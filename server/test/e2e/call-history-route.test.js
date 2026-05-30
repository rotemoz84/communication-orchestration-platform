const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const express = require('express');

const repositoryPath = require.resolve('../../dal/repositories/callRepository');
const routesPath = require.resolve('../../routes/calls');
const priorRepository = require.cache[repositoryPath];

let server;
let baseUrl;

before(async () => {
    require.cache[repositoryPath] = {
        id: repositoryPath,
        filename: repositoryPath,
        loaded: true,
        exports: {
            async getStats() {
                return {
                    total: 1,
                    inbound_calls: 1,
                    followup_requested: 1
                };
            }
        }
    };
    delete require.cache[routesPath];

    const app = express();
    app.use(express.json());
    app.use((req, res, next) => {
        req.session = req.get('x-test-auth') === 'admin' ? { userId: 7 } : {};
        next();
    });
    app.use('/api/calls', require('../../routes/calls'));
    server = await new Promise(resolve => {
        const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    if (server) {
        await new Promise(resolve => server.close(resolve));
    }
    delete require.cache[routesPath];
    if (priorRepository) {
        require.cache[repositoryPath] = priorRepository;
    } else {
        delete require.cache[repositoryPath];
    }
});

test('call history reporting requires an authenticated admin session', async () => {
    const unauthenticated = await fetch(
        `${baseUrl}/api/calls/stats?startDate=2026-05-26&endDate=2026-05-27`
    );
    const unauthenticatedBody = await unauthenticated.json();

    assert.equal(unauthenticated.status, 401);
    assert.equal(unauthenticatedBody.code, 'LOGIN_REQUIRED');

    const response = await fetch(
        `${baseUrl}/api/calls/stats?startDate=2026-05-26&endDate=2026-05-27`,
        { headers: { 'x-test-auth': 'admin' } }
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.stats.total, 1);
    assert.equal(body.stats.inbound_calls, 1);
    assert.equal(body.stats.followup_requested, 1);
});

test('standalone outbound call initiation is not exposed', async () => {
    const response = await fetch(`${baseUrl}/api/calls/outgoing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-test-auth': 'admin' },
        body: JSON.stringify({ to: '+972501111111' })
    });

    assert.equal(response.status, 404);
});
