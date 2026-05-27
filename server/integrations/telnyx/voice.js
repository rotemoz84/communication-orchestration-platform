/**
 * Telnyx Voice Integration
 * Builds and normalizes TeXML for the inbound IVR flow.
 */

const TEXML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>';
const HEBREW_SAY_DEFAULTS = Object.freeze({
    voice: 'alice',
    language: 'he-IL'
});

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
 * The same shape is used for instruction fetches, Gather actions, and Dial
 * actions so IVR routes do not need provider field names scattered through
 * their business logic.
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
        duration: fields.DialCallDuration ?? fields.CallDuration ?? null
    };
}

module.exports = {
    HEBREW_SAY_DEFAULTS,
    escapeXml,
    texmlResponse,
    texmlSay,
    texmlDial,
    texmlGather,
    texmlHangup,
    normalizeTeXMLWebhook
};
