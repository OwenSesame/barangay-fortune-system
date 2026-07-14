const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'server/routes/admin.js');
let content = fs.readFileSync(filePath, 'utf8');

const analyticsRoute = 
// FEATURE 7: Live Dashboard Analytics
router.get('/analytics', (req, res) => {
    const analytics = {};
    
    // Top 5 Most Requested Documents
    const topReasonsSql = \
        SELECT doc.doc_name as name, COUNT(req.request_id) as value
        FROM Document_RequestTable req
        JOIN Document_TemplateTable doc ON req.doc_type_id = doc.doc_type_id
        GROUP BY doc.doc_type_id
        ORDER BY value DESC
        LIMIT 5
    \;
    
    db.query(topReasonsSql, (err1, res1) => {
        if (err1) return res.status(500).json({ error: "Database error" });
        analytics.topReasons = res1;
        
        // Transaction Volume by Status
        const volumeSql = \
            SELECT status as name, COUNT(request_id) as value
            FROM Document_RequestTable
            GROUP BY status
        \;
        
        db.query(volumeSql, (err2, res2) => {
            if (err2) return res.status(500).json({ error: "Database error" });
            analytics.volume = res2;
            
            res.json(analytics);
        });
    });
});

export default router;
;

content = content.replace("export default router;", analyticsRoute);
fs.writeFileSync(filePath, content, 'utf8');
console.log('admin.js updated with Analytics Route safely');
