import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

// Upgrade to createPool instead of createConnection
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10, // Allows up to 10 simultaneous database connections
    queueLimit: 0
});

// Test the pool connection to ensure it works on startup
db.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to the database:', err.message);
        return;
    }
    if (connection) {
        connection.release();
        console.log('Connected to MySQL Database with a Connection Pool!');
    }
});

export default db;