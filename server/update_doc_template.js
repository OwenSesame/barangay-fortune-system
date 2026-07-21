import db from './db.js';

const sql = `ALTER TABLE Document_TemplateTable ADD COLUMN requires_attachment TINYINT(1) DEFAULT 0`;

db.query(sql, (err, result) => {
    if (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("Column already exists.");
        } else {
            console.error(err);
        }
    } else {
        console.log("requires_attachment column added successfully!");
    }
    process.exit();
});
