import express from 'express';
import db from '../db.js';
import bcrypt from 'bcrypt';
import transporter from '../utils/mailer.js';

const router = express.Router();

// HELPER: Record an action in the audits_logstable
const recordLog = (adminId, action, details) => {
    const sql = "INSERT INTO audits_logstable (user_id, action_type, details) VALUES (?, ?, ?)";
    db.query(sql, [adminId, action, details], (err) => {
        if (err) console.error("Critical: Failed to write audit log!", err);
    });
};

// GET: Fetch Admin Dashboard Statistics
router.get('/dashboard-stats', (req, res) => {
    const stats = {};
    
    // 1. Total Registered Residents
    db.query(`SELECT COUNT(*) as count FROM Resident_ProfileTable`, (err1, res1) => {
        if (err1) return res.status(500).json({ error: "Database error" });
        stats.totalResidents = res1[0].count;
        
        // 2. Active Queue (Anything not finished)
        db.query(`SELECT COUNT(*) as count FROM Document_RequestTable WHERE status NOT IN ('Released', 'Cancelled', 'Rejected')`, (err2, res2) => {
            if (err2) return res.status(500).json({ error: "Database error" });
            stats.activeQueue = res2[0].count;
            
            // 3. Pending Action
            db.query(`SELECT COUNT(*) as count FROM Document_RequestTable WHERE status = 'Pending'`, (err3, res3) => {
                if (err3) return res.status(500).json({ error: "Database error" });
                stats.awaitingApproval = res3[0].count;
                
                // 4. Data for Donut Chart (Top Reasons)
                db.query(`SELECT purpose as name, COUNT(*) as value FROM Document_RequestTable WHERE purpose IS NOT NULL AND purpose != '' GROUP BY purpose ORDER BY value DESC LIMIT 4`, (err4, res4) => {
                    if (err4) console.error(err4);
                    stats.topReasons = res4 || [];
                    
                    // 5. Data for Bar Chart (Most Frequent Documents)
                    db.query(`SELECT d.doc_name as name, COUNT(r.request_id) as value FROM Document_RequestTable r JOIN Document_TemplateTable d ON r.doc_type_id = d.doc_type_id GROUP BY d.doc_name ORDER BY value DESC LIMIT 4`, (err5, res5) => {
                        if (err5) console.error(err5);
                        stats.frequentDocs = res5 || [];
                        
                        // Send all the compiled math to the frontend!
                        res.json(stats);
                    });
                });
            });
        });
    });
});

// GET: Fetch ALL users with every detail needed for tables and editing
router.get('/accounts', (req, res) => {
    const sql = `
        SELECT 
            official_id as id, 
            full_name as name, 
            username, 
            '' as first_name, 
            '' as last_name, 
            '' as contact_number, 
            '' as email_address, 
            role, 
            'official' as account_type 
        FROM barangay_officialstable
        UNION
        SELECT 
            resident_id as id, 
            CONCAT(first_name, ' ', last_name) as name, 
            '' as username, 
            first_name, 
            last_name, 
            contact_number, 
            email_address, 
            'Resident' as role, 
            'resident' as account_type 
        FROM resident_profiletable
        WHERE account_status != 'Archived'
        ORDER BY role ASC, name ASC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

// PUT: Update Account Details and Record in Audit Log
router.put('/accounts/update', (req, res) => {
    const { id, account_type, full_name, first_name, last_name, contact_number, email_address } = req.body;
    const adminId = 5; // Replace with req.user.id
    
    // Determine the name for the log entry
    const targetName = account_type === 'official' ? full_name : `${first_name} ${last_name}`;

    let sql = "";
    let params = [];

    if (account_type === 'official') {
        sql = "UPDATE barangay_officialstable SET full_name = ? WHERE official_id = ?";
        params = [full_name, id];
    } else {
        sql = "UPDATE resident_profiletable SET first_name = ?, last_name = ?, contact_number = ?, email_address = ? WHERE resident_id = ?";
        params = [first_name, last_name, contact_number, email_address, id];
    }

    db.query(sql, params, (err) => {
        if (err) return res.status(500).json({ error: "Database error" });

        // LOG THE ACTION
        recordLog(adminId, "Account Update", `Updated ${account_type} profile for: ${targetName}`);
        
        res.json({ message: "Account updated successfully!" });
    });
});

// ARCHIVE: Soft Delete an Account
router.put('/accounts/archive', (req, res) => {
    const { id, account_type } = req.body;
    const adminId = 5; // Replace with req.user.id

    if (account_type === 'official') {
        // Staff don't have transaction histories tied to them directly in the same way, so hard delete is fine.
        db.query(`DELETE FROM barangay_officialstable WHERE official_id = ?`, [id], (err) => {
            if (err) return res.status(500).json({ error: "Cannot delete staff. Active audit logs exist." });
            recordLog(adminId, "Account Deletion", `Permanently deleted staff account (ID: ${id})`);
            res.json({ message: "Staff account deleted." });
        });
    } else {
        // RESIDENT: Hard Delete
        // First delete their document requests to prevent foreign key constraint errors
        db.query(`DELETE FROM document_requesttable WHERE resident_id = ?`, [id], (err1) => {
            if (err1) return res.status(500).json({ error: "Cannot delete resident's document requests." });
            
            // Then delete the resident profile
            db.query(`DELETE FROM resident_profiletable WHERE resident_id = ?`, [id], (err) => {
                if (err) return res.status(500).json({ error: "Database error." });
                recordLog(adminId, "Account Deletion", `Permanently deleted resident account (ID: ${id}) and all associated records.`);
                res.json({ message: "Resident account permanently deleted from database." });
            });
        });
    }
});
// --- ADMIN DOCUMENT TEMPLATE MANAGEMENT ---

// GET all documents (including hidden ones)
router.get('/document-templates', (req, res) => {
    db.query("SELECT * FROM Document_TemplateTable", (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

// POST a new document type
router.post('/document-templates', (req, res) => {
    const { doc_name, base_fee } = req.body;
    db.query("INSERT INTO Document_TemplateTable (doc_name, base_fee, available) VALUES (?, ?, 1)", [doc_name, base_fee], (err) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({ message: "New Document Template Created!" });
    });
});

// PUT (Toggle availability on or off)
router.put('/document-templates/:id/toggle', (req, res) => {
    const { available } = req.body;
    db.query("UPDATE Document_TemplateTable SET available = ? WHERE doc_type_id = ?", [available, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({ message: "Document status updated!" });
    });
});

// Removed duplicate bcrypt import

// --- NEW STAFF MANAGEMENT ROUTES ---

// GET: Fetch Staff List for Toggle Feature
router.get('/staff-list', (req, res) => {
    // We select official_id as user_id so React understands it
    const sql = "SELECT official_id as user_id, full_name, username, role, can_review FROM barangay_officialstable WHERE role = 'Staff'";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

// POST: Create New Staff (with hashed password)
router.post('/create-staff', async (req, res) => {
    const { full_name, username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = "INSERT INTO barangay_officialstable (full_name, username, password_hash, role, can_review, account_status) VALUES (?, ?, ?, 'Staff', 1, 'Active')";
        db.query(sql, [full_name, username, hashedPassword], (err) => {
            if (err) return res.status(500).json({ error: "Database error or username taken." });
            res.json({ message: "Staff account created!" });
        });
    } catch (error) {
        res.status(500).json({ error: "Error encrypting password" });
    }
});

// PUT: Toggle Staff Access and Record in Audit Log
router.put('/staff/:id/toggle-access', (req, res) => {
    const { can_review } = req.body;
    const staffId = req.params.id;
    const adminId = 5; // Replace this with req.user.id if you have auth middleware
    const accessStatus = can_review === 1 ? "GRANTED" : "REVOKED";

    const sql = "UPDATE barangay_officialstable SET can_review = ? WHERE official_id = ?";
    db.query(sql, [can_review, staffId], (err) => {
        if (err) return res.status(500).json({ error: "Database error" });

        // LOG THE ACTION
        recordLog(adminId, "Privilege Change", `Pending Review access ${accessStatus} for Staff ID: ${staffId}`);
        
        res.json({ message: `Access ${accessStatus} successfully.` });
    });
});

// GET: Fetch System Audit Logs
router.get('/audit-logs', (req, res) => {
    // Join with officialstable to get the name of who did it
    const sql = `
        SELECT a.log_id, a.action_type, a.details, a.timestamp, b.full_name as user_name 
        FROM audits_logstable a 
        LEFT JOIN barangay_officialstable b ON a.user_id = b.official_id 
        ORDER BY a.timestamp DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

// --- NEW: RESIDENT APPROVAL WORKFLOW ---

// GET: Fetch all pending resident registrations
router.get('/pending-residents', (req, res) => {
    const sql = `
        SELECT resident_id, first_name, last_name, middle_name, date_of_birth, contact_number, email_address, addres_street, id_proof_image, account_status
        FROM resident_profiletable 
        WHERE account_status = 'Pending'
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

// PUT: Approve a resident
router.put('/approve-resident/:id', (req, res) => {
    const residentId = req.params.id;
    const adminId = 5; // Assuming fixed admin for now

    db.query("UPDATE resident_profiletable SET account_status = 'Active' WHERE resident_id = ?", [residentId], (err, updateRes) => {
        if (err) return res.status(500).json({ error: "Database error" });

        recordLog(adminId, "Account Approval", `Approved resident registration for ID: ${residentId}`);
        
        // Fetch email to notify user
        db.query("SELECT email_address, first_name FROM resident_profiletable WHERE resident_id = ?", [residentId], (err2, results) => {
            if (!err2 && results.length > 0) {
                const user = results[0];
                const mailOptions = {
                    from: process.env.EMAIL_USER || 'barangayfortune.dummy@gmail.com',
                    to: user.email_address,
                    subject: 'Barangay Fortune Portal - Account Approved!',
                    text: `Hello ${user.first_name},\n\nGood news! Your registration at the Barangay Fortune E-Services Portal has been approved by the administration. You may now log in to request documents.\n\nThank you!`
                };
                transporter.sendMail(mailOptions).catch(err => console.log("Email failed to send (ignore if using dummy credentials):", err));
            }
        });

        res.json({ message: "Resident approved successfully." });
    });
});

// PUT: Reject a resident
router.put('/reject-resident/:id', (req, res) => {
    const residentId = req.params.id;
    const { reason } = req.body;
    const adminId = 5; 

    db.query("UPDATE resident_profiletable SET account_status = 'Rejected' WHERE resident_id = ?", [residentId], (err, updateRes) => {
        if (err) return res.status(500).json({ error: "Database error" });

        recordLog(adminId, "Account Rejection", `Rejected resident registration for ID: ${residentId}. Reason: ${reason}`);
        
        // Fetch email to notify user
        db.query("SELECT email_address, first_name FROM resident_profiletable WHERE resident_id = ?", [residentId], (err2, results) => {
            if (!err2 && results.length > 0) {
                const user = results[0];
                const mailOptions = {
                    from: process.env.EMAIL_USER || 'barangayfortune.dummy@gmail.com',
                    to: user.email_address,
                    subject: 'Barangay Fortune Portal - Registration Issue',
                    text: `Hello ${user.first_name},\n\nWe reviewed your registration at the Barangay Fortune E-Services Portal and unfortunately it was rejected.\nReason: ${reason || 'Incomplete or invalid information.'}\n\nPlease visit the Barangay Hall for further assistance.\n\nThank you.`
                };
                transporter.sendMail(mailOptions).catch(err => console.log("Email failed to send (ignore if using dummy credentials):", err));
            }
        });

        res.json({ message: "Resident rejected successfully." });
    });
});

// FEATURE 7: Live Dashboard Analytics
router.get('/analytics', (req, res) => {
    const analytics = {};
    
    // Top 5 Most Requested Documents
    const topReasonsSql = `
        SELECT doc.doc_name as name, COUNT(req.request_id) as value
        FROM Document_RequestTable req
        JOIN Document_TemplateTable doc ON req.doc_type_id = doc.doc_type_id
        GROUP BY doc.doc_type_id
        ORDER BY value DESC
        LIMIT 5
    `;
    
    db.query(topReasonsSql, (err1, res1) => {
        if (err1) return res.status(500).json({ error: "Database error" });
        analytics.topReasons = res1;
        
        // Transaction Volume by Status
        const volumeSql = `
            SELECT status as name, COUNT(request_id) as value
            FROM Document_RequestTable
            GROUP BY status
        `;
        
        db.query(volumeSql, (err2, res2) => {
            if (err2) return res.status(500).json({ error: "Database error" });
            analytics.volume = res2;
            
            res.json(analytics);
        });
    });
});

export default router;