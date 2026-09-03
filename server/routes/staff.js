import { sendNotificationEmail } from '../utils/mailer.js';
import express from 'express';
import db from '../db.js';
import fs from 'fs';
import path from 'path';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply JWT verification and Staff/Admin RBAC to all routes in this file
router.use(verifyToken);
router.use(requireRole(['Staff', 'Admin']));

// 1. Fetch Pending and Ready to Print requests (Now includes ID Image!)
// 1. Fetch Pending and Ready to Print requests (Now includes requested_for_others, requested_for_name, authorization_proof)
router.get('/pending-requests', (req, res) => {
    const sql = `
        SELECT req.request_id, req.status, req.date_requested, req.purpose, req.requirement_file, req.or_number,
               req.requested_for_others, req.requested_for_name, req.authorization_proof,
               res.first_name, res.last_name, res.id_proof_image, 
               doc.doc_name, doc.base_fee, q.daily_sequence_no
        FROM Document_RequestTable req
        JOIN Resident_ProfileTable res ON req.resident_id = res.resident_id
        JOIN Document_TemplateTable doc ON req.doc_type_id = doc.doc_type_id
        LEFT JOIN Queue_ManagementTable q ON req.request_id = q.request_id
        WHERE req.status IN ('Pending', 'Waiting for Printing', 'Ready for Pickup', 'Ready to Print')
        ORDER BY req.date_requested ASC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
}); 

// 2. Fetch full resident details to generate the printable certificate
router.get('/print-details/:id', (req, res) => {
    const sql = `
        SELECT req.request_id, req.date_requested, req.requested_for_others, req.requested_for_name,
               res.first_name, res.middle_name, res.last_name, res.addres_street, res.civil_status, res.id_proof_image
        FROM Document_RequestTable req
        JOIN Resident_ProfileTable res ON req.resident_id = res.resident_id
        WHERE req.request_id = ?
    `;
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (results.length === 0) return res.status(404).json({ message: "Document not found" });
        res.json(results[0]);
    });
});

// Helper: Generate a unique random OR code
const createRandomORCode = () => {
    const randomHex = Math.floor(100000 + Math.random() * 900000).toString(16).toUpperCase().padStart(6, '0');
    return `OR-${randomHex}`;
};

// PUT: Cashier / Staff receives payment and generates an Official Receipt (OR)
router.put('/generate-or/:id', (req, res) => {
    const { orNumber } = req.body;
    const official_id = req.user.id;
    const requestId = req.params.id;

    const cleanOr = (orNumber && orNumber.trim()) ? orNumber.trim().toUpperCase() : createRandomORCode();

    // 1. Fetch request and resident details
    const detailSql = `
        SELECT res.first_name, res.last_name, res.email_address, doc.doc_name, doc.base_fee, off.full_name as staff_name
        FROM Document_RequestTable req
        JOIN Resident_ProfileTable res ON req.resident_id = res.resident_id
        JOIN Document_TemplateTable doc ON req.doc_type_id = doc.doc_type_id
        LEFT JOIN Barangay_OfficialsTable off ON off.official_id = ?
        WHERE req.request_id = ?
    `;
    db.query(detailSql, [official_id, requestId], (detailErr, detailRes) => {
        if (detailErr) return res.status(500).json({ error: "Database error" });
        if (detailRes.length === 0) return res.status(404).json({ error: "Request not found." });

        const residentName = `${detailRes[0].first_name} ${detailRes[0].last_name}`;
        const docName = detailRes[0].doc_name;
        const baseFee = detailRes[0].base_fee || 0;
        const staffName = detailRes[0].staff_name || 'Staff / Cashier';
        const residentEmail = detailRes[0].email_address;

        // 2. Check if OR Number is already used for another request
        const checkDupSql = `SELECT request_id FROM Document_RequestTable WHERE or_number = ? AND request_id != ?`;
        db.query(checkDupSql, [cleanOr, requestId], (dupErr, dupRes) => {
            if (dupErr) return res.status(500).json({ error: "Database error while verifying OR." });
            if (dupRes && dupRes.length > 0) {
                return res.status(400).json({ error: `OR Code "${cleanOr}" has already been used for another transaction.` });
            }

            // 3. Save the OR Number and update status to Ready for Pickup
            const updateSql = `UPDATE Document_RequestTable SET or_number = ?, status = 'Ready for Pickup' WHERE request_id = ?`;
            db.query(updateSql, [cleanOr, requestId], (updateErr) => {
                if (updateErr) return res.status(500).json({ error: "Failed to record OR number." });

                // 4. Log the transaction in the Audit Logs
                const logSql = `INSERT INTO audits_logstable (user_id, action_type, details) VALUES (?, ?, ?)`;
                const logDetails = `Staff ${staffName} received payment (₱${baseFee}) and generated OR #${cleanOr} for ${docName} Request #${requestId} (Resident: ${residentName})`;

                db.query(logSql, [official_id, 'Payment & OR Generated', logDetails], (logErr) => {
                    if (logErr) console.error("Log error:", logErr);

                    if (residentEmail) {
                        sendNotificationEmail(
                            residentEmail, 
                            'Official Receipt Issued - Barangay Fortune',
                            `Good day ${residentName}!\n\nYour payment of ₱${baseFee} for ${docName} has been confirmed.\nOfficial Receipt (OR) Number: ${cleanOr}\n\nPlease present this OR Code to the releasing officer at the Barangay Hall to claim your printed document.`
                        );
                    }

                    res.json({ 
                        message: "Payment received and Official Receipt generated successfully!", 
                        or_number: cleanOr 
                    });
                });
            });
        });
    });
});

// PUT: Update request status AND record it in the Audit Log
router.put('/update-status/:id', (req, res) => {
    const { status, orNumber } = req.body;
    const official_id = req.user.id;
    const requestId = req.params.id;

    // 1. Fetch names and current OR for validation
    const nameSql = `
        SELECT req.or_number, res.first_name, res.last_name, res.email_address, doc.doc_name, off.full_name as staff_name
        FROM Document_RequestTable req
        JOIN Resident_ProfileTable res ON req.resident_id = res.resident_id
        JOIN Document_TemplateTable doc ON req.doc_type_id = doc.doc_type_id
        LEFT JOIN Barangay_OfficialsTable off ON off.official_id = ?
        WHERE req.request_id = ?
    `;
    db.query(nameSql, [official_id, requestId], (nameErr, nameRes) => {
        if (nameErr) return res.status(500).json({ error: "Database error" });
        if (nameRes.length === 0) return res.status(404).json({ error: "Request not found." });

        const residentName = `${nameRes[0].first_name} ${nameRes[0].last_name}`;
        const docName = nameRes[0].doc_name;
        const staffName = nameRes[0].staff_name || 'Staff';
        const assignedOr = nameRes[0].or_number;

        const proceedUpdate = (validOrNumber) => {
            let sql = `UPDATE Document_RequestTable SET status = ?, processed_by = ? WHERE request_id = ?`;
            let params = [status, official_id, requestId];

            if (status === 'Released' && validOrNumber) {
                sql = `UPDATE Document_RequestTable SET status = ?, processed_by = ?, or_number = ? WHERE request_id = ?`;
                params = [status, official_id, validOrNumber, requestId];
            }
            
            db.query(sql, params, (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: "Database error" });
                }

                // 3. Save this action to the Admin Audit Logs!
                const logSql = `INSERT INTO audits_logstable (user_id, action_type, details) VALUES (?, ?, ?)`;
                let logDetails = `Staff ${staffName} updated ${docName} Request #${requestId} for Resident ${residentName} to status: ${status}`;
                
                if (status === 'Released' && validOrNumber) {
                    logDetails = `Staff ${staffName} released ${docName} Request #${requestId} for Resident ${residentName} with OR #${validOrNumber}`;
                }

                db.query(logSql, [official_id, 'Process Document', logDetails], (logErr) => {
                    if (logErr) console.error("Log error:", logErr); 
                    
                    if (status === 'Waiting for Printing' && nameRes[0]?.email_address) { 
                        sendNotificationEmail(nameRes[0].email_address, 'Document Request Approved', `Good day ${residentName}! Your request for ${docName} has been approved and is now waiting for printing.`); 
                    }
                    if (status === 'Ready for Pickup' && nameRes[0]?.email_address) { 
                        sendNotificationEmail(nameRes[0].email_address, 'Document Ready for Pickup', `Good day ${residentName}! Your requested ${docName} is now printed and Ready for Pickup. Please proceed to the Barangay Hall Cashier / Front Desk with your Queue Number to settle the fee and claim your Official Receipt.`); 
                    }
                    if (status === 'Released' && nameRes[0]?.email_address) {
                        sendNotificationEmail(nameRes[0].email_address, 'Document Released', `Good day ${residentName}! Your requested ${docName} has been successfully released with Official Receipt #${validOrNumber || assignedOr}. Thank you!`);
                    }

                    res.json({ message: `Status successfully changed to ${status}` });
                });
            });
        };

        // 2. Validate OR Code when releasing a document
        if (status === 'Released') {
            if (!orNumber || typeof orNumber !== 'string' || !orNumber.trim()) {
                return res.status(400).json({ error: "Official Receipt (OR) Code is required to officialize this release." });
            }
            const cleanOr = orNumber.trim().toUpperCase();

            // Check against assigned OR if one was already generated at the cashier
            if (assignedOr && cleanOr !== assignedOr.toUpperCase()) {
                return res.status(400).json({ error: `Invalid OR Code. The entered code does not match the issued Official Receipt (${assignedOr}).` });
            }

            // Check if OR Number is already used for another document request
            const checkDupSql = `SELECT request_id FROM Document_RequestTable WHERE or_number = ? AND request_id != ?`;
            db.query(checkDupSql, [cleanOr, requestId], (dupErr, dupRes) => {
                if (dupErr) return res.status(500).json({ error: "Database error while verifying OR Code." });
                if (dupRes && dupRes.length > 0) {
                    return res.status(400).json({ error: `OR Code "${cleanOr}" has already been used for another transaction.` });
                }
                proceedUpdate(cleanOr);
            });
        } else {
            proceedUpdate(null);
        }
    });
});
// GET: Fetch all data needed to print a specific document
router.get('/print-data/:id', (req, res) => {
    const sql = `
        SELECT req.request_id, req.date_requested, req.purpose, req.requested_for_others, req.requested_for_name,
               res.first_name, res.last_name, res.middle_name, res.addres_street, res.civil_status,
               doc.doc_name, doc.base_fee
        FROM Document_RequestTable req
        JOIN Resident_ProfileTable res ON req.resident_id = res.resident_id
        JOIN Document_TemplateTable doc ON req.doc_type_id = doc.doc_type_id
        WHERE req.request_id = ?
    `;
    
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (results.length === 0) return res.status(404).json({ error: "Document not found" });
        
        const docData = results[0];
        
        // Fetch current Barangay Captain
        db.query(`SELECT full_name FROM barangay_officialstable WHERE is_captain = 1 LIMIT 1`, (capErr, capRes) => {
            if (!capErr && capRes.length > 0) {
                docData.captain_name = capRes[0].full_name;
            } else {
                docData.captain_name = 'JUAN DELA CRUZ'; // Fallback
            }
            res.json(docData);
        });
    });
});

// PUT: Reject a document and log the reason
router.put('/reject/:id', (req, res) => {
    const requestId = req.params.id;
    const { reason } = req.body;
    const official_id = req.user.id;

    // 1. Fetch names, requirement_file, and authorization_proof for the log and cleanup
    const nameSql = `
        SELECT res.first_name, res.last_name, res.email_address, doc.doc_name, off.full_name as staff_name, req.requirement_file, req.authorization_proof
        FROM Document_RequestTable req
        JOIN Resident_ProfileTable res ON req.resident_id = res.resident_id
        JOIN Document_TemplateTable doc ON req.doc_type_id = doc.doc_type_id
        LEFT JOIN Barangay_OfficialsTable off ON off.official_id = ?
        WHERE req.request_id = ?
    `;
    db.query(nameSql, [official_id, requestId], (nameErr, nameRes) => {
        if (nameErr) return res.status(500).json({ error: "Database error" });
        const residentName = nameRes.length > 0 ? `${nameRes[0].first_name} ${nameRes[0].last_name}` : 'Unknown Resident';
        const docName = nameRes.length > 0 ? nameRes[0].doc_name : 'Document';
        const staffName = nameRes.length > 0 && nameRes[0].staff_name ? nameRes[0].staff_name : 'Staff';
        const requirementFile = nameRes.length > 0 ? nameRes[0].requirement_file : null;
        const authorizationProof = nameRes.length > 0 ? nameRes[0].authorization_proof : null;

        // 2. Change the status to Rejected
        const sql = `UPDATE Document_RequestTable SET status = 'Rejected', remarks = ? WHERE request_id = ?`;
        
        db.query(sql, [reason, requestId], (err, result) => {
            if (err) return res.status(500).json({ error: "Database error" });

            // 3. Garbage Collection: Delete physical files from the server
            if (requirementFile) {
                const filePath = path.join(process.cwd(), requirementFile);
                fs.unlink(filePath, (unlinkErr) => {
                    if (unlinkErr && unlinkErr.code !== 'ENOENT') {
                        console.error(`Failed to delete file ${filePath}:`, unlinkErr);
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

            // 4. Log this specific action and the reason to the Audit Logs
            const logSql = `INSERT INTO audits_logstable (user_id, action_type, details) VALUES (?, ?, ?)`;
            const logDetails = `Staff ${staffName} rejected ${docName} Request #${requestId} for Resident ${residentName}. Reason: ${reason}`;
            
            db.query(logSql, [official_id, 'Reject Document', logDetails], (logErr) => {
                if (logErr) console.error("Log error:", logErr);
                if (nameRes[0]?.email_address) { sendNotificationEmail(nameRes[0].email_address, 'Barangay Document Rejected', `Good day ${residentName}. We regret to inform you that your request for ${docName} has been rejected. Reason: ${reason}`); }
                res.json({ message: "Document successfully rejected and files cleaned." });
            });
        });
    });
});

// FEATURE 5: PUT - Mark a document as "No-Show" / Forfeited
router.put('/no-show/:id', (req, res) => {
    const requestId = req.params.id;
    const official_id = req.user.id;

    // 1. Fetch names for the log
    const nameSql = `
        SELECT res.first_name, res.last_name, doc.doc_name, off.full_name as staff_name
        FROM Document_RequestTable req
        JOIN Resident_ProfileTable res ON req.resident_id = res.resident_id
        JOIN Document_TemplateTable doc ON req.doc_type_id = doc.doc_type_id
        LEFT JOIN Barangay_OfficialsTable off ON off.official_id = ?
        WHERE req.request_id = ?
    `;
    db.query(nameSql, [official_id, requestId], (nameErr, nameRes) => {
        if (nameErr) return res.status(500).json({ error: "Database error" });
        const residentName = nameRes.length > 0 ? `${nameRes[0].first_name} ${nameRes[0].last_name}` : 'Unknown Resident';
        const docName = nameRes.length > 0 ? nameRes[0].doc_name : 'Document';
        const staffName = nameRes.length > 0 && nameRes[0].staff_name ? nameRes[0].staff_name : 'Staff';

        // 2. Change the status to Cancelled and add a remark
        const sql = `UPDATE Document_RequestTable SET status = 'Cancelled', remarks = 'Forfeited (No-Show)' WHERE request_id = ?`;
        
        db.query(sql, [requestId], (err, result) => {
            if (err) return res.status(500).json({ error: "Database error" });

            // 3. Log this specific action
            const logSql = `INSERT INTO audits_logstable (user_id, action_type, details) VALUES (?, ?, ?)`;
            const logDetails = `Staff ${staffName} marked ${docName} Request #${requestId} as No-Show for Resident ${residentName}.`;
            
            db.query(logSql, [official_id, 'No-Show / Forfeiture', logDetails], (logErr) => {
                if (logErr) console.error("Log error:", logErr);
                if (nameRes[0]?.email_address) { sendNotificationEmail(nameRes[0].email_address, 'Barangay Document Forfeited', `Good day ${residentName}. You missed your appointment to claim your ${docName}. Your request has been officially forfeited.`); }
                res.json({ message: "Document forfeited as No-Show." });
            });
        });
    });
});

// GET: Fetch full transaction receipt by Request ID
router.get('/receipt/:requestId', (req, res) => {
    const sql = `
        SELECT req.request_id, req.status, req.date_requested, req.or_number, req.requested_for_others, req.requested_for_name,
               res.first_name, res.last_name, 
               doc.doc_name, doc.base_fee,
               req.processed_by
        FROM Document_RequestTable req
        JOIN Resident_ProfileTable res ON req.resident_id = res.resident_id
        JOIN Document_TemplateTable doc ON req.doc_type_id = doc.doc_type_id
        WHERE req.request_id = ?
    `;
    db.query(sql, [req.params.requestId], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        
        if (results.length === 0) return res.status(404).json({ error: "Receipt not found." });
        
        const receipt = results[0];
        
        // Fetch the staff name
        db.query(`SELECT full_name FROM Barangay_OfficialsTable WHERE official_id = ?`, [receipt.processed_by || 0], (staffErr, staffRes) => {
            receipt.staff_name = (staffRes && staffRes.length > 0) ? staffRes[0].full_name : 'System Admin';
            res.json(receipt);
        });
    });
});

// GET: Fetch all completed, rejected, or cancelled document records
router.get('/document-records', (req, res) => {
    const sql = `
        SELECT req.request_id, req.status, req.date_requested, req.purpose, req.remarks, req.or_number, req.requested_for_others, req.requested_for_name,
               res.first_name, res.last_name, 
               doc.doc_name, q.daily_sequence_no
        FROM Document_RequestTable req
        JOIN Resident_ProfileTable res ON req.resident_id = res.resident_id
        JOIN Document_TemplateTable doc ON req.doc_type_id = doc.doc_type_id
        LEFT JOIN Queue_ManagementTable q ON req.request_id = q.request_id
        WHERE req.status IN ('Released', 'Rejected', 'Cancelled')
        ORDER BY req.date_requested DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

// NEW: Fetch current staff profile & permissions
router.get('/profile/:id', (req, res) => {
    const sql = `SELECT official_id, full_name, role, can_review FROM Barangay_OfficialsTable WHERE official_id = ?`;
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (results.length === 0) return res.status(404).json({ error: "Staff not found" });
        res.json(results[0]);
    });
});

// GET: Dashboard Stats for Staff
router.get('/dashboard-stats', (req, res) => {
    const stats = {};
    // Count only active requests for the staff view
    db.query(`SELECT 
        (SELECT COUNT(*) FROM Document_RequestTable WHERE status = 'Pending') as pending,
        (SELECT COUNT(*) FROM Document_RequestTable WHERE status = 'Ready to Print') as ready,
        (SELECT COUNT(*) FROM Document_RequestTable WHERE status = 'Released') as released`, 
    (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results[0]);
    });
});

export default router;