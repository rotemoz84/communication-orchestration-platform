/**
 * Critical readiness and deployment preflight checks.
 *
 * These checks intentionally focus on paths where a patient lead, booking, or
 * requested follow-up could be lost. Liveness remains separate in /api/health.
 */

const REQUIRED_ENV_VARS = [
    'DB_HOST',
    'DB_PORT',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'SESSION_SECRET',
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASSWORD',
    'EMAIL_FROM',
    'EMAIL_NOTIFICATION_TO',
    'DEPLOYMENT_SUCCESS_EMAIL_TO',
    'IVR_FALLBACK_EMAIL_TO',
    'GOOGLE_SHEET_ID',
    'GOOGLE_CALENDAR_ID',
    'TELNYX_PUBLIC_KEY',
    'CRON_SECRET',
    'CRON_ADMIN_EMAIL'
];

const REQUIRED_TABLES = [
    'calls',
    'inquiries',
    'job_state',
    'session',
    'admin_users'
];

function toPublicError(error) {
    return {
        name: error && error.name ? error.name : 'Error',
        message: error && error.message ? error.message : 'Unknown error'
    };
}

function createCheckResult(name, status, options = {}) {
    return {
        name,
        status,
        critical: options.critical !== false,
        message: options.message || null,
        details: options.details || null
    };
}

function getMissingRequiredEnvVars() {
    return REQUIRED_ENV_VARS.filter(key => !process.env[key] || String(process.env[key]).trim() === '');
}

async function runCheck(name, fn, options = {}) {
    try {
        const details = await fn();
        return createCheckResult(name, 'ok', {
            critical: options.critical,
            message: options.message || 'ok',
            details: details || null
        });
    } catch (error) {
        return createCheckResult(name, 'fail', {
            critical: options.critical,
            message: error.message,
            details: {
                error: toPublicError(error)
            }
        });
    }
}

async function checkRequiredEnvironment() {
    const missing = getMissingRequiredEnvVars();

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    return {
        requiredCount: REQUIRED_ENV_VARS.length
    };
}

async function checkDatabase({ includeSyntheticInquiry = false } = {}) {
    const { getPool } = require('../dal');
    const pool = getPool();

    await pool.query('SELECT 1 AS ok');

    const tableResult = await pool.query(
        `
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = ANY($1)
        `,
        [REQUIRED_TABLES]
    );
    const existingTables = new Set(tableResult.rows.map(row => row.table_name));
    const missingTables = REQUIRED_TABLES.filter(tableName => !existingTables.has(tableName));

    if (missingTables.length > 0) {
        throw new Error(`Missing required database tables: ${missingTables.join(', ')}`);
    }

    if (includeSyntheticInquiry) {
        await checkSyntheticInquiryInsert(pool);
    }

    return {
        requiredTables: REQUIRED_TABLES,
        syntheticInquiryChecked: includeSyntheticInquiry
    };
}

async function checkSyntheticInquiryInsert(pool) {
    const client = await pool.connect();
    const inquiryId = `HLTH${Date.now().toString(36).slice(-8)}${Math.random().toString(36).slice(2, 6)}`;

    try {
        await client.query('BEGIN');
        await client.query(
            `
                INSERT INTO inquiries (
                    inquiry_id,
                    phone,
                    source,
                    privacy_consent,
                    sensitive_data_consent,
                    consent_policy_version,
                    consent_recorded_at
                )
                VALUES ($1, $2, $3, true, false, $4, CURRENT_TIMESTAMP)
            `,
            [inquiryId, '0000000000', 'healthcheck', 'healthcheck']
        );
        await client.query('ROLLBACK');
    } catch (error) {
        try {
            await client.query('ROLLBACK');
        } catch (rollbackError) {
            console.error('Health check rollback failed:', rollbackError.message);
        }
        throw error;
    } finally {
        client.release();
    }
}

async function checkSmtp() {
    const { testEmailConnection } = require('../integrations/email');
    const result = await testEmailConnection();

    if (!result.success) {
        throw new Error(result.error || 'SMTP connection failed');
    }

    return {
        verified: true
    };
}

async function checkGoogleBusinessIntegrations() {
    const { getBookingSettings } = require('../integrations/google/sheets');
    const { getBusyTimes } = require('../integrations/google/calendar');

    const settings = await getBookingSettings();
    const meetingTypes = Array.isArray(settings.meetingTypes) ? settings.meetingTypes : [];
    const workingHours = settings.workingHours && typeof settings.workingHours === 'object'
        ? settings.workingHours
        : {};

    if (meetingTypes.length === 0) {
        throw new Error('Google Sheets booking settings do not include active meeting types');
    }
    if (Object.keys(workingHours).length === 0) {
        throw new Error('Google Sheets booking settings do not include working hours');
    }

    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(now);
    dayEnd.setHours(23, 59, 59, 999);
    await getBusyTimes(dayStart, dayEnd);

    return {
        meetingTypesCount: meetingTypes.length,
        workingDaysCount: Object.keys(workingHours).length,
        calendarFreeBusyChecked: true
    };
}

async function runReadinessChecks(options = {}) {
    const {
        includeDatabaseChecks = true,
        includeSyntheticInquiry = true,
        includeSmtpCheck = true,
        includeGoogleChecks = true
    } = options;

    const checks = [
        await runCheck('required_environment', checkRequiredEnvironment)
    ];

    if (includeDatabaseChecks) {
        checks.push(await runCheck('database', () => checkDatabase({ includeSyntheticInquiry })));
    }

    if (includeSmtpCheck) {
        checks.push(await runCheck('smtp', checkSmtp));
    }

    if (includeGoogleChecks) {
        checks.push(await runCheck('google_business_integrations', checkGoogleBusinessIntegrations));
    }

    const failedCriticalChecks = checks.filter(check => check.critical && check.status !== 'ok');

    return {
        success: failedCriticalChecks.length === 0,
        status: failedCriticalChecks.length === 0 ? 'ready' : 'not_ready',
        checkedAt: new Date().toISOString(),
        checks
    };
}

async function assertReadiness(options = {}) {
    const result = await runReadinessChecks(options);

    if (!result.success) {
        const failedNames = result.checks
            .filter(check => check.critical && check.status !== 'ok')
            .map(check => check.name)
            .join(', ');
        const error = new Error(`Critical readiness checks failed: ${failedNames}`);
        error.readiness = result;
        throw error;
    }

    return result;
}

module.exports = {
    REQUIRED_ENV_VARS,
    REQUIRED_TABLES,
    assertReadiness,
    getMissingRequiredEnvVars,
    runReadinessChecks
};
