const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'server/routes/staff.js');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('import { sendNotificationEmail }')) {
  content = "import { sendNotificationEmail } from '../utils/mailer.js';\n" + content;
}

// 1. Update update-status
content = content.replace(
  "SELECT res.first_name, res.last_name, doc.doc_name, off.full_name as staff_name",
  "SELECT res.first_name, res.last_name, res.email_address, doc.doc_name, off.full_name as staff_name"
);

content = content.replace(
  "const residentName = nameRes.length > 0 ? ${nameRes[0].first_name}  : 'Unknown Resident';",
  "const residentName = nameRes.length > 0 ? ${nameRes[0].first_name}  : 'Unknown Resident';\n        const residentEmail = nameRes.length > 0 ? nameRes[0].email_address : null;"
);

content = content.replace(
  "res.json({ message: \"Document status updated successfully!\" });",
  "if (status === 'Ready to Print' && residentEmail) { sendNotificationEmail(residentEmail, 'Barangay Document Ready', Good day ! Your requested  is now Approved and Ready to Print. Please proceed to the Barangay Hall to claim it.); }\n                res.json({ message: \"Document status updated successfully!\" });"
);

// 2. Update reject
content = content.replace(
  "res.json({ message: \"Document successfully rejected.\" });",
  "if (residentEmail) { sendNotificationEmail(residentEmail, 'Barangay Document Rejected', Good day . We regret to inform you that your request for  has been rejected. Reason: ); }\n                res.json({ message: \"Document successfully rejected.\" });"
);

// 3. Update no-show
content = content.replace(
  "res.json({ message: \"Document forfeited as No-Show.\" });",
  "if (residentEmail) { sendNotificationEmail(residentEmail, 'Barangay Document Forfeited', Good day . You missed your appointment to claim your . Your request has been officially forfeited.); }\n                res.json({ message: \"Document forfeited as No-Show.\" });"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('staff.js updated with Email Notifications safely');
