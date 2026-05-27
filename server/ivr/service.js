/**
 * IVR Service
 * Handles voice call logic and business hours check
 */

const { getBookingSettings } = require('../integrations/google/sheets');
const { config } = require('../config');

// In-memory store for dynamic IVR settings (in production, use database)
let ivrSettings = {
    officeOpen: true,
    callForwarding: true,
    recordingEnabled: true,
    customGreeting: null,
    emergencyMode: false,
    queueEnabled: false,
    maxQueueSize: 10,
    currentQueue: []
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
        // Check emergency mode first
        if (ivrSettings.emergencyMode) {
            console.log('🚨 Emergency Mode - Office forced CLOSED');
            return false;
        }

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
            timezone: config.timezone,
            ivrSettings: ivrSettings,
            queueStatus: {
                enabled: ivrSettings.queueEnabled,
                currentSize: ivrSettings.currentQueue.length,
                maxSize: ivrSettings.maxQueueSize
            }
        };
    } catch (error) {
        console.error('Error getting office status:', error.message);
        return {
            isOpen: false,
            error: error.message
        };
    }
}

/**
 * Update IVR settings
 * @param {Object} newSettings - Settings to update
 */
function updateIvrSettings(newSettings) {
    const allowedKeys = [
        'officeOpen', 'callForwarding',
        'recordingEnabled', 'customGreeting', 'emergencyMode',
        'queueEnabled', 'maxQueueSize'
    ];
    
    for (const [key, value] of Object.entries(newSettings)) {
        if (allowedKeys.includes(key)) {
            ivrSettings[key] = value;
            console.log(`🔧 IVR setting updated: ${key} = ${value}`);
        }
    }
    
    return ivrSettings;
}

/**
 * Get current IVR settings
 */
function getIvrSettings() {
    return { ...ivrSettings };
}

/**
 * Add caller to queue
 * @param {string} callerNumber - Phone number of caller
 * @param {string} callId - Unique call identifier
 */
function addToQueue(callerNumber, callId) {
    if (!ivrSettings.queueEnabled) {
        return { success: false, error: 'Queue is disabled' };
    }
    
    if (ivrSettings.currentQueue.length >= ivrSettings.maxQueueSize) {
        return { success: false, error: 'Queue is full' };
    }
    
    const queueEntry = {
        callerNumber,
        callId,
        joinedAt: new Date(),
        position: ivrSettings.currentQueue.length + 1
    };
    
    ivrSettings.currentQueue.push(queueEntry);
    console.log(`📞 Caller ${callerNumber} added to queue at position ${queueEntry.position}`);
    
    return { success: true, position: queueEntry.position };
}

/**
 * Remove caller from queue
 * @param {string} callId - Call identifier
 */
function removeFromQueue(callId) {
    const index = ivrSettings.currentQueue.findIndex(entry => entry.callId === callId);
    if (index !== -1) {
        const removed = ivrSettings.currentQueue.splice(index, 1)[0];
        // Update positions for remaining callers
        ivrSettings.currentQueue.forEach((entry, i) => {
            entry.position = i + 1;
        });
        console.log(`📞 Caller ${removed.callerNumber} removed from queue`);
        return { success: true, removed };
    }
    return { success: false, error: 'Call not found in queue' };
}

/**
 * Get current queue status
 */
function getQueueStatus() {
    return {
        enabled: ivrSettings.queueEnabled,
        maxSize: ivrSettings.maxQueueSize,
        currentSize: ivrSettings.currentQueue.length,
        callers: ivrSettings.currentQueue.map(entry => ({
            callId: entry.callId,
            callerNumber: entry.callerNumber,
            position: entry.position,
            joinedAt: entry.joinedAt,
            waitTime: Date.now() - entry.joinedAt.getTime()
        }))
    };
}

/**
 * Toggle emergency mode
 * @param {boolean} enabled - Whether emergency mode should be enabled
 */
function toggleEmergencyMode(enabled) {
    ivrSettings.emergencyMode = enabled;
    console.log(`🚨 Emergency mode ${enabled ? 'ENABLED' : 'DISABLED'}`);
    
    if (enabled) {
        // Clear queue when emergency mode is enabled
        ivrSettings.currentQueue = [];
        console.log('📞 Queue cleared due to emergency mode');
    }
    
    return ivrSettings.emergencyMode;
}

/**
 * Get next caller from queue
 */
function getNextCaller() {
    if (ivrSettings.currentQueue.length === 0) {
        return null;
    }
    
    return ivrSettings.currentQueue.shift();
}

/**
 * Check if call forwarding should be used
 */
function shouldUseCallForwarding() {
    return ivrSettings.callForwarding && !ivrSettings.emergencyMode;
}

/**
 * Check if call recording should be enabled
 */
function shouldRecordCalls() {
    return ivrSettings.recordingEnabled;
}

/**
 * Get custom greeting message
 */
function getCustomGreeting() {
    return ivrSettings.customGreeting;
}

module.exports = {
    isOfficeOpen,
    getOfficeStatus,
    updateIvrSettings,
    getIvrSettings,
    addToQueue,
    removeFromQueue,
    getQueueStatus,
    toggleEmergencyMode,
    getNextCaller,
    shouldUseCallForwarding,
    shouldRecordCalls,
    getCustomGreeting
};
