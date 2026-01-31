/**
 * Email Service
 * Sends email notifications using nodemailer
 */

const nodemailer = require('nodemailer');

// Create transporter (will be configured from environment variables)
let transporter = null;

/**
 * Initialize the email transporter
 */
function initializeTransporter() {
    const host = process.env.EMAIL_HOST;
    const port = process.env.EMAIL_PORT || 587;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!host || !user || !pass) {
        console.warn('⚠️ Email configuration incomplete. Email notifications disabled.');
        return null;
    }

    transporter = nodemailer.createTransport({
        host: host,
        port: parseInt(port),
        secure: parseInt(port) === 465, // true for 465 (SSL), false for other ports
        auth: {
            user: user,
            pass: pass
        },
        tls: {
            // Allow self-signed certificates (common on shared hosting)
            rejectUnauthorized: false
        }
    });

    console.log('✅ Email transporter initialized');
    return transporter;
}

/**
 * Send email notification for new inquiry
 * @param {Object} inquiry - The inquiry data
 */
async function sendInquiryNotification(inquiry) {
    if (!transporter) {
        transporter = initializeTransporter();
        if (!transporter) {
            console.log('📧 Email not configured, skipping notification');
            return false;
        }
    }

    const recipientEmail = process.env.EMAIL_NOTIFICATION_TO || process.env.EMAIL_USER;
    const senderEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    
    const emailContent = `
פנייה חדשה מהאתר

פרטי הפנייה:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

שם: ${inquiry.name || 'לא צוין'}
טלפון: ${inquiry.phone || 'לא צוין'}
אימייל: ${inquiry.email || 'לא צוין'}
שירות מבוקש: ${inquiry.service || 'לא צוין'}
שבוע מועדף: ${inquiry.week || 'לא צוין'}

הודעה:
${inquiry.message || 'לא צוינה הודעה'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
מספר פנייה: ${inquiry.inquiryId || 'N/A'}
זמן: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}
    `.trim();

    const mailOptions = {
        from: senderEmail,
        to: recipientEmail,
        subject: `פנייה חדשה מהאתר - ${inquiry.name || 'לקוח חדש'}`,
        text: emailContent
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`📧 Email notification sent: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to send email notification:', error.message);
        return false;
    }
}

/**
 * Test email configuration
 */
async function testEmailConnection() {
    if (!transporter) {
        transporter = initializeTransporter();
        if (!transporter) {
            return { success: false, error: 'Email not configured' };
        }
    }

    try {
        await transporter.verify();
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

module.exports = {
    initializeTransporter,
    sendInquiryNotification,
    testEmailConnection
};
