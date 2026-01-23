/**
 * Reminder Service
 * Handles scheduling and sending appointment reminders
 */

const { getAppointmentsNeedingReminder, markReminderSent } = require('./appointments');
const { sendSMS, formatPhoneNumber, buildReminderMessage } = require('./sms');
const { getBookingSettings } = require('./googleSheets');

// Base URL for confirmation links (set in .env)
const BASE_URL = process.env.BASE_URL || 'http://localhost:3003';

/**
 * Get tomorrow's date in YYYY-MM-DD format
 */
function getTomorrowDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
}

/**
 * Build confirmation link for an appointment
 */
function buildConfirmLink(bookingId) {
    return `${BASE_URL}/confirm.html?id=${bookingId}`;
}

/**
 * Send reminders for all appointments tomorrow
 * Called daily at 10:00 AM
 */
async function sendDailyReminders() {
    console.log('🔔 Starting daily reminder job...');
    
    try {
        const tomorrowDate = getTomorrowDate();
        console.log(`📅 Sending reminders for: ${tomorrowDate}`);

        // Get settings for message template
        const settings = await getBookingSettings();
        const reminderSettings = {
            businessName: settings.settings.businessName || 'העסק',
            reminderMessage: settings.settings.reminderMessage
        };

        // Get appointments needing reminders
        const appointments = await getAppointmentsNeedingReminder(tomorrowDate);
        
        if (appointments.length === 0) {
            console.log('📭 No appointments need reminders for tomorrow');
            return { sent: 0, failed: 0 };
        }

        console.log(`📋 Found ${appointments.length} appointments to remind`);

        let sent = 0;
        let failed = 0;

        for (const appointment of appointments) {
            try {
                const phone = formatPhoneNumber(appointment.phone);
                
                if (!phone) {
                    console.log(`⚠️ No valid phone for ${appointment.clientName}`);
                    failed++;
                    continue;
                }

                const confirmLink = buildConfirmLink(appointment.bookingId);
                const message = buildReminderMessage(appointment, confirmLink, reminderSettings);

                await sendSMS(phone, message);
                await markReminderSent(appointment.bookingId);
                
                sent++;
                console.log(`✅ Reminder sent to ${appointment.clientName}`);
                
                // Small delay between messages to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                console.error(`❌ Failed to send reminder to ${appointment.clientName}:`, error.message);
                failed++;
            }
        }

        console.log(`🔔 Daily reminders complete: ${sent} sent, ${failed} failed`);
        return { sent, failed };
        
    } catch (error) {
        console.error('❌ Daily reminder job failed:', error.message);
        throw error;
    }
}

/**
 * Schedule daily reminders at 10:00 AM Israel time
 */
function scheduleDailyReminders() {
    const schedule = require('node-schedule');
    
    // Schedule for 10:00 AM Israel time
    // Israel is UTC+2 (or UTC+3 during DST)
    // Using timezone-aware scheduling
    const rule = new schedule.RecurrenceRule();
    rule.hour = 10;
    rule.minute = 0;
    rule.tz = 'Asia/Jerusalem';

    const job = schedule.scheduleJob(rule, async () => {
        console.log('⏰ Scheduled reminder job triggered');
        try {
            await sendDailyReminders();
        } catch (error) {
            console.error('Scheduled job error:', error.message);
        }
    });

    console.log('📅 Daily reminders scheduled for 10:00 AM Israel time');
    return job;
}

module.exports = {
    sendDailyReminders,
    scheduleDailyReminders,
    getTomorrowDate,
    buildConfirmLink
};

