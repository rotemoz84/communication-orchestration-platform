/**
 * Voice/IVR Routes
 * Handles incoming calls via Twilio
 * 
 * Flow:
 * 1. Incoming call → Check if office open
 * 2. Office OPEN:
 *    - Play Message A
 *    - Press 1 → Forward to rep → If no answer after 5 rings → Message B → Press 9 for WhatsApp
 *    - Press 2 → Send WhatsApp
 * 3. Office CLOSED:
 *    - Play Message C
 *    - Send WhatsApp automatically
 */

const express = require('express');
const router = express.Router();
const VoiceResponse = require('twilio').twiml.VoiceResponse;
const { isOfficeOpen, getMessage } = require('../services/ivr');
const { sendMissedCallWhatsApp } = require('../services/whatsapp');

// Rep phone number from environment
const REP_PHONE = process.env.REP_PHONE_NUMBER || '+972500000000';

/**
 * Main entry point for incoming calls
 * POST /api/voice/incoming
 */
router.post('/incoming', async (req, res) => {
    const twiml = new VoiceResponse();
    const callerNumber = req.body.From || 'unknown';
    
    console.log(`📞 Incoming call from: ${callerNumber}`);

    try {
        const officeOpen = await isOfficeOpen();

        if (officeOpen) {
            // Office is OPEN - play welcome menu (Message A)
            console.log('🏢 Office OPEN - playing menu');
            
            const gather = twiml.gather({
                numDigits: 1,
                action: '/api/voice/menu-selection',
                method: 'POST',
                timeout: 10,
                language: 'he-IL'
            });
            
            gather.say({
                voice: 'Polly.Aditi', // Use a voice that supports Hebrew or switch to recording
                language: 'he-IL'
            }, getMessage('IVR_welcome'));

            // If no input, repeat
            twiml.redirect('/api/voice/incoming');
            
        } else {
            // Office is CLOSED - play message C and send WhatsApp
            console.log('🏢 Office CLOSED - sending WhatsApp');
            
            twiml.say({
                voice: 'Polly.Aditi',
                language: 'he-IL'
            }, getMessage('IVR_closed'));

            // Send WhatsApp asynchronously
            sendMissedCallWhatsApp(callerNumber, 'closed').catch(err => {
                console.error('Failed to send closed-hours WhatsApp:', err.message);
            });

            twiml.hangup();
        }

    } catch (error) {
        console.error('Error in voice handler:', error.message);
        twiml.say({
            language: 'he-IL'
        }, 'מצטערים, אירעה שגיאה. אנא נסה שוב מאוחר יותר.');
        twiml.hangup();
    }

    res.type('text/xml');
    res.send(twiml.toString());
});

/**
 * Handle menu selection from Message A
 * POST /api/voice/menu-selection
 */
router.post('/menu-selection', async (req, res) => {
    const twiml = new VoiceResponse();
    const digit = req.body.Digits;
    const callerNumber = req.body.From || 'unknown';

    console.log(`📞 Menu selection: ${digit} from ${callerNumber}`);

    switch (digit) {
        case '1':
            // Connect to rep with timeout handling
            console.log('➡️ Forwarding to rep...');
            
            const dial = twiml.dial({
                action: '/api/voice/dial-callback',
                method: 'POST',
                timeout: 25, // ~5 rings (5 seconds per ring)
                callerId: req.body.To // Use the business number as caller ID
            });
            
            dial.number(REP_PHONE);
            break;

        case '2':
            // Send WhatsApp
            console.log('📱 Sending WhatsApp...');
            
            twiml.say({
                language: 'he-IL'
            }, getMessage('IVR_whatsapp_sent'));

            sendMissedCallWhatsApp(callerNumber, 'missed').catch(err => {
                console.error('Failed to send WhatsApp:', err.message);
            });

            twiml.hangup();
            break;

        default:
            // Invalid input - repeat menu
            twiml.say({
                language: 'he-IL'
            }, 'בחירה לא תקינה.');
            twiml.redirect('/api/voice/incoming');
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

    console.log(`📞 Dial callback - Status: ${dialStatus}`);

    // Check if call was answered
    if (dialStatus === 'completed') {
        // Call was answered and finished normally
        console.log('✅ Call completed successfully');
        twiml.hangup();
    } else {
        // Call was NOT answered (no-answer, busy, failed, canceled)
        console.log(`⚠️ Call not answered (${dialStatus}) - playing Message B`);
        
        const gather = twiml.gather({
            numDigits: 1,
            action: '/api/voice/no-answer-menu',
            method: 'POST',
            timeout: 15,
            language: 'he-IL'
        });

        gather.say({
            language: 'he-IL'
        }, getMessage('IVR_no_answer'));

        // If no input, keep waiting for rep (redial)
        const redial = twiml.dial({
            action: '/api/voice/dial-callback',
            method: 'POST',
            timeout: 25
        });
        redial.number(REP_PHONE);
    }

    res.type('text/xml');
    res.send(twiml.toString());
});

/**
 * Handle no-answer menu (Message B response)
 * POST /api/voice/no-answer-menu
 */
router.post('/no-answer-menu', async (req, res) => {
    const twiml = new VoiceResponse();
    const digit = req.body.Digits;
    const callerNumber = req.body.From || 'unknown';

    console.log(`📞 No-answer menu selection: ${digit} from ${callerNumber}`);

    if (digit === '9') {
        // Send WhatsApp
        console.log('📱 Sending WhatsApp after no-answer...');
        
        twiml.say({
            language: 'he-IL'
        }, getMessage('IVR_whatsapp_sent'));

        sendMissedCallWhatsApp(callerNumber, 'no_answer').catch(err => {
            console.error('Failed to send no-answer WhatsApp:', err.message);
        });

        twiml.hangup();
    } else {
        // Continue waiting for rep
        console.log('📞 Continuing to wait for rep...');
        
        twiml.say({
            language: 'he-IL'
        }, 'ממתינים לנציג...');

        const dial = twiml.dial({
            action: '/api/voice/dial-callback',
            method: 'POST',
            timeout: 25
        });
        dial.number(REP_PHONE);
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
        const { getAllMessages } = require('../services/ivr');
        
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

