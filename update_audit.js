const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'client/src/pages/AuditLogs.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const exportFunc = `
  // FEATURE 8: Export to CSV
  const exportToCSV = () => {
    if (filteredLogs.length === 0) return alert("No logs to export.");
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Timestamp,User,Action,Details\\n";
    filteredLogs.forEach(log => {
      const date = new Date(log.timestamp).toLocaleString().replace(/,/g, '');
      const user = log.user_name || 'System Admin';
      const action = log.action_type;
      const details = log.details.replace(/,/g, ';'); // prevent CSV breaking
      csvContent += \`\${date},\${user},\${action},\${details}\\n\`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "System_Audit_Logs.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (`;

content = content.replace("  return (", exportFunc);

const buttonStr = "<button onClick={() => {setSearchTerm(''); setDateFilter('');}} style={{ alignSelf: 'flex-end', padding: '10px 20px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}>Reset</button>";
const newButtonStr = buttonStr + "\n          <button onClick={exportToCSV} style={{ alignSelf: 'flex-end', padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>📥 Export CSV</button>";

content = content.replace(buttonStr, newButtonStr);

fs.writeFileSync(filePath, content, 'utf8');
console.log('AuditLogs.jsx updated safely');
