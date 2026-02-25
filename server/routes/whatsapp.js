/**
 * WhatsApp Routes
 * Handles incoming WhatsApp messages via Twilio webhooks and outgoing messaging
 */

const express = require('express');
const router = express.Router();
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const { 
    handleIncomingMessage, 
    getBotStartMessage, 
    resetUserState, 
    getAllBotMessages 
} = require('../integrations/twilio/whatsappBot');

// Import Telnyx WhatsApp functions
let sendWhatsAppMessage, sendWhatsAppInteractive, sendWhatsAppLocation, sendBulkWhatsApp;
try {
    const telnyxWhatsApp = require('../integrations/telnyx/whatsapp');
    sendWhatsAppMessage = telnyxWhatsApp.sendWhatsAppMessage;
    sendWhatsAppInteractive = telnyxWhatsApp.sendWhatsAppInteractive;
    sendWhatsAppLocation = telnyxWhatsApp.sendWhatsAppLocation;
    sendBulkWhatsApp = telnyxWhatsApp.sendBulkWhatsApp;
} catch (error) {
    console.log('⚠️ Telnyx WhatsApp not available, using mock mode');
    // Fallback to Twilio for now
    const twilioWhatsApp = require('../integrations/twilio/whatsapp');
    sendWhatsAppMessage = twilioWhatsApp.sendWhatsAppMessage;
    sendWhatsAppInteractive = twilioWhatsApp.sendWhatsAppInteractive;
    sendWhatsAppLocation = twilioWhatsApp.sendWhatsAppLocation;
    sendBulkWhatsApp = twilioWhatsApp.sendBulkWhatsApp;
}

const { saveInquiry } = require('../dal/repositories/inquiryRepository');
const { isTelnyxConfigured, isTwilioConfigured } = require('../config');

/**
 * POST /api/whatsapp/send
 * Send a WhatsApp message programmatically
 * Body: { to: string, message: string, options?: object }
 */
router.post('/send', async (req, res) => {
    try {
        const { to, message, options = {} } = req.body;
        
        if (!to || !message) {
            return res.status(400).json({ 
                error: 'Phone number and message are required' 
            });
        }
        
        // Check if Telnyx is configured
        if (!isTelnyxConfigured()) {
            return res.status(500).json({ 
                error: 'Telnyx not configured. Please set TELNYX_API_KEY and other Telnyx credentials' 
            });
        }
        
        const result = await sendWhatsAppMessage(to, message, options);
        
        res.json({
            success: true,
            result
        });
        
    } catch (error) {
        console.error('Error sending WhatsApp:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/whatsapp/send-interactive
 * Send WhatsApp message with interactive buttons
 * Body: { to: string, message: string, buttons: Array<{id: string, title: string}> }
 */
router.post('/send-interactive', async (req, res) => {
    try {
        const { to, message, buttons = [] } = req.body;
        
        if (!to || !message || buttons.length === 0) {
            return res.status(400).json({ 
                error: 'Phone number, message, and buttons are required' 
            });
        }
        
        const result = await sendWhatsAppInteractive(to, message, buttons);
        
        res.json({
            success: true,
            result
        });
        
    } catch (error) {
        console.error('Error sending interactive WhatsApp:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/whatsapp/send-location
 * Send WhatsApp location
 * Body: { to: string, location: {lat: number, lon: number, name?: string, address?: string} }
 */
router.post('/send-location', async (req, res) => {
    try {
        const { to, location } = req.body;
        
        if (!to || !location || !location.lat || !location.lon) {
            return res.status(400).json({ 
                error: 'Phone number and location (lat, lon) are required' 
            });
        }
        
        const result = await sendWhatsAppLocation(to, location);
        
        res.json({
            success: true,
            result
        });
        
    } catch (error) {
        console.error('Error sending WhatsApp location:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/whatsapp/send-bulk
 * Send bulk WhatsApp messages
 * Body: { recipients: Array<{phone: string, message: string, options?: object}>, options?: {delay?: number, batchSize?: number} }
 */
router.post('/send-bulk', async (req, res) => {
    try {
        const { recipients = [], options = {} } = req.body;
        
        if (!Array.isArray(recipients) || recipients.length === 0) {
            return res.status(400).json({ 
                error: 'Recipients array is required and cannot be empty' 
            });
        }
        
        // Validate each recipient
        for (const recipient of recipients) {
            if (!recipient.phone || !recipient.message) {
                return res.status(400).json({ 
                    error: 'Each recipient must have phone and message' 
                });
            }
        }
        
        const result = await sendBulkWhatsApp(recipients, options);
        
        res.json({
            success: true,
            result
        });
        
    } catch (error) {
        console.error('Error sending bulk WhatsApp:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Incoming WhatsApp message webhook
 * POST /api/whatsapp/incoming
 */
router.post('/incoming', async (req, res) => {
    const twiml = new MessagingResponse();
    
    try {
        // Extract message details from Twilio
        const from = req.body.From || ''; // whatsapp:+972...
        const body = req.body.Body || '';
        const profileName = req.body.ProfileName || '';
        const buttonPayload = req.body.ButtonPayload || ''; // For interactive buttons
        
        // Clean phone number (remove 'whatsapp:' prefix)
        const phoneNumber = from.replace('whatsapp:', '');
        
        // Use button payload if available, otherwise use message body
        const messageContent = buttonPayload || body;
        
        console.log(` WhatsApp incoming from ${phoneNumber}: ${messageContent}`);

        // Handle the message through the bot (pass saveInquiry function)
        const response = await handleIncomingMessage(phoneNumber, messageContent, profileName, saveInquiry);

        // Build response with buttons if provided
        if (response.buttons && response.buttons.length > 0) {
            // Twilio TwiML doesn't support buttons directly in response
            // We need to send buttons via the API instead
            // For now, append button options to message text
            let messageWithOptions = response.message;
            
            // Send response via TwiML (simple text)
            twiml.message(messageWithOptions);
        } else {
            twiml.message(response.message);
        }

    } catch (error) {
        console.error('Error handling WhatsApp message:', error.message);
        twiml.message('מצטערים, אירעה שגיאה. אנא נסה שוב מאוחר יותר.');
    }

    res.type('text/xml');
    res.send(twiml.toString());
});

/**
 * Send initial bot message to a phone number
 * Used when redirecting from IVR
 * POST /api/whatsapp/send-start
 */
router.post('/send-start', async (req, res) => {
    try {
        const { phoneNumber, reason } = req.body;
        
        if (!phoneNumber) {
            return res.status(400).json({ error: 'Phone number required' });
        }

        const startMessage = getBotStartMessage();
        
        // Add context based on reason
        let contextMessage = '';
        if (reason === 'closed') {
            contextMessage = '🕐 פניתם אלינו מחוץ לשעות הפעילות.\n\n';
        } else if (reason === 'no_answer') {
            contextMessage = '📞 לא הצלחנו לענות לשיחה.\n\n';
        }

        const fullMessage = contextMessage + startMessage.message + '\n\nהקלידו "התחל" כדי להמשיך.';

        await sendWhatsAppMessage(phoneNumber, fullMessage);

        console.log(`📱 Bot start message sent to ${phoneNumber} (reason: ${reason})`);
        
        res.json({ 
            success: true, 
            message: 'Bot start message sent',
            phoneNumber
        });
    } catch (error) {
        console.error('Error sending bot start:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * WhatsApp status callback
 * POST /api/whatsapp/status
 */
router.post('/status', (req, res) => {
    console.log('📊 WhatsApp Status:', {
        messageSid: req.body.MessageSid,
        status: req.body.MessageStatus,
        to: req.body.To,
        errorCode: req.body.ErrorCode
    });
    res.sendStatus(200);
});

/**
 * Get bot status and messages
 * GET /api/whatsapp/status
 */
router.get('/status', (req, res) => {
    res.json({
        success: true,
        messages: getAllBotMessages()
    });
});

/**
 * Reset user conversation (for testing)
 * POST /api/whatsapp/reset
 */
router.post('/reset', (req, res) => {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number required' });
    }

    resetUserState(phoneNumber);
    
    res.json({ 
        success: true, 
        message: `Conversation reset for ${phoneNumber}`
    });
});

/**
 * Test endpoint - simulate incoming message
 * POST /api/whatsapp/test
 */
router.post('/test', async (req, res) => {
    try {
        const { phoneNumber, message, name } = req.body;
        
        if (!phoneNumber || !message) {
            return res.status(400).json({ error: 'Phone number and message required' });
        }

        const response = await handleIncomingMessage(phoneNumber, message, name || 'Test User');
        
        res.json({
            success: true,
            response
        });
    } catch (error) {
        console.error('Error in test endpoint:', error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

