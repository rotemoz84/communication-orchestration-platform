/**
 * SMS Service
 * Handles sending SMS via Twilio
 */

const twilio = require('twilio');
const { config, isTwilioConfigured } = require('../../config');

// Initialize Twilio client
let twilioClient = null;

function getTwilioClient() {
    if (!twilioClient) {
        if (!isTwilioConfigured()) {
            console.warn('⚠️ Twilio credentials not configured');
            return null;
        }
        
        twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);
    }
    return twilioClient;
}

/**
 * Send an SMS message
 * @param {string} to - Phone number (with country code, e.g., +972...)
 * @param {string} message - Message text
 * @returns {Object} - Message details or null if failed
 */
async function sendSMS(to, message) {
    const client = getTwilioClient();
    
    if (!client || !config.twilio.phoneNumber) {
        // Mock mode - just log the SMS
        console.log('═══════════════════════════════════════');
        console.log('📱 SMS (mock mode - Twilio not configured)');
        console.log(`📞 To: ${to}`);
        console.log(`💬 Message: ${message}`);
        console.log('═══════════════════════════════════════');
        
        return { mock: true, to, message };
    }

    try {
        const result = await client.messages.create({
            body: message,
            from: config.twilio.phoneNumber,
            to: to
        });

        console.log(`📱 SMS sent to ${to}: ${result.sid}`);
        return {
            sid: result.sid,
            to: to,
            status: result.status
        };
    } catch (error) {
        console.error('Error sending SMS:', error.message);
        throw new Error(`Could not send SMS: ${error.message}`);
    }
}

/**
 * Format phone number to international format
 * Handles Israeli numbers
 */
function formatPhoneNumber(phone) {
    if (!phone) return null;
    
    // Remove spaces, dashes, parentheses
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // If starts with 0, assume Israeli number
    if (cleaned.startsWith('0')) {
        cleaned = '+972' + cleaned.substring(1);
    }
    
    // If doesn't start with +, add it
    if (!cleaned.startsWith('+')) {
        cleaned = '+' + cleaned;
    }
    
    return cleaned;
}

/**
 * Build reminder message in Hebrew
 */
function buildReminderMessage(appointment, confirmLink, settings) {
    const businessName = settings.businessName || 'העסק';
    
    // Format date in Hebrew
    const dateObj = new Date(appointment.date + 'T00:00:00');
    const hebrewDate = dateObj.toLocaleDateString('he-IL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });

    // Default message template
    let message = settings.reminderMessage || 
        'שלום {name}, תזכורת לפגישה שלך ב{date} בשעה {time}. לאישור או שינוי: {link}';
    
    // Replace placeholders
    message = message
        .replace('{name}', appointment.clientName)
        .replace('{date}', hebrewDate)
        .replace('{time}', appointment.time)
        .replace('{link}', confirmLink)
        .replace('{business}', businessName);

    return message;
}

module.exports = {
    getTwilioClient,
    sendSMS,
    formatPhoneNumber,
    buildReminderMessage
};
