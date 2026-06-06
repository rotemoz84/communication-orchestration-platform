const assert = require('node:assert/strict');
const { after, beforeEach, test } = require('node:test');

const healthChecksPath = require.resolve('../../services/healthChecks');
const dalPath = require.resolve('../../dal');
const emailPath = require.resolve('../../integrations/email');
const sheetsPath = require.resolve('../../integrations/google/sheets');
const calendarPath = require.resolve('../../integrations/google/calendar');
const modulePaths = [healthChecksPath, dalPath, emailPath, sheetsPath, calendarPath];
const priorModules = new Map(modulePaths.map(modulePath => [modulePath, require.cache[modulePath]]));

const requiredEnvironment = {
    DB_HOST: 'db.example.test',
    DB_PORT: '5432',
    DB_USER: 'postgres',
    DB_PASSWORD: 'db-password',
    DB_NAME: 'clinic',
    SESSION_SECRET: 'session-secret',
    SMTP_HOST: 'smtp.example.test',
    SMTP_USER: 'sender@example.test',
    SMTP_PASSWORD: 'smtp-password',
    EMAIL_FROM: 'sender@example.test',
    EMAIL_NOTIFICATION_TO: 'summary@example.test',
    IVR_FALLBACK_EMAIL_TO: 'ivr@example.test',
    GOOGLE_SHEET_ID: 'sheet-id',
    GOOGLE_CALENDAR_ID: 'calendar-id',
    TELNYX_PUBLIC_KEY: 'telnyx-key',
    CRON_SECRET: 'cron-secret',
    CRON_ADMIN_EMAIL: 'admin@example.test'
};
const priorEnvironment = Object.fromEntries(
    Object.keys(requiredEnvironment).map(key => [key, process.env[key]])
);

const clientQueries = [];
const REQUIRED_TABLES = ['calls', 'inquiries', 'job_state', 'session', 'admin_users'];

function replaceModule(resolvedPath, exports) {
    require.cache[resolvedPath] = {
        id: resolvedPath,
        filename: resolvedPath,
        loaded: true,
        exports
    };
}

function loadHealthChecks({
    smtpResult = { success: true },
    bookingSettings = {
        meetingTypes: [{ id: 'consultation', name: 'Consultation', duration: 30 }],
        workingHours: { sunday: { status: 'OPEN' } }
    },
    existingTables = REQUIRED_TABLES
} = {}) {
    delete require.cache[healthChecksPath];
    clientQueries.length = 0;

    replaceModule(dalPath, {
        getPool() {
            return {
                async query(sql) {
                    if (String(sql).includes('information_schema.tables')) {
                        return {
                            rows: existingTables.map(tableName => ({ table_name: tableName }))
                        };
                    }
                    return { rows: [{ ok: 1 }] };
                },
                async connect() {
                    return {
                        async query(sql) {
                            clientQueries.push(String(sql));
                            return { rows: [] };
                        },
                        release() {}
                    };
                }
            };
        }
    });
    replaceModule(emailPath, {
        async testEmailConnection() {
            return smtpResult;
        }
    });
    replaceModule(sheetsPath, {
        async getBookingSettings() {
            return bookingSettings;
        }
    });
    replaceModule(calendarPath, {
        async getBusyTimes() {
            return [];
        }
    });

    return require('../../services/healthChecks');
}

beforeEach(() => {
    for (const [key, value] of Object.entries(requiredEnvironment)) {
        process.env[key] = value;
    }
});

after(() => {
    for (const [modulePath, priorModule] of priorModules.entries()) {
        if (priorModule) {
            require.cache[modulePath] = priorModule;
        } else {
            delete require.cache[modulePath];
        }
    }

    for (const key of Object.keys(requiredEnvironment)) {
        if (priorEnvironment[key] === undefined) {
            delete process.env[key];
        } else {
            process.env[key] = priorEnvironment[key];
        }
    }
});

test('readiness passes only after critical infrastructure and synthetic inquiry checks pass', async () => {
    const { runReadinessChecks } = loadHealthChecks();

    const result = await runReadinessChecks();

    assert.equal(result.success, true);
    assert.equal(result.status, 'ready');
    assert.deepEqual(
        result.checks.map(check => [check.name, check.status]),
        [
            ['required_environment', 'ok'],
            ['database', 'ok'],
            ['smtp', 'ok'],
            ['google_business_integrations', 'ok']
        ]
    );
    assert.ok(clientQueries.some(query => query.includes('INSERT INTO inquiries')));
    assert.ok(clientQueries.some(query => query.includes('ROLLBACK')));
});

test('readiness fails when critical environment or database tables are missing', async () => {
    delete process.env.SMTP_PASSWORD;
    const { runReadinessChecks } = loadHealthChecks({
        existingTables: REQUIRED_TABLES.filter(tableName => tableName !== 'job_state')
    });

    const result = await runReadinessChecks();

    assert.equal(result.success, false);
    assert.equal(result.status, 'not_ready');

    const environmentCheck = result.checks.find(check => check.name === 'required_environment');
    const databaseCheck = result.checks.find(check => check.name === 'database');

    assert.equal(environmentCheck.status, 'fail');
    assert.match(environmentCheck.message, /SMTP_PASSWORD/);
    assert.equal(databaseCheck.status, 'fail');
    assert.match(databaseCheck.message, /job_state/);
});

test('assertReadiness throws with check details when a critical service fails', async () => {
    const { assertReadiness } = loadHealthChecks({
        smtpResult: { success: false, error: 'SMTP connection failed' }
    });

    await assert.rejects(
        () => assertReadiness(),
        error => {
            assert.match(error.message, /smtp/);
            assert.equal(error.readiness.success, false);
            assert.equal(error.readiness.checks.find(check => check.name === 'smtp').status, 'fail');
            return true;
        }
    );
});
