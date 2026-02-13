/**
 * Communication Orchestration Platform
 * Express server that handles bookings, IVR, WhatsApp, and call tracking
 */

require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

// Configuration
const { config, validateConfig } = require('./config');

// DAL (Database)
const { initDatabase, getPool } = require('./dal');

// Routes
const authRoutes = require('./routes/auth');
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

// Middleware - CORS configuration
const corsOptions = {
    origin: [
        'https://drozyuval.com',
        'https://www.drozyuval.com',
        'http://localhost:3000',
        'http://localhost:5173'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));
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

// Inquiries API: mounted after session in startServer() so auth works for admin endpoints

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

        // Session (requires DB pool) + Auth routes - only when DB is available
        if (dbConnected) {
            const session = require('express-session');
            const PGStore = require('connect-pg-simple')(session);
            const pool = getPool();
            app.use(session({
                store: new PGStore({ pool, tableName: 'session' }),
                secret: process.env.SESSION_SECRET || 'change-me-in-production',
                resave: false,
                saveUninitialized: false,
                rolling: true, // reset expiry on every request → logout after 1h of *inactivity*
                cookie: {
                    httpOnly: true,
                    secure: config.nodeEnv === 'production',
                    maxAge: Number(config.session.maxAgeMs) || 60 * 60 * 1000, // 1h if missing/invalid
                    sameSite: 'lax'
                }
            }));
            app.use(BASE_PATH + '/api/auth', authRoutes);
            app.use(BASE_PATH + '/api/inquiries', inquiryRoutes);

            // Admin SPA: serve static files and SPA fallback
            const adminPath = path.join(__dirname, 'public', 'admin');
            app.use(BASE_PATH + '/admin', express.static(adminPath));
            app.get(BASE_PATH + '/admin', (req, res) => {
                res.sendFile(path.join(adminPath, 'index.html'));
            });
            app.get(BASE_PATH + '/admin/*', (req, res) => {
                res.sendFile(path.join(adminPath, 'index.html'));
            });
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
