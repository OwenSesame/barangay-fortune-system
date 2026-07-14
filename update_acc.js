const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'client/src/pages/AccountManagement.jsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  "axios.delete('http://localhost:5000/api/admin/accounts/delete', { data: { id, account_type: type } });",
  "axios.put('http://localhost:5000/api/admin/accounts/archive', { id, account_type: type });"
);

content = content.replace(
  "window.confirm(WARNING: Are you sure you want to permanently delete this ",
  "window.confirm(WARNING: Are you sure you want to archive/remove this "
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('AccountManagement.jsx updated safely');
