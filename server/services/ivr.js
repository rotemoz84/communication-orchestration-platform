/**
 * IVR Service
 * Handles voice call logic, business hours check, and message routing
 */

const { getBookingSettings } = require('./googleSheets');

// Message placeholders - will be replaced with actual recordings or TTS
const MESSAGES = {
    // IVR_welcome: Office is OPEN - Welcome menu
    IVR_welcome: `
        שלום וברוכים הבאים.
        לשיחה עם נציג, הקישו 1.
        לקבלת הודעה בוואטסאפ, הקישו 2.
    `,
    
    // IVR_no_answer: Rep didn't answer after 5 rings
    IVR_no_answer: `
        מצטערים, אין מענה כרגע.
        להמתנה לנציג, המתינו על הקו.
        לקבלת הודעה בוואטסאפ, הקישו 9.
    `,
    
    // IVR_closed: Office is CLOSED
    IVR_closed: `
        שלום, הגעתם אלינו מחוץ לשעות הפעילות.
        שעות הפעילות שלנו הן ימים א עד ה, בין 9 בבוקר ל-5 אחר הצהריים.
        מיד תקבלו הודעת וואטסאפ ותוכלו להשאיר פרטים.
        תודה ולהתראות.
    `,

    // IVR_whatsapp_sent: WhatsApp sent confirmation
    IVR_whatsapp_sent: `
        תודה! שלחנו לך הודעת וואטסאפ.
        נציג יחזור אליך בהקדם.
        להתראות.
    `
};

/**
 * Check if office is currently open based on Google Sheet settings
 */
async function isOfficeOpen() {
    try {
        const settings = await getBookingSettings();
        const workingHours = settings.workingHours;
        const forceOpen = settings.settings.forceOpen;

        // Check Force Open override
        if (forceOpen === true || forceOpen === 'TRUE' || forceOpen === 'true') {
            console.log('🏢 Office FORCE OPEN (override active)');
            return true;
        }

        // Get current day and time in Israel
        const now = new Date();
        const israelTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
        
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDay = days[israelTime.getDay()];
        const currentMinutes = israelTime.getHours() * 60 + israelTime.getMinutes();

        const todayHours = workingHours[currentDay];

        if (!todayHours) {
            console.log(`🏢 Office CLOSED (${currentDay} is a day off)`);
            return false;
        }

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

