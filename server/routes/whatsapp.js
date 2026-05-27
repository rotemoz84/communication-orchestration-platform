/**
 * WhatsApp API placeholders.
 *
 * Messaging is deferred to the future Meta WhatsApp phase. These endpoint
 * placeholders intentionally perform no send, receive, or status processing.
 */

const express = require('express');

const router = express.Router();

const DEFERRED_PATHS = [
    '/send',
    '/send-interactive',
    '/send-location',
    '/send-bulk',
    '/incoming',
    '/send-start',
    '/status',
    '/reset',
    '/test'
];

function metaMigrationPending(req, res) {
    res.status(501).json({
        error: 'WhatsApp messaging is disabled until the Meta WhatsApp implementation is available.',
        provider: 'meta',
        phase: 'deferred'
    });
}

DEFERRED_PATHS.forEach(path => {
    router.all(path, metaMigrationPending);
});

module.exports = router;
