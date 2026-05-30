/**
 * Application Constants
 * Centralized location for all constants used across the app
 */

// Call outcome statuses
const CALL_OUTCOMES = {
    INCOMING: 'incoming',
    ANSWERED: 'answered',
    REPRESENTATIVE_UNAVAILABLE: 'representative_unavailable',
    REPRESENTATIVE_UNAVAILABLE_FOLLOWUP_REQUESTED: 'representative_unavailable_followup_requested',
    CLOSED_HOURS_FOLLOWUP_REQUESTED: 'closed_hours_followup_requested',
    ERROR: 'error'
};

// Office status
const OFFICE_STATUS = {
    OPEN: 'open',
    CLOSED: 'closed',
    UNKNOWN: 'unknown'
};

// Appointment statuses
const APPOINTMENT_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled',
    CANCEL_REQUESTED: 'cancel_requested',
    COMPLETED: 'completed',
    NO_SHOW: 'no_show'
};

// Inquiry sources
const INQUIRY_SOURCE = {
    WEBSITE: 'website',
    WHATSAPP_BOT: 'whatsapp_bot',
    PHONE: 'phone',
    MANUAL: 'manual'
};

// Published privacy-policy revision accepted by the website inquiry form.
const INQUIRY_CONSENT_POLICY_VERSION = '2026-02';

// Preferred callback times
const PREFERRED_TIME = {
    MORNING: 'morning',      // 08:00-12:00
    NOON: 'noon',            // 12:00-16:00
    EVENING: 'evening',      // 16:00-20:00
    ANYTIME: 'anytime'
};

// WhatsApp bot states
const BOT_STATES = {
    INITIAL: 'initial',
    MENU: 'menu',
    AWAITING_MESSAGE: 'awaiting_message',
    AWAITING_PREFERRED_TIME: 'awaiting_preferred_time',
    COMPLETED: 'completed'
};

// Cache durations (in milliseconds)
const CACHE_DURATION = {
    SETTINGS: 5 * 60 * 1000,        // 5 minutes
    WORKING_HOURS: 5 * 60 * 1000,   // 5 minutes
    CONVERSATION: 60 * 60 * 1000    // 1 hour
};

// API rate limits
const RATE_LIMITS = {
    SMS_DELAY_MS: 500,              // Delay between SMS sends
    CALENDAR_REQUESTS_PER_MIN: 60
};

// Default values
const DEFAULTS = {
    MEETING_DURATION: 30,           // minutes
    BUFFER_TIME: 15,                // minutes between meetings
    MIN_NOTICE_HOURS: 24,           // minimum hours notice for booking
    ADVANCE_BOOKING_DAYS: 30,       // days ahead to show availability
    DIAL_TIMEOUT: 20                // seconds to wait for answer
};

// Hebrew day names
const HEBREW_DAYS = {
    sunday: 'ראשון',
    monday: 'שני',
    tuesday: 'שלישי',
    wednesday: 'רביעי',
    thursday: 'חמישי',
    friday: 'שישי',
    saturday: 'שבת'
};

// Day order (for iteration)
const DAY_ORDER = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

module.exports = {
    CALL_OUTCOMES,
    OFFICE_STATUS,
    APPOINTMENT_STATUS,
    INQUIRY_SOURCE,
    INQUIRY_CONSENT_POLICY_VERSION,
    PREFERRED_TIME,
    BOT_STATES,
    CACHE_DURATION,
    RATE_LIMITS,
    DEFAULTS,
    HEBREW_DAYS,
    DAY_ORDER
};
