import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import multer from 'multer';

// Configure where and how to save images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Saves to the folder we just created
    },
    filename: (req, file, cb) => {
        // Renames the file to the current timestamp so names never clash
        cb(null, Date.now() + '-' + file.originalname); 
    }
});
const upload = multer({ storage });

const router = express.Router();

// REGISTRATION ROUTE (Now with Image Upload)
// We add upload.single('id_proof') as a middleware
router.post('/register', upload.single('id_proof'), async (req, res) => {
    const { firstName, lastName, middleName, dateOfBirth, civilStatus, address, contactNumber, email, password } = req.body;

    // Catch the image path if a file was uploaded
    const idProofImage = req.file ? req.file.path : null;

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Added id_proof_image to the SQL query
        const sql = `INSERT INTO Resident_ProfileTable 
        (first_name, last_name, middle_name, date_of_birth, civil_status, addres_street, contact_number, email_address, password_hash, id_proof_image) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        db.query(sql, [firstName, lastName, middleName, dateOfBirth, civilStatus, address, contactNumber, email, hashedPassword, idProofImage], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Database error or email exists." });
            }
            res.status(201).json({ message: "Resident registered successfully with ID!" });
        });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// LOGIN ROUTE (For all 3 roles)
router.post('/login', async (req, res) => {
    let { role, identifier, password } = req.body;

    // 1. Translate UI names to Database Roles
    let dbRole = role;
    if (role === 'Barangay Staff') dbRole = 'Staff';
    if (role === 'Administrator') dbRole = 'Admin';

    // 2. Prepare the Correct SQL based on the Role
    let sql = '';
    let queryParams = [];

    if (dbRole === 'Resident') {
        sql = `SELECT * FROM Resident_ProfileTable WHERE email_address = ?`;
        queryParams = [identifier];
    } else {
        // We check the username AND the specific role (Staff or Admin)
        sql = `SELECT * FROM Barangay_OfficialsTable WHERE username = ? AND role = ?`;
        queryParams = [identifier, dbRole];
    }

    db.query(sql, queryParams, async (err, result) => {
        if (err) {
            console.error("SQL Error:", err); // This prints the EXACT error in your terminal
            return res.status(500).json({ error: "Database error" });
        }
        
        if (result.length === 0) return res.status(404).json({ error: "User not found" });

        const user = result[0];

        // 3. Security Check for Suspended Residents
        if (dbRole === 'Resident' && user.account_status === 'Suspended') {
            return res.status(403).json({ error: "Account suspended. Please visit the Barangay Hall." });
        }

        // 4. Verify Password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(400).json({ error: "Invalid credentials" });

        // 5. Generate Token and send response
        // Note: Residents use 'resident_id', Officials use 'official_id'
        const userId = dbRole === 'Resident' ? user.resident_id : user.official_id;
        const token = jwt.sign({ id: userId, role: dbRole }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ 
            message: "Login successful", 
            token, 
            role: dbRole, // Send back the simple role for navigation logic
            id: userId 
        });
    });
});

// --- NEW: Get Resident Profile Data ---
router.get('/profile/:id', (req, res) => {
    const sql = `
        SELECT first_name, last_name, middle_name, email_address, contact_number, addres_street, civil_status 
        FROM Resident_ProfileTable 
        WHERE resident_id = ?
    `;
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (results.length === 0) return res.status(404).json({ error: "User not found" });
        res.json(results[0]);
    });
});

// --- NEW: Update Resident Contact Info ---
router.put('/profile/update/:id', (req, res) => {
    const { contact_number, addres_street } = req.body;
    const sql = `UPDATE Resident_ProfileTable SET contact_number = ?, addres_street = ? WHERE resident_id = ?`;
    
    db.query(sql, [contact_number, addres_street, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({ message: "Profile updated successfully!" });
    });
});

export default router;