const fs = require('fs');
const path = require('path');

const files = [
  'AdminDashboard.jsx',
  'AccountManagement.jsx',
  'AuditLogs.jsx',
  'SystemSettings.jsx',
  'DocumentManagement.jsx',
  'ResidentApprovals.jsx',
  'ReadyToPrint.jsx',
  'PendingReview.jsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, 'client/src/pages', file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Regex to match the entire sidebar div block.
  // It starts with <div style={{ width: '260px' and ends with </div> just before <div style={{ flex: 1
  const sidebarRegex = /<div style=\{\{ width: '260px'[\s\S]*?<\/div>[\s]*?(?=<div style=\{\{ flex: 1)/;
  
  // Also check if they already import AdminSidebar
  if (!content.includes('import AdminSidebar')) {
    // Add import after other imports
    content = content.replace(/(import .*;\n)+/, match => match + "import AdminSidebar from '../components/AdminSidebar';\n");
  }

  // Does the file have badgeCounts?
  const hasBadgeCounts = content.includes('badgeCounts');
  const replacement = hasBadgeCounts ? '<AdminSidebar badgeCounts={badgeCounts} />\n\n      ' : '<AdminSidebar />\n\n      ';

  if (sidebarRegex.test(content)) {
    content = content.replace(sidebarRegex, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Refactored ' + file);
  } else {
    console.log('Could not find sidebar in ' + file);
  }
});
