import express from 'express';
import db from '../db.js'; // Adjust path if your db connection is elsewhere
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';
import { processIDPhoto } from '../utils/imageProcessor.js';

const router = express.Router();

// Setup Multer for saving the requirement files into the 'uploads' folder
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, 'req_' + Date.now() + path.extname(file.originalname));
    }
});

// SECURE FILE UPLOAD CONFIGURATION (Feature 2)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/; // Also allow PDF for document requirements
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Security Error: Only .png, .jpg, .jpeg, and .pdf files are allowed!"));
    }
};

const upload = multer({ 
    storage, 
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit
});

// Helper to get day name
const getDayName = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'long' });
};

// GET: Fetch available dates for appointment scheduling
router.get('/available-dates', (req, res) => {
    // 1. Fetch limits
    db.query(`SELECT setting_value FROM system_settingstable WHERE setting_key = 'DEFAULT_DAILY_LIMIT'`, (err, limitResults) => {
        if (err) return res.status(500).json({ error: "Database error" });
        
        let defaultLimit = 50;
        if (limitResults.length > 0) {
            defaultLimit = parseInt(limitResults[0].setting_value, 10);
        }
        
        db.query(`SELECT specific_date, document_limit FROM Date_Specific_LimitsTable`, (dateErr, dateRes) => {
            if (dateErr) return res.status(500).json({ error: "Database error" });
            
            const specificLimits = {};
            dateRes.forEach(row => {
                if (row.specific_date) {
                    const dStr = new Date(row.specific_date).toLocaleDateString('en-CA');
                    specificLimits[dStr] = row.document_limit;
                }
            });
        
        // 2. Fetch counts for the next 14 days (EXCLUDING Cancelled and Rejected)
        const countSql = `
            SELECT pick_up_date, COUNT(*) as booked 
            FROM Document_RequestTable 
            WHERE pick_up_date >= CURDATE() AND pick_up_date <= DATE_ADD(CURDATE(), INTERVAL 14 DAY)
            AND status NOT IN ('Cancelled', 'Rejected')
            GROUP BY pick_up_date
        `;
        
        db.query(countSql, (countErr, countResults) => {
            if (countErr) return res.status(500).json({ error: "Database error" });
            
            // Map the results for quick lookup
            const bookedMap = {};
            countResults.forEach(row => {
                if (row.pick_up_date) {
                    const dateStr = new Date(row.pick_up_date).toLocaleDateString('en-CA'); // YYYY-MM-DD local time
                    bookedMap[dateStr] = row.booked;
                }
            });
            
            // Generate the next 14 days
            const availableDates = [];
            for (let i = 0; i < 14; i++) {
                const d = new Date();
                d.setDate(d.getDate() + i);
                
                // Skip Sundays (0) completely
                if (d.getDay() === 0) continue; 

                const dateStr = d.toLocaleDateString('en-CA'); // YYYY-MM-DD local time
                const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
                
                const booked = bookedMap[dateStr] || 0;
                
                // Determine the limit for this specific day
                let dayLimit = defaultLimit;
                if (specificLimits[dateStr] !== undefined) {
                    dayLimit = specificLimits[dateStr];
                }
                
                // Full if limit > 0 AND booked >= limit, OR if limit is explicitly 0 (closed)
                const isFull = (dayLimit > 0 && booked >= dayLimit) || dayLimit === 0;
                
                availableDates.push({
                    date: dateStr,
                    isFull: isFull,
                    display: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                });
            }
            
            res.json(availableDates);
        });
        });
    });
});

const requestLocks = new Set(); // In-memory mutex for BR4 Anti-Spam

// POST: Submit a new document application WITH a requirement file and optionally authorization_proof
router.post('/submit', verifyToken, requireRole(['Resident']), upload.fields([{ name: 'requirement_file', maxCount: 1 }, { name: 'authorization_proof', maxCount: 1 }]), async (req, res) => {
    const { doc_type_id, purpose, scheduled_date, requested_for_others, requested_for_name } = req.body;
    const resident_id = req.user.id;
    let requirement_file = (req.files && req.files['requirement_file']) ? req.files['requirement_file'][0].path.replace(/\\/g, '/') : null;
    let authorization_proof = (req.files && req.files['authorization_proof']) ? req.files['authorization_proof'][0].path.replace(/\\/g, '/') : null;
    
    const isForOthers = requested_for_others === 'true' || requested_for_others === true || requested_for_others === 1 || requested_for_others === '1';
    const trimmedRequestedForName = (isForOthers && requested_for_name) ? requested_for_name.trim() : null;

    if (isForOthers) {
        if (!trimmedRequestedForName) {
            return res.status(400).json({ error: "Please enter the full name of the person this document is for." });
        }
        if (!authorization_proof) {
            return res.status(400).json({ error: "Please upload proof of authorization or relationship." });
        }
    }

    // FEATURE 14: Process the uploaded photo asynchronously
    if (requirement_file) {
        requirement_file = await processIDPhoto(requirement_file);
    }
    if (authorization_proof) {
        authorization_proof = await processIDPhoto(authorization_proof);
    }

    // Mutex Lock Check (Prevents race conditions if Resident spams the submit button)
    let lockKey = `${resident_id}_${doc_type_id}`;
    if (isForOthers && trimmedRequestedForName) {
        lockKey += `_${trimmedRequestedForName}`;
    }

    if (requestLocks.has(lockKey)) {
        return res.status(429).json({ error: "Anti-Spam Alert: Your previous request is still processing. Please wait." });
    }
    requestLocks.add(lockKey); // Lock it!

    const unlock = () => requestLocks.delete(lockKey); // Helper to unlock

    // FEATURE 4: Anti-Spam Duplicate Prevention (Database verification)
    let duplicateCheckSql = `
        SELECT request_id FROM Document_RequestTable 
        WHERE resident_id = ? AND doc_type_id = ? AND status IN ('Pending', 'Waiting for Printing', 'Ready for Pickup')
    `;
    let queryParams = [resident_id, doc_type_id];

    if (isForOthers && trimmedRequestedForName) {
        duplicateCheckSql += " AND requested_for_others = 1 AND requested_for_name = ?";
        queryParams.push(trimmedRequestedForName);
    } else {
        duplicateCheckSql += " AND (requested_for_others = 0 OR requested_for_others IS NULL)";
    }

    db.query(duplicateCheckSql, queryParams, (dupErr, dupRes) => {
        if (dupErr) {
            unlock();
            return res.status(500).json({ error: "Database error during spam check." });
        }
        if (dupRes.length > 0) {
            unlock();
            return res.status(403).json({ error: "Anti-Spam Alert: You already have an active request for this document type in the queue!" });
        }

        if (!scheduled_date) {
            unlock();
            return res.status(400).json({ error: "Please select an appointment date." });
        }

    const requestedDateObj = new Date(scheduled_date);
    if (requestedDateObj.getDay() === 0) {
        unlock();
        return res.status(403).json({ error: "The Barangay is closed on Sundays. Please select a valid date." });
    }
    const dayName = requestedDateObj.toLocaleDateString('en-US', { weekday: 'long' });

    // --- Fetch names for the audit log ---
    const fetchNamesSql = `
        SELECT res.first_name, res.last_name, doc.doc_name 
        FROM Resident_ProfileTable res, Document_TemplateTable doc 
        WHERE res.resident_id = ? AND doc.doc_type_id = ?
    `;
    db.query(fetchNamesSql, [resident_id, doc_type_id], (err, nameRes) => {
        if (err) {
            unlock();
            return res.status(500).json({ error: "Database error." });
        }
        
        const residentName = nameRes.length > 0 ? `${nameRes[0].first_name} ${nameRes[0].last_name}` : 'Unknown Resident';
        const documentName = nameRes.length > 0 ? nameRes[0].doc_name : 'Unknown Document';

        // Fetch the limits
        db.query(`SELECT setting_value FROM system_settingstable WHERE setting_key = 'DEFAULT_DAILY_LIMIT'`, (limitErr, limitRes) => {
            if (limitErr) {
                unlock();
                return res.status(500).json({ error: "Database error." });
            }
            
            let defaultLimit = 50;
            if (limitRes.length > 0) {
                defaultLimit = parseInt(limitRes[0].setting_value, 10);
            }

            db.query(`SELECT document_limit FROM Date_Specific_LimitsTable WHERE specific_date = ?`, [scheduled_date], (specErr, specRes) => {
                if (specErr) {
                    unlock();
                    return res.status(500).json({ error: "Database error." });
                }
                
                let dayLimit = defaultLimit;
                if (specRes.length > 0) {
                    dayLimit = specRes[0].document_limit;
                }

            // Count how many are already scheduled for this SPECIFIC date (EXCLUDING Cancelled and Rejected)
            const countSql = `SELECT COUNT(*) as totalScheduled FROM Document_RequestTable WHERE pick_up_date = ? AND status NOT IN ('Cancelled', 'Rejected')`;
            
            db.query(countSql, [scheduled_date], (countErr, countResult) => {
                if (countErr) {
                    unlock();
                    return res.status(500).json({ error: "Failed to generate queue number." });
                }

                const count = countResult.length > 0 ? Object.values(countResult[0])[0] : 0;
                
                // ENFORCE DAILY LIMIT
                if (dayLimit > 0 && count >= dayLimit) {
                    unlock();
                    return res.status(403).json({ error: `The queue for ${dayName}s is currently limited to ${dayLimit} and is already full. Please select another date.` });
                }

                let queueNumber = parseInt(count) + 1;

                // Save with the scheduled_date mapped to pick_up_date
                const sql = `INSERT INTO Document_RequestTable (resident_id, doc_type_id, purpose, requirement_file, status, pick_up_date, requested_for_others, requested_for_name, authorization_proof) VALUES (?, ?, ?, ?, 'Pending', ?, ?, ?, ?)`;
                
                db.query(sql, [resident_id, doc_type_id, purpose, requirement_file, scheduled_date, isForOthers ? 1 : 0, trimmedRequestedForName, isForOthers ? authorization_proof : null], (err, result) => {
                    if (err) {
                        unlock();
                        return res.status(500).json({ error: "Failed to save request." });
                    }

                    const requestId = result.insertId;
                    const queueSql = `INSERT INTO Queue_ManagementTable (request_id, daily_sequence_no) VALUES (?, ?)`;
                    
                    db.query(queueSql, [requestId, queueNumber.toString()], (qErr) => {
                        if (qErr) console.error(qErr);
                        
                        const logSql = `INSERT INTO audits_logstable (user_id, action_type, details) VALUES (?, ?, ?)`;
                        const targetPerson = isForOthers && trimmedRequestedForName ? `${trimmedRequestedForName} (on behalf by ${residentName})` : residentName;
                        const logDetails = `Resident ${residentName} requested a ${documentName} for ${targetPerson} for ${scheduled_date} (Request #${requestId})`;
                        db.query(logSql, [resident_id, 'Document Requested', logDetails], (logErr) => {
                            if (logErr) console.error("Audit log error:", logErr);
                            unlock();
                            res.json({ message: "Application submitted successfully", queue_number: queueNumber });
                        });
                    });
                });
            });
            });
        });
    }); // End of duplicate check
  });
});

// GET: Fetch the latest request for the dashboard
router.get('/latest/:residentId', verifyToken, requireRole(['Resident']), (req, res) => {
    const sql = `
        SELECT r.request_id, r.status as request_status, r.or_number, r.requested_for_others, r.requested_for_name, q.daily_sequence_no, r.pick_up_date as scheduled_date, doc.doc_name, doc.base_fee
        FROM Document_RequestTable r
        JOIN Document_TemplateTable doc ON r.doc_type_id = doc.doc_type_id
        JOIN Queue_ManagementTable q ON r.request_id = q.request_id
        WHERE r.resident_id = ? 
        ORDER BY r.date_requested DESC LIMIT 1
    `;
    db.query(sql, [req.user.id], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results[0] || {});
    });
});

// GET: Fetch the complete history of requests for a resident
router.get('/history/:residentId', verifyToken, requireRole(['Resident']), (req, res) => {
    const sql = `
        SELECT r.request_id, doc.doc_name, doc.base_fee, r.date_requested, r.pick_up_date, r.status, r.remarks, r.or_number, r.requested_for_others, r.requested_for_name, q.daily_sequence_no 
        FROM Document_RequestTable r
        JOIN Document_TemplateTable doc ON r.doc_type_id = doc.doc_type_id
        LEFT JOIN Queue_ManagementTable q ON r.request_id = q.request_id
        WHERE r.resident_id = ? 
        ORDER BY r.date_requested DESC
    `;
    db.query(sql, [req.user.id], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

// PUT: Cancel a pending request
router.put('/cancel/:id', verifyToken, requireRole(['Resident']), (req, res) => {
    // 1. Fetch the requirement_file and authorization_proof first
    db.query(`SELECT requirement_file, authorization_proof FROM Document_RequestTable WHERE request_id = ?`, [req.params.id], (fetchErr, fetchRes) => {
        if (fetchErr) return res.status(500).json({ error: "Database error" });
        const requirementFile = fetchRes.length > 0 ? fetchRes[0].requirement_file : null;
        const authorizationProof = fetchRes.length > 0 ? fetchRes[0].authorization_proof : null;

        // We use TRIM() just in case there are invisible spaces saving in your database
        const sql = `UPDATE Document_RequestTable SET status = 'Cancelled' WHERE request_id = ? AND TRIM(status) = 'Pending'`;
        
        db.query(sql, [req.params.id], (err, result) => {
            if (err) return res.status(500).json({ error: "Database error" });
            
            // Check if the database actually changed a row!
            if (result.affectedRows === 0) {
                return res.status(400).json({ error: "Could not cancel. It may have already been processed by staff." });
            }

            // 3. Garbage Collection: Delete physical files from the server
            if (requirementFile) {
                const filePath = path.join(process.cwd(), requirementFile);
                fs.unlink(filePath, (unlinkErr) => {
                    if (unlinkErr && unlinkErr.code !== 'ENOENT') {
                        console.error(`Failed to delete requirement file ${filePath}:`, unlinkErr);
                    }
                });
            }
            if (authorizationProof) {
                const authPath = path.join(process.cwd(), authorizationProof);
                fs.unlink(authPath, (unlinkErr) => {
                    if (unlinkErr && unlinkErr.code !== 'ENOENT') {
                        console.error(`Failed to delete authorization proof ${authPath}:`, unlinkErr);
                    }
                });
            }

            res.json({ message: "Request cancelled successfully" });
        });
    });
});
// GET: Fetch all available document types for the dropdown
router.get('/documents', (req, res) => {
    const sql = `SELECT doc_type_id, doc_name, base_fee, available, requires_attachment FROM Document_TemplateTable WHERE available = 1`;
    
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});
export default router;