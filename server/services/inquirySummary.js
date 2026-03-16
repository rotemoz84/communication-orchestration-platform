/**
 * Inquiry Summary Service
 * Sends daily email summaries of inquiries
 * 
 * Triggered via cPanel cron job (more reliable on shared hosting).
 * Cron flow: POST /api/auth/cron-login (X-Cron-Secret) to get a session cookie, then
 * POST /api/inquiries/send-summary with that cookie.
 * 
 * Reliability: Tracks last successful send to ensure no inquiries are missed
 */

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
 * Manually trigger the summary (called by cron endpoint)
 */
async function triggerManualSummary() {
    console.log('🔧 Manual inquiry summary triggered');
    return sendDailySummary();
}

module.exports = {
    sendDailySummary,
    triggerManualSummary,
    getPendingInquiries,
    JOB_NAME
};
