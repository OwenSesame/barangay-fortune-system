const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'server/routes/staff.js');

let content = fs.readFileSync(filePath, 'utf8');

// The original file is a mess because of the bad string interpolation.
// Let's just fix the bad lines directly using regex.

// 1. Fix Reject Email syntax
content = content.replace(
  "if (residentEmail) { sendNotificationEmail(residentEmail, 'Barangay Document Rejected', Good day . We regret to inform you that your request for  has been rejected. Reason: ); }",
  "if (nameRes[0]?.email_address) { sendNotificationEmail(nameRes[0].email_address, 'Barangay Document Rejected', `Good day ${residentName}. We regret to inform you that your request for ${docName} has been rejected. Reason: ${reason}`); }"
);

// 2. Fix No-Show Email syntax
content = content.replace(
  "if (residentEmail) { sendNotificationEmail(residentEmail, 'Barangay Document Forfeited', Good day . You missed your appointment to claim your . Your request has been officially forfeited.); }",
  "if (nameRes[0]?.email_address) { sendNotificationEmail(nameRes[0].email_address, 'Barangay Document Forfeited', `Good day ${residentName}. You missed your appointment to claim your ${docName}. Your request has been officially forfeited.`); }"
);

// 3. Fix the extra }); in reject route (lines 138-140 usually)
content = content.replace("    });\n    });\n});\n\n// FEATURE 5:", "    });\n});\n\n// FEATURE 5:");

// 4. Also make sure the SQL query for reject fetches email
content = content.replace(
  "SELECT res.first_name, res.last_name, doc.doc_name, off.full_name as staff_name\n        FROM Document_RequestTable req\n        JOIN Resident_ProfileTable res ON req.resident_id = res.resident_id\n        JOIN Document_TemplateTable doc ON req.doc_type_id = doc.doc_type_id\n        LEFT JOIN Barangay_OfficialsTable off ON off.official_id = ?\n        WHERE req.request_id = ?",
  "SELECT res.first_name, res.last_name, res.email_address, doc.doc_name, off.full_name as staff_name\n        FROM Document_RequestTable req\n        JOIN Resident_ProfileTable res ON req.resident_id = res.resident_id\n        JOIN Document_TemplateTable doc ON req.doc_type_id = doc.doc_type_id\n        LEFT JOIN Barangay_OfficialsTable off ON off.official_id = ?\n        WHERE req.request_id = ?"
);

// 5. Update-status: Add email notification for 'Ready to Print'
if (!content.includes("if (status === 'Ready to Print' && nameRes[0]?.email_address)")) {
  content = content.replace(
    "res.json({ message: `Status successfully changed to ${status}` });",
    "if (status === 'Ready to Print' && nameRes[0]?.email_address) { sendNotificationEmail(nameRes[0].email_address, 'Barangay Document Ready', `Good day ${residentName}! Your requested ${docName} is now Approved and Ready to Print. Please proceed to the Barangay Hall to claim it.`); }\n                res.json({ message: `Status successfully changed to ${status}` });"
  );
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('staff.js fixed');
