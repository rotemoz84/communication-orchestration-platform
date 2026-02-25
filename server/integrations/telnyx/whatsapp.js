/**
 * Telnyx WhatsApp Integration
 * Handles WhatsApp messaging through Telnyx
 */

const Telnyx = require('telnyx');
const { config } = require('../../config');

// Initialize Telnyx client only if API key is available
let telnyx;
try {
    telnyx = Telnyx(config.telnyx.apiKey);
} catch (error) {
    console.log('⚠️ Telnyx client initialization failed:', error.message);
    telnyx = null;
}

/**
 * Send WhatsApp message
 * @param {string} to - Destination phone number
 * @param {string} message - Message content
 * @param {Object} options - Additional options
 */
async function sendWhatsAppMessage(to, message, options = {}) {
    try {
        const messageParams = {
            from: formatWhatsAppNumber(options.from || config.telnyx.whatsappNumber),
            to: formatWhatsAppNumber(to),
            text: message,
            // Webhook for message status
            webhook_url: config.telnyx.webhookUrl || `${config.baseUrl}/api/whatsapp/status`,
            webhook_url_method: 'POST'
        };

        // Add media URL if provided
        if (options.mediaUrl) {
            messageParams.media_urls = Array.isArray(options.mediaUrl) ? options.mediaUrl : [options.mediaUrl];
        }

        const response = await telnyx.messages.create(messageParams);
        
        console.log(`📱 WhatsApp sent to ${to}: ${response.id}`);
        return {
            success: true,
            messageId: response.id,
            sid: response.id,
            to: to,
            from: options.from || config.telnyx.whatsappNumber,
            status: response.status,
            direction: 'outbound',
            dateCreated: response.created_at
        };
    } catch (error) {
        console.error('Error sending WhatsApp:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Send WhatsApp message with interactive buttons
 * @param {string} to - Destination phone number
 * @param {string} message - Message content
 * @param {Array} buttons - Array of button objects
 */
async function sendWhatsAppInteractive(to, message, buttons = []) {
    try {
        const interactiveContent = {
            type: 'button',
            body: {
                type: 'text',
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

        const messageParams = {
            from: formatWhatsAppNumber(config.telnyx.whatsappNumber),
            to: formatWhatsAppNumber(to),
            interactive: interactiveContent,
            webhook_url: `${config.baseUrl}/api/whatsapp/status`,
            webhook_url_method: 'POST'
        };

        const response = await telnyx.messages.create(messageParams);
        
        console.log(`📱 WhatsApp interactive sent to ${to}: ${response.id}`);
        return {
            success: true,
            messageId: response.id,
            to: to,
            status: response.status,
            type: 'interactive'
        };
    } catch (error) {
        console.error('Error sending WhatsApp interactive:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Send WhatsApp location
 * @param {string} to - Destination phone number
 * @param {Object} location - Location object
 */
async function sendWhatsAppLocation(to, location) {
    try {
        const locationContent = {
            type: 'location',
            location: {
                latitude: location.lat,
                longitude: location.lon,
                name: location.name || '',
                address: location.address || ''
            }
        };

        const messageParams = {
            from: formatWhatsAppNumber(config.telnyx.whatsappNumber),
            to: formatWhatsAppNumber(to),
            interactive: locationContent,
            webhook_url: `${config.baseUrl}/api/whatsapp/status`,
            webhook_url_method: 'POST'
        };

        const response = await telnyx.messages.create(messageParams);
        
        console.log(`📱 WhatsApp location sent to ${to}: ${response.id}`);
        return {
            success: true,
            messageId: response.id,
            to: to,
            status: response.status,
            type: 'location'
        };
    } catch (error) {
        console.error('Error sending WhatsApp location:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Send WhatsApp template message
 * @param {string} to - Destination phone number
 * @param {string} templateName - Template name
 * @param {Object} variables - Template variables
 */
async function sendWhatsAppTemplate(to, templateName, variables = {}) {
    try {
        const templateContent = {
            type: 'template',
            template: {
                name: templateName,
                language: {
                    code: variables.language || 'en'
                },
                components: []
            }
        };

        // Add components if variables provided
        if (variables.body && variables.body.length > 0) {
            templateContent.template.template.components.push({
                type: 'body',
                parameters: variables.body.map(param => ({
                    type: 'text',
                    text: param
                }))
            });
        }

        const messageParams = {
            from: formatWhatsAppNumber(config.telnyx.whatsappNumber),
            to: formatWhatsAppNumber(to),
            interactive: templateContent,
            webhook_url: `${config.baseUrl}/api/whatsapp/status`,
            webhook_url_method: 'POST'
        };

        const response = await telnyx.messages.create(messageParams);
        
        console.log(`📱 WhatsApp template sent to ${to}: ${response.id}`);
        return {
            success: true,
            messageId: response.id,
            to: to,
            status: response.status,
            type: 'template'
        };
    } catch (error) {
        console.error('Error sending WhatsApp template:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Bulk send WhatsApp messages
 * @param {Array} recipients - Array of recipients
 * @param {Object} options - Bulk options
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
 * Format phone number for WhatsApp
 * @param {string} phoneNumber - Phone number to format
 */
function formatWhatsAppNumber(phoneNumber) {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Remove whatsapp prefix if present
    if (cleaned.startsWith('whatsapp')) {
        cleaned = cleaned.substring(8);
    }
    
    // Ensure it starts with + and country code
    if (!cleaned.startsWith('+')) {
        // Default to Israel country code if no country code provided
        if (cleaned.startsWith('0')) {
            cleaned = '972' + cleaned.substring(1);
        } else if (cleaned.length === 9) {
            cleaned = '972' + cleaned;
        }
        cleaned = '+' + cleaned;
    }
    
    return 'whatsapp:' + cleaned;
}

/**
 * Handle incoming WhatsApp webhook
 * @param {Object} webhookData - Telnyx webhook data
 */
function handleIncomingWhatsApp(webhookData) {
    const { event_type, data } = webhookData;
    
    if (event_type === 'message.received' && data.from.startsWith('whatsapp:')) {
        return {
            type: 'received',
            messageId: data.id,
            from: data.from.replace('whatsapp:', ''),
            to: data.to.replace('whatsapp:', ''),
            text: data.text,
            mediaUrls: data.media_urls || [],
            interactive: data.interactive,
            timestamp: data.created_at
        };
    }
    
    return null;
}

module.exports = {
    sendWhatsAppMessage,
    sendWhatsAppInteractive,
    sendWhatsAppLocation,
    sendWhatsAppTemplate,
    sendBulkWhatsApp,
    formatWhatsAppNumber,
    handleIncomingWhatsApp
};
