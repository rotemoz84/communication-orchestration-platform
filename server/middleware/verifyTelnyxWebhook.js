const { createPublicKey, verify } = require('node:crypto');
const { config } = require('../config');

const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');
const MAX_WEBHOOK_AGE_SECONDS = 5 * 60;

let cachedPublicKeyValue;
let cachedPublicKey;

function decodeBase64(value) {
    const normalized = value
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const paddingLength = (4 - (normalized.length % 4)) % 4;

    return Buffer.from(normalized + '='.repeat(paddingLength), 'base64');
}

function parsePublicKey(value) {
    const publicKey = String(value || '').trim();

    if (publicKey.includes('BEGIN PUBLIC KEY')) {
        return createPublicKey(publicKey);
    }

    const decoded = decodeBase64(publicKey);
    const spkiKey = decoded.length === 32
        ? Buffer.concat([ED25519_SPKI_PREFIX, decoded])
        : decoded;

    return createPublicKey({
        key: spkiKey,
        format: 'der',
        type: 'spki'
    });
}

function getPublicKey() {
    const configuredValue = config.telnyx && config.telnyx.publicKey;

    if (!configuredValue || String(configuredValue).trim() === '') {
        return null;
    }

    if (configuredValue !== cachedPublicKeyValue) {
        cachedPublicKey = parsePublicKey(configuredValue);
        cachedPublicKeyValue = configuredValue;
    }

    return cachedPublicKey;
}

function rejectWebhook(res, status, reason) {
    console.warn(`Rejected Telnyx webhook: ${reason}`);
    return res.status(status).json({ error: 'Telnyx webhook verification failed' });
}

function verifyTelnyxWebhook(req, res, next) {
    let publicKey;
    try {
        publicKey = getPublicKey();
    } catch (error) {
        return rejectWebhook(res, 503, 'invalid server public key configuration');
    }

    if (!publicKey) {
        return rejectWebhook(res, 503, 'missing server public key configuration');
    }

    const signatureHeader = req.get('telnyx-signature-ed25519');
    const timestampHeader = req.get('telnyx-timestamp');

    if (!signatureHeader || !timestampHeader || !Buffer.isBuffer(req.rawBody)) {
        return rejectWebhook(res, 403, 'missing verification data');
    }

    if (!/^\d+$/.test(timestampHeader)) {
        return rejectWebhook(res, 403, 'invalid timestamp');
    }

    const timestamp = Number(timestampHeader);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (!Number.isSafeInteger(timestamp)
        || Math.abs(currentTimestamp - timestamp) > MAX_WEBHOOK_AGE_SECONDS) {
        return rejectWebhook(res, 403, 'expired timestamp');
    }

    let signature;
    try {
        signature = decodeBase64(signatureHeader);
    } catch (error) {
        return rejectWebhook(res, 403, 'invalid signature encoding');
    }

    const signedPayload = Buffer.concat([
        Buffer.from(`${timestampHeader}|`, 'utf8'),
        req.rawBody
    ]);

    if (signature.length !== 64 || !verify(null, signedPayload, publicKey, signature)) {
        return rejectWebhook(res, 403, 'invalid signature');
    }

    return next();
}

module.exports = {
    MAX_WEBHOOK_AGE_SECONDS,
    verifyTelnyxWebhook
};
