/**
 * IVR Module Index
 */

const routes = require('./routes');
const service = require('./service');
const messages = require('./messages');

module.exports = {
    // Routes
    routes,
    
    // Service
    isOfficeOpen: service.isOfficeOpen,
    getOfficeStatus: service.getOfficeStatus,
    
    // Messages
    getMessage: messages.getMessage,
    setMessage: messages.setMessage,
    getAllMessages: messages.getAllMessages,
    IVR_MESSAGES: messages.IVR_MESSAGES
};
