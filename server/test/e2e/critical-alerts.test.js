const assert = require('node:assert/strict');
const { after, beforeEach, test } = require('node:test');

const criticalAlertsPath = require.resolve('../../services/criticalAlerts');
const emailPath = require.resolve('../../integrations/email');
const priorCriticalAlertsModule = require.cache[criticalAlertsPath];
const priorEmailModule = require.cache[emailPath];
const sentAlerts = [];

function loadCriticalAlerts() {
    delete require.cache[criticalAlertsPath];
    require.cache[emailPath] = {
        id: emailPath,
        filename: emailPath,
        loaded: true,
        exports: {
            async sendCriticalAlertEmail(alert) {
                sentAlerts.push(alert);
                return { success: true, messageId: `alert-${sentAlerts.length}` };
            }
        }
    };

    return require('../../services/criticalAlerts');
}

beforeEach(() => {
    sentAlerts.length = 0;
});

after(() => {
    if (priorCriticalAlertsModule) {
        require.cache[criticalAlertsPath] = priorCriticalAlertsModule;
    } else {
        delete require.cache[criticalAlertsPath];
    }
    if (priorEmailModule) {
        require.cache[emailPath] = priorEmailModule;
    } else {
        delete require.cache[emailPath];
    }

});

test('critical alerts are rate-limited by issue key', async () => {
    const { notifyCriticalFailure } = loadCriticalAlerts();

    const first = await notifyCriticalFailure({
        key: 'test:critical-path',
        title: 'Critical path failed',
        path: 'test',
        error: new Error('dependency unavailable'),
        context: { hasContact: true }
    });
    const second = await notifyCriticalFailure({
        key: 'test:critical-path',
        title: 'Critical path failed again',
        path: 'test',
        context: { hasContact: true }
    });

    assert.equal(first.success, true);
    assert.equal(first.suppressed, false);
    assert.equal(second.success, false);
    assert.equal(second.suppressed, true);
    assert.equal(sentAlerts.length, 1);
    assert.equal(sentAlerts[0].key, 'test:critical-path');
    assert.deepEqual(sentAlerts[0].error, {
        name: 'Error',
        message: 'dependency unavailable'
    });
});

test('critical alert force option bypasses rate limiting', async () => {
    const { notifyCriticalFailure } = loadCriticalAlerts();

    await notifyCriticalFailure({ key: 'test:force', title: 'First', path: 'test' });
    const forced = await notifyCriticalFailure({
        key: 'test:force',
        title: 'Second',
        path: 'test',
        force: true
    });

    assert.equal(forced.success, true);
    assert.equal(forced.suppressed, false);
    assert.equal(sentAlerts.length, 2);
});
