#!/usr/bin/env node

/**
 * Optional cPanel deployment hook.
 *
 * cPanel's "Run NPM Install" action runs npm lifecycle scripts. Keep this
 * disabled by default so local installs and non-production installs are not
 * blocked by production-only dependencies.
 */

const { spawnSync } = require('node:child_process');
const path = require('node:path');

if (process.env.DEPLOYMENT_AUTOMATION_ENABLED !== 'true') {
    console.log('Deployment preflight skipped after install. Set DEPLOYMENT_AUTOMATION_ENABLED=true to enable it.');
    process.exit(0);
}

console.log('Running deployment preflight after install...');

const preflightPath = path.join(__dirname, 'preflight.js');
const result = spawnSync(process.execPath, [preflightPath], {
    cwd: path.join(__dirname, '..'),
    env: process.env,
    stdio: 'inherit'
});

if (result.error) {
    console.error('Deployment preflight could not start:', result.error.message);
    process.exit(1);
}

process.exit(result.status === null ? 1 : result.status);
