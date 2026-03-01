import express from 'express';
import db from '../db.js';

const router = express.Router();

// ROUTE 1: Get all registered residents (For Account Management)
router.get('/residents', (req, res) => {
    // We don't want to send passwords to the frontend, so we only select safe columns
    const sql = `
        SELECT resident_id, first_name, last_name, email_address, contact_number, account_status 
        FROM Resident_ProfileTable
        ORDER BY last_name ASC
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to fetch residents" });
        res.status(200).json(results);
    });
});

// ROUTE 2: Get all official accounts (Staff/Admin)
router.get('/officials', (req, res) => {
    const sql = `
        SELECT official_id, username, role, account_status, last_login 
        FROM Barangay_OfficialsTable
        ORDER BY role DESC
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to fetch officials" });
        res.status(200).json(results);
    });
});

// ROUTE 3: Update a user's account status (Activate / Suspend)
router.put('/update-status', (req, res) => {
    // The frontend will tell us if it's a Resident or an Official being updated
    const { userType, userId, newStatus } = req.body; 

    let sql = "";
    if (userType === 'Resident') {
        sql = `UPDATE Resident_ProfileTable SET account_status = ? WHERE resident_id = ?`;
    } else if (userType === 'Official') {
        sql = `UPDATE Barangay_OfficialsTable SET account_status = ? WHERE official_id = ?`;
    } else {
        return res.status(400).json({ error: "Invalid user type" });
    }

    db.query(sql, [newStatus, userId], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to update account status" });
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        
        res.status(200).json({ message: `${userType} account status successfully changed to ${newStatus}` });
    });
});

export default router;