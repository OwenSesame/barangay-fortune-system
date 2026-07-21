import db from './db.js';

async function migrate() {
    try {
        const promiseDb = db.promise();
        await promiseDb.query(`
            CREATE TABLE IF NOT EXISTS Date_Specific_LimitsTable (
                id INT AUTO_INCREMENT PRIMARY KEY,
                specific_date DATE NOT NULL UNIQUE,
                document_limit INT NOT NULL DEFAULT 0,
                reason VARCHAR(255)
            )
        `);
        console.log('Created Date_Specific_LimitsTable.');

        const [rows] = await promiseDb.query("SELECT * FROM system_settingstable WHERE setting_key = 'DEFAULT_DAILY_LIMIT'");
        if (rows.length === 0) {
            await promiseDb.query(`
                INSERT INTO system_settingstable (setting_key, setting_value, description)
                VALUES ('DEFAULT_DAILY_LIMIT', '50', 'Default daily transaction limit for document requests.')
            `);
            console.log('Inserted DEFAULT_DAILY_LIMIT.');
        } else {
            console.log('DEFAULT_DAILY_LIMIT already exists.');
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

migrate();
