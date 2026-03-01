import express from 'express';
import db from '../db.js';

const router = express.Router();

// ROUTE: Submit a new document request
router.post('/submit', async (req, res) => {
    // The frontend will send us who is requesting, and what document they want
    const { resident_id, doc_type_id } = req.body;

    try {
        // 1. Create the Document Request
        const requestSql = `INSERT INTO Document_RequestTable (resident_id, doc_type_id) VALUES (?, ?)`;
        
        db.query(requestSql, [resident_id, doc_type_id], (err, requestResult) => {
            if (err) return res.status(500).json({ error: "Failed to create request", details: err });
            
            const newRequestId = requestResult.insertId;

            // 2. Calculate the Queue Number for today
            const today = new Date().toISOString().split('T')[0]; // Gets today's date (YYYY-MM-DD)
            const countSql = `SELECT COUNT(*) as count FROM Queue_ManagementTable WHERE DATE(generated_at) = ?`;

            db.query(countSql, [today], (err, countResult) => {
                if (err) return res.status(500).json({ error: "Failed to calculate queue" });

                // If 5 people requested today, this person becomes number 6
                const dailySequenceNo = countResult[0].count + 1;

                // 3. Create the Queue Ticket
                const queueSql = `INSERT INTO Queue_ManagementTable (request_id, daily_sequence_no) VALUES (?, ?)`;
                
                db.query(queueSql, [newRequestId, dailySequenceNo], (err, queueResult) => {
                    if (err) return res.status(500).json({ error: "Failed to assign queue ticket" });

                    // 4. Send success message back
                    res.status(201).json({ 
                        message: "Document requested successfully!", 
                        request_id: newRequestId,
                        queue_number: dailySequenceNo 
                    });
                });
            });
        });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

export default router;