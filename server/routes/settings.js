import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET: Fetch Default Daily Limit
router.get('/daily-limit', (req, res) => {
    const sql = `SELECT setting_value FROM system_settingstable WHERE setting_key = 'DEFAULT_DAILY_LIMIT'`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        let limit = 50; // Fallback
        if (results.length > 0) {
            limit = parseInt(results[0].setting_value, 10);
        }
        res.json({ limit });
    });
});

// PUT: Update Default Daily Limit
router.put('/daily-limit', (req, res) => {
    const { limit, adminId } = req.body;
    
    db.query(`SELECT * FROM system_settingstable WHERE setting_key = 'DEFAULT_DAILY_LIMIT'`, (checkErr, checkRes) => {
        if (checkErr) return res.status(500).json({ error: "Database error" });

        let sql = "";
        if (checkRes.length === 0) {
            sql = `INSERT INTO system_settingstable (setting_key, setting_value, description) VALUES ('DEFAULT_DAILY_LIMIT', ?, 'Default daily transaction limit for document requests.')`;
        } else {
            sql = `UPDATE system_settingstable SET setting_value = ? WHERE setting_key = 'DEFAULT_DAILY_LIMIT'`;
        }

        db.query(sql, [limit.toString()], (updateErr, updateRes) => {
            if (updateErr) return res.status(500).json({ error: "Failed to update limits" });

            const logSql = `INSERT INTO Audit_LogsTable (user_id, action_type, action_details) VALUES (?, ?, ?)`;
            db.query(logSql, [adminId || 0, 'System Configuration', `Admin updated the default daily limit to ${limit}`], () => {
                res.json({ message: "Default limit updated successfully!" });
            });
        });
    });
});

// GET: Fetch all date-specific limits
router.get('/date-limits', (req, res) => {
    db.query(`SELECT * FROM Date_Specific_LimitsTable ORDER BY specific_date ASC`, (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

// POST: Add or update a date-specific limit
router.post('/date-limits', (req, res) => {
    const { date, limit, reason, adminId } = req.body;
    const sql = `INSERT INTO Date_Specific_LimitsTable (specific_date, document_limit, reason) 
                 VALUES (?, ?, ?) 
                 ON DUPLICATE KEY UPDATE document_limit = VALUES(document_limit), reason = VALUES(reason)`;
    
    db.query(sql, [date, limit, reason], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed to add date limit" });
        }
        
        const logSql = `INSERT INTO Audit_LogsTable (user_id, action_type, action_details) VALUES (?, ?, ?)`;
        db.query(logSql, [adminId || 0, 'System Configuration', `Admin set specific limit for ${date} to ${limit} (${reason})`], () => {
            res.json({ message: "Date limit added/updated successfully!" });
        });
    });
});

// DELETE: Remove a date-specific limit
router.delete('/date-limits/:id', (req, res) => {
    const { id } = req.params;
    const { adminId } = req.body; // Can be passed in body or headers
    
    db.query(`DELETE FROM Date_Specific_LimitsTable WHERE id = ?`, [id], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        
        const logSql = `INSERT INTO Audit_LogsTable (user_id, action_type, action_details) VALUES (?, ?, ?)`;
        db.query(logSql, [adminId || 0, 'System Configuration', `Admin deleted date limit with ID ${id}`], () => {
            res.json({ message: "Date limit deleted successfully!" });
        });
    });
});

export default router;
