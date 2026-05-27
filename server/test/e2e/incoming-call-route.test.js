const assert = require('node:assert/strict');
const { after, before, beforeEach, test } = require('node:test');
const express = require('express');

const configPath = require.resolve('../../config');
const repositoryPath = require.resolve('../../dal/repositories/callRepository');
const servicePath = require.resolve('../../ivr/service');
const routesPath = require.resolve('../../ivr/routes');
const priorModules = new Map();
const incomingCalls = [];

let server;
let baseUrl;
let officeOpen;

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
    return fetch(`${baseUrl}/api/voice/incoming`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(fields)
    });
}

before(async () => {
    replaceModule(configPath, {
        config: {
            repPhoneNumber: '+972509111111',
            telnyx: {}
        }
    });
    replaceModule(repositoryPath, {
        async create(call) {
            incomingCalls.push(call);
            return { callId: `CALL-INCOMING-${incomingCalls.length}`, ...call };
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
    officeOpen = true;
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

test('closed-hours incoming call is tracked and receives a Hebrew menu with hangup fallback', async () => {
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
    assert.match(xml, /<\/Gather><Say voice="alice" language="he-IL">תודה שהתקשרת\. להתראות\.<\/Say><Hangup\/>/);

    const deferredMenu = await fetch(`${baseUrl}/api/voice/closed-menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ Digits: '9' })
    });
    assert.equal(deferredMenu.status, 501);
});
