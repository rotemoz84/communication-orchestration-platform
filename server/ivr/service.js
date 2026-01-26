/**
 * IVR Service
 * Handles voice call logic and business hours check
 */

const { getBookingSettings } = require('../integrations/google/sheets');
const { config } = require('../config');

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
        const israelTime = new Date(now.toLocaleString('en-US', { timeZone: config.timezone }));
        
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
 * Get current office status details
 */
async function getOfficeStatus() {
    try {
        const settings = await getBookingSettings();
        const isOpen = await isOfficeOpen();
        
        return {
            isOpen,
            workingHours: settings.workingHours,
            timezone: config.timezone
        };
    } catch (error) {
        console.error('Error getting office status:', error.message);
        return {
            isOpen: false,
            error: error.message
        };
    }
}

module.exports = {
    isOfficeOpen,
    getOfficeStatus
};
