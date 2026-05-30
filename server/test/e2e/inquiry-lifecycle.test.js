const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const path = require('node:path');

const contactForm = readFileSync(
    path.join(__dirname, '../../../site_clinic/src/components/ContactForm.tsx'),
    'utf8'
);

test('successful primary inquiry submission does not create a PHP fallback copy', () => {
    const successBranch = contactForm.match(
        /console\.log\('Main API response:', result\);[\s\S]*?if \(result\.success\) \{([\s\S]*?)\n\s*\} else \{/
    );

    assert.ok(successBranch, 'Could not find the primary API success branch');
    assert.doesNotMatch(successBranch[1], /tryPHPFallback/);
});
