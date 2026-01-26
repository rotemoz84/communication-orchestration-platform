/**
 * Google Calendar Service
 * Handles calendar availability and event creation
 */

const { getCalendarClient } = require('./auth');
const { config } = require('../../config');

const CALENDAR_ID = config.google.calendarId;

/**
 * Get busy times from Google Calendar for a date range
 * @param {Date} startDate - Start of the range
 * @param {Date} endDate - End of the range
 * @returns {Array} Array of busy time periods
 */
async function getBusyTimes(startDate, endDate) {
    try {
        const calendar = await getCalendarClient();

        const response = await calendar.freebusy.query({
            requestBody: {
                timeMin: startDate.toISOString(),
                timeMax: endDate.toISOString(),
                items: [{ id: CALENDAR_ID }]
            }
        });

        const busyTimes = response.data.calendars[CALENDAR_ID]?.busy || [];
        
        return busyTimes.map(period => ({
            start: new Date(period.start),
            end: new Date(period.end)
        }));
    } catch (error) {
        console.error('Error fetching busy times:', error.message);
        throw new Error('Could not fetch calendar availability');
    }
}

/**
 * Calculate available time slots for a specific date
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @param {Object} workingHours - Working hours for each day
 * @param {number} duration - Meeting duration in minutes
 * @param {number} buffer - Buffer time between meetings in minutes
 * @param {number} minNoticeHours - Minimum hours notice required
 * @returns {Array} Array of available time slots
 */
async function getAvailableSlots(dateStr, workingHours, duration, buffer = 15, minNoticeHours = 24) {
    const date = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Check if this day has working hours
    const dayHours = workingHours[dayOfWeek];
    if (!dayHours) {
        return []; // Closed on this day
    }

    // Create date range for the full day
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    // Get busy times from calendar
    const busyTimes = await getBusyTimes(dayStart, dayEnd);

    // Generate all possible slots within working hours
    const slots = [];
    const slotDuration = duration + buffer;
    
    let currentMinutes = dayHours.startMinutes;
    const endMinutes = dayHours.endMinutes;

    // Calculate minimum allowed time (now + notice period)
    const now = new Date();
    const minAllowedTime = new Date(now.getTime() + (minNoticeHours * 60 * 60 * 1000));

    while (currentMinutes + duration <= endMinutes) {
        const slotStart = new Date(date);
        slotStart.setHours(Math.floor(currentMinutes / 60), currentMinutes % 60, 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + duration);

        // Check if slot is in the future with enough notice
        if (slotStart > minAllowedTime) {
            // Check if slot conflicts with any busy time
            const hasConflict = busyTimes.some(busy => {
                // Add buffer to busy times
                const busyStart = new Date(busy.start.getTime() - (buffer * 60 * 1000));
                const busyEnd = new Date(busy.end.getTime() + (buffer * 60 * 1000));
                
                return (slotStart < busyEnd && slotEnd > busyStart);
            });

            if (!hasConflict) {
                slots.push({
                    start: slotStart.toISOString(),
                    end: slotEnd.toISOString(),
                    time: formatTime(slotStart),
                    available: true
                });
            }
        }

        // Move to next slot (every 30 minutes or based on duration)
        currentMinutes += Math.min(30, duration);
    }

    return slots;
}

/**
 * Format time for display
 */
function formatTime(date) {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

/**
 * Create a calendar event for a booking
 * @param {Object} bookingData - The booking information
 * @returns {Object} Created event details
 */
async function createBookingEvent(bookingData) {
    try {
        const calendar = await getCalendarClient();
        
        const { name, email, phone, service, date, time, message, meetingType } = bookingData;

        // Parse the start time
        const startDateTime = new Date(`${date}T${time}:00`);
        const endDateTime = new Date(startDateTime);
        endDateTime.setMinutes(endDateTime.getMinutes() + (meetingType?.duration || 30));

        const event = {
            summary: `Meeting with ${name}`,
            description: `
📋 BOOKING DETAILS
━━━━━━━━━━━━━━━━━━
Service: ${service || meetingType?.name || 'Consultation'}
Client: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}
${message ? `\nNotes: ${message}` : ''}

---
Booked via website
            `.trim(),
            start: {
                dateTime: startDateTime.toISOString(),
                timeZone: config.timezone
            },
            end: {
                dateTime: endDateTime.toISOString(),
                timeZone: config.timezone
            },
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'popup', minutes: 30 }
                ]
            }
        };

        const response = await calendar.events.insert({
            calendarId: CALENDAR_ID,
            requestBody: event
        });

        console.log(`📅 Event created: ${response.data.htmlLink}`);

        return {
            eventId: response.data.id,
            htmlLink: response.data.htmlLink,
            start: response.data.start,
            end: response.data.end
        };
    } catch (error) {
        console.error('Error creating calendar event:', error.message);
        throw new Error('Could not create calendar event');
    }
}

/**
 * Get available slots for multiple days
 * @param {number} daysAhead - Number of days to check
 * @param {Object} workingHours - Working hours configuration
 * @param {number} duration - Meeting duration
 * @param {number} buffer - Buffer time
 * @returns {Object} Slots organized by date
 */
async function getAvailableSlotsForRange(daysAhead, workingHours, duration, buffer = 15, minNoticeHours = 24) {
    const result = {};
    const today = new Date();
    
    for (let i = 0; i < daysAhead; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        const slots = await getAvailableSlots(dateStr, workingHours, duration, buffer, minNoticeHours);
        if (slots.length > 0) {
            result[dateStr] = slots;
        }
    }

    return result;
}

module.exports = {
    getBusyTimes,
    getAvailableSlots,
    getAvailableSlotsForRange,
    createBookingEvent
};
