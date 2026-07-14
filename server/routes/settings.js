import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET: Fetch Weekly Transaction Limits
router.get('/weekly-limits', (req, res) => {
    const sql = `SELECT setting_value FROM system_settingstable WHERE setting_key = 'WEEKLY_TRANSACTION_LIMITS'`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        
        let limits = {
            Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0
        };
        
        if (results.length > 0) {
            try {
                limits = JSON.parse(results[0].setting_value);
            } catch (e) {
                console.error("Error parsing weekly limits JSON");
            }
        }
        res.json({ limits });
    });
});

// PUT: Update Weekly Transaction Limits
router.put('/weekly-limits', (req, res) => {
    const { limits, adminId } = req.body;
    
    db.query(`SELECT * FROM system_settingstable WHERE setting_key = 'WEEKLY_TRANSACTION_LIMITS'`, (checkErr, checkRes) => {
        if (checkErr) return res.status(500).json({ error: "Database error" });
        
        let sql;
        let queryParams;
        const valueStr = JSON.stringify(limits);

        if (checkRes.length === 0) {
            sql = `INSERT INTO system_settingstable (setting_key, setting_value, description) VALUES ('WEEKLY_TRANSACTION_LIMITS', ?, 'JSON matrix of daily limits from Monday to Saturday.')`;
            queryParams = [valueStr];
        } else {
            sql = `UPDATE system_settingstable SET setting_value = ? WHERE setting_key = 'WEEKLY_TRANSACTION_LIMITS'`;
            queryParams = [valueStr];
        }
        
        db.query(sql, queryParams, (updateErr) => {
            if (updateErr) return res.status(500).json({ error: "Failed to update limits" });
            
            const logSql = `INSERT INTO audits_logstable (user_id, action_type, details) VALUES (?, ?, ?)`;
            db.query(logSql, [adminId || 0, 'System Configuration', `Admin updated the weekly transaction matrix limits`], () => {
                res.json({ message: "Weekly transaction matrix updated successfully." });
            });
        });
    });
});

export default router;
