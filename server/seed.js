import bcrypt from 'bcrypt';
import db from './db.js';

async function createDummies() {
    try {
        // Scramble the password "password123"
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        const sql = `INSERT INTO Barangay_OfficialsTable (username, password_hash, role) VALUES ?`;
        const values = [
            ['staff_user', hashedPassword, 'Staff'],
            ['admin_user', hashedPassword, 'Admin']
        ];

        db.query(sql, [values], (err, result) => {
            if (err) {
                console.log("Accounts might already exist or there was an error:", err.sqlMessage);
            } else {
                console.log("Dummy accounts created successfully!");
                console.log("Staff Username: staff_user | Password: password123");
                console.log("Admin Username: admin_user | Password: password123");
            }
            process.exit(); // Stop the script once done
        });
    } catch (error) {
        console.error(error);
        process.exit();
    }
}

createDummies();