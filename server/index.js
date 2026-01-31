/**
 * Communication Orchestration Platform
 * Express server that handles bookings, IVR, WhatsApp, and call tracking
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Configuration
const { config, validateConfig } = require('./config');

// DAL (Database)
const { initDatabase } = require('./dal');

// Routes
const bookingRoutes = require('./routes/booking');
const whatsappRoutes = require('./routes/whatsapp');
const callRoutes = require('./routes/calls');
const inquiryRoutes = require('./routes/inquiries');
const ivrRoutes = require('./ivr/routes');

// Google Integrations (Calendar Sync)
const { 
    syncCalendarToSheet, 
    schedulePeriodicSync 
} = require('./integrations/google');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For Twilio webhooks

// ============================================
// Route Prefix (for cPanel deployments)
// ============================================
const BASE_PATH = process.env.BASE_PATH || '';

// ============================================
// Health & Status Endpoints
// ============================================

app.get(BASE_PATH + '/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        timezone: config.timezone
    });
});

// ============================================
// API Routes
// ============================================

// Booking routes
app.use(BASE_PATH + '/api/booking', bookingRoutes);

// Voice/IVR routes (Twilio webhooks)
app.use(BASE_PATH + '/api/voice', ivrRoutes);

// WhatsApp bot routes (Twilio webhooks)
app.use(BASE_PATH + '/api/whatsapp', whatsappRoutes);

// Call records API
app.use(BASE_PATH + '/api/calls', callRoutes);

// Inquiries API (website contact form)
app.use(BASE_PATH + '/api/inquiries', inquiryRoutes);

// ============================================
// Admin/Management Endpoints
// ============================================

// Manual calendar sync trigger
app.post(BASE_PATH + '/api/sync/calendar', async (req, res) => {
    try {
        console.log('🔄 Manual calendar sync requested');
        const result = await syncCalendarToSheet();
        res.json({ 
            success: true, 
            message: 'Calendar synced to sheet',
            ...result
        });
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ error: error.message });
    }
});


// ============================================
// Error Handling
// ============================================

app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(config.nodeEnv === 'development' && { stack: err.stack })
    });
});

// ============================================
// Server Startup
// ============================================

async function startServer() {
    try {
        // Validate configuration
        validateConfig();

        // Initialize database connection
        let dbConnected = false;
        try {
            console.log('📦 Connecting to database...');
            await initDatabase();
            console.log('✅ Database connected');
            dbConnected = true;
        } catch (dbError) {
            console.error('⚠️ Database connection failed:', dbError.message);
            console.log('⚠️ Server will continue without database');
        }

        app.listen(config.port, () => {
            console.log('');
            console.log('═══════════════════════════════════════════════');
            console.log(`🚀 Server running on http://localhost:${config.port}`);
            console.log('═══════════════════════════════════════════════');
            console.log(`📅 Calendar ID: ${config.google.calendarId || 'Not configured'}`);
            console.log(`📊 Sheet ID: ${config.google.sheetId || 'Not configured'}`);
            console.log(`🗄️ Database: ${dbConnected ? config.db.database : 'Not connected'}`);
            console.log(`🕐 Timezone: ${config.timezone}`);
            console.log('═══════════════════════════════════════════════');
            
            // Start calendar sync scheduler (every 30 minutes) - only if Google is configured
            try {
                schedulePeriodicSync(30);
                
                // Run initial sync on startup
                console.log('🔄 Running initial calendar sync...');
                syncCalendarToSheet().catch(err => {
                    console.error('Initial sync failed:', err.message);
                });
            } catch (syncError) {
                console.log('⚠️ Calendar sync disabled (Google not configured)');
            }
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
}

startServer();
