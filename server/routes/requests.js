import express from 'express';
import db from '../db.js'; // Adjust path if your db connection is elsewhere
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Setup Multer for saving the requirement files into the 'uploads' folder
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, 'req_' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// POST: Submit a new document application WITH a requirement file
router.post('/submit', upload.single('requirement_file'), (req, res) => {
    const { resident_id, doc_type_id, purpose } = req.body;
    const requirement_file = req.file ? req.file.path.replace('\\', '/') : null;

    const countSql = `SELECT COUNT(*) as totalToday FROM Document_RequestTable WHERE DATE(date_requested) = CURDATE()`;
    
    db.query(countSql, (countErr, countResult) => {
        if (countErr) {
            console.error(countErr);
            return res.status(500).json({ error: "Failed to generate queue number." });
        }

        // BULLETPROOF MATH: Extract the exact number safely, defaulting to 0 if it gets confused
        // Object.values grabs the first number regardless of what the database names the column!
        const count = countResult.length > 0 ? Object.values(countResult[0])[0] : 0;
        
        // Ensure it's a real number, then add 1
        let queueNumber = parseInt(count) + 1;

        const sql = `INSERT INTO Document_RequestTable (resident_id, doc_type_id, purpose, requirement_file, status) VALUES (?, ?, ?, ?, 'Pending')`;
        
        db.query(sql, [resident_id, doc_type_id, purpose, requirement_file], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Failed to save request." });
            }

            const requestId = result.insertId;
            const queueSql = `INSERT INTO Queue_ManagementTable (request_id, daily_sequence_no) VALUES (?, ?)`;
            
            // Convert the safe number to a string to save it perfectly
            db.query(queueSql, [requestId, queueNumber.toString()], (qErr) => {
                if (qErr) console.error(qErr);
                res.json({ message: "Application submitted successfully", queue_number: queueNumber });
            });
        });
    });
});

// GET: Fetch the latest request for the dashboard
router.get('/latest/:residentId', (req, res) => {
    const sql = `
        SELECT r.status as request_status, q.daily_sequence_no 
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
    // We use TRIM() just in case there are invisible spaces saving in your database
    const sql = `UPDATE Document_RequestTable SET status = 'Cancelled' WHERE request_id = ? AND TRIM(status) = 'Pending'`;
    
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        
        // NEW: Check if the database actually changed a row!
        if (result.affectedRows === 0) {
            return res.status(400).json({ error: "Could not cancel. It may have already been processed by staff." });
        }

        res.json({ message: "Request cancelled successfully" });
    });
});
// GET: Fetch all available document types for the dropdown
router.get('/documents', (req, res) => {
    // FIXED: Added base_fee and available to the query!
    const sql = `SELECT doc_type_id, doc_name, base_fee, available FROM Document_TemplateTable WHERE available = 1`;
    
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});
export default router;