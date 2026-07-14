import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import multer from 'multer';
import crypto from 'crypto';
import transporter from '../utils/mailer.js';
import rateLimit from 'express-rate-limit';
import path from 'path';

// RATE LIMITING CONFIGURATION (Feature 1)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: { error: "Security Alert: Too many login attempts. Please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
});

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
// SECURE FILE UPLOAD CONFIGURATION (Feature 2)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Security Error: Only .png, .jpg and .jpeg files are allowed!"));
    }
};

const upload = multer({ 
    storage, 
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit
});

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

        // Added id_proof_image and account_status to the SQL query
        const sql = `INSERT INTO Resident_ProfileTable 
        (first_name, last_name, middle_name, date_of_birth, civil_status, addres_street, contact_number, email_address, password_hash, id_proof_image, account_status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        db.query(sql, [firstName, lastName, middleName, dateOfBirth, civilStatus, address, contactNumber, email, hashedPassword, idProofImage, 'Pending'], (err, result) => {
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

// LOGIN ROUTE (For all 3 roles) - Protected by Rate Limiter
router.post('/login', loginLimiter, async (req, res) => {
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

        // 3. Security Check for Suspended/Pending/Rejected Residents
        if (dbRole === 'Resident') {
            if (user.account_status === 'Suspended') {
                return res.status(403).json({ error: "Account suspended. Please visit the Barangay Hall." });
            }
            if (user.account_status === 'Pending') {
                return res.status(403).json({ error: "Account pending approval. Please wait for the admin to verify your registration." });
            }
            if (user.account_status === 'Rejected') {
                return res.status(403).json({ error: "Registration rejected. Please visit the Barangay Hall or try registering again." });
            }
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
// --- NEW: Forgot Password (Residents Only) ---
router.post('/forgot-password', (req, res) => {
    const { email } = req.body;
    
    // 1. Check if resident exists
    db.query(`SELECT * FROM Resident_ProfileTable WHERE email_address = ?`, [email], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (results.length === 0) return res.status(404).json({ error: "No resident found with this email" });
        
        const resident = results[0];
        
        // 2. Generate secure token
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        // 3. Hash token for secure database storage
        const salt = bcrypt.genSaltSync(10);
        const hashedToken = bcrypt.hashSync(resetToken, salt);
        
        // Expiration time: 1 hour from now
        const expiresAt = new Date(Date.now() + 3600000); 

        // 4. Save to database
        const sql = `INSERT INTO password_resettable (email, token_hash, expires_at, ip_request) VALUES (?, ?, ?, ?)`;
        db.query(sql, [email, hashedToken, expiresAt, req.ip], (insertErr) => {
            if (insertErr) {
                console.error(insertErr);
                return res.status(500).json({ error: "Failed to generate reset request" });
            }
            
            // 5. Send Email
            const resetLink = `http://localhost:5173/reset-password/${resetToken}?email=${encodeURIComponent(email)}`;
            
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Barangay Fortune - Password Reset Request',
                html: `
                    <div style="font-family: sans-serif; padding: 20px;">
                        <h2 style="color: #0f172a;">Password Reset Request</h2>
                        <p>Hi ${resident.first_name},</p>
                        <p>We received a request to reset the password for your E-Serbisyo Portal account.</p>
                        <p>Click the secure link below to reset your password. This link will expire in 1 hour.</p>
                        <br>
                        <a href="${resetLink}" style="padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset My Password</a>
                        <br><br>
                        <p style="color: #64748b; font-size: 13px;">If you did not request this, you can safely ignore this email. Your password will not change.</p>
                    </div>
                `
            };
            
            transporter.sendMail(mailOptions, (mailErr) => {
                if (mailErr) console.error("Email failed:", mailErr);
                
                // 6. Audit Log (System User = 0)
                const logSql = `INSERT INTO audits_logstable (user_id, action_type, details) VALUES (?, ?, ?)`;
                db.query(logSql, [0, 'Password Reset Requested', `Resident ${resident.first_name} ${resident.last_name} (${email}) requested a password reset.`], () => {
                    res.json({ message: "Reset link sent to your email." });
                });
            });
        });
    });
});

// --- NEW: Reset Password ---
router.post('/reset-password', (req, res) => {
    const { email, token, newPassword } = req.body;

    // 1. Find the latest valid token for this email
    const sql = `SELECT * FROM password_resettable WHERE email = ? AND is_used = 0 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`;
    
    db.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (results.length === 0) return res.status(400).json({ error: "Invalid or expired reset token" });
        
        const resetRecord = results[0];
        
        // 2. Verify the token matches the hash
        const isValid = await bcrypt.compare(token, resetRecord.token_hash);
        if (!isValid) return res.status(400).json({ error: "Invalid reset token" });
        
        // 3. Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // 4. Update the resident's password
        db.query(`UPDATE Resident_ProfileTable SET password_hash = ? WHERE email_address = ?`, [hashedPassword, email], (updateErr) => {
            if (updateErr) return res.status(500).json({ error: "Failed to update password" });
            
            // 5. Mark token as used
            db.query(`UPDATE password_resettable SET is_used = 1 WHERE Reset_id = ?`, [resetRecord.Reset_id], () => {
                
                // 6. Audit Log
                const logSql = `INSERT INTO audits_logstable (user_id, action_type, details) VALUES (?, ?, ?)`;
                db.query(logSql, [0, 'Password Successfully Reset', `Resident (${email}) successfully changed their password using a secure token.`], () => {
                    res.json({ message: "Password updated successfully!" });
                });
            });
        });
    });
});

export default router;