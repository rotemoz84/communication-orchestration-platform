/**
 * Voice webhook and IVR control routes.
 *
 * Incoming TeXML, representative dialing, and follow-up menus are active.
 * Status callbacks stay unavailable until implemented.
 */

const express = require('express');
const { config } = require('../config');
const { CALL_OUTCOMES, DEFAULTS } = require('../constants');
const callRepository = require('../dal/repositories/callRepository');
const { sendIvrFallbackNotification } = require('../integrations/email');
const {
    normalizeTeXMLWebhook,
    texmlDial,
    texmlGather,
    texmlHangup,
    texmlResponse,
    texmlSay
} = require('../integrations/telnyx/voice');
const { getMessage } = require('./messages');
const { requireAuth } = require('../middleware/requireAuth');
const { verifyTelnyxWebhook } = require('../middleware/verifyTelnyxWebhook');
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

const voiceRouter = express.Router();
const adminRouter = express.Router();

adminRouter.use(requireAuth);

const VOICE_WEBHOOK_PATHS = [
    '/status'
];

function voiceMigrationPending(req, res) {
    res.status(501).json({
        error: 'Voice IVR is temporarily unavailable while Telnyx TeXML support is being implemented.',
        provider: 'telnyx',
        phase: 'texml-migration'
    });
}

/**
 * Main Telnyx TeXML entry point for inbound calls.
 * POST /api/voice/incoming
 */
voiceRouter.post('/incoming', verifyTelnyxWebhook, async (req, res) => {
    const webhook = normalizeTeXMLWebhook(req.body);
    const callerNumber = webhook.from || 'unknown';

    try {
        const officeOpen = await isOfficeOpen();

        const trackedCall = await callRepository.create({
            callerNumber,
            officeStatus: officeOpen ? 'open' : 'closed',
            outcome: 'incoming',
            providerCallId: webhook.providerCallId
        });

        if (!trackedCall) {
            console.error('Failed to track incoming call');
        }

        if (officeOpen) {
            return res.type('text/xml').send(texmlResponse(texmlDial(
                config.repPhoneNumber,
                {
                    action: '/api/voice/dial-callback',
                    method: 'POST',
                    timeout: DEFAULTS.DIAL_TIMEOUT,
                    callerId: webhook.to
                }
            )));
        }

        return res.type('text/xml').send(texmlResponse(
            texmlGather(getMessage('IVR_no_answer'), {
                action: '/api/voice/closed-menu',
                method: 'POST',
                timeout: 15,
                numDigits: 1
            }),
            texmlSay(getMessage('IVR_goodbye')),
            texmlHangup()
        ));
    } catch (error) {
        console.error('Error handling incoming voice call:', error.message);
        return res.type('text/xml').send(texmlResponse(
            texmlSay(getMessage('IVR_error')),
            texmlHangup()
        ));
    }
});

/**
 * Handle the outcome of dialing the representative during open hours.
 * POST /api/voice/dial-callback
 */
voiceRouter.post('/dial-callback', verifyTelnyxWebhook, async (req, res) => {
    const webhook = normalizeTeXMLWebhook(req.body);
    const representativeAnswered = webhook.dialStatus === 'completed';

    try {
        if (webhook.providerCallId) {
            const updatedCall = await callRepository.updateByProviderCallId(
                webhook.providerCallId,
                {
                    outcome: representativeAnswered
                        ? CALL_OUTCOMES.ANSWERED
                        : CALL_OUTCOMES.REPRESENTATIVE_UNAVAILABLE,
                    duration: webhook.duration
                }
            );

            if (!updatedCall) {
                console.error('Failed to update dial outcome for provider call');
            }
        } else {
            console.error('Dial callback did not include a provider call ID');
        }

        if (representativeAnswered) {
            return res.type('text/xml').send(texmlResponse(texmlHangup()));
        }

        return res.type('text/xml').send(texmlResponse(
            texmlGather(getMessage('IVR_no_answer'), {
                action: '/api/voice/no-answer-menu',
                method: 'POST',
                timeout: 15,
                numDigits: 1
            }),
            texmlSay(getMessage('IVR_goodbye')),
            texmlHangup()
        ));
    } catch (error) {
        console.error('Error handling representative dial callback:', error.message);
        return res.type('text/xml').send(texmlResponse(
            texmlSay(getMessage('IVR_error')),
            texmlHangup()
        ));
    }
});

function createFollowUpMenuHandler(reason, requestedOutcome) {
    return async (req, res) => {
        const webhook = normalizeTeXMLWebhook(req.body);

        if (webhook.digits !== '9') {
            return res.type('text/xml').send(texmlResponse(
                texmlSay(getMessage('IVR_goodbye')),
                texmlHangup()
            ));
        }

        const callerNumber = webhook.from || 'unknown';
        try {
            // TODO(meta-whatsapp): replace this interim email with the Meta WhatsApp starter message.
            const notification = await sendIvrFallbackNotification({
                callerNumber,
                reason,
                providerCallId: webhook.providerCallId,
                timestamp: new Date()
            });

            if (webhook.providerCallId) {
                await callRepository.updateByProviderCallId(webhook.providerCallId, {
                    outcome: requestedOutcome,
                    notes: notification.success
                        ? `Follow-up requested (${reason}); interim email sent.`
                        : `Follow-up requested (${reason}); interim email unavailable.`
                });
            }

            return res.type('text/xml').send(texmlResponse(
                texmlSay(getMessage('IVR_request_received')),
                texmlHangup()
            ));
        } catch (error) {
            console.error('Error handling follow-up menu selection:', error.message);
            return res.type('text/xml').send(texmlResponse(
                texmlSay(getMessage('IVR_request_received')),
                texmlHangup()
            ));
        }
    };
}

voiceRouter.post(
    '/closed-menu',
    verifyTelnyxWebhook,
    createFollowUpMenuHandler('closed_hours', CALL_OUTCOMES.CLOSED_HOURS_FOLLOWUP_REQUESTED)
);
voiceRouter.post(
    '/no-answer-menu',
    verifyTelnyxWebhook,
    createFollowUpMenuHandler('no_answer', CALL_OUTCOMES.REPRESENTATIVE_UNAVAILABLE_FOLLOWUP_REQUESTED)
);

VOICE_WEBHOOK_PATHS.forEach(path => {
    voiceRouter.post(path, voiceMigrationPending);
});

/**
 * Update IVR settings.
 * POST /api/ivr/settings
 */
adminRouter.post('/settings', (req, res) => {
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
        return res.status(500).json({ error: 'Failed to update IVR settings' });
    }
});

/**
 * Get current IVR settings.
 * GET /api/ivr/settings
 */
adminRouter.get('/settings', (req, res) => {
    try {
        return res.json({
            success: true,
            settings: getIvrSettings()
        });
    } catch (error) {
        console.error('Error getting IVR settings:', error.message);
        return res.status(500).json({ error: 'Failed to get IVR settings' });
    }
});

/**
 * Toggle emergency mode.
 * POST /api/ivr/emergency
 */
adminRouter.post('/emergency', (req, res) => {
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
        return res.status(500).json({ error: 'Failed to toggle emergency mode' });
    }
});

/**
 * Get current queue status.
 * GET /api/ivr/queue
 */
adminRouter.get('/queue', (req, res) => {
    try {
        return res.json({
            success: true,
            queue: getQueueStatus()
        });
    } catch (error) {
        console.error('Error getting queue status:', error.message);
        return res.status(500).json({ error: 'Failed to get queue status' });
    }
});

/**
 * Add a caller to the in-memory queue for testing.
 * POST /api/ivr/queue/add
 */
adminRouter.post('/queue/add', (req, res) => {
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
        return res.status(500).json({ error: 'Failed to add queue entry' });
    }
});

/**
 * Remove a caller from the in-memory queue.
 * POST /api/ivr/queue/remove
 */
adminRouter.post('/queue/remove', (req, res) => {
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
        return res.status(500).json({ error: 'Failed to remove queue entry' });
    }
});

/**
 * Get office status for IVR administration.
 * GET /api/ivr/status
 */
adminRouter.get('/status', async (req, res) => {
    try {
        const officeOpen = await isOfficeOpen();
        const officeStatus = await getOfficeStatus();

        return res.json({
            success: true,
            officeOpen,
            officeStatus
        });
    } catch (error) {
        console.error('Error getting IVR status:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Failed to get IVR status'
        });
    }
});

module.exports = voiceRouter;
module.exports.adminRouter = adminRouter;
