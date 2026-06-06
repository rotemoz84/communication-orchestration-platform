#!/usr/bin/env node

/**
 * Deployment preflight.
 *
 * Run this before promoting a new release. It initializes the database schema
 * if needed, then verifies the critical paths that must work before traffic is
 * switched to this version.
 */

require('dotenv').config();

const { initDatabase, closeDatabase } = require('../dal');
const { assertReadiness } = require('../services/healthChecks');

async function main() {
    try {
        console.log('🩺 Running deployment preflight...');
        console.log('📦 Initializing database for preflight checks...');
        await initDatabase();

        const result = await assertReadiness();
        console.log(`✅ Preflight passed at ${result.checkedAt}`);
    } catch (error) {
        console.error('❌ Preflight failed:', error.message);

        if (error.readiness && Array.isArray(error.readiness.checks)) {
            for (const check of error.readiness.checks) {
                if (check.status === 'ok') {
                    continue;
                }

                console.error(`- ${check.name}: ${check.message}`);
            }
        }

        process.exitCode = 1;
    } finally {
        await closeDatabase().catch(error => {
            console.error('Failed to close database after preflight:', error.message);
        });
    }
}

main();
