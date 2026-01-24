/**
 * Voice/IVR Routes
 * Handles incoming calls via Twilio
 * 
 * Flow:
 * 1. Incoming call → Check if office open → Track call in Google Sheet
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
const { isOfficeOpen, getMessage } = require('../services/ivr');
const { sendMissedCallWhatsApp } = require('../services/whatsapp');
const { saveCallRecord, updateCallRecord } = require('../services/callTracking');

// Rep phone number from environment
const REP_PHONE = process.env.REP_PHONE_NUMBER || '+972500000000';

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

        // Track the call in Google Sheets
        saveCallRecord({
            callerNumber,
            officeStatus: officeOpen ? 'open' : 'closed',
            outcome: 'incoming', // Will be updated later with final outcome
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
                timeout: 20, // ~4 rings (approximately 5 seconds per ring)
                callerId: req.body.To // Use the business number as caller ID
            });
            
            dial.number(REP_PHONE);
            
        } else {
            // Office is CLOSED - play IVR_no_answer message with WhatsApp option
            console.log('🏢 Office CLOSED - playing IVR_no_answer');
            
            // Gather with no_answer message (press 9 for WhatsApp)
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
            }, 'שולחים לך הודעת וואטסאפ. להתראות.');

            sendMissedCallWhatsApp(callerNumber, 'closed').catch(err => {
                console.error('Failed to send closed-hours WhatsApp:', err.message);
            });

            updateCallRecord(callerNumber, { outcome: 'closed_hours_whatsapp' }).catch(err => {
                console.error('Failed to update call record:', err.message);
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
 * Handle menu selection from Message A (Legacy - kept for backwards compatibility)
 * POST /api/voice/menu-selection
 * Note: Current flow forwards directly to rep without menu
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
                timeout: 20, // ~4 rings
                callerId: req.body.To
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

            updateCallRecord(callerNumber, { outcome: 'menu_whatsapp' }).catch(err => {
                console.error('Failed to update call record:', err.message);
            });

            twiml.hangup();
            break;

        default:
            // Invalid input - redirect to incoming
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
    const dialDuration = req.body.DialCallDuration || '';

    console.log(`📞 Dial callback - Status: ${dialStatus}`);

    // Check if call was answered
    if (dialStatus === 'completed') {
        // Call was answered and finished normally
        console.log('✅ Call completed successfully');
        
        // Update call tracking with success
        updateCallRecord(callerNumber, { 
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

        // If no input after timeout, hang up (caller didn't press 9)
        twiml.say({
            language: 'he-IL'
        }, 'תודה שהתקשרת. להתראות.');
        
        // Update call tracking
        updateCallRecord(callerNumber, { outcome: 'no_answer_hangup' }).catch(err => {
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
        // Send WhatsApp
        console.log('📱 Sending WhatsApp (office closed, pressed 9)...');
        
        twiml.say({
            voice: 'Polly.Aditi',
            language: 'he-IL'
        }, getMessage('IVR_whatsapp_sent'));

        sendMissedCallWhatsApp(callerNumber, 'closed').catch(err => {
            console.error('Failed to send closed-hours WhatsApp:', err.message);
        });

        // Update call tracking
        updateCallRecord(callerNumber, { outcome: 'closed_hours_whatsapp' }).catch(err => {
            console.error('Failed to update call record:', err.message);
        });

        twiml.hangup();
    } else {
        // Any other input - send WhatsApp anyway (office is closed)
        console.log('📞 Invalid input when closed, sending WhatsApp anyway...');
        
        twiml.say({
            language: 'he-IL'
        }, 'שולחים לך הודעת וואטסאפ. להתראות.');

        sendMissedCallWhatsApp(callerNumber, 'closed').catch(err => {
            console.error('Failed to send closed-hours WhatsApp:', err.message);
        });

        updateCallRecord(callerNumber, { outcome: 'closed_hours_whatsapp' }).catch(err => {
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
        // Send WhatsApp
        console.log('📱 Sending WhatsApp after no-answer...');
        
        twiml.say({
            voice: 'Polly.Aditi',
            language: 'he-IL'
        }, getMessage('IVR_whatsapp_sent'));

        sendMissedCallWhatsApp(callerNumber, 'no_answer').catch(err => {
            console.error('Failed to send no-answer WhatsApp:', err.message);
        });

        // Update call tracking
        updateCallRecord(callerNumber, { outcome: 'no_answer_whatsapp' }).catch(err => {
            console.error('Failed to update call record:', err.message);
        });

        twiml.hangup();
    } else {
        // Any other input - thank and hang up
        console.log('📞 Invalid input, ending call...');
        
        twiml.say({
            language: 'he-IL'
        }, 'תודה שהתקשרת. להתראות.');

        // Update call tracking
        updateCallRecord(callerNumber, { outcome: 'no_answer_hangup' }).catch(err => {
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

