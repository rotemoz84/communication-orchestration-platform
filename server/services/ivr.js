/**
 * IVR Service
 * Handles voice call logic, business hours check, and message routing
 */

const { getBookingSettings } = require('./googleSheets');

// Message placeholders - will be replaced with actual recordings or TTS
const MESSAGES = {
    // IVR_no_answer: Rep didn't answer after 4 rings
    // TODO: Update this message with user-provided content
    IVR_no_answer: `
        מצטערים, אין מענה כרגע.
        לקבלת הודעה בוואטסאפ, הקישו 9.
    `,

    // IVR_whatsapp_sent: WhatsApp sent confirmation
    IVR_whatsapp_sent: `
        תודה! שלחנו לך הודעת וואטסאפ.
        נציג יחזור אליך בהקדם.
        להתראות.
    `
};

/**
 * Check if office is currently open based on Google Sheet Working Hours
 * 
 * Per-day Active column values:
 * - OPEN: Office is open all day (ignore hours)
 * - CLOSED: Office is closed all day (ignore hours)
 * - DEFAULT: Check if current time is within start-end hours
 */
async function isOfficeOpen() {
    try {
        const settings = await getBookingSettings();
        const workingHours = settings.workingHours;

        // Get current day and time in Israel
        const now = new Date();
        const israelTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
        
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDay = days[israelTime.getDay()];
        const currentMinutes = israelTime.getHours() * 60 + israelTime.getMinutes();

        const todayHours = workingHours[currentDay];

        if (!todayHours) {
            console.log(`🏢 Office CLOSED (${currentDay} not configured)`);
            return false;
        }

        // Check day status: OPEN, CLOSED, or DEFAULT
        if (todayHours.status === 'OPEN') {
            console.log(`🏢 Office OPEN (${currentDay} forced OPEN)`);
            return true;
        }
        if (todayHours.status === 'CLOSED') {
            console.log(`🏢 Office CLOSED (${currentDay} forced CLOSED)`);
            return false;
        }

        // DEFAULT - check if within working hours
        const isOpen = currentMinutes >= todayHours.startMinutes && 
                       currentMinutes < todayHours.endMinutes;

        console.log(`🏢 Office ${isOpen ? 'OPEN' : 'CLOSED'} (${currentDay} ${israelTime.toLocaleTimeString()})`);
        return isOpen;
    } catch (error) {
        console.error('Error checking office hours:', error.message);
        // Default to closed if can't check
        return false;
    }
}

/**
 * Get message text (placeholder for now - can be replaced with audio URLs)
 */
function getMessage(key) {
    return MESSAGES[key] || 'שלום';
}

/**
 * Update a message (for admin use)
 */
function setMessage(key, text) {
    if (MESSAGES.hasOwnProperty(key)) {
        MESSAGES[key] = text;
        console.log(`📝 Message ${key} updated`);
        return true;
    }
    return false;
}

/**
 * Get all messages (for admin view)
 */
function getAllMessages() {
    return { ...MESSAGES };
}

module.exports = {
    isOfficeOpen,
    getMessage,
    setMessage,
    getAllMessages,
    MESSAGES
};

