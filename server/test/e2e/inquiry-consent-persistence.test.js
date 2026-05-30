const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const path = require('node:path');

function read(relativePath) {
    return readFileSync(path.join(__dirname, '../..', relativePath), 'utf8');
}

test('inquiry persistence retains consent evidence fields', () => {
    const database = read('dal/database.js');
    const repository = read('dal/repositories/inquiryRepository.js');

    for (const column of [
        'privacy_consent',
        'sensitive_data_consent',
        'consent_policy_version',
        'consent_recorded_at'
    ]) {
        assert.match(database, new RegExp(column));
        assert.match(repository, new RegExp(column));
    }
});

test('PHP inquiry fallback enforces and records consent evidence', () => {
    const phpFallback = read('../site_clinic/src/contact.php');

    assert.match(phpFallback, /'Privacy consent is required'/);
    assert.match(phpFallback, /'Sensitive data consent is required when pregnancy week is provided'/);
    assert.match(phpFallback, /\$PRIVACY_POLICY_VERSION = '2026-02';/);
    assert.match(phpFallback, /'Consent Recorded At'/);
});

test('PHP inquiry fallback bounds copied personal data before storage', () => {
    const phpFallback = read('../site_clinic/src/contact.php');

    assert.match(phpFallback, /'message' => 1000/);
    assert.match(phpFallback, /textLength\(\$rawValue\) > \$maxLength/);
    assert.match(phpFallback, /Pregnancy week must be a whole number between 1 and 42/);
    assert.match(phpFallback, /FILTER_VALIDATE_EMAIL/);
});
