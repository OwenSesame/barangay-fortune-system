import db from './db.js';

db.query('DESCRIBE audits_logstable', (err, result) => {
    if (err) throw err;
    console.log(result);
    process.exit(0);
});
