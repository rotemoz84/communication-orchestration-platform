/**
 * Voice/IVR Routes
 * Handles incoming calls via Twilio
 * 
 * Flow:
 * 1. Incoming call → Check if office open → Track call in database
 * 2. Office OPEN:
 *    - Forward directly to rep (4 rings / ~20 seconds)
 *    - If no answer → Play IVR_no_answer message
 *    - Press 9 → Send WhatsApp
 * 3. Office CLOSED:
 *    - Play IVR_no_answer message
 *    - Press 9 → Send WhatsApp (or auto-send on timeout)
 */

const express = require('express');
const router = express.Router();
const VoiceResponse = require('twilio').twiml.VoiceResponse;
const { isOfficeOpen } = require('./service');
const { getMessage, getAllMessages } = require('./messages');
const { sendMissedCallWhatsApp } = require('../integrations/twilio/whatsapp');
const { callRepository } = require('../dal');
const { config } = require('../config');
const { DEFAULTS } = require('../constants');

// Rep phone number from config
const REP_PHONE = config.repPhoneNumber;

/**
 * Main entry point for incoming calls
 * POST /api/voice/incoming
 */
router.post('/incoming', async (req, res) => {
    const twiml = new VoiceResponse();
    const callerNumber = req.body.From || 'unknown';
    const twilioCallSid = req.body.CallSid || '';
    
    console.log(`📞 Incoming call from: ${callerNumber}`);

    try {
        const officeOpen = await isOfficeOpen();

        // Track the call in database
        callRepository.create({
            callerNumber,
            officeStatus: officeOpen ? 'open' : 'closed',
            outcome: 'incoming',
            twilioCallSid
        }).catch(err => {
            console.error('Failed to track call:', err.message);
        });

        if (officeOpen) {
            // Office is OPEN - forward directly to rep (no menu)
            console.log('🏢 Office OPEN - forwarding to rep');
            
            const dial = twiml.dial({
                action: '/api/voice/dial-callback',
                method: 'POST',
                timeout: DEFAULTS.DIAL_TIMEOUT,
                callerId: req.body.To
            });
            
            dial.number(REP_PHONE);
            
        } else {
            // Office is CLOSED - play IVR_no_answer message with WhatsApp option
            console.log('🏢 Office CLOSED - playing IVR_no_answer');
            
            const gather = twiml.gather({
                numDigits: 1,
                action: '/api/voice/closed-menu',
                method: 'POST',
                timeout: 15,
                language: 'he-IL'
            });

            gather.say({
                voice: 'Polly.Aditi',
                language: 'he-IL'
            }, getMessage('IVR_no_answer'));

            // If no input after timeout, send WhatsApp anyway and hang up
            twiml.say({
                language: 'he-IL'
            }, getMessage('IVR_closed_sending_whatsapp'));

            sendMissedCallWhatsApp(callerNumber, 'closed').catch(err => {
                console.error('Failed to send closed-hours WhatsApp:', err.message);
            });

            callRepository.updateByCallerNumber(callerNumber, { outcome: 'closed_hours_whatsapp' }).catch(err => {
                console.error('Failed to update call record:', err.message);
            });

            twiml.hangup();
        }

    } catch (error) {
        console.error('Error in voice handler:', error.message);
        twiml.say({
            language: 'he-IL'
        }, getMessage('IVR_error'));
        twiml.hangup();
    }

    res.type('text/xml');
    res.send(twiml.toString());
});

/**
 * Handle dial callback (after forwarding to rep)
 * POST /api/voice/dial-callback
 */
router.post('/dial-callback', async (req, res) => {
    const twiml = new VoiceResponse();
    const dialStatus = req.body.DialCallStatus;
    const callerNumber = req.body.From || 'unknown';
    const dialDuration = req.body.DialCallDuration || '';

    console.log(`📞 Dial callback - Status: ${dialStatus}`);

    if (dialStatus === 'completed') {
        // Call was answered and finished normally
        console.log('✅ Call completed successfully');
        
        callRepository.updateByCallerNumber(callerNumber, { 
            outcome: 'answered',
            duration: dialDuration
        }).catch(err => {
            console.error('Failed to update call record:', err.message);
        });
        
        twiml.hangup();
    } else {
        // Call was NOT answered (no-answer, busy, failed, canceled)
        console.log(`⚠️ Call not answered (${dialStatus}) - playing IVR_no_answer`);
        
        const gather = twiml.gather({
            numDigits: 1,
            action: '/api/voice/no-answer-menu',
            method: 'POST',
            timeout: 15,
            language: 'he-IL'
        });

        gather.say({
            voice: 'Polly.Aditi',
            language: 'he-IL'
        }, getMessage('IVR_no_answer'));

        // If no input after timeout, hang up
        twiml.say({
            language: 'he-IL'
        }, getMessage('IVR_goodbye'));
        
        callRepository.updateByCallerNumber(callerNumber, { outcome: 'no_answer_hangup' }).catch(err => {
            console.error('Failed to update call record:', err.message);
        });
        
        twiml.hangup();
    }

    res.type('text/xml');
    res.send(twiml.toString());
});

/**
 * Handle closed office menu (IVR_no_answer response when office is closed)
 * POST /api/voice/closed-menu
 */
router.post('/closed-menu', async (req, res) => {
    const twiml = new VoiceResponse();
    const digit = req.body.Digits;
    const callerNumber = req.body.From || 'unknown';

    console.log(`📞 Closed menu selection: ${digit} from ${callerNumber}`);

    if (digit === '9') {
        console.log('📱 Sending WhatsApp (office closed, pressed 9)...');
        
        twiml.say({
            voice: 'Polly.Aditi',
            language: 'he-IL'
        }, getMessage('IVR_whatsapp_sent'));

        sendMissedCallWhatsApp(callerNumber, 'closed').catch(err => {
            console.error('Failed to send closed-hours WhatsApp:', err.message);
        });

        callRepository.updateByCallerNumber(callerNumber, { outcome: 'closed_hours_whatsapp' }).catch(err => {
            console.error('Failed to update call record:', err.message);
        });

        twiml.hangup();
    } else {
        console.log('📞 Invalid input when closed, sending WhatsApp anyway...');
        
        twiml.say({
            language: 'he-IL'
        }, getMessage('IVR_closed_sending_whatsapp'));

        sendMissedCallWhatsApp(callerNumber, 'closed').catch(err => {
            console.error('Failed to send closed-hours WhatsApp:', err.message);
        });

        callRepository.updateByCallerNumber(callerNumber, { outcome: 'closed_hours_whatsapp' }).catch(err => {
            console.error('Failed to update call record:', err.message);
        });

        twiml.hangup();
    }

    res.type('text/xml');
    res.send(twiml.toString());
});

/**
 * Handle no-answer menu (IVR_no_answer response when office is open)
 * POST /api/voice/no-answer-menu
 */
router.post('/no-answer-menu', async (req, res) => {
    const twiml = new VoiceResponse();
    const digit = req.body.Digits;
    const callerNumber = req.body.From || 'unknown';

    console.log(`📞 No-answer menu selection: ${digit} from ${callerNumber}`);

    if (digit === '9') {
        console.log('📱 Sending WhatsApp after no-answer...');
        
        twiml.say({
            voice: 'Polly.Aditi',
            language: 'he-IL'
        }, getMessage('IVR_whatsapp_sent'));

        sendMissedCallWhatsApp(callerNumber, 'no_answer').catch(err => {
            console.error('Failed to send no-answer WhatsApp:', err.message);
        });

        callRepository.updateByCallerNumber(callerNumber, { outcome: 'no_answer_whatsapp' }).catch(err => {
            console.error('Failed to update call record:', err.message);
        });

        twiml.hangup();
    } else {
        console.log('📞 Invalid input, ending call...');
        
        twiml.say({
            language: 'he-IL'
        }, getMessage('IVR_goodbye'));

        callRepository.updateByCallerNumber(callerNumber, { outcome: 'no_answer_hangup' }).catch(err => {
            console.error('Failed to update call record:', err.message);
        });

        twiml.hangup();
    }

    res.type('text/xml');
    res.send(twiml.toString());
});

/**
 * Handle outgoing call status
 * POST /api/voice/outgoing-status
 */
router.post('/outgoing-status', async (req, res) => {
    const twiml = new VoiceResponse();
    const callStatus = req.body.CallStatus;
    const to = req.body.To || 'unknown';
    const from = req.body.From || 'unknown';
    
    console.log(`📞 Outgoing call status: ${callStatus} to ${to}`);

    try {
        // Update call record based on status
        let outcome = 'outgoing_unknown';
        
        switch (callStatus) {
            case 'queued':
                outcome = 'outgoing_queued';
                break;
            case 'ringing':
                outcome = 'outgoing_ringing';
                break;
            case 'in-progress':
                outcome = 'outgoing_answered';
                break;
            case 'completed':
                outcome = 'outgoing_completed';
                break;
            case 'busy':
                outcome = 'outgoing_busy';
                break;
            case 'no-answer':
                outcome = 'outgoing_no_answer';
                break;
            case 'failed':
                outcome = 'outgoing_failed';
                break;
            case 'canceled':
                outcome = 'outgoing_canceled';
                break;
        }

        // Update by Twilio SID
        const twilioCallSid = req.body.CallSid;
        if (twilioCallSid) {
            await callRepository.updateByTwilioSid(twilioCallSid, { outcome });
        }

        // For outgoing calls, we don't need to provide TwiML
        // Just return success
        res.status(200).send('OK');
        
    } catch (error) {
        console.error('Error handling outgoing call status:', error.message);
        res.status(500).send('Error');
    }
});

/**
 * Status callback for tracking call metrics
 * POST /api/voice/status
 */
router.post('/status', (req, res) => {
    console.log('📊 Call Status:', {
        callSid: req.body.CallSid,
        callStatus: req.body.CallStatus,
        from: req.body.From,
        to: req.body.To,
        duration: req.body.CallDuration
    });
    res.sendStatus(200);
});

/**
 * IVR Settings and Control API Routes
 * POST /api/ivr/settings
 */
router.post('/settings', async (req, res) => {
    try {
        const { updateIvrSettings } = require('./service');
        const newSettings = req.body;
        
        if (!newSettings || typeof newSettings !== 'object') {
            return res.status(400).json({ error: 'Settings object is required' });
        }
        
        const updatedSettings = updateIvrSettings(newSettings);
        
        res.json({
            success: true,
            settings: updatedSettings
        });
    } catch (error) {
        console.error('Error updating IVR settings:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/ivr/settings
 * Get current IVR settings
 */
router.get('/settings', async (req, res) => {
    try {
        const { getIvrSettings } = require('./service');
        const settings = getIvrSettings();
        
        res.json({
            success: true,
            settings
        });
    } catch (error) {
        console.error('Error getting IVR settings:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ivr/emergency
 * Toggle emergency mode
 * Body: { enabled: boolean }
 */
router.post('/emergency', async (req, res) => {
    try {
        const { toggleEmergencyMode } = require('./service');
        const { enabled } = req.body;
        
        if (typeof enabled !== 'boolean') {
            return res.status(400).json({ error: 'enabled boolean is required' });
        }
        
        const emergencyMode = toggleEmergencyMode(enabled);
        
        res.json({
            success: true,
            emergencyMode
        });
    } catch (error) {
        console.error('Error toggling emergency mode:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/ivr/queue
 * Get current queue status
 */
router.get('/queue', async (req, res) => {
    try {
        const { getQueueStatus } = require('./service');
        const queueStatus = getQueueStatus();
        
        res.json({
            success: true,
            queue: queueStatus
        });
    } catch (error) {
        console.error('Error getting queue status:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ivr/queue/add
 * Add caller to queue (for testing)
 * Body: { callerNumber: string, callId: string }
 */
router.post('/queue/add', async (req, res) => {
    try {
        const { addToQueue } = require('./service');
        const { callerNumber, callId } = req.body;
        
        if (!callerNumber || !callId) {
            return res.status(400).json({ error: 'callerNumber and callId are required' });
        }
        
        const result = addToQueue(callerNumber, callId);
        
        res.json({
            success: result.success,
            result
        });
    } catch (error) {
        console.error('Error adding to queue:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ivr/queue/remove
 * Remove caller from queue
 * Body: { callId: string }
 */
router.post('/queue/remove', async (req, res) => {
    try {
        const { removeFromQueue } = require('./service');
        const { callId } = req.body;
        
        if (!callId) {
            return res.status(400).json({ error: 'callId is required' });
        }
        
        const result = removeFromQueue(callId);
        
        res.json({
            success: result.success,
            result
        });
    } catch (error) {
        console.error('Error removing from queue:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/voice/status
 * Get current IVR status and settings
 */
router.get('/status', async (req, res) => {
    try {
        const { isOfficeOpen, getOfficeStatus } = require('./service');
        const officeOpen = await isOfficeOpen();
        const officeStatus = await getOfficeStatus();
        
        res.json({
            success: true,
            officeOpen,
            officeStatus
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
