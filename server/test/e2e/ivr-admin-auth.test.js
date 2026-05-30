const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const index = readFileSync(path.join(__dirname, '../../index.js'), 'utf8');
const ivrRoutes = readFileSync(path.join(__dirname, '../../ivr/routes.js'), 'utf8');

test('production mounts public voice webhooks separately from IVR administration', () => {
    assert.match(index, /app\.use\(BASE_PATH \+ '\/api\/voice', voiceRoutes\);/);
    assert.match(index, /app\.use\(BASE_PATH \+ '\/api\/ivr', ivrAdminRoutes\);/);
    assert.doesNotMatch(index, /app\.use\(BASE_PATH \+ '\/api\/ivr', voiceRoutes\);/);
    assert.ok(
        index.indexOf('app.use(session({') < index.indexOf("app.use(BASE_PATH + '/api/ivr', ivrAdminRoutes);"),
        'IVR administration must be mounted after session initialization'
    );
});

test('IVR administration router requires authentication', () => {
    assert.match(ivrRoutes, /adminRouter\.use\(requireAuth\);/);
    assert.match(ivrRoutes, /module\.exports\.adminRouter = adminRouter;/);
});
