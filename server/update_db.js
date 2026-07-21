import db from './db.js';

const sql = `ALTER TABLE Document_RequestTable ADD COLUMN or_number VARCHAR(100) DEFAULT NULL`;

db.query(sql, (err, result) => {
    if (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("or_number column already exists.");
        } else {
            console.error("Error adding column:", err);
        }
    } else {
        console.log("Successfully added or_number column.");
    }
    process.exit(0);
});
