/**
 * WhatsApp Service
 * Handles sending WhatsApp messages via Twilio
 */

// Twilio client will be initialized when credentials are available
let twilioClient = null;

function getTwilioClient() {
    if (!twilioClient) {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        
        if (!accountSid || !authToken) {
            console.warn('⚠️ Twilio credentials not configured');
            return null;
        }
        
        const twilio = require('twilio');
        twilioClient = twilio(accountSid, authToken);
    }
    return twilioClient;
}

/**
 * Format phone number for WhatsApp (must include country code)
 */
function formatWhatsAppNumber(phone) {
    if (!phone) return null;
    
    // Remove spaces, dashes, parentheses
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // If starts with 0, assume Israeli number
    if (cleaned.startsWith('0')) {
        cleaned = '972' + cleaned.substring(1);
    }
    
    // Remove + if present (WhatsApp format doesn't use it)
    if (cleaned.startsWith('+')) {
        cleaned = cleaned.substring(1);
    }
    
    return `whatsapp:+${cleaned}`;
}

/**
 * Send WhatsApp message to a phone number
 * Uses template message for business-initiated conversations
 * 
 * @param {string} to - Phone number
 * @param {string} templateName - Name of approved template (optional)
 * @param {object} templateVars - Variables for template (optional)
 */
async function sendWhatsAppMessage(to, message) {
    const client = getTwilioClient();
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    
    if (!client || !whatsappNumber) {
        // Mock mode - just log
        console.log('═══════════════════════════════════════');
        console.log('📱 WhatsApp (mock mode)');
        console.log(`📞 To: ${to}`);
        console.log(`💬 Message: ${message}`);
        console.log('═══════════════════════════════════════');
        return { mock: true, to, message };
    }

    try {
        const formattedTo = formatWhatsAppNumber(to);
        const formattedFrom = `whatsapp:${whatsappNumber}`;

        const result = await client.messages.create({
            body: message,
            from: formattedFrom,
            to: formattedTo
        });

        console.log(`📱 WhatsApp sent to ${to}: ${result.sid}`);
        return {
            sid: result.sid,
            to: to,
            status: result.status
        };
    } catch (error) {
        console.error('Error sending WhatsApp:', error.message);
        throw new Error(`Could not send WhatsApp: ${error.message}`);
    }
}

/**
 * Send WhatsApp template message (for business-initiated conversations)
 * Template must be pre-approved by WhatsApp
 */
async function sendWhatsAppTemplate(to, templateSid, variables = {}) {
    const client = getTwilioClient();
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    
    if (!client || !whatsappNumber) {
        console.log('═══════════════════════════════════════');
        console.log('📱 WhatsApp Template (mock mode)');
        console.log(`📞 To: ${to}`);
        console.log(`📋 Template: ${templateSid}`);
        console.log(`📝 Variables: ${JSON.stringify(variables)}`);
        console.log('═══════════════════════════════════════');
        return { mock: true, to, templateSid, variables };
    }

    try {
        const formattedTo = formatWhatsAppNumber(to);
        const formattedFrom = `whatsapp:${whatsappNumber}`;

        const result = await client.messages.create({
            from: formattedFrom,
            to: formattedTo,
            contentSid: templateSid,
            contentVariables: JSON.stringify(variables)
        });

        console.log(`📱 WhatsApp template sent to ${to}: ${result.sid}`);
        return {
            sid: result.sid,
            to: to,
            status: result.status
        };
    } catch (error) {
        console.error('Error sending WhatsApp template:', error.message);
        throw new Error(`Could not send WhatsApp template: ${error.message}`);
    }
}

/**
 * Send missed call WhatsApp notification with bot_start message
 */
async function sendMissedCallWhatsApp(phoneNumber, reason = 'missed') {
    // Import bot start message
    const { getBotStartMessage } = require('./whatsappBot');
    const startMessage = getBotStartMessage();
    
    // Context messages based on reason
    const contextMessages = {
        missed: '📞 ראינו שהתקשרת ולא הצלחנו לענות.',
        closed: '🕐 התקשרת אלינו מחוץ לשעות הפעילות.',
        no_answer: '📞 הנציג שלנו לא היה פנוי כרגע.'
    };

    const context = contextMessages[reason] || contextMessages.missed;
    
    // Combine context with bot start message
    const fullMessage = `${context}\n\n${startMessage.message}\n\n📲 הקלידו "התחל" כדי להמשיך.`;
    
    return await sendWhatsAppMessage(phoneNumber, fullMessage);
}

module.exports = {
    sendWhatsAppMessage,
    sendWhatsAppTemplate,
    sendMissedCallWhatsApp,
    formatWhatsAppNumber
};

