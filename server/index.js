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
const bookingAdminRoutes = bookingRoutes.adminRouter;
const whatsappRoutes = require('./routes/whatsapp');
let callRoutes;
try {
    callRoutes = require('./routes/calls');
} catch (error) {
    console.log('⚠️ Call routes not available:', error.message);
    callRoutes = express.Router();
}
const inquiryRoutes = require('./routes/inquiries');
const voiceRoutes = require('./ivr/routes');
const ivrAdminRoutes = voiceRoutes.adminRouter;
const { requireAuth } = require('./middleware/requireAuth');

// Google Integrations (Calendar Sync)
const { 
    syncCalendarToSheet, 
    schedulePeriodicSync 
} = require('./integrations/google');

const app = express();

// Trust first proxy (required in production when behind nginx/Apache/cPanel)
// so req.secure and cookies work correctly over HTTPS
// Env is case-sensitive: use TRUST_PROXY=1
if (config.nodeEnv === 'production' || process.env.TRUST_PROXY === '1') {
    app.set('trust proxy', 1);
}

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
app.use(express.urlencoded({ extended: true })); // For webhook form payloads

// ============================================
// Route Prefix (for cPanel deployments)
// ============================================
const BASE_PATH = process.env.BASE_PATH || '';

// ============================================
// Favicon (avoid 404 in browser console)
// ============================================
app.get(BASE_PATH + '/favicon.ico', (req, res) => {
    res.status(204).end();
});

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

// Voice/IVR routes
app.use(BASE_PATH + '/api/voice', voiceRoutes);

// WhatsApp routes (disabled pending Meta implementation)
app.use(BASE_PATH + '/api/whatsapp', whatsappRoutes);

// Inquiry and call-record APIs are mounted after session in startServer()
// so protected administration endpoints can authenticate requests.

async function syncCalendar(req, res) {
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
        res.status(500).json({ error: 'Calendar sync failed' });
    }
}

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
            const sessionSecret = process.env.SESSION_SECRET;
            if (!sessionSecret || String(sessionSecret).trim() === '') {
                console.error('❌ SESSION_SECRET is required. Set SESSION_SECRET in .env (e.g. a long random string).');
                process.exit(1);
            }
            const session = require('express-session');
            const PGStore = require('connect-pg-simple')(session);
            const pool = getPool();
            app.use(session({
                store: new PGStore({ pool, tableName: 'session' }),
                secret: sessionSecret,
                resave: false,
                saveUninitialized: false,
                rolling: true, // reset expiry on every request → logout after 1h of *inactivity*
                cookie: {
                    httpOnly: true,
                    secure: config.nodeEnv === 'production',
                    maxAge: Number(config.session.maxAgeMs) || 60 * 60 * 1000, // 1h if missing/invalid
                    sameSite: 'lax',
                    path: BASE_PATH || '/'
                }
            }));
            app.use(BASE_PATH + '/api/auth', authRoutes);
            app.use(BASE_PATH + '/api/inquiries', inquiryRoutes);
            app.use(BASE_PATH + '/api/calls', callRoutes);
            app.use(BASE_PATH + '/api/ivr', ivrAdminRoutes);
            app.use(BASE_PATH + '/api/booking', bookingAdminRoutes);
            app.post(BASE_PATH + '/api/sync/calendar', requireAuth, syncCalendar);

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
