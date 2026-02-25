/**
 * Telnyx Voice Integration
 * Handles voice calls and IVR functionality
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
 * Create an outbound call
 * @param {string} to - Destination phone number
 * @param {string} from - Source phone number (your Telnyx number)
 * @param {Object} options - Call options
 */
async function createCall(to, from, options = {}) {
    try {
        const callParams = {
            to: formatPhoneNumber(to),
            from: formatPhoneNumber(from),
            connection_id: options.connectionId || config.telnyx.connectionId,
            // Webhook for call status updates
            webhook_url: `${config.baseUrl}/api/voice/status`,
            webhook_url_method: 'POST',
            // Answer URL for IVR
            answer_url: `${config.baseUrl}/api/voice/incoming`,
            answer_method: 'POST'
        };

        // Add recording if enabled
        if (options.record !== false) {
            callParams.record_enabled = true;
            callParams.record_format = 'wav';
        }

        const call = await telnyx.calls.create(callParams);
        
        console.log(`📞 Telnyx call initiated: ${call.id} to ${to}`);
        return {
            success: true,
            callId: call.id,
            sid: call.id,
            status: call.status,
            direction: 'outbound'
        };
    } catch (error) {
        console.error('Error creating Telnyx call:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get call details
 * @param {string} callId - Call ID
 */
async function getCall(callId) {
    try {
        const call = await telnyx.calls.retrieve(callId);
        return {
            success: true,
            call: {
                id: call.id,
                status: call.status,
                direction: call.direction,
                from: call.from,
                to: call.to,
                duration: call.duration,
                startTime: call.start_time,
                endTime: call.end_time,
                recordingUrl: call.recording_url
            }
        };
    } catch (error) {
        console.error('Error retrieving Telnyx call:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Enable call recording
 * @param {string} callId - Call ID
 */
async function recordCall(callId) {
    try {
        await telnyx.calls.record(callId, {
            enabled: true,
            format: 'wav'
        });
        
        console.log(`📞 Recording enabled for call: ${callId}`);
        return { success: true };
    } catch (error) {
        console.error('Error enabling call recording:', error.message);
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
 * Generate Telnyx XML for IVR
 * @param {Object} options - IVR options
 */
function generateIVRXml(options = {}) {
    const { 
        message, 
        gather = false, 
        timeout = 10, 
        numDigits = 1,
        actionUrl = null,
        redirectUrl = null
    } = options;

    let xml = '<?xml version="1.0" encoding="UTF-8"?>';
    xml += '<Response>';

    if (message) {
        xml += `<Say language="${options.language || 'en-US'}">${message}</Say>`;
    }

    if (gather) {
        xml += '<Gather';
        xml += ` timeout="${timeout}"`;
        xml += ` numDigits="${numDigits}"`;
        if (actionUrl) {
            xml += ` action="${actionUrl}"`;
            xml += ` method="POST"`;
        }
        xml += '>';
        
        if (options.prompt) {
            xml += `<Say language="${options.language || 'en-US'}">${options.prompt}</Say>`;
        }
        
        xml += '</Gather>';
    }

    if (redirectUrl) {
        xml += `<Redirect method="POST">${redirectUrl}</Redirect>`;
    }

    xml += '</Response>';
    return xml;
}

/**
 * Handle incoming call webhook
 * @param {Object} webhookData - Telnyx webhook data
 */
function handleIncomingWebhook(webhookData) {
    const { event_type, data } = webhookData;
    
    switch (event_type) {
        case 'call.initiated':
            return {
                type: 'initiated',
                callId: data.id,
                from: data.from,
                to: data.to,
                status: data.status
            };
            
        case 'call.answered':
            return {
                type: 'answered',
                callId: data.id,
                from: data.from,
                to: data.to,
                status: data.status
            };
            
        case 'call.hangup':
            return {
                type: 'completed',
                callId: data.id,
                from: data.from,
                to: data.to,
                status: data.status,
                duration: data.duration
            };
            
        case 'call.recording':
            return {
                type: 'recording',
                callId: data.call_id,
                recordingUrl: data.recording_url,
                duration: data.duration
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
    createCall,
    getCall,
    recordCall,
    formatPhoneNumber,
    generateIVRXml,
    handleIncomingWebhook
};
