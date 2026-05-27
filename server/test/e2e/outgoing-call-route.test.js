const assert = require('node:assert/strict');
const { after, before, beforeEach, test } = require('node:test');
const express = require('express');

const configPath = require.resolve('../../config');
const repositoryPath = require.resolve('../../dal/repositories/callRepository');
const voicePath = require.resolve('../../integrations/telnyx/voice');
const routesPath = require.resolve('../../routes/calls');
const priorModules = new Map();
const calls = new Map();

let server;
let baseUrl;
let telnyxResult;
let nextCallId;

function replaceModule(modulePath, exports) {
    priorModules.set(modulePath, require.cache[modulePath]);
    require.cache[modulePath] = {
        id: modulePath,
        filename: modulePath,
        loaded: true,
        exports
    };
}

before(async () => {
    replaceModule(configPath, {
        config: {
            telnyx: {
                phoneNumber: '+972509876543',
                connectionId: 'connection-test'
            }
        },
        isTelnyxConfigured() {
            return true;
        }
    });
    replaceModule(repositoryPath, {
        async createOutgoing({ calleeNumber, notes }) {
            const call = {
                callId: `CALL-OUTGOING-${nextCallId++}`,
                calleeNumber,
                notes,
                direction: 'outbound',
                officeStatus: 'outgoing',
                outcome: 'outgoing_initiated',
                providerCallId: null
            };
            calls.set(call.callId, call);
            return call;
        },
        async updateByCallId(callId, updateData) {
            const call = calls.get(callId);
            if (!call) {
                return null;
            }
            Object.assign(call, updateData);
            return call;
        },
        async findById(callId) {
            return calls.get(callId) || null;
        }
    });
    replaceModule(voicePath, {
        async createCall() {
            return telnyxResult;
        }
    });
    delete require.cache[routesPath];

    const app = express();
    app.use(express.json());
    app.use('/api/calls', require('../../routes/calls'));
    server = await new Promise(resolve => {
        const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

beforeEach(() => {
    calls.clear();
    nextCallId = 1;
    telnyxResult = {
        success: true,
        callId: 'v3:telnyx-outgoing-call'
    };
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

test('successful outgoing call initiation exposes the stored provider call ID', async () => {
    const response = await fetch(`${baseUrl}/api/calls/outgoing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: '+972501111111', notes: 'Follow up call' })
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.callId, 'CALL-OUTGOING-1');
    assert.equal(body.providerCallId, 'v3:telnyx-outgoing-call');

    const storedResponse = await fetch(`${baseUrl}/api/calls/${body.callId}`);
    const storedBody = await storedResponse.json();
    assert.equal(storedResponse.status, 200);
    assert.equal(storedBody.call.providerCallId, 'v3:telnyx-outgoing-call');
    assert.equal(storedBody.call.outcome, 'outgoing_initiated');
    assert.equal(storedBody.call.notes, 'Follow up call');
});

test('failed outgoing call initiation remains visible with a failed outcome', async () => {
    telnyxResult = {
        success: false,
        error: 'Telnyx rejected the call'
    };

    const response = await fetch(`${baseUrl}/api/calls/outgoing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: '+972501111111' })
    });
    const body = await response.json();

    assert.equal(response.status, 500);
    assert.equal(body.error, 'Telnyx rejected the call');

    const storedResponse = await fetch(`${baseUrl}/api/calls/CALL-OUTGOING-1`);
    const storedBody = await storedResponse.json();
    assert.equal(storedResponse.status, 200);
    assert.equal(storedBody.call.outcome, 'outgoing_failed');
    assert.equal(storedBody.call.providerCallId, null);
});
