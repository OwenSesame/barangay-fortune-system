import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

let db;

if (process.env.NODE_ENV === 'test') {
    // Inject a mock database pool for testing
    db = {
        query: (sql, params, callback) => {
            // If callback isn't provided (e.g. some queries just use (sql, callback))
            const cb = typeof params === 'function' ? params : callback;
            if (cb) cb(null, []);
        },
        getConnection: (cb) => {
            cb(null, { release: () => {} });
        },
        // A property to let tests override query behavior dynamically
        mockQuery: function (implementation) {
            this.query = implementation;
        }
    };
} else {
    // Real MySQL Connection Pool
    db = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

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
}

export default db;