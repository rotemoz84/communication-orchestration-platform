/**
 * Critical business-path alerting with in-memory rate limiting.
 */

const { sendCriticalAlertEmail } = require('../integrations/email');

const DEFAULT_MIN_INTERVAL_MINUTES = 60;
const lastAlertByKey = new Map();

function getMinIntervalMs() {
    return DEFAULT_MIN_INTERVAL_MINUTES * 60 * 1000;
}

function normalizeError(error) {
    if (!error) {
        return null;
    }

    return {
        name: error.name || 'Error',
        message: error.message || 'Unknown error'
    };
}

async function notifyCriticalFailure({
    key,
    title,
    path,
    severity = 'critical',
    error = null,
    context = {},
    force = false
}) {
    const alertKey = key || `${path || 'unknown'}:${title || 'critical_failure'}`;
    const now = Date.now();
    const minIntervalMs = getMinIntervalMs();
    const lastSentAt = lastAlertByKey.get(alertKey);

    if (!force && lastSentAt && now - lastSentAt < minIntervalMs) {
        return {
            success: false,
            suppressed: true,
            key: alertKey
        };
    }

    lastAlertByKey.set(alertKey, now);

    try {
        const result = await sendCriticalAlertEmail({
            key: alertKey,
            title: title || 'Critical business-path failure',
            path,
            severity,
            error: normalizeError(error),
            context,
            occurredAt: new Date(now).toISOString()
        });

        return {
            ...result,
            key: alertKey,
            suppressed: false
        };
    } catch (alertError) {
        console.error('Critical alert delivery failed:', alertError.message);
        return {
            success: false,
            error: 'Critical alert delivery unavailable',
            key: alertKey,
            suppressed: false
        };
    }
}

function resetCriticalAlertRateLimits() {
    lastAlertByKey.clear();
}

module.exports = {
    notifyCriticalFailure,
    resetCriticalAlertRateLimits
};
