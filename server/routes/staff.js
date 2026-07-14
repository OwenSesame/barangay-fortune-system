import { sendNotificationEmail } from '../utils/mailer.js';
import express from 'express';
import db from '../db.js';

const router = express.Router();

// 1. Fetch Pending and Ready to Print requests (Now includes ID Image!)
// Fetch Pending and Ready to Print requests (Now includes Purpose and Requirement File)
router.get('/pending-requests', (req, res) => {
    const sql = `
        SELECT req.request_id, req.status, req.date_requested, req.purpose, req.requirement_file,
               res.first_name, res.last_name, res.id_proof_image, 
               doc.doc_name, q.daily_sequence_no
        FROM Document_RequestTable req
        JOIN Resident_ProfileTable res ON req.resident_id = res.resident_id
        JOIN Document_TemplateTable doc ON req.doc_type_id = doc.doc_type_id
        LEFT JOIN Queue_ManagementTable q ON req.request_id = q.request_id
        WHERE req.status IN ('Pending', 'Ready to Print')
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
        SELECT req.request_id, req.date_requested, 
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

// PUT: Update request status AND record it in the Audit Log
router.put('/update-status/:id', (req, res) => {
    const { status, official_id } = req.body;
    const requestId = req.params.id;

    // 1. Fetch names for the log
    const nameSql = `
        SELECT res.first_name, res.last_name, res.email_address, doc.doc_name, off.full_name as staff_name
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

        // 2. Update the document's status
        const sql = `UPDATE Document_RequestTable SET status = ? WHERE request_id = ?`;
        
        db.query(sql, [status, requestId], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Database error" });
            }

            // 3. Save this action to the Admin Audit Logs!
            const logSql = `INSERT INTO audits_logstable (user_id, action_type, details) VALUES (?, ?, ?)`;
            const logDetails = `Staff ${staffName} updated ${docName} Request #${requestId} for Resident ${residentName} to status: ${status}`;
            
            db.query(logSql, [official_id, 'Process Document', logDetails], (logErr) => {
                if (logErr) console.error("Log error:", logErr); 
                if (status === 'Ready to Print' && nameRes[0]?.email_address) { sendNotificationEmail(nameRes[0].email_address, 'Barangay Document Ready', `Good day ${residentName}! Your requested ${docName} is now Approved and Ready to Print. Please proceed to the Barangay Hall to claim it.`); }
                res.json({ message: `Status successfully changed to ${status}` });
            });
        });
    });
});
// GET: Fetch all data needed to print a specific document
router.get('/print-data/:id', (req, res) => {
    const sql = `
        SELECT req.request_id, req.date_requested, req.purpose, 
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
        res.json(results[0]);
    });
});

// PUT: Reject a document and log the reason
router.put('/reject/:id', (req, res) => {
    const { official_id, reason } = req.body;
    const requestId = req.params.id;

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

        // 2. Change the status to Rejected
        const sql = `UPDATE Document_RequestTable SET status = 'Rejected', remarks = ? WHERE request_id = ?`;
        
        db.query(sql, [reason, requestId], (err, result) => {
            if (err) return res.status(500).json({ error: "Database error" });

            // 3. Log this specific action and the reason to the Audit Logs
            const logSql = `INSERT INTO audits_logstable (user_id, action_type, details) VALUES (?, ?, ?)`;
            const logDetails = `Staff ${staffName} rejected ${docName} Request #${requestId} for Resident ${residentName}. Reason: ${reason}`;
            
            db.query(logSql, [official_id, 'Reject Document', logDetails], (logErr) => {
                if (logErr) console.error("Log error:", logErr);
                if (nameRes[0]?.email_address) { sendNotificationEmail(nameRes[0].email_address, 'Barangay Document Rejected', `Good day ${residentName}. We regret to inform you that your request for ${docName} has been rejected. Reason: ${reason}`); }
                res.json({ message: "Document successfully rejected." });
            });
        });
    });
});

// FEATURE 5: PUT - Mark a document as "No-Show" / Forfeited
router.put('/no-show/:id', (req, res) => {
    const requestId = req.params.id;
    const { official_id } = req.body;

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

// GET: Fetch all completed, rejected, or cancelled document records
router.get('/document-records', (req, res) => {
    const sql = `
        SELECT req.request_id, req.status, req.date_requested, req.purpose, req.remarks,
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