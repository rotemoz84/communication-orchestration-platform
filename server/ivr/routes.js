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

/**
 * Main Telnyx TeXML entry point for inbound calls.
 * POST /api/voice/incoming
 */
router.post('/incoming', async (req, res) => {
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
router.post('/dial-callback', async (req, res) => {
    const webhook = normalizeTeXMLWebhook(req.body);
    const representativeAnswered = webhook.dialStatus === 'completed';

    try {
        if (webhook.providerCallId) {
            const updatedCall = await callRepository.updateByProviderCallId(
                webhook.providerCallId,
                {
                    outcome: representativeAnswered
                        ? CALL_OUTCOMES.ANSWERED
                        : CALL_OUTCOMES.NO_ANSWER_HANGUP,
                    duration: webhook.duration
                }
            );

            if (!updatedCall) {
                console.error(`Failed to update dial outcome for provider ID ${webhook.providerCallId}`);
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
                        ? `Future WhatsApp follow-up requested (${reason}); interim email sent.`
                        : `Future WhatsApp follow-up requested (${reason}); interim email unavailable: ${notification.error}.`
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

router.post(
    '/closed-menu',
    createFollowUpMenuHandler('closed_hours', CALL_OUTCOMES.CLOSED_HOURS_WHATSAPP)
);
router.post(
    '/no-answer-menu',
    createFollowUpMenuHandler('no_answer', CALL_OUTCOMES.NO_ANSWER_WHATSAPP)
);

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
