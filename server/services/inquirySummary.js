/**
 * Inquiry Summary Service
 * Scheduled job that sends daily email summaries of inquiries
 * 
 * Schedule: Daily at 08:00 Israel time, except Friday and Saturday
 * On Sunday: includes inquiries from Friday and Saturday as well
 * 
 * Reliability: Tracks last successful send to ensure no inquiries are missed
 */

const schedule = require('node-schedule');
const inquiryRepository = require('../dal/repositories/inquiryRepository');
const jobStateRepository = require('../dal/repositories/jobStateRepository');
const { sendInquirySummaryEmail } = require('../integrations/email');

const JOB_NAME = 'daily_inquiry_summary';
const DEFAULT_LOOKBACK_HOURS = 72; // 3 days lookback if no previous run

/**
 * Get inquiries that haven't been included in a summary email yet
 * Uses the last successful job run timestamp to ensure no misses
 */
async function getPendingInquiries() {
    // Get the timestamp from which to query (last successful send, or default lookback)
    const fromTimestamp = await jobStateRepository.getQueryFromTimestamp(
        JOB_NAME, 
        DEFAULT_LOOKBACK_HOURS
    );
    
    const toTimestamp = new Date();
    
    console.log(`📋 Querying inquiries from ${fromTimestamp.toISOString()} to ${toTimestamp.toISOString()}`);
    
    const inquiries = await inquiryRepository.findByTimestampRange(fromTimestamp, toTimestamp);
    
    return {
        inquiries,
        fromTimestamp,
        toTimestamp
    };
}

/**
 * Send the daily inquiry summary email
 */
async function sendDailySummary() {
    console.log('📧 Starting daily inquiry summary job...');
    
    try {
        const { inquiries, fromTimestamp, toTimestamp } = await getPendingInquiries();
        
        console.log(`📋 Found ${inquiries.length} inquiries to include in summary`);
        
        // Send the summary email (even if empty - to confirm the job ran)
        await sendInquirySummaryEmail(inquiries, fromTimestamp, toTimestamp);
        
        // Update job state on success
        await jobStateRepository.updateJobState(JOB_NAME, {
            success: true,
            error: null,
            metadata: {
                inquiriesCount: inquiries.length,
                fromTimestamp: fromTimestamp.toISOString(),
                toTimestamp: toTimestamp.toISOString()
            }
        });
        
        console.log(`✅ Daily inquiry summary completed: ${inquiries.length} inquiries sent`);
        
        return {
            success: true,
            inquiriesCount: inquiries.length,
            fromTimestamp,
            toTimestamp
        };
    } catch (error) {
        console.error('❌ Daily inquiry summary failed:', error.message);
        
        // Update job state with error (but don't update last_success_at)
        await jobStateRepository.updateJobState(JOB_NAME, {
            success: false,
            error: error.message
        });
        
        throw error;
    }
}

/**
 * Check if today is a day the job should run
 * Runs Sunday-Thursday (0, 1, 2, 3, 4)
 * Does NOT run Friday (5) or Saturday (6)
 */
function shouldRunToday() {
    const now = new Date();
    // Get day of week in Israel timezone
    const israelDay = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' })).getDay();
    
    // Sunday = 0, Monday = 1, ..., Thursday = 4, Friday = 5, Saturday = 6
    return israelDay >= 0 && israelDay <= 4; // Sunday through Thursday
}

/**
 * Schedule the daily inquiry summary job
 * Runs at 08:00 Israel time, Sunday through Thursday
 */
function scheduleDailySummary() {
    const rule = new schedule.RecurrenceRule();
    rule.hour = 8;
    rule.minute = 0;
    rule.tz = 'Asia/Jerusalem';
    
    // Only run Sunday through Thursday (0-4)
    // On Sunday, we'll include Fri-Sat inquiries since we check from last successful run
    rule.dayOfWeek = [0, 1, 2, 3, 4]; // Sunday, Monday, Tuesday, Wednesday, Thursday
    
    const job = schedule.scheduleJob(rule, async () => {
        console.log('⏰ Scheduled inquiry summary triggered');
        try {
            await sendDailySummary();
        } catch (error) {
            // Error is already logged in sendDailySummary
            // Job will retry on next scheduled run
        }
    });
    
    console.log('📅 Daily inquiry summary scheduled for 08:00 Israel time (Sun-Thu)');
    console.log('   ℹ️  Sunday includes Friday and Saturday inquiries');
    
    return job;
}

/**
 * Manually trigger the summary (for testing or catch-up)
 */
async function triggerManualSummary() {
    console.log('🔧 Manual inquiry summary triggered');
    return sendDailySummary();
}

module.exports = {
    scheduleDailySummary,
    sendDailySummary,
    triggerManualSummary,
    getPendingInquiries,
    JOB_NAME
};
