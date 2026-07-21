import express from 'express';
import db from '../db.js'; // Adjust path if your db connection is elsewhere
import multer from 'multer';
import path from 'path';
import fs from 'fs';

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

// POST: Submit a new document application WITH a requirement file
router.post('/submit', upload.single('requirement_file'), (req, res) => {
    const { resident_id, doc_type_id, purpose, scheduled_date } = req.body;
    const requirement_file = req.file ? req.file.path.replace('\\', '/') : null;

    // FEATURE 4: Anti-Spam Duplicate Prevention
    const duplicateCheckSql = `
        SELECT request_id FROM Document_RequestTable 
        WHERE resident_id = ? AND doc_type_id = ? AND status IN ('Pending', 'Waiting for Printing', 'Ready for Pickup')
    `;
    db.query(duplicateCheckSql, [resident_id, doc_type_id], (dupErr, dupRes) => {
        if (dupErr) return res.status(500).json({ error: "Database error during spam check." });
        if (dupRes.length > 0) {
            return res.status(403).json({ error: "Anti-Spam Alert: You already have an active request for this document type in the queue!" });
        }

        if (!scheduled_date) return res.status(400).json({ error: "Please select an appointment date." });

    const requestedDateObj = new Date(scheduled_date);
    if (requestedDateObj.getDay() === 0) {
        return res.status(403).json({ error: "The Barangay is closed on Sundays. Please select a valid date." });
    }
    const dayName = requestedDateObj.toLocaleDateString('en-US', { weekday: 'long' });

    // --- Fetch names for the audit log ---
    const fetchNamesSql = `
        SELECT res.first_name, res.last_name, doc.doc_name 
        FROM Resident_ProfileTable res, Document_TemplateTable doc 
        WHERE res.resident_id = ? AND doc.doc_type_id = ?
    `;
    db.query(fetchNamesSql, [doc_type_id, resident_id], (err, nameRes) => {
        if (err) return res.status(500).json({ error: "Database error." });
        
        const residentName = nameRes.length > 0 ? `${nameRes[0].first_name} ${nameRes[0].last_name}` : 'Unknown Resident';
        const documentName = nameRes.length > 0 ? nameRes[0].doc_name : 'Unknown Document';

        // Fetch the limits
        db.query(`SELECT setting_value FROM system_settingstable WHERE setting_key = 'DEFAULT_DAILY_LIMIT'`, (limitErr, limitRes) => {
            if (limitErr) return res.status(500).json({ error: "Database error." });
            
            let defaultLimit = 50;
            if (limitRes.length > 0) {
                defaultLimit = parseInt(limitRes[0].setting_value, 10);
            }

            db.query(`SELECT document_limit FROM Date_Specific_LimitsTable WHERE specific_date = ?`, [scheduled_date], (specErr, specRes) => {
                if (specErr) return res.status(500).json({ error: "Database error." });
                
                let dayLimit = defaultLimit;
                if (specRes.length > 0) {
                    dayLimit = specRes[0].document_limit;
                }

            // Count how many are already scheduled for this SPECIFIC date (EXCLUDING Cancelled and Rejected)
            const countSql = `SELECT COUNT(*) as totalScheduled FROM Document_RequestTable WHERE pick_up_date = ? AND status NOT IN ('Cancelled', 'Rejected')`;
            
            db.query(countSql, [scheduled_date], (countErr, countResult) => {
                if (countErr) return res.status(500).json({ error: "Failed to generate queue number." });

                const count = countResult.length > 0 ? Object.values(countResult[0])[0] : 0;
                
                // ENFORCE DAILY LIMIT
                if (dayLimit > 0 && count >= dayLimit) {
                    return res.status(403).json({ error: `The queue for ${dayName}s is currently limited to ${dayLimit} and is already full. Please select another date.` });
                }

                let queueNumber = parseInt(count) + 1;

                // Save with the scheduled_date mapped to pick_up_date
                const sql = `INSERT INTO Document_RequestTable (resident_id, doc_type_id, purpose, requirement_file, status, pick_up_date) VALUES (?, ?, ?, ?, 'Pending', ?)`;
                
                db.query(sql, [resident_id, doc_type_id, purpose, requirement_file, scheduled_date], (err, result) => {
                    if (err) return res.status(500).json({ error: "Failed to save request." });

                    const requestId = result.insertId;
                    const queueSql = `INSERT INTO Queue_ManagementTable (request_id, daily_sequence_no) VALUES (?, ?)`;
                    
                    db.query(queueSql, [requestId, queueNumber.toString()], (qErr) => {
                        if (qErr) console.error(qErr);
                        
                        const logSql = `INSERT INTO Audit_LogsTable (user_id, action_type, action_details) VALUES (?, ?, ?)`;
                        const logDetails = `Resident ${residentName} requested a ${documentName} for ${scheduled_date} (Request #${requestId})`;
                        db.query(logSql, [0, 'Document Requested', logDetails], () => {
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
router.get('/latest/:residentId', (req, res) => {
    const sql = `
        SELECT r.request_id, r.status as request_status, q.daily_sequence_no, r.pick_up_date as scheduled_date
        FROM Document_RequestTable r
        JOIN Queue_ManagementTable q ON r.request_id = q.request_id
        WHERE r.resident_id = ? 
        ORDER BY r.date_requested DESC LIMIT 1
    `;
    db.query(sql, [req.params.residentId], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results[0] || {});
    });
});

// GET: Fetch the complete history of requests for a resident
router.get('/history/:residentId', (req, res) => {
    const sql = `
        SELECT r.request_id, doc.doc_name, r.date_requested, r.status, r.remarks, q.daily_sequence_no 
        FROM Document_RequestTable r
        JOIN Document_TemplateTable doc ON r.doc_type_id = doc.doc_type_id
        LEFT JOIN Queue_ManagementTable q ON r.request_id = q.request_id
        WHERE r.resident_id = ? 
        ORDER BY r.date_requested DESC
    `;
    db.query(sql, [req.params.residentId], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

// PUT: Cancel a pending request
router.put('/cancel/:id', (req, res) => {
    // 1. Fetch the requirement_file first
    db.query(`SELECT requirement_file FROM Document_RequestTable WHERE request_id = ?`, [req.params.id], (fetchErr, fetchRes) => {
        if (fetchErr) return res.status(500).json({ error: "Database error" });
        const requirementFile = fetchRes.length > 0 ? fetchRes[0].requirement_file : null;

        // We use TRIM() just in case there are invisible spaces saving in your database
        const sql = `UPDATE Document_RequestTable SET status = 'Cancelled' WHERE request_id = ? AND TRIM(status) = 'Pending'`;
        
        db.query(sql, [req.params.id], (err, result) => {
            if (err) return res.status(500).json({ error: "Database error" });
            
            // Check if the database actually changed a row!
            if (result.affectedRows === 0) {
                return res.status(400).json({ error: "Could not cancel. It may have already been processed by staff." });
            }

            // 3. Garbage Collection: Delete the physical file from the server
            if (requirementFile) {
                const filePath = path.join(process.cwd(), requirementFile);
                fs.unlink(filePath, (unlinkErr) => {
                    if (unlinkErr && unlinkErr.code !== 'ENOENT') {
                        console.error(`Failed to delete file ${filePath}:`, unlinkErr);
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