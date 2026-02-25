/**
 * Telnyx Messaging Integration
 * Handles SMS and MMS messaging
 */

const Telnyx = require('telnyx');
const { config } = require('../../config');

// Initialize Telnyx client
const telnyx = Telnyx(config.telnyx.apiKey);

/**
 * Send SMS message
 * @param {string} to - Destination phone number
 * @param {string} message - Message content
 * @param {Object} options - Additional options
 */
async function sendSMS(to, message, options = {}) {
    try {
        const messageParams = {
            from: formatPhoneNumber(options.from || config.telnyx.phoneNumber),
            to: formatPhoneNumber(to),
            text: message,
            // Webhook for message status
            webhook_url: `${config.baseUrl}/api/sms/status`,
            webhook_url_method: 'POST'
        };

        // Add delivery receipt if requested
        if (options.requireDeliveryReceipt) {
            messageParams.require_delivery_receipt = true;
        }

        const response = await telnyx.messages.create(messageParams);
        
        console.log(`📱 SMS sent to ${to}: ${response.id}`);
        return {
            success: true,
            messageId: response.id,
            to: to,
            from: options.from || config.telnyx.phoneNumber,
            status: response.status,
            direction: 'outbound'
        };
    } catch (error) {
        console.error('Error sending SMS:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Send MMS message with media
 * @param {string} to - Destination phone number
 * @param {string} message - Message content
 * @param {Array} mediaUrls - Array of media URLs
 * @param {Object} options - Additional options
 */
async function sendMMS(to, message, mediaUrls = [], options = {}) {
    try {
        const messageParams = {
            from: formatPhoneNumber(options.from || config.telnyx.phoneNumber),
            to: formatPhoneNumber(to),
            text: message,
            media_urls: mediaUrls,
            webhook_url: `${config.baseUrl}/api/sms/status`,
            webhook_url_method: 'POST'
        };

        const response = await telnyx.messages.create(messageParams);
        
        console.log(`📱 MMS sent to ${to}: ${response.id}`);
        return {
            success: true,
            messageId: response.id,
            to: to,
            from: options.from || config.telnyx.phoneNumber,
            status: response.status,
            mediaCount: mediaUrls.length
        };
    } catch (error) {
        console.error('Error sending MMS:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get message details
 * @param {string} messageId - Message ID
 */
async function getMessage(messageId) {
    try {
        const message = await telnyx.messages.retrieve(messageId);
        return {
            success: true,
            message: {
                id: message.id,
                from: message.from,
                to: message.to,
                text: message.text,
                status: message.status,
                direction: message.direction,
                mediaUrls: message.media_urls || [],
                createdAt: message.created_at,
                updatedAt: message.updated_at
            }
        };
    } catch (error) {
        console.error('Error retrieving message:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Format phone number for Telnyx
 * @param {string} phoneNumber - Phone number to format
 */
function formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
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
    
    return cleaned;
}

/**
 * Handle incoming SMS webhook
 * @param {Object} webhookData - Telnyx webhook data
 */
function handleIncomingSMS(webhookData) {
    const { event_type, data } = webhookData;
    
    if (event_type === 'message.received') {
        return {
            type: 'received',
            messageId: data.id,
            from: data.from,
            to: data.to,
            text: data.text,
            mediaUrls: data.media_urls || [],
            timestamp: data.created_at
        };
    }
    
    return null;
}

/**
 * Handle SMS status webhook
 * @param {Object} webhookData - Telnyx webhook data
 */
function handleSMSStatus(webhookData) {
    const { event_type, data } = webhookData;
    
    switch (event_type) {
        case 'message.delivered':
            return {
                type: 'delivered',
                messageId: data.id,
                status: 'delivered',
                timestamp: data.created_at
            };
            
        case 'message.undelivered':
            return {
                type: 'undelivered',
                messageId: data.id,
                status: 'undelivered',
                errorCode: data.error_code,
                errorMessage: data.error_message,
                timestamp: data.created_at
            };
            
        case 'message.sent':
            return {
                type: 'sent',
                messageId: data.id,
                status: 'sent',
                timestamp: data.created_at
            };
            
        default:
            return {
                type: 'unknown',
                event_type,
                data
            };
    }
}

module.exports = {
    sendSMS,
    sendMMS,
    getMessage,
    formatPhoneNumber,
    handleIncomingSMS,
    handleSMSStatus
};
