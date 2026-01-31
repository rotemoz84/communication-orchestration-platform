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
// Health & Status Endpoints
// ============================================

app.get('/api/health', (req, res) => {
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
app.use('/api/booking', bookingRoutes);

// Voice/IVR routes (Twilio webhooks)
app.use('/api/voice', ivrRoutes);

// WhatsApp bot routes (Twilio webhooks)
app.use('/api/whatsapp', whatsappRoutes);

// Call records API
app.use('/api/calls', callRoutes);

// Inquiries API (website contact form)
app.use('/api/inquiries', inquiryRoutes);

// ============================================
// Admin/Management Endpoints
// ============================================

// Manual calendar sync trigger
app.post('/api/sync/calendar', async (req, res) => {
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
        console.log('📦 Connecting to database...');
        await initDatabase();
        console.log('✅ Database connected');

        app.listen(config.port, () => {
            console.log('');
            console.log('═══════════════════════════════════════════════');
            console.log(`🚀 Server running on http://localhost:${config.port}`);
            console.log('═══════════════════════════════════════════════');
            console.log(`📅 Calendar ID: ${config.google.calendarId || 'Not configured'}`);
            console.log(`📊 Sheet ID: ${config.google.sheetId || 'Not configured'}`);
            console.log(`🗄️ Database: ${config.db.database}`);
            console.log(`🕐 Timezone: ${config.timezone}`);
            console.log('═══════════════════════════════════════════════');
            
            // Start calendar sync scheduler (every 30 minutes)
            schedulePeriodicSync(30);
            
            // Run initial sync on startup
            console.log('🔄 Running initial calendar sync...');
            syncCalendarToSheet().catch(err => {
                console.error('Initial sync failed:', err.message);
            });
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
}

startServer();
