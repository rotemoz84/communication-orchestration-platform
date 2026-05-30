const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

function read(relativePath) {
    return readFileSync(path.join(__dirname, '../..', relativePath), 'utf8');
}

test('API routes do not return raw exception messages', () => {
    for (const relativePath of [
        'index.js',
        'routes/auth.js',
        'routes/calls.js',
        'routes/inquiries.js',
        'ivr/routes.js'
    ]) {
        const source = read(relativePath);

        assert.doesNotMatch(source, /json\(\{[^}]*error:\s*error\.message/);
        assert.doesNotMatch(source, /json\(\{[^}]*message:\s*error\.message/);
        assert.doesNotMatch(source, /error:\s*err\.message\s*\|\|/);
    }
});

test('stored operational failures use stable redacted messages', () => {
    const email = read('integrations/email/index.js');
    const inquirySummary = read('services/inquirySummary.js');
    const ivrRoutes = read('ivr/routes.js');
    const ivrService = read('ivr/service.js');

    assert.doesNotMatch(email, /return \{ success: false, error: error\.message \};/);
    assert.match(email, /error: 'Notification delivery unavailable'/);
    assert.match(inquirySummary, /error: 'Inquiry summary failed'/);
    assert.doesNotMatch(ivrRoutes, /notification\.error/);
    assert.match(ivrService, /error: 'Unable to determine office status'/);
    assert.match(ivrService, /ivrSettings: getIvrSettings\(\)/);
});
