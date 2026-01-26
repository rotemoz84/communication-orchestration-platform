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
 * Get current IVR status and settings
 * GET /api/voice/status
 */
router.get('/status', async (req, res) => {
    try {
        const officeOpen = await isOfficeOpen();
        
        res.json({
            success: true,
            officeOpen,
            repPhone: REP_PHONE,
            messages: getAllMessages()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
