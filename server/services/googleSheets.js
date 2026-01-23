/**
 * Google Sheets Service
 * Reads booking settings from Google Sheets
 */

const { getSheetsClient } = require('./googleAuth');

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

// Cache settings for 5 minutes to reduce API calls
let settingsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Parse time string (HH:MM) to minutes since midnight
 */
function timeToMinutes(timeStr) {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Read working hours from the "Working Hours" sheet
 * Expected columns: Day | Start | End | Active
 */
async function getWorkingHours(sheets) {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: 'Working Hours!A2:D8', // Skip header row
        });

        const rows = response.data.values || [];
        const workingHours = {};

        const dayMapping = {
            'sunday': 0,
            'monday': 1,
            'tuesday': 2,
            'wednesday': 3,
            'thursday': 4,
            'friday': 5,
            'saturday': 6
        };

        rows.forEach(row => {
            const [day, start, end, active] = row;
            if (day) {
                const dayLower = day.toLowerCase().trim();
                const isActive = active?.toUpperCase() === 'TRUE' || active === '1' || active?.toUpperCase() === 'YES';
                
                workingHours[dayLower] = isActive ? {
                    start: start?.trim() || null,
                    end: end?.trim() || null,
                    startMinutes: timeToMinutes(start?.trim()),
                    endMinutes: timeToMinutes(end?.trim())
                } : null;
            }
        });

        return workingHours;
    } catch (error) {
        console.error('Error reading Working Hours:', error.message);
        throw error;
    }
}

/**
 * Read meeting types from the "Meeting Types" sheet
 * Expected columns: Name | Duration (minutes) | Description | Active
 */
async function getMeetingTypes(sheets) {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: 'Meeting Types!A2:D20', // Skip header row
        });

        const rows = response.data.values || [];
        const meetingTypes = [];

        rows.forEach((row, index) => {
            const [name, duration, description, active] = row;
            if (name) {
                const isActive = active?.toUpperCase() === 'TRUE' || active === '1' || active?.toUpperCase() === 'YES' || active === undefined;
                
                if (isActive) {
                    meetingTypes.push({
                        id: `meeting-${index}`,
                        name: name.trim(),
                        duration: parseInt(duration) || 30,
                        description: description?.trim() || ''
                    });
                }
            }
        });

        return meetingTypes;
    } catch (error) {
        console.error('Error reading Meeting Types:', error.message);
        throw error;
    }
}

/**
 * Read general settings from the "Settings" sheet
 * Expected format: Setting Name | Value (two columns)
 */
async function getGeneralSettings(sheets) {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: 'Settings!A2:B20', // Skip header row
        });

        const rows = response.data.values || [];
        const settings = {
            bufferTime: 15,
            advanceBookingDays: 60,
            minNoticeHours: 24,
            timezone: process.env.TIMEZONE || 'UTC',
            forceOpen: false
        };

        const settingMapping = {
            'buffer time': 'bufferTime',
            'buffer between meetings': 'bufferTime',
            'advance booking days': 'advanceBookingDays',
            'days in advance': 'advanceBookingDays',
            'minimum notice hours': 'minNoticeHours',
            'min notice': 'minNoticeHours',
            'timezone': 'timezone',
            'force open': 'forceOpen',
            'forceopen': 'forceOpen'
        };

        rows.forEach(row => {
            const [name, value] = row;
            if (name && value !== undefined) {
                const nameLower = name.toLowerCase().trim();
                const settingKey = settingMapping[nameLower];
                if (settingKey) {
                    // Handle boolean values
                    if (settingKey === 'forceOpen') {
                        settings[settingKey] = value.toString().toUpperCase() === 'TRUE' || value === '1';
                    } else {
                        settings[settingKey] = isNaN(value) ? value : parseInt(value);
                    }
                }
            }
        });

        return settings;
    } catch (error) {
        console.error('Error reading Settings:', error.message);
        // Return defaults if settings sheet doesn't exist
        return {
            bufferTime: 15,
            advanceBookingDays: 60,
            minNoticeHours: 24,
            timezone: process.env.TIMEZONE || 'UTC',
            forceOpen: false
        };
    }
}

/**
 * Get all booking settings from Google Sheets
 * Results are cached for 5 minutes
 */
async function getBookingSettings() {
    // Check cache
    if (settingsCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
        return settingsCache;
    }

    try {
        const sheets = await getSheetsClient();

        const [workingHours, meetingTypes, settings] = await Promise.all([
            getWorkingHours(sheets),
            getMeetingTypes(sheets),
            getGeneralSettings(sheets)
        ]);

        settingsCache = {
            workingHours,
            meetingTypes,
            settings,
            lastUpdated: new Date().toISOString()
        };
        cacheTimestamp = Date.now();

        console.log('📊 Settings loaded from Google Sheets');
        return settingsCache;
    } catch (error) {
        console.error('Failed to load settings from Google Sheets:', error.message);
        throw new Error('Could not load booking settings');
    }
}

/**
 * Clear the settings cache (useful after manual updates)
 */
function clearCache() {
    settingsCache = null;
    cacheTimestamp = null;
    console.log('🔄 Settings cache cleared');
}

module.exports = {
    getBookingSettings,
    clearCache
};

