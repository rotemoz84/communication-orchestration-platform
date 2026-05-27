const assert = require('node:assert/strict');
const { after, before, beforeEach, test } = require('node:test');
const express = require('express');

const configPath = require.resolve('../../config');
const repositoryPath = require.resolve('../../dal/repositories/callRepository');
const emailPath = require.resolve('../../integrations/email');
const servicePath = require.resolve('../../ivr/service');
const routesPath = require.resolve('../../ivr/routes');
const priorModules = new Map();
const incomingCalls = [];
const updatedCalls = [];
const notifications = [];

let server;
let baseUrl;
let officeOpen;
let notificationResult;

function replaceModule(modulePath, exports) {
    priorModules.set(modulePath, require.cache[modulePath]);
    require.cache[modulePath] = {
        id: modulePath,
        filename: modulePath,
        loaded: true,
        exports
    };
}

async function incomingRequest(fields) {
    return voiceRequest('/incoming', fields);
}

async function voiceRequest(path, fields) {
    return fetch(`${baseUrl}/api/voice${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(fields)
    });
}

before(async () => {
    replaceModule(configPath, {
        config: {
            repPhoneNumber: '+972509111111'
        }
    });
    replaceModule(repositoryPath, {
        async create(call) {
            incomingCalls.push(call);
            return { callId: `CALL-INCOMING-${incomingCalls.length}`, ...call };
        },
        async updateByProviderCallId(providerCallId, updateData) {
            updatedCalls.push({ providerCallId, ...updateData });
            return { providerCallId, ...updateData };
        }
    });
    replaceModule(emailPath, {
        async sendIvrFallbackNotification(notification) {
            notifications.push(notification);
            return notificationResult;
        }
    });
    replaceModule(servicePath, {
        async isOfficeOpen() {
            return officeOpen;
        }
    });
    delete require.cache[routesPath];

    const app = express();
    app.use(express.urlencoded({ extended: true }));
    app.use('/api/voice', require('../../ivr/routes'));
    server = await new Promise(resolve => {
        const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

beforeEach(() => {
    incomingCalls.length = 0;
    updatedCalls.length = 0;
    notifications.length = 0;
    officeOpen = true;
    notificationResult = { success: true, messageId: 'message-1' };
});

after(async () => {
    if (server) {
        await new Promise(resolve => server.close(resolve));
    }
    delete require.cache[routesPath];
    priorModules.forEach((priorModule, modulePath) => {
        if (priorModule) {
            require.cache[modulePath] = priorModule;
        } else {
            delete require.cache[modulePath];
        }
    });
});

test('open-hours incoming Telnyx call is tracked and forwarded to the representative', async () => {
    const response = await incomingRequest({
        CallSid: 'v3:incoming-open',
        From: '+972501234567',
        To: '+972509876543&"<incoming>'
    });
    const xml = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /^text\/xml/);
    assert.deepEqual(incomingCalls, [{
        callerNumber: '+972501234567',
        officeStatus: 'open',
        outcome: 'incoming',
        providerCallId: 'v3:incoming-open'
    }]);
    assert.equal(
        xml,
        '<?xml version="1.0" encoding="UTF-8"?>'
        + '<Response>'
        + '<Dial action="/api/voice/dial-callback" method="POST" timeout="20" callerId="+972509876543&amp;&quot;&lt;incoming&gt;">'
        + '<Number>+972509111111</Number>'
        + '</Dial>'
        + '</Response>'
    );
});

test('closed-hours incoming call can request follow-up through the interim notification', async () => {
    officeOpen = false;

    const response = await incomingRequest({
        CallSid: 'v3:incoming-closed',
        From: '+972501234567',
        To: '+972509876543'
    });
    const xml = await response.text();

    assert.equal(response.status, 200);
    assert.deepEqual(incomingCalls, [{
        callerNumber: '+972501234567',
        officeStatus: 'closed',
        outcome: 'incoming',
        providerCallId: 'v3:incoming-closed'
    }]);
    assert.match(xml, /<Gather action="\/api\/voice\/closed-menu" method="POST" timeout="15" numDigits="1">/);
    assert.match(xml, /<Say voice="alice" language="he-IL">[\s\S]*הקישו 9/);
    assert.doesNotMatch(xml, /וואטסאפ/);
    assert.match(xml, /<\/Gather><Say voice="alice" language="he-IL">תודה שהתקשרת\. להתראות\.<\/Say><Hangup\/>/);

    const selectedMenu = await voiceRequest('/closed-menu', {
        CallSid: 'v3:incoming-closed',
        From: '+972501234567',
        Digits: '9'
    });
    const selectedXml = await selectedMenu.text();

    assert.equal(selectedMenu.status, 200);
    assert.equal(notifications.length, 1);
    assert.equal(notifications[0].callerNumber, '+972501234567');
    assert.equal(notifications[0].reason, 'closed_hours');
    assert.equal(notifications[0].providerCallId, 'v3:incoming-closed');
    assert.ok(notifications[0].timestamp instanceof Date);
    assert.deepEqual(updatedCalls, [{
        providerCallId: 'v3:incoming-closed',
        outcome: 'closed_hours_followup_requested',
        notes: 'Follow-up requested (closed_hours); interim email sent.'
    }]);
    assert.match(selectedXml, /בקשתך התקבלה/);
    assert.doesNotMatch(selectedXml, /וואטסאפ/);
    assert.match(selectedXml, /<Hangup\/>/);
});

test('answered representative callback updates the incoming call and ends the flow', async () => {
    const response = await voiceRequest('/dial-callback', {
        CallSid: 'v3:incoming-answered',
        DialCallStatus: 'completed',
        DialCallDuration: '42'
    });
    const xml = await response.text();

    assert.equal(response.status, 200);
    assert.deepEqual(updatedCalls, [{
        providerCallId: 'v3:incoming-answered',
        outcome: 'answered',
        duration: '42'
    }]);
    assert.equal(
        xml,
        '<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>'
    );
});

test('busy representative callback can request follow-up through the interim notification', async () => {
    const response = await voiceRequest('/dial-callback', {
        CallSid: 'v3:incoming-busy',
        DialCallStatus: 'busy',
        DialCallDuration: '6'
    });
    const xml = await response.text();

    assert.equal(response.status, 200);
    assert.deepEqual(updatedCalls, [{
        providerCallId: 'v3:incoming-busy',
        outcome: 'representative_unavailable',
        duration: '6'
    }]);
    assert.match(xml, /<Gather action="\/api\/voice\/no-answer-menu" method="POST" timeout="15" numDigits="1">/);
    assert.match(xml, /<Say voice="alice" language="he-IL">[\s\S]*הקישו 9/);
    assert.doesNotMatch(xml, /וואטסאפ/);
    assert.match(xml, /<\/Gather><Say voice="alice" language="he-IL">תודה שהתקשרת\. להתראות\.<\/Say><Hangup\/>/);

    const selectedMenu = await voiceRequest('/no-answer-menu', {
        CallSid: 'v3:incoming-busy',
        From: '+972501234567',
        Digits: '9'
    });
    const selectedXml = await selectedMenu.text();

    assert.equal(selectedMenu.status, 200);
    assert.equal(notifications.length, 1);
    assert.equal(notifications[0].reason, 'no_answer');
    assert.equal(notifications[0].providerCallId, 'v3:incoming-busy');
    assert.deepEqual(updatedCalls, [{
        providerCallId: 'v3:incoming-busy',
        outcome: 'representative_unavailable',
        duration: '6'
    }, {
        providerCallId: 'v3:incoming-busy',
        outcome: 'representative_unavailable_followup_requested',
        notes: 'Follow-up requested (no_answer); interim email sent.'
    }]);
    assert.match(selectedXml, /בקשתך התקבלה/);
    assert.doesNotMatch(selectedXml, /וואטסאפ/);
    assert.match(selectedXml, /<Hangup\/>/);
});

test('menu timeout or invalid digit ends the call without sending a notification', async () => {
    const timedOut = await voiceRequest('/closed-menu', {
        CallSid: 'v3:incoming-timeout',
        From: '+972501234567'
    });
    const invalid = await voiceRequest('/no-answer-menu', {
        CallSid: 'v3:incoming-invalid',
        From: '+972501234567',
        Digits: '2'
    });
    const timedOutXml = await timedOut.text();
    const invalidXml = await invalid.text();

    assert.equal(timedOut.status, 200);
    assert.equal(invalid.status, 200);
    assert.equal(notifications.length, 0);
    assert.deepEqual(updatedCalls, []);
    assert.match(timedOutXml, /תודה שהתקשרת\. להתראות\./);
    assert.match(invalidXml, /תודה שהתקשרת\. להתראות\./);
    assert.match(timedOutXml, /<Hangup\/>/);
    assert.match(invalidXml, /<Hangup\/>/);
});

test('follow-up request remains graceful when interim notification is unavailable', async () => {
    notificationResult = { success: false, error: 'SMTP not configured' };

    const response = await voiceRequest('/closed-menu', {
        CallSid: 'v3:incoming-no-email',
        From: '+972501234567',
        Digits: '9'
    });
    const xml = await response.text();

    assert.equal(response.status, 200);
    assert.equal(notifications.length, 1);
    assert.deepEqual(updatedCalls, [{
        providerCallId: 'v3:incoming-no-email',
        outcome: 'closed_hours_followup_requested',
        notes: 'Follow-up requested (closed_hours); interim email unavailable: SMTP not configured.'
    }]);
    assert.match(xml, /בקשתך התקבלה/);
    assert.match(xml, /<Hangup\/>/);
});
