/**
 * WhatsApp Service
 * Handles sending WhatsApp messages via Twilio
 */

const twilio = require('twilio');
const { config, isTwilioConfigured } = require('../../config');

// Twilio client
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
 * @param {string} to - Phone number
 * @param {string} message - Message text
 * @param {Object} options - Additional options (mediaUrl, priority, etc.)
 */
async function sendWhatsAppMessage(to, message, options = {}) {
    const client = getTwilioClient();
    const whatsappNumber = config.twilio.whatsappNumber;
    
    if (!client || !whatsappNumber) {
        // Mock mode - just log
        console.log('═══════════════════════════════════════');
        console.log('📱 WhatsApp (mock mode)');
        console.log(`📞 To: ${to}`);
        console.log(`💬 Message: ${message}`);
        console.log(`⚙️ Options: ${JSON.stringify(options)}`);
        console.log('═══════════════════════════════════════');
        return { mock: true, to, message, options };
    }

    try {
        const formattedTo = formatWhatsAppNumber(to);
        const formattedFrom = whatsappNumber.startsWith('whatsapp:') 
            ? whatsappNumber 
            : `whatsapp:${whatsappNumber}`;

        const messageParams = {
            body: message,
            from: formattedFrom,
            to: formattedTo
        };

        // Add media URL if provided
        if (options.mediaUrl) {
            messageParams.mediaUrl = [options.mediaUrl];
        }

        // Add priority if provided
        if (options.priority) {
            messageParams.priority = options.priority;
        }

        const result = await client.messages.create(messageParams);

        console.log(`📱 WhatsApp sent to ${to}: ${result.sid}`);
        return {
            sid: result.sid,
            to: to,
            status: result.status,
            direction: result.direction,
            dateCreated: result.dateCreated
        };
    } catch (error) {
        console.error('Error sending WhatsApp:', error.message);
        throw new Error(`Could not send WhatsApp: ${error.message}`);
    }
}

/**
 * Send WhatsApp message with interactive buttons
 * @param {string} to - Phone number
 * @param {string} message - Message text
 * @param {Array} buttons - Array of button objects {id: string, title: string}
 */
async function sendWhatsAppInteractive(to, message, buttons = []) {
    const client = getTwilioClient();
    const whatsappNumber = config.twilio.whatsappNumber;
    
    if (!client || !whatsappNumber) {
        console.log('═══════════════════════════════════════');
        console.log('📱 WhatsApp Interactive (mock mode)');
        console.log(`📞 To: ${to}`);
        console.log(`💬 Message: ${message}`);
        console.log(`🔘 Buttons: ${JSON.stringify(buttons)}`);
        console.log('═══════════════════════════════════════');
        return { mock: true, to, message, buttons };
    }

    try {
        const formattedTo = formatWhatsAppNumber(to);
        const formattedFrom = whatsappNumber.startsWith('whatsapp:') 
            ? whatsappNumber 
            : `whatsapp:${whatsappNumber}`;

        // Create interactive content
        const interactiveContent = {
            type: 'button',
            body: {
                type: 'plain_text',
                text: message
            },
            action: {
                buttons: buttons.map(btn => ({
                    type: 'reply',
                    reply: {
                        id: btn.id,
                        title: btn.title
                    }
                }))
            }
        };

        const result = await client.messages.create({
            contentSid: '', // Will be populated by Twilio
            contentVariables: JSON.stringify({ interactive: interactiveContent }),
            from: formattedFrom,
            to: formattedTo
        });

        console.log(`📱 WhatsApp interactive sent to ${to}: ${result.sid}`);
        return {
            sid: result.sid,
            to: to,
            status: result.status,
            type: 'interactive'
        };
    } catch (error) {
        console.error('Error sending WhatsApp interactive:', error.message);
        throw new Error(`Could not send WhatsApp interactive: ${error.message}`);
    }
}

/**
 * Send WhatsApp location
 * @param {string} to - Phone number
 * @param {Object} location - Location object {lat: number, lon: number, name?: string, address?: string}
 */
async function sendWhatsAppLocation(to, location) {
    const client = getTwilioClient();
    const whatsappNumber = config.twilio.whatsappNumber;
    
    if (!client || !whatsappNumber) {
        console.log('═══════════════════════════════════════');
        console.log('📱 WhatsApp Location (mock mode)');
        console.log(`📞 To: ${to}`);
        console.log(`📍 Location: ${JSON.stringify(location)}`);
        console.log('═══════════════════════════════════════');
        return { mock: true, to, location };
    }

    try {
        const formattedTo = formatWhatsAppNumber(to);
        const formattedFrom = whatsappNumber.startsWith('whatsapp:') 
            ? whatsappNumber 
            : `whatsapp:${whatsappNumber}`;

        const result = await client.messages.create({
            from: formattedFrom,
            to: formattedTo,
            persistentAction: ['send_location'],
            location: {
                latitude: location.lat,
                longitude: location.lon,
                name: location.name || '',
                address: location.address || ''
            }
        });

        console.log(`📱 WhatsApp location sent to ${to}: ${result.sid}`);
        return {
            sid: result.sid,
            to: to,
            status: result.status,
            type: 'location'
        };
    } catch (error) {
        console.error('Error sending WhatsApp location:', error.message);
        throw new Error(`Could not send WhatsApp location: ${error.message}`);
    }
}

/**
 * Bulk send WhatsApp messages
 * @param {Array} recipients - Array of {phone: string, message: string, options?: object}
 * @param {Object} options - Bulk options {delay?: number, batchSize?: number}
 */
async function sendBulkWhatsApp(recipients, options = {}) {
    const { delay = 1000, batchSize = 10 } = options;
    const results = [];
    
    console.log(`📱 Starting bulk WhatsApp send to ${recipients.length} recipients`);
    
    for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (recipient, index) => {
            try {
                const result = await sendWhatsAppMessage(
                    recipient.phone, 
                    recipient.message, 
                    recipient.options
                );
                return { 
                    success: true, 
                    phone: recipient.phone, 
                    result,
                    batchIndex: i + index
                };
            } catch (error) {
                console.error(`Failed to send to ${recipient.phone}:`, error.message);
                return { 
                    success: false, 
                    phone: recipient.phone, 
                    error: error.message,
                    batchIndex: i + index
                };
            }
        });
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Add delay between batches to avoid rate limiting
        if (i + batchSize < recipients.length && delay > 0) {
            console.log(`⏳ Waiting ${delay}ms before next batch...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;
    
    console.log(`📱 Bulk send completed: ${successCount} successful, ${failureCount} failed`);
    
    return {
        total: recipients.length,
        successful: successCount,
        failed: failureCount,
        results
    };
}

/**
 * Send WhatsApp template message (for business-initiated conversations)
 * Template must be pre-approved by WhatsApp
 */
async function sendWhatsAppTemplate(to, templateSid, variables = {}) {
    const client = getTwilioClient();
    const whatsappNumber = config.twilio.whatsappNumber;
    
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
        const formattedFrom = whatsappNumber.startsWith('whatsapp:') 
            ? whatsappNumber 
            : `whatsapp:${whatsappNumber}`;

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
    // Import bot start message lazily to avoid circular dependency
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
    getTwilioClient,
    sendWhatsAppMessage,
    sendWhatsAppTemplate,
    sendMissedCallWhatsApp,
    formatWhatsAppNumber
};
