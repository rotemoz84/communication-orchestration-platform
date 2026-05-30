const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const path = require('node:path');

const contactForm = readFileSync(
    path.join(__dirname, '../../../site_clinic/src/components/ContactForm.tsx'),
    'utf8'
);

test('successful primary inquiry submission does not create a PHP fallback copy', () => {
    const primarySubmission = contactForm.match(
        /const API_URL = 'https:\/\/api\.drozyuval\.com\/api\/inquiries';([\s\S]*?)\n\s*\} catch/
    );

    assert.ok(primarySubmission, 'Could not find the primary API submission');

    const successBranch = primarySubmission[1].match(
        /if \(result\.success\) \{([\s\S]*?)\n\s*\} else \{/
    );

    assert.ok(successBranch, 'Could not find the primary API success branch');
    assert.doesNotMatch(successBranch[1], /tryPHPFallback/);
});
