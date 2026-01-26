/**
 * Google Integrations Index
 */

const auth = require('./auth');
const calendar = require('./calendar');
const sheets = require('./sheets');
const calendarSync = require('./calendarSync');

module.exports = {
    // Auth
    getAuthClient: auth.getAuthClient,
    getSheetsClient: auth.getSheetsClient,
    getCalendarClient: auth.getCalendarClient,
    
    // Calendar
    getBusyTimes: calendar.getBusyTimes,
    getAvailableSlots: calendar.getAvailableSlots,
    getAvailableSlotsForRange: calendar.getAvailableSlotsForRange,
    createBookingEvent: calendar.createBookingEvent,
    
    // Sheets
    getBookingSettings: sheets.getBookingSettings,
    clearCache: sheets.clearCache,
    
    // Calendar Sync
    fetchCalendarEvents: calendarSync.fetchCalendarEvents,
    syncCalendarToSheet: calendarSync.syncCalendarToSheet,
    schedulePeriodicSync: calendarSync.schedulePeriodicSync,
    getSheetAppointments: calendarSync.getSheetAppointments
};
