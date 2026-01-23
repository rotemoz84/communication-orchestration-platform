/**
 * Booking Server
 * Express server that connects Google Sheets (settings) with Google Calendar (availability)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bookingRoutes = require('./routes/booking');
const inquiryRoutes = require('./routes/inquiry');
const voiceRoutes = require('./routes/voice');
const whatsappRoutes = require('./routes/whatsapp');
const { scheduleDailyReminders, sendDailyReminders } = require('./services/reminder');
const { syncCalendarToSheet, schedulePeriodicSync } = require('./services/calendarSync');
const { setupAppointmentsSheet, setupInquiriesSheet } = require('./services/sheetSetup');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For Twilio webhooks

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        timezone: process.env.TIMEZONE || 'UTC'
    });
});

// Booking routes
app.use('/api/booking', bookingRoutes);

// Inquiry routes
app.use('/api/inquiry', inquiryRoutes);

// Voice/IVR routes (Twilio webhooks)
app.use('/api/voice', voiceRoutes);

// WhatsApp bot routes (Twilio webhooks)
app.use('/api/whatsapp', whatsappRoutes);

// Manual reminder trigger (for testing)
app.post('/api/reminders/send', async (req, res) => {
    try {
        console.log('📤 Manual reminder trigger requested');
        const result = await sendDailyReminders();
        res.json({ 
            success: true, 
            message: 'Reminders sent',
            ...result
        });
    } catch (error) {
        console.error('Reminder error:', error);
        res.status(500).json({ error: error.message });
    }
});

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

// Setup sheet formatting (run once)
app.post('/api/sheet/setup', async (req, res) => {
    try {
        console.log('🔧 Sheet setup requested');
        const result = await setupAppointmentsSheet();
        res.json({ 
            success: true, 
            message: 'Sheet formatting applied',
            ...result
        });
    } catch (error) {
        console.error('Setup error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Setup Inquiries sheet formatting
app.post('/api/sheet/setup-inquiries', async (req, res) => {
    try {
        console.log('🔧 Inquiries sheet setup requested');
        const result = await setupInquiriesSheet();
        res.json({ 
            success: true, 
            message: 'Inquiries sheet formatting applied',
            ...result
        });
    } catch (error) {
        console.error('Setup error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Booking server running on http://localhost:${PORT}`);
    console.log(`📅 Calendar ID: ${process.env.GOOGLE_CALENDAR_ID || 'Not configured'}`);
    console.log(`📊 Sheet ID: ${process.env.GOOGLE_SHEET_ID || 'Not configured'}`);
    
    // Start the daily reminder scheduler
    if (process.env.TWILIO_ACCOUNT_SID) {
        scheduleDailyReminders();
    } else {
        console.log('⚠️ Twilio not configured - reminders disabled');
    }

    // Start calendar sync scheduler (every 30 minutes)
    schedulePeriodicSync(30);
    
    // Run initial sync on startup
    console.log('🔄 Running initial calendar sync...');
    syncCalendarToSheet().catch(err => {
        console.error('Initial sync failed:', err.message);
    });
});

