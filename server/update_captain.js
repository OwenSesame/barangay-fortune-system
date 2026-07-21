import db from './db.js';

const sql = `ALTER TABLE barangay_officialstable ADD COLUMN is_captain TINYINT(1) DEFAULT 0`;

db.query(sql, (err, result) => {
    if (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("Column already exists.");
        } else {
            console.error(err);
        }
    } else {
        console.log("is_captain column added successfully!");
    }
    process.exit();
});
