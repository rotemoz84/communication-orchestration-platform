/**
 * Email Service
 * Sends email notifications using SMTP (a2hosting)
 * Only sends daily inquiry summary reports
 */

const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Initialize Nodemailer SMTP transporter
 */
function initializeEmailTransporter() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT) || 465;
    const secure = process.env.SMTP_SECURE === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;

    if (!host || !user || !pass) {
        console.warn('⚠️ SMTP not fully configured. Email notifications disabled.');
        console.warn('   Required: SMTP_HOST, SMTP_USER, SMTP_PASSWORD');
        return null;
    }

    transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
            user,
            pass
        },
        tls: {
            // Allow self-signed certificates (common with shared hosting)
            rejectUnauthorized: false
        }
    });

    console.log(`✅ SMTP email transporter initialized (${host}:${port})`);
    return transporter;
}

/**
 * Test email configuration by verifying SMTP connection
 */
async function testEmailConnection() {
    if (!transporter) {
        transporter = initializeEmailTransporter();
        if (!transporter) {
            return { success: false, error: 'SMTP not configured' };
        }
    }

    try {
        await transporter.verify();
        console.log('✅ SMTP connection verified');
        return { success: true };
    } catch (error) {
        console.error('❌ SMTP connection failed:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Format a single inquiry for the summary email
 * @param {Object} inquiry - The inquiry data
 * @param {number} index - Position in the list
 */
function formatInquiryForSummary(inquiry, index) {
    return `
${index + 1}. ${inquiry.name || 'לא צוין'}
   טלפון: ${inquiry.phone || 'לא צוין'}
   אימייל: ${inquiry.email || 'לא צוין'}
   שירות: ${inquiry.service || 'לא צוין'}
   שבוע: ${inquiry.pregnancyWeek || 'לא צוין'}
   הודעה: ${inquiry.message || '-'}
   מזהה: ${inquiry.inquiryId}
   זמן: ${new Date(inquiry.timestamp).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}
`.trim();
}

/**
 * Send daily inquiry summary email
 * @param {Array} inquiries - List of inquiries to include
 * @param {Date} fromTimestamp - Start of the reporting period
 * @param {Date} toTimestamp - End of the reporting period
 */
async function sendInquirySummaryEmail(inquiries, fromTimestamp, toTimestamp) {
    if (!transporter) {
        transporter = initializeEmailTransporter();
        if (!transporter) {
            console.log('📧 Email not configured, skipping summary');
            return false;
        }
    }

    const recipientEmail = process.env.EMAIL_NOTIFICATION_TO;
    const senderEmail = process.env.EMAIL_FROM;

    if (!recipientEmail || !senderEmail) {
        console.warn('⚠️ EMAIL_FROM or EMAIL_NOTIFICATION_TO not configured');
        return false;
    }

    const fromDateStr = fromTimestamp.toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' });
    const toDateStr = toTimestamp.toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' });
    const todayStr = new Date().toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem' });

    let emailContent;
    let subject;

    if (inquiries.length === 0) {
        subject = `סיכום פניות יומי - ${todayStr} (אין פניות חדשות)`;
        emailContent = `
סיכום פניות יומי
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

תקופה: ${fromDateStr} עד ${toDateStr}

לא התקבלו פניות חדשות בתקופה זו.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
דוח זה נשלח אוטומטית כל יום (ראשון-חמישי) בשעה 08:00
        `.trim();
    } else {
        subject = `סיכום פניות יומי - ${todayStr} (${inquiries.length} פניות)`;
        const inquiriesList = inquiries.map((inq, idx) => formatInquiryForSummary(inq, idx)).join('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n');

        emailContent = `
סיכום פניות יומי
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

תקופה: ${fromDateStr} עד ${toDateStr}
סה"כ פניות: ${inquiries.length}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${inquiriesList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
דוח זה נשלח אוטומטית כל יום (ראשון-חמישי) בשעה 08:00
        `.trim();
    }

    try {
        const info = await transporter.sendMail({
            from: senderEmail,
            to: recipientEmail,
            subject,
            text: emailContent
        });

        console.log(`📧 Daily summary email sent: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to send summary email:', error.message);
        throw error;
    }
}

module.exports = {
    initializeEmailTransporter,
    testEmailConnection,
    sendInquirySummaryEmail
};
