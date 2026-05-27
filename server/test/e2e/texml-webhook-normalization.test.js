const assert = require('node:assert/strict');
const test = require('node:test');
const { normalizeTeXMLWebhook } = require('../../integrations/telnyx/voice');

test('normalizes an incoming TeXML instruction request', () => {
    assert.deepEqual(normalizeTeXMLWebhook({
        CallSid: 'v3:incoming-call',
        From: '+972501234567',
        To: '+972509876543',
        CallStatus: 'in-progress'
    }), {
        from: '+972501234567',
        to: '+972509876543',
        providerCallId: 'v3:incoming-call',
        digits: null,
        dialStatus: null,
        callStatus: 'in-progress',
        duration: null
    });
});

test('normalizes a Dial action callback and uses dial duration', () => {
    assert.deepEqual(normalizeTeXMLWebhook({
        CallSid: 'v3:parent-call',
        From: '+972501234567',
        To: '+972509876543',
        CallStatus: 'completed',
        CallDuration: '60',
        DialCallStatus: 'no-answer',
        DialCallDuration: '20'
    }), {
        from: '+972501234567',
        to: '+972509876543',
        providerCallId: 'v3:parent-call',
        digits: null,
        dialStatus: 'no-answer',
        callStatus: 'completed',
        duration: '20'
    });
});

test('normalizes Gather digit callback values', () => {
    assert.deepEqual(normalizeTeXMLWebhook({
        CallSid: 'v3:gather-call',
        From: '+972501234567',
        To: '+972509876543',
        Digits: '9'
    }), {
        from: '+972501234567',
        to: '+972509876543',
        providerCallId: 'v3:gather-call',
        digits: '9',
        dialStatus: null,
        callStatus: null,
        duration: null
    });
});

test('normalizes a TeXML status callback and uses call duration', () => {
    assert.deepEqual(normalizeTeXMLWebhook({
        CallSid: 'v3:completed-call',
        From: '+972501234567',
        To: '+972509876543',
        CallStatus: 'completed',
        CallDuration: '45'
    }), {
        from: '+972501234567',
        to: '+972509876543',
        providerCallId: 'v3:completed-call',
        digits: null,
        dialStatus: null,
        callStatus: 'completed',
        duration: '45'
    });
});

test('normalizes missing optional TeXML fields without throwing', () => {
    const emptyWebhook = {
        from: null,
        to: null,
        providerCallId: null,
        digits: null,
        dialStatus: null,
        callStatus: null,
        duration: null
    };

    assert.deepEqual(normalizeTeXMLWebhook(), emptyWebhook);
    assert.deepEqual(normalizeTeXMLWebhook(null), emptyWebhook);
});
