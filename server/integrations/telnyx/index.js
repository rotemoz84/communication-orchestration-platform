/**
 * Telnyx Integrations Index
 * Replaces Twilio with Telnyx for voice and messaging
 */

const voice = require('./voice');
const messaging = require('./messaging');
const whatsapp = require('./whatsapp');

module.exports = {
    // Voice/IVR
    createCall: voice.createCall,
    getCall: voice.getCall,
    recordCall: voice.recordCall,
    
    // Messaging
    sendSMS: messaging.sendSMS,
    sendMMS: messaging.sendMMS,
    
    // WhatsApp
    sendWhatsAppMessage: whatsapp.sendWhatsAppMessage,
    sendWhatsAppInteractive: whatsapp.sendWhatsAppInteractive,
    sendWhatsAppLocation: whatsapp.sendWhatsAppLocation,
    sendBulkWhatsApp: whatsapp.sendBulkWhatsApp,
    sendWhatsAppTemplate: whatsapp.sendWhatsAppTemplate,
    formatWhatsAppNumber: whatsapp.formatWhatsAppNumber
};
