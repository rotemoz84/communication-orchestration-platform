#!/usr/bin/env node

/**
 * Post-deployment confirmation email.
 *
 * Run this after the new server version has started and /api/ready has passed.
 */

require('dotenv').config();

const { sendDeploymentSuccessEmail } = require('../integrations/email');

async function main() {
    const result = await sendDeploymentSuccessEmail({
        environment: process.env.DEPLOYMENT_ENVIRONMENT || process.env.NODE_ENV || 'production',
        commit: process.env.DEPLOYMENT_COMMIT || process.env.GIT_COMMIT,
        baseUrl: process.env.BASE_URL,
        readyUrl: process.env.DEPLOYMENT_READY_URL,
        deployedAt: new Date().toISOString()
    });

    if (!result.success) {
        console.error('Deployment success email failed:', result.error);
        process.exitCode = 1;
        return;
    }

    console.log(`Deployment success email sent: ${result.messageId}`);
}

main().catch(error => {
    console.error('Deployment success email failed:', error.message);
    process.exitCode = 1;
});
