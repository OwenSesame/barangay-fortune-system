import express from 'express';
import db from '../db.js';

const router = express.Router();

// ROUTE 1: Get all "Pending" requests for the Staff Dashboard
router.get('/pending-requests', (req, res) => {
    // This SQL query joins 4 tables together to get the full picture
    const sql = `
        SELECT 
            req.request_id,
            res.first_name,
            res.last_name,
            doc.doc_name,
            q.daily_sequence_no,
            req.status,
            req.date_requested
        FROM Document_RequestTable req
        JOIN Resident_ProfileTable res ON req.resident_id = res.resident_id
        JOIN Document_TemplateTable doc ON req.doc_type_id = doc.doc_type_id
        JOIN Queue_ManagementTable q ON req.request_id = q.request_id
        WHERE req.status = 'Pending'
        ORDER BY q.daily_sequence_no ASC
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to fetch pending requests", details: err });
        res.status(200).json(results);
    });
});

// ROUTE 2: Update the status of a specific request
router.put('/update-status/:id', (req, res) => {
    const requestId = req.params.id; // Gets the ID from the URL
    const { status, official_id } = req.body; // Gets the new status from the frontend

    // Update the request status and record which staff member processed it
    const sql = `UPDATE Document_RequestTable SET status = ?, processed_by = ? WHERE request_id = ?`;

    db.query(sql, [status, official_id, requestId], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to update status" });
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Request not found" });
        }
        
        res.status(200).json({ message: `Request ${requestId} successfully updated to ${status}` });
    });
});

export default router;