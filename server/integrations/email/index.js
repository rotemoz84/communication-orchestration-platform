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
 * Format a single inquiry as a table row (HTML)
 * @param {Object} inquiry - The inquiry data
 */
function formatInquiryAsTableRow(inquiry) {
    const dateStr = new Date(inquiry.timestamp).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' });
    const rawPhone = inquiry.phone || '';
    const whatsappPhone = rawPhone.replace(/\D/g, '');
    const phoneContent = whatsappPhone
        ? `<a href="https://wa.me/${whatsappPhone}" target="_blank" rel="noopener noreferrer" style="color: #128C7E; text-decoration: none;">${rawPhone}</a>`
        : '-';

    return `
        <tr>
            <td style="border: 1px solid #ddd; padding: 4px 6px; white-space: nowrap;">${dateStr}</td>
            <td style="border: 1px solid #ddd; padding: 4px 6px; white-space: nowrap;">${phoneContent}</td>
            <td style="border: 1px solid #ddd; padding: 4px 6px; white-space: nowrap;">${inquiry.name || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 4px 6px;">${inquiry.email || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 4px 6px; white-space: nowrap;">${inquiry.service || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 4px 6px;">${inquiry.message || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 4px 6px; text-align: center;">${inquiry.pregnancyWeek || '-'}</td>
        </tr>`;
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

    let htmlContent;
    let subject;

    if (inquiries.length === 0) {
        subject = `סיכום פניות יומי - ${todayStr} (אין פניות חדשות)`;
        htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; direction: rtl;">
    <h2>סיכום פניות יומי</h2>
    <p><strong>תקופה:</strong> ${fromDateStr} עד ${toDateStr}</p>
    <p>לא התקבלו פניות חדשות בתקופה זו.</p>
    <hr>
    <p style="color: #666; font-size: 12px;">דוח זה נשלח אוטומטית כל יום (ראשון-חמישי) בשעה 08:00</p>
</body>
</html>`;
    } else {
        // Sort inquiries by date (oldest first)
        const sortedInquiries = [...inquiries].sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
        );

        subject = `סיכום פניות יומי - ${todayStr} (${inquiries.length} פניות)`;
        const tableRows = sortedInquiries.map(inq => formatInquiryAsTableRow(inq)).join('');

        htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; direction: rtl;">
    <h2>סיכום פניות יומי</h2>
    <p><strong>תקופה:</strong> ${fromDateStr} עד ${toDateStr}</p>
    <p><strong>סה"כ פניות:</strong> ${inquiries.length}</p>
    
    <table style="border-collapse: collapse; margin-top: 20px; font-size: 14px;">
        <thead>
            <tr style="background-color: #4CAF50; color: white;">
                <th style="border: 1px solid #ddd; padding: 6px 8px; text-align: right; white-space: nowrap;">תאריך</th>
                <th style="border: 1px solid #ddd; padding: 6px 8px; text-align: right; white-space: nowrap;">טלפון</th>
                <th style="border: 1px solid #ddd; padding: 6px 8px; text-align: right; white-space: nowrap;">שם</th>
                <th style="border: 1px solid #ddd; padding: 6px 8px; text-align: right; white-space: nowrap;">מייל</th>
                <th style="border: 1px solid #ddd; padding: 6px 8px; text-align: right; white-space: nowrap;">שירות</th>
                <th style="border: 1px solid #ddd; padding: 6px 8px; text-align: right; white-space: nowrap;">הערות</th>
                <th style="border: 1px solid #ddd; padding: 6px 8px; text-align: center; white-space: nowrap;">שבוע</th>
            </tr>
        </thead>
        <tbody>
            ${tableRows}
        </tbody>
    </table>
    
    <hr style="margin-top: 30px;">
    <p style="color: #666; font-size: 12px;">דוח זה נשלח אוטומטית כל יום (ראשון-חמישי) בשעה 08:00</p>
</body>
</html>`;
    }

    try {
        const info = await transporter.sendMail({
            from: senderEmail,
            to: recipientEmail,
            subject,
            html: htmlContent
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
