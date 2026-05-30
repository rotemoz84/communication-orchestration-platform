/**
 * Configuration Module
 * Centralizes all environment configuration
 */

// Env vars are case-sensitive; 
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
    
    // Business
    repPhoneNumber: process.env.REP_PHONE_NUMBER || '+972500000000',

    // Telnyx webhook verification
    telnyx: {
        publicKey: process.env.TELNYX_PUBLIC_KEY
    },
    
    // IVR Settings
    ivr: {
        callRecording: process.env.IVR_CALL_RECORDING === 'true',
        emergencyMode: process.env.IVR_EMERGENCY_MODE === 'true',
        queueEnabled: process.env.IVR_QUEUE_ENABLED === 'true',
        maxQueueSize: parseInt(process.env.IVR_MAX_QUEUE_SIZE) || 10,
        customGreeting: process.env.IVR_CUSTOM_GREETING,
        callForwarding: process.env.IVR_CALL_FORWARDING !== 'false'
    },

    // Cron job auth (for triggering send-summary etc. without browser)
    cron: {
        secret: process.env.CRON_SECRET,
        adminEmail: process.env.CRON_ADMIN_EMAIL
    },

    // Admin session (cookie lifetime)
    session: {
        // Session duration in ms. Default 1 hour. Use SESSION_MAX_AGE_HOURS (e.g. 0.5, 1, 2) or SESSION_MAX_AGE_MS.
        maxAgeMs: process.env.SESSION_MAX_AGE_MS
            ? parseInt(process.env.SESSION_MAX_AGE_MS, 10)
            : (parseFloat(process.env.SESSION_MAX_AGE_HOURS) || 1) * 60 * 60 * 1000
    }
};

/**
 * Validate required configuration
 */
function validateConfig() {
    const missing = [];
    
    // Check required fields
    if (!config.google.sheetId) missing.push('GOOGLE_SHEET_ID');
    if (!config.google.calendarId) missing.push('GOOGLE_CALENDAR_ID');
    if (!config.telnyx.publicKey) missing.push('TELNYX_PUBLIC_KEY');
    
    if (missing.length > 0) {
        console.warn(`⚠️ Missing configuration: ${missing.join(', ')}`);
    }
    
    return missing.length === 0;
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
    isDatabaseConfigured
};
