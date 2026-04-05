import bcrypt from 'bcrypt';
import db from './db.js';

const seedAccounts = async () => {
    try {
        // 1. Generate a secure hash for the password "password123"
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        // 2. Prepare the official accounts
        const sql = `INSERT INTO Barangay_OfficialsTable (username, full_name, password_hash, role) VALUES ?`;
        const values = [
            ['admin1', 'Super Admin', hashedPassword, 'Admin'],
            ['staff1', 'Front Desk Staff', hashedPassword, 'Staff']
        ];

        // 3. Insert them into the database
        db.query(sql, [values], (err, result) => {
            if (err) {
                // If it fails because they already exist, that's okay!
                if (err.code === 'ER_DUP_ENTRY') {
                    console.log("Accounts already exist! You can log in.");
                } else {
                    console.error("Database error:", err);
                }
            } else {
                console.log("✅ Seed successful!");
                console.log("👉 Admin Username: admin1");
                console.log("👉 Staff Username: staff1");
                console.log("👉 Password for both: password123");
            }
            process.exit(); // Closes the script
        });
    } catch (error) {
        console.error("Hashing error:", error);
        process.exit(1);
    }
};

seedAccounts();