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

const TEXML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>';
const HEBREW_SAY_DEFAULTS = Object.freeze({
    voice: 'alice',
    language: 'he-IL'
});

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
 * Escape user/configuration values before placing them in a TeXML document.
 * @param {*} value - Text or attribute value
 */
function escapeXml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function serializeAttributes(attributes = {}) {
    return Object.entries(attributes)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([name, value]) => ` ${name}="${escapeXml(value)}"`)
        .join('');
}

/**
 * Wrap rendered TeXML verbs in the required response document.
 * @param {...string|string[]} verbs - Rendered TeXML verbs
 */
function texmlResponse(...verbs) {
    const body = verbs
        .flat()
        .filter(verb => verb !== undefined && verb !== null && verb !== false)
        .join('');

    return `${TEXML_DECLARATION}<Response>${body}</Response>`;
}

/**
 * Render Hebrew speech using the centralized text-to-speech defaults.
 * @param {string} text - Message to speak
 * @param {Object} attributes - Optional TeXML Say attributes
 */
function texmlSay(text, attributes = {}) {
    const sayAttributes = {
        ...HEBREW_SAY_DEFAULTS,
        ...attributes
    };

    return `<Say${serializeAttributes(sayAttributes)}>${escapeXml(text)}</Say>`;
}

/**
 * Render a dial operation with a destination number.
 * @param {string} number - Destination phone number
 * @param {Object} attributes - TeXML Dial attributes
 * @param {Object} numberAttributes - TeXML Number attributes
 */
function texmlDial(number, attributes = {}, numberAttributes = {}) {
    return `<Dial${serializeAttributes(attributes)}>`
        + `<Number${serializeAttributes(numberAttributes)}>${escapeXml(number)}</Number>`
        + '</Dial>';
}

/**
 * Render a DTMF gather operation with an optional spoken prompt.
 * @param {string|null} prompt - Prompt to speak inside Gather
 * @param {Object} attributes - TeXML Gather attributes
 * @param {Object} sayAttributes - Optional prompt Say attributes
 */
function texmlGather(prompt, attributes = {}, sayAttributes = {}) {
    const promptVerb = prompt === undefined || prompt === null
        ? ''
        : texmlSay(prompt, sayAttributes);

    return `<Gather${serializeAttributes(attributes)}>${promptVerb}</Gather>`;
}

function texmlHangup() {
    return '<Hangup/>';
}

/**
 * Normalize the form fields supplied in Telnyx TeXML webhook callbacks.
 *
 * The same shape is used for instruction fetches, Gather actions, Dial
 * actions, and call status callbacks so IVR routes do not need provider field
 * names scattered through their business logic.
 *
 * @param {Object} payload - Telnyx application/x-www-form-urlencoded fields
 */
function normalizeTeXMLWebhook(payload = {}) {
    const fields = payload || {};

    return {
        from: fields.From ?? null,
        to: fields.To ?? null,
        providerCallId: fields.CallSid ?? null,
        digits: fields.Digits ?? null,
        dialStatus: fields.DialCallStatus ?? null,
        callStatus: fields.CallStatus ?? null,
        duration: fields.DialCallDuration ?? fields.CallDuration ?? null
    };
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
    HEBREW_SAY_DEFAULTS,
    escapeXml,
    texmlResponse,
    texmlSay,
    texmlDial,
    texmlGather,
    texmlHangup,
    normalizeTeXMLWebhook,
    handleIncomingWebhook
};
