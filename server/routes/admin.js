import express from 'express';
import db from '../db.js';

const router = express.Router();

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

// GET: Fetch ALL users (combining Officials and Residents)
router.get('/accounts', (req, res) => {
    // We use UNION to combine both tables into one unified list for the Admin!
    const sql = `
        SELECT official_id as id, full_name as name, role, 'official' as account_type 
        FROM Barangay_OfficialsTable
        UNION
        SELECT resident_id as id, CONCAT(first_name, ' ', last_name) as name, 'Resident' as role, 'resident' as account_type 
        FROM Resident_ProfileTable
        ORDER BY role ASC, name ASC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

// PUT: Update a User's Details or Role
router.put('/accounts/update', (req, res) => {
    const { id, account_type, name, role } = req.body;
    let sql = "";

    if (account_type === 'official') {
        sql = `UPDATE Barangay_OfficialsTable SET full_name = ?, role = ? WHERE official_id = ?`;
    } else {
        // For residents, we split the name back into first and last (simplified for this example)
        const nameParts = name.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');
        sql = `UPDATE Resident_ProfileTable SET first_name = ?, last_name = ? WHERE resident_id = ?`;
    }

    db.query(sql, [account_type === 'official' ? name : firstName, account_type === 'official' ? role : lastName, id], (err) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({ message: "Account updated successfully!" });
    });
});

// DELETE: Permanently Remove an Account
router.delete('/accounts/delete', (req, res) => {
    const { id, account_type } = req.body;
    const sql = account_type === 'official' 
        ? `DELETE FROM Barangay_OfficialsTable WHERE official_id = ?` 
        : `DELETE FROM Resident_ProfileTable WHERE resident_id = ?`;

    db.query(sql, [id], (err) => {
        if (err) return res.status(500).json({ error: "Database error. Cannot delete user with active records." });
        res.json({ message: "Account permanently deleted." });
    });
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

export default router;