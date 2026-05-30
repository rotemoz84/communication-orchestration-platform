const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const repoRoot = path.join(__dirname, '../../..');

function read(relativePath) {
    return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('public inquiry form does not log form data or API responses', () => {
    const contactForm = read('site_clinic/src/components/ContactForm.tsx');

    assert.doesNotMatch(contactForm, /console\.(?:log|error|warn)\(/);
});

test('server operational logs omit direct personal and provider identifiers', () => {
    const inquiryRepository = read('server/dal/repositories/inquiryRepository.js');
    const callRepository = read('server/dal/repositories/callRepository.js');
    const ivrService = read('server/ivr/service.js');
    const ivrRoutes = read('server/ivr/routes.js');
    const calendar = read('server/integrations/google/calendar.js');
    const requireAuth = read('server/middleware/requireAuth.js');
    const seedAdmin = read('server/scripts/seed-admin.js');

    assert.doesNotMatch(inquiryRepository, /\$\{phone \|\| email\}/);
    assert.doesNotMatch(callRepository, /\$\{callerNumber\}/);
    assert.doesNotMatch(callRepository, /\$\{providerCallId\}/);
    assert.doesNotMatch(ivrService, /\$\{callerNumber\}/);
    assert.doesNotMatch(ivrService, /\$\{removed\.callerNumber\}/);
    assert.doesNotMatch(ivrRoutes, /\$\{webhook\.providerCallId\}/);
    assert.doesNotMatch(calendar, /\$\{response\.data\.htmlLink\}/);
    assert.doesNotMatch(requireAuth, /sessionId=/);
    assert.doesNotMatch(seedAdmin, /console\.log\([^)]*, email\)/);
});
