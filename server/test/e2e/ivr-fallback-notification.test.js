const assert = require('node:assert/strict');
const { after, beforeEach, test } = require('node:test');

const emailPath = require.resolve('../../integrations/email');
const nodemailerPath = require.resolve('nodemailer');
const priorNodemailerModule = require.cache[nodemailerPath];
const environmentKeys = [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_SECURE',
    'SMTP_USER',
    'SMTP_PASSWORD',
    'EMAIL_FROM',
    'EMAIL_NOTIFICATION_TO',
    'IVR_FALLBACK_EMAIL_TO'
];
const priorEnvironment = Object.fromEntries(
    environmentKeys.map(key => [key, process.env[key]])
);
const sentMessages = [];

function loadEmailService() {
    delete require.cache[emailPath];
    require.cache[nodemailerPath] = {
        id: nodemailerPath,
        filename: nodemailerPath,
        loaded: true,
        exports: {
            createTransport() {
                return {
                    async sendMail(message) {
                        sentMessages.push(message);
                        return { messageId: `message-${sentMessages.length}` };
                    }
                };
            }
        }
    };

    return require('../../integrations/email');
}

beforeEach(() => {
    sentMessages.length = 0;
    process.env.SMTP_HOST = 'smtp.example.test';
    process.env.SMTP_PORT = '465';
    process.env.SMTP_SECURE = 'true';
    process.env.SMTP_USER = 'sender@example.test';
    process.env.SMTP_PASSWORD = 'smtp-password';
    process.env.EMAIL_FROM = 'sender@example.test';
    process.env.EMAIL_NOTIFICATION_TO = 'summary@example.test';
    process.env.IVR_FALLBACK_EMAIL_TO = 'ivr@example.test';
});

after(() => {
    delete require.cache[emailPath];
    if (priorNodemailerModule) {
        require.cache[nodemailerPath] = priorNodemailerModule;
    } else {
        delete require.cache[nodemailerPath];
    }

    environmentKeys.forEach(key => {
        if (priorEnvironment[key] === undefined) {
            delete process.env[key];
        } else {
            process.env[key] = priorEnvironment[key];
        }
    });
});

test('IVR fallback notification sends caller context to its dedicated recipient', async () => {
    const { sendIvrFallbackNotification } = loadEmailService();

    const result = await sendIvrFallbackNotification({
        callerNumber: '+972501234567',
        reason: 'no_answer',
        providerCallId: 'v3:incoming-no-answer',
        timestamp: new Date('2026-05-27T10:00:00.000Z')
    });

    assert.deepEqual(result, { success: true, messageId: 'message-1' });
    assert.equal(sentMessages.length, 1);
    assert.equal(sentMessages[0].to, 'ivr@example.test');
    assert.equal(sentMessages[0].subject, 'IVR fallback request: no_answer');
    assert.match(sentMessages[0].text, /Caller phone number: \+972501234567/);
    assert.match(sentMessages[0].text, /Provider call ID: v3:incoming-no-answer/);
    assert.match(sentMessages[0].text, /Timestamp: 2026-05-27T10:00:00.000Z/);
    assert.match(sentMessages[0].text, /future Meta WhatsApp starter message/);
});

test('IVR fallback notification handles missing SMTP or notification recipient', async () => {
    delete process.env.SMTP_HOST;
    const withoutSmtp = await loadEmailService().sendIvrFallbackNotification({
        callerNumber: '+972501234567',
        reason: 'closed_hours'
    });

    assert.deepEqual(withoutSmtp, { success: false, error: 'Notification delivery unavailable' });
    assert.equal(sentMessages.length, 0);

    process.env.SMTP_HOST = 'smtp.example.test';
    delete process.env.IVR_FALLBACK_EMAIL_TO;
    const withoutRecipient = await loadEmailService().sendIvrFallbackNotification({
        callerNumber: '+972501234567',
        reason: 'closed_hours'
    });

    assert.deepEqual(withoutRecipient, {
        success: false,
        error: 'Notification delivery unavailable'
    });
    assert.equal(sentMessages.length, 0);
});

test('daily inquiry summary keeps its existing summary recipient', async () => {
    const { sendInquirySummaryEmail } = loadEmailService();

    const sent = await sendInquirySummaryEmail(
        [],
        new Date('2026-05-26T08:00:00.000Z'),
        new Date('2026-05-27T08:00:00.000Z')
    );

    assert.equal(sent, true);
    assert.equal(sentMessages.length, 1);
    assert.equal(sentMessages[0].to, 'summary@example.test');
    assert.notEqual(sentMessages[0].to, process.env.IVR_FALLBACK_EMAIL_TO);
});

test('critical alert email uses the configured notification recipient', async () => {
    const { sendCriticalAlertEmail } = loadEmailService();

    const result = await sendCriticalAlertEmail({
        key: 'inquiry:create:save_failed',
        title: 'Website inquiry failed to save',
        path: 'POST /api/inquiries',
        severity: 'critical',
        occurredAt: '2026-06-06T10:00:00.000Z',
        error: {
            name: 'Error',
            message: 'Database unavailable'
        },
        context: {
            lostData: {
                name: 'Patient',
                phone: '0501234567',
                email: 'patient@example.test',
                message: 'Please call'
            }
        }
    });

    assert.deepEqual(result, { success: true, messageId: 'message-1' });
    assert.equal(sentMessages.length, 1);
    assert.equal(sentMessages[0].to, 'summary@example.test');
    assert.equal(sentMessages[0].subject, '[CRITICAL] Website inquiry failed to save');
    assert.match(sentMessages[0].text, /Key: inquiry:create:save_failed/);
    assert.match(sentMessages[0].text, /Path: POST \/api\/inquiries/);
    assert.match(sentMessages[0].text, /Database unavailable/);
    assert.match(sentMessages[0].text, /0501234567/);
    assert.match(sentMessages[0].text, /patient@example\.test/);
    assert.match(sentMessages[0].text, /Please call/);
});
