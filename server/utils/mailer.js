import nodemailer from 'nodemailer';

import dotenv from 'dotenv';
dotenv.config();

// Create a reusable transporter
let transporterInstance = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log('Using real SMTP credentials from .env for user:', process.env.EMAIL_USER);
    transporterInstance = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
} else {
    console.log('Missing real credentials. USER:', process.env.EMAIL_USER, 'PASS:', process.env.EMAIL_PASS ? '***' : 'missing');
    nodemailer.createTestAccount((err, account) => {
        if (err) {
            console.error('Failed to create a testing account. ' + err.message);
            return process.exit(1);
        }

        console.log('Ethereal Email Test Account Created!');
        console.log('SMTP Configured automatically. Emails sent will generate a preview URL in the console.');

        transporterInstance = nodemailer.createTransport({
            host: account.smtp.host,
            port: account.smtp.port,
            secure: account.smtp.secure,
            auth: {
                user: account.user,
                pass: account.pass
            }
        });
    });
}

const transporter = {
    sendMail: async function(...args) {
        if (!transporterInstance) {
            console.error('Mailer not ready.');
            return Promise.reject(new Error('Mailer not ready.'));
        }
        
        try {
            let info = await transporterInstance.sendMail(...args);
            console.log(`\n📧 EMAIL SENT`);
            if (args[0] && args[0].subject) console.log(`SUBJECT: ${args[0].subject}`);
            console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}\n`);
            
            // if a callback was provided, call it
            const cb = args[args.length - 1];
            if (typeof cb === 'function') cb(null, info);
            
            return info;
        } catch (err) {
            console.error("Error sending email: ", err);
            const cb = args[args.length - 1];
            if (typeof cb === 'function') cb(err);
            throw err;
        }
    }
};

export const sendNotificationEmail = async (toEmail, subject, text) => {
    return transporter.sendMail({
        from: '"Barangay Fortune E-Serbisyo" <no-reply@barangayfortune.gov.ph>',
        to: toEmail,
        subject: subject,
        text: text
    });
};

export default transporter;
