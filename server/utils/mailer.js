import nodemailer from 'nodemailer';

// Create a reusable transporter using Ethereal (Fake SMTP for testing/capstone defense)
let transporter;

nodemailer.createTestAccount((err, account) => {
    if (err) {
        console.error('Failed to create a testing account. ' + err.message);
        return process.exit(1);
    }

    console.log('Ethereal Email Test Account Created!');
    console.log('SMTP Configured automatically. Emails sent will generate a preview URL in the console.');

    transporter = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: {
            user: account.user,
            pass: account.pass
        }
    });
});

export const sendNotificationEmail = async (toEmail, subject, text) => {
    if (!transporter) return console.log('Mailer not ready.');
    try {
        let info = await transporter.sendMail({
            from: '"Barangay Fortune E-Serbisyo" <no-reply@barangayfortune.gov.ph>',
            to: toEmail,
            subject: subject,
            text: text
        });
        console.log(`\n📧 EMAIL SENT TO ${toEmail}`);
        console.log(`SUBJECT: ${subject}`);
        console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}\n`);
    } catch (err) {
        console.error("Error sending email: ", err);
    }
};

export default transporter;
