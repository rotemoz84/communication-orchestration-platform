const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const serverRoot = path.join(__dirname, '../..');

function read(relativePath) {
    return readFileSync(path.join(serverRoot, relativePath), 'utf8');
}

test('postinstall deployment checks are gated by cPanel preflight env flag', () => {
    const packageJson = require('../../package.json');
    const postinstall = read('scripts/postinstall-deployment-checks.js');

    assert.equal(packageJson.scripts.postinstall, 'node scripts/postinstall-deployment-checks.js');
    assert.match(postinstall, /DEPLOYMENT_AUTOMATION_ENABLED/);
    assert.match(postinstall, /preflight\.js/);
});

test('server can send deployment success email automatically after startup', () => {
    const serverIndex = read('index.js');

    assert.match(serverIndex, /DEPLOYMENT_AUTOMATION_ENABLED/);
    assert.match(serverIndex, /sendDeploymentSuccessEmail/);
    assert.match(serverIndex, /sendDeploymentSuccessOnStartup\(\);/);
});
