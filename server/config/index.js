/**
 * Configuration Module
 * Centralizes all environment configuration
 */

const config = {
    // Server
    port: process.env.PORT || 3003,
    nodeEnv: process.env.NODE_ENV || 'development',
    baseUrl: process.env.BASE_URL || 'http://localhost:3003',
    
    // Timezone
    timezone: process.env.TIMEZONE || 'Asia/Jerusalem',
    
    // Database (PostgreSQL)
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'communication_platform',
        maxConnections: 10,
        idleTimeoutMs: 30000,
        connectionTimeoutMs: 2000
    },
    
    // Google APIs
    google: {
        serviceAccountKeyPath: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || './service-account-key.json',
        sheetId: process.env.GOOGLE_SHEET_ID,
        calendarId: process.env.GOOGLE_CALENDAR_ID
    },
    
    // Twilio
    twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER,
        phoneNumber: process.env.TWILIO_PHONE_NUMBER
    },
    
    // Business
    repPhoneNumber: process.env.REP_PHONE_NUMBER || '+972500000000'
};

/**
 * Validate required configuration
 */
function validateConfig() {
    const missing = [];
    
    // Check required fields
    if (!config.google.sheetId) missing.push('GOOGLE_SHEET_ID');
    if (!config.google.calendarId) missing.push('GOOGLE_CALENDAR_ID');
    
    if (missing.length > 0) {
        console.warn(`⚠️ Missing configuration: ${missing.join(', ')}`);
    }
    
    return missing.length === 0;
}

/**
 * Check if Twilio is configured
 */
function isTwilioConfigured() {
    return !!(config.twilio.accountSid && config.twilio.authToken);
}

/**
 * Check if database is configured
 */
function isDatabaseConfigured() {
    return !!(config.db.host && config.db.user && config.db.database);
}

module.exports = {
    config,
    validateConfig,
    isTwilioConfigured,
    isDatabaseConfigured
};
