const fs = require('fs');
const path = require('path');

const files = [
  'AdminDashboard.jsx',
  'AccountManagement.jsx',
  'AuditLogs.jsx',
  'DocumentManagement.jsx',
  'ResidentApprovals.jsx',
  'ReadyToPrint.jsx',
  'PendingReview.jsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, 'client/src/pages', file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Check if AdminSidebar is already imported
  if (!content.includes('import AdminSidebar')) {
    // Add import after other imports (find last import)
    const importMatch = content.match(/(import .*;\n)+/);
    if (importMatch) {
      content = content.replace(/(import .*;\n)+/, match => match + "import AdminSidebar from '../components/AdminSidebar';\n");
    } else {
      content = "import AdminSidebar from '../components/AdminSidebar';\n" + content;
    }
  }

  const startIdx = content.indexOf("<div style={{ width: '260px'");
  if (startIdx !== -1) {
    const logoutIdx = content.indexOf("Logout", startIdx);
    if (logoutIdx !== -1) {
      const buttonEndIdx = content.indexOf("</button>", logoutIdx);
      const divEndIdx = content.indexOf("</div>", buttonEndIdx) + 6;
      
      const hasBadgeCounts = content.includes('badgeCounts');
      const replacement = hasBadgeCounts ? '<AdminSidebar badgeCounts={badgeCounts} />' : '<AdminSidebar />';
      
      content = content.substring(0, startIdx) + replacement + content.substring(divEndIdx);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Successfully refactored ' + file);
    } else {
      console.log('Could not find Logout in ' + file);
    }
  } else {
    console.log('Could not find sidebar start in ' + file);
  }
});
