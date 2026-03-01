import express from 'express';
import db from '../db.js';

const router = express.Router();

// ROUTE 1: Get today's entire queue list (For the monitors and dashboards)
router.get('/today', (req, res) => {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // We join tables so we can see the queue number AND the resident's name
    const sql = `
        SELECT 
            q.queue_id,
            q.daily_sequence_no,
            q.service_status,
            q.called_at,
            res.first_name,
            res.last_name
        FROM Queue_ManagementTable q
        JOIN Document_RequestTable req ON q.request_id = req.request_id
        JOIN Resident_ProfileTable res ON req.resident_id = res.resident_id
        WHERE DATE(q.generated_at) = ?
        ORDER BY q.daily_sequence_no ASC
    `;

    db.query(sql, [today], (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to fetch today's queue", details: err });
        res.status(200).json(results);
    });
});

// ROUTE 2: "Call" the next person in line (Used by Staff/Admin)
router.put('/call/:queue_id', (req, res) => {
    const queueId = req.params.queue_id; // The specific queue ticket ID
    const { official_id } = req.body;    // The staff member calling them

    // Updates the status from 'Waiting' to 'Serving' and logs exactly when it happened
    const sql = `
        UPDATE Queue_ManagementTable 
        SET service_status = 'Serving', official_id = ?, called_at = CURRENT_TIMESTAMP 
        WHERE queue_id = ?
    `;

    db.query(sql, [official_id, queueId], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to call queue number" });
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Queue ticket not found" });
        }
        
        res.status(200).json({ message: `Queue ticket ${queueId} is now being served!` });
    });
});

export default router;