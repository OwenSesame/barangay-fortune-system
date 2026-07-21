import db from './db.js';

const sql = `ALTER TABLE barangay_officialstable ADD COLUMN email_address VARCHAR(100) NULL`;

db.query(sql, (err, result) => {
    if (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("Column already exists.");
        } else {
            console.error(err);
        }
    } else {
        console.log("email_address column added successfully!");
    }
    process.exit();
});
