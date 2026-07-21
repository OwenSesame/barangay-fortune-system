import db from './db.js';

db.query('DESCRIBE Document_RequestTable', (err, result) => {
    if (err) throw err;
    console.log(result);
    process.exit(0);
});
