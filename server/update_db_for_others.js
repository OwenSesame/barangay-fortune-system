import db from './db.js';

const addColumnsSql = `
    ALTER TABLE Document_RequestTable
    ADD COLUMN requested_for_others BOOLEAN DEFAULT FALSE,
    ADD COLUMN requested_for_name VARCHAR(100) NULL,
    ADD COLUMN authorization_proof VARCHAR(255) NULL;
`;

db.query(addColumnsSql, (err, result) => {
    if (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("Columns already exist. Skipping.");
        } else {
            console.error("Failed to add columns:", err);
        }
    } else {
        console.log("Successfully added requested_for_others, requested_for_name, and authorization_proof to Document_RequestTable.");
    }
    process.exit();
});
