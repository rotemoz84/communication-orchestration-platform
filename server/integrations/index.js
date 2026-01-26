/**
 * Integrations Index
 * Central export for all external service integrations
 */

const google = require('./google');
const twilio = require('./twilio');

module.exports = {
    google,
    twilio
};
