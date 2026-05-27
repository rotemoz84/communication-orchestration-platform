/**
 * Voice webhook and IVR control routes.
 *
 * Voice webhooks are deliberately unavailable until the Telnyx TeXML flow is
 * implemented. Keeping explicit endpoints prevents an old provider flow from
 * being used accidentally during the migration.
 */

const express = require('express');
const {
    addToQueue,
    getIvrSettings,
    getOfficeStatus,
    getQueueStatus,
    isOfficeOpen,
    removeFromQueue,
    toggleEmergencyMode,
    updateIvrSettings
} = require('./service');

const router = express.Router();

const VOICE_WEBHOOK_PATHS = [
    '/incoming',
    '/dial-callback',
    '/closed-menu',
    '/no-answer-menu',
    '/outgoing-status',
    '/status'
];

function voiceMigrationPending(req, res) {
    res.status(501).json({
        error: 'Voice IVR is temporarily unavailable while Telnyx TeXML support is being implemented.',
        provider: 'telnyx',
        phase: 'texml-migration'
    });
}

VOICE_WEBHOOK_PATHS.forEach(path => {
    router.post(path, voiceMigrationPending);
});

/**
 * Update IVR settings.
 * POST /api/ivr/settings
 */
router.post('/settings', (req, res) => {
    try {
        const newSettings = req.body;

        if (!newSettings || typeof newSettings !== 'object') {
            return res.status(400).json({ error: 'Settings object is required' });
        }

        return res.json({
            success: true,
            settings: updateIvrSettings(newSettings)
        });
    } catch (error) {
        console.error('Error updating IVR settings:', error.message);
        return res.status(500).json({ error: error.message });
    }
});

/**
 * Get current IVR settings.
 * GET /api/ivr/settings
 */
router.get('/settings', (req, res) => {
    try {
        return res.json({
            success: true,
            settings: getIvrSettings()
        });
    } catch (error) {
        console.error('Error getting IVR settings:', error.message);
        return res.status(500).json({ error: error.message });
    }
});

/**
 * Toggle emergency mode.
 * POST /api/ivr/emergency
 */
router.post('/emergency', (req, res) => {
    try {
        const { enabled } = req.body;

        if (typeof enabled !== 'boolean') {
            return res.status(400).json({ error: 'enabled boolean is required' });
        }

        return res.json({
            success: true,
            emergencyMode: toggleEmergencyMode(enabled)
        });
    } catch (error) {
        console.error('Error toggling emergency mode:', error.message);
        return res.status(500).json({ error: error.message });
    }
});

/**
 * Get current queue status.
 * GET /api/ivr/queue
 */
router.get('/queue', (req, res) => {
    try {
        return res.json({
            success: true,
            queue: getQueueStatus()
        });
    } catch (error) {
        console.error('Error getting queue status:', error.message);
        return res.status(500).json({ error: error.message });
    }
});

/**
 * Add a caller to the in-memory queue for testing.
 * POST /api/ivr/queue/add
 */
router.post('/queue/add', (req, res) => {
    try {
        const { callerNumber, callId } = req.body;

        if (!callerNumber || !callId) {
            return res.status(400).json({ error: 'callerNumber and callId are required' });
        }

        const result = addToQueue(callerNumber, callId);
        return res.json({
            success: result.success,
            result
        });
    } catch (error) {
        console.error('Error adding to queue:', error.message);
        return res.status(500).json({ error: error.message });
    }
});

/**
 * Remove a caller from the in-memory queue.
 * POST /api/ivr/queue/remove
 */
router.post('/queue/remove', (req, res) => {
    try {
        const { callId } = req.body;

        if (!callId) {
            return res.status(400).json({ error: 'callId is required' });
        }

        const result = removeFromQueue(callId);
        return res.json({
            success: result.success,
            result
        });
    } catch (error) {
        console.error('Error removing from queue:', error.message);
        return res.status(500).json({ error: error.message });
    }
});

/**
 * Get office status for IVR administration.
 * GET /api/ivr/status
 */
router.get('/status', async (req, res) => {
    try {
        const officeOpen = await isOfficeOpen();
        const officeStatus = await getOfficeStatus();

        return res.json({
            success: true,
            officeOpen,
            officeStatus
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
