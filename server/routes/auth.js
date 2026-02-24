import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../db.js';

const router = express.Router();

// REGISTRATION ROUTE (Only for Residents)
router.post('/register', async (req, res) => {
    const { firstName, lastName, dateOfBirth, address, contactNumber, email, password } = req.body;

    try {
        // Scramble the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const sql = `INSERT INTO Resident_ProfileTable 
        (first_name, last_name, date_of_birth, addres_street, contact_number, email_address, password_hash) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`;

        db.query(sql, [firstName, lastName, dateOfBirth, address, contactNumber, email, hashedPassword], (err, result) => {
            if (err) return res.status(500).json({ error: "Email might already exist or database error." });
            res.status(201).json({ message: "Resident registered successfully!" });
        });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// LOGIN ROUTE (For all 3 roles)
router.post('/login', async (req, res) => {
    const { role, identifier, password } = req.body; 
    // 'identifier' will be email for Resident, username for Staff/Admin

    let sql = "";
    if (role === 'Resident') {
        sql = "SELECT resident_id as id, password_hash, account_status, 'Resident' as role FROM Resident_ProfileTable WHERE email_address = ?";
    } else {
        sql = "SELECT official_id as id, password_hash, account_status, role FROM Barangay_OfficialsTable WHERE username = ? AND role = ?";
    }

    // Pass the role twice if it's official to check the specific enum, or just use identifier and role
    const queryParams = role === 'Resident' ? [identifier] : [identifier, role];

    db.query(sql, queryParams, async (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (results.length === 0) return res.status(401).json({ error: "Invalid credentials" });

        const user = results[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

        // Generate a token
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: "Login successful", token, role: user.role });
    });
});

export default router;