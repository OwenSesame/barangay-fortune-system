import db from './db.js';

const sql = `ALTER TABLE barangay_officialstable ADD COLUMN account_status ENUM('Active', 'Suspended') DEFAULT 'Active'`;

db.query(sql, (err, result) => {
    if (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("Column already exists.");
        } else {
            console.error(err);
        }
    } else {
        console.log("account_status column added successfully!");
    }
    process.exit();
});
