/**
 * Twilio Integrations Index
 */

const sms = require('./sms');
const whatsapp = require('./whatsapp');
const whatsappBot = require('./whatsappBot');

module.exports = {
    // SMS
    sendSMS: sms.sendSMS,
    formatPhoneNumber: sms.formatPhoneNumber,
    buildReminderMessage: sms.buildReminderMessage,
    
    // WhatsApp
    sendWhatsAppMessage: whatsapp.sendWhatsAppMessage,
    sendWhatsAppTemplate: whatsapp.sendWhatsAppTemplate,
    sendMissedCallWhatsApp: whatsapp.sendMissedCallWhatsApp,
    formatWhatsAppNumber: whatsapp.formatWhatsAppNumber,
    
    // WhatsApp Bot
    handleIncomingMessage: whatsappBot.handleIncomingMessage,
    getBotStartMessage: whatsappBot.getBotStartMessage,
    resetUserState: whatsappBot.resetUserState,
    getAllBotMessages: whatsappBot.getAllBotMessages,
    BOT_MESSAGES: whatsappBot.BOT_MESSAGES
};
