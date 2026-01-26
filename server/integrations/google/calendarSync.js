/**
 * Calendar Sync Service
 * Syncs Google Calendar events to the Appointments sheet
 * Calendar is the source of truth
 */

const { getCalendarClient, getSheetsClient } = require('./auth');
const { config } = require('../../config');

const CALENDAR_ID = config.google.calendarId;
const SHEET_ID = config.google.sheetId;
const APPOINTMENTS_SHEET = 'Appointments';

/**
 * Get today's date at midnight in local timezone
 */
function getTodayStart() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

/**
 * Get end of tomorrow in local timezone
 */
function getTomorrowEnd() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
}

/**
 * Fetch events from Google Calendar for today and tomorrow only
 */
async function fetchCalendarEvents() {
    const calendar = await getCalendarClient();
    
    const todayStart = getTodayStart();
    const tomorrowEnd = getTomorrowEnd();

    try {
        const response = await calendar.events.list({
            calendarId: CALENDAR_ID,
            timeMin: todayStart.toISOString(),
            timeMax: tomorrowEnd.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 100
        });

        const events = response.data.items || [];
        console.log(`📅 Fetched ${events.length} events from calendar (today + tomorrow)`);
        
        return events.map(event => ({
            eventId: event.id,
            summary: event.summary || '',
            description: event.description || '',
            start: event.start?.dateTime || event.start?.date,
            end: event.end?.dateTime || event.end?.date,
            status: event.status
        }));
    } catch (error) {
        console.error('Error fetching calendar events:', error.message);
        throw error;
    }
}

/**
 * Parse booking details from event description
 */
function parseEventDescription(description) {
    const details = {
        clientName: '',
        email: '',
        phone: '',
        service: ''
    };

    if (!description) return details;

    const clientMatch = description.match(/Client:\s*(.+)/i);
    if (clientMatch) details.clientName = clientMatch[1].trim();

    const emailMatch = description.match(/Email:\s*([^\s\n]+)/i);
    if (emailMatch) details.email = emailMatch[1].trim();

    const phoneMatch = description.match(/Phone:\s*([^\n]+)/i);
    if (phoneMatch) details.phone = phoneMatch[1].trim();

    const serviceMatch = description.match(/Service:\s*(.+)/i);
    if (serviceMatch) details.service = serviceMatch[1].trim();

    return details;
}

/**
 * Get all appointments from the sheet
 */
async function getSheetAppointments() {
    const sheets = await getSheetsClient();
    
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${APPOINTMENTS_SHEET}!A2:K`
        });

        const rows = response.data.values || [];
        
        return rows.map((row, index) => ({
            rowIndex: index + 2,
            bookingId: row[0] || '',
            date: row[1] || '',
            time: row[2] || '',
            clientName: row[3] || '',
            phone: row[4] || '',
            email: row[5] || '',
            service: row[6] || '',
            status: row[7] || '',
            reminderSent: row[8] || '',
            responseTime: row[9] || '',
            notes: row[10] || ''
        }));
    } catch (error) {
        console.error('Error fetching sheet appointments:', error.message);
        return [];
    }
}

/**
 * Generate a booking ID from event ID
 */
function generateBookingIdFromEvent(eventId) {
    return eventId.substring(0, 16);
}

/**
 * Clear all appointments from the sheet (keeps header row)
 */
async function clearAppointmentsSheet() {
    const sheets = await getSheetsClient();
    
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${APPOINTMENTS_SHEET}!A:K`
        });
        
        const rowCount = response.data.values?.length || 1;
        
        if (rowCount > 1) {
            await sheets.spreadsheets.values.clear({
                spreadsheetId: SHEET_ID,
                range: `${APPOINTMENTS_SHEET}!A2:K${rowCount}`
            });
        }
    } catch (error) {
        console.error('Error clearing sheet:', error.message);
        throw error;
    }
}

/**
 * Write multiple appointments to sheet at once
 */
async function writeAppointmentsToSheet(appointments) {
    if (appointments.length === 0) return;
    
    const sheets = await getSheetsClient();
    
    const rows = appointments.map(apt => [
        apt.bookingId,
        apt.date,
        apt.time,
        apt.clientName,
        apt.phone,
        apt.email,
        apt.service,
        apt.status || 'new',
        apt.reminderSent || '',
        apt.responseTime || '',
        apt.notes || ''
    ]);

    await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${APPOINTMENTS_SHEET}!A:K`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: rows }
    });
}

/**
 * Sync calendar events with Appointments sheet
 * Calendar is the source of truth
 */
async function syncCalendarToSheet() {
    console.log('🔄 Starting calendar sync (today + tomorrow only)...');
    
    try {
        const calendarEvents = await fetchCalendarEvents();
        
        const existingAppointments = await getSheetAppointments();
        const existingMap = new Map();
        existingAppointments.forEach(apt => {
            const key = `${apt.date}_${apt.time}`;
            existingMap.set(key, apt);
        });

        const appointments = [];
        
        for (const event of calendarEvents) {
            if (!event.start || !event.start.includes('T')) continue;
            if (event.status === 'cancelled') continue;

            const startDate = new Date(event.start);
            const date = startDate.toISOString().split('T')[0];
            const time = startDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: config.timezone
            });

            const details = parseEventDescription(event.description);
            
            if (!details.clientName && event.summary) {
                const nameMatch = event.summary.match(/Meeting with (.+)/i);
                if (nameMatch) {
                    details.clientName = nameMatch[1].trim();
                }
            }

            const bookingId = generateBookingIdFromEvent(event.eventId);
            const key = `${date}_${time}`;
            const existing = existingMap.get(key);

            appointments.push({
                bookingId: existing?.bookingId || bookingId,
                date,
                time,
                sortKey: startDate.getTime(),
                clientName: details.clientName || event.summary || 'Unknown',
                phone: details.phone || existing?.phone || '',
                email: details.email || existing?.email || '',
                service: details.service || existing?.service || 'Meeting',
                status: existing?.status || 'new',
                reminderSent: existing?.reminderSent || '',
                responseTime: existing?.responseTime || '',
                notes: existing?.notes || ''
            });
        }

        appointments.sort((a, b) => a.sortKey - b.sortKey);

        await clearAppointmentsSheet();
        await writeAppointmentsToSheet(appointments);

        console.log(`✅ Sync complete: ${appointments.length} appointments (today + tomorrow, sorted)`);
        
        return { 
            total: appointments.length,
            message: 'Sheet updated with today and tomorrow appointments, sorted by time'
        };
        
    } catch (error) {
        console.error('❌ Sync failed:', error.message);
        throw error;
    }
}

/**
 * Schedule periodic sync
 */
function schedulePeriodicSync(intervalMinutes = 60) {
    const schedule = require('node-schedule');
    
    const rule = new schedule.RecurrenceRule();
    rule.minute = new schedule.Range(0, 59, intervalMinutes);
    rule.tz = 'Asia/Jerusalem';

    const job = schedule.scheduleJob(rule, async () => {
        console.log('⏰ Scheduled sync triggered');
        try {
            await syncCalendarToSheet();
        } catch (error) {
            console.error('Scheduled sync error:', error.message);
        }
    });

    console.log(`📅 Calendar sync scheduled every ${intervalMinutes} minutes`);
    return job;
}

module.exports = {
    fetchCalendarEvents,
    syncCalendarToSheet,
    schedulePeriodicSync,
    getSheetAppointments
};
