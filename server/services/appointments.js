/**
 * Appointments Service
 * Manages appointments in Google Sheets - save, update, query
 */

const { getSheetsClient } = require('./googleAuth');
const crypto = require('crypto');

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const APPOINTMENTS_SHEET = 'Appointments';

/**
 * Generate a unique booking ID
 */
function generateBookingId() {
    return crypto.randomBytes(8).toString('hex');
}

/**
 * Save a new appointment to the Appointments sheet
 */
async function saveAppointment(bookingData) {
    try {
        const sheets = await getSheetsClient();
        const bookingId = generateBookingId();
        
        const { name, email, phone, date, time, meetingType } = bookingData;
        
        const row = [
            bookingId,                          // Booking ID
            date,                               // Date
            time,                               // Time
            name,                               // Client Name
            phone || '',                        // Phone
            email,                              // Email
            meetingType?.name || 'Consultation', // Service
            'new',                              // Status
            '',                                 // Reminder Sent
            '',                                 // Response Time
            ''                                  // Notes
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: `${APPOINTMENTS_SHEET}!A:K`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [row]
            }
        });

        console.log(`📝 Appointment saved: ${bookingId}`);
        return { bookingId, ...bookingData };
    } catch (error) {
        console.error('Error saving appointment:', error.message);
        throw new Error('Could not save appointment');
    }
}

/**
 * Get all appointments from the sheet
 */
async function getAllAppointments() {
    try {
        const sheets = await getSheetsClient();
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${APPOINTMENTS_SHEET}!A2:K`,
        });

        const rows = response.data.values || [];
        
        return rows.map(row => ({
            bookingId: row[0],
            date: row[1],
            time: row[2],
            clientName: row[3],
            phone: row[4],
            email: row[5],
            service: row[6],
            status: row[7] || 'new',
            reminderSent: row[8],
            responseTime: row[9],
            notes: row[10]
        }));
    } catch (error) {
        console.error('Error fetching appointments:', error.message);
        throw new Error('Could not fetch appointments');
    }
}

/**
 * Get appointments for a specific date
 */
async function getAppointmentsByDate(dateStr) {
    const appointments = await getAllAppointments();
    return appointments.filter(apt => apt.date === dateStr);
}

/**
 * Get appointment by booking ID
 */
async function getAppointmentById(bookingId) {
    const appointments = await getAllAppointments();
    return appointments.find(apt => apt.bookingId === bookingId);
}

/**
 * Get appointments that need reminders (for tomorrow, not yet sent)
 */
async function getAppointmentsNeedingReminder(targetDate) {
    const appointments = await getAllAppointments();
    
    return appointments.filter(apt => {
        return apt.date === targetDate && 
               !apt.reminderSent && 
               apt.status !== 'cancelled' &&
               apt.phone; // Must have phone number
    });
}

/**
 * Update appointment status
 */
async function updateAppointmentStatus(bookingId, status, notes = '') {
    try {
        const sheets = await getSheetsClient();
        
        // First, find the row number for this booking
        const appointments = await getAllAppointments();
        const rowIndex = appointments.findIndex(apt => apt.bookingId === bookingId);
        
        if (rowIndex === -1) {
            throw new Error('Appointment not found');
        }

        // Row number in sheet (add 2 for header row and 0-indexing)
        const sheetRow = rowIndex + 2;
        
        // Update status (column H) and response time (column J)
        const responseTime = new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' });
        
        await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `${APPOINTMENTS_SHEET}!H${sheetRow}:K${sheetRow}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[status, '', responseTime, notes]]
            }
        });

        console.log(`📝 Appointment ${bookingId} status updated to: ${status}`);
        return { bookingId, status };
    } catch (error) {
        console.error('Error updating appointment:', error.message);
        throw new Error('Could not update appointment');
    }
}

/**
 * Mark reminder as sent for an appointment
 */
async function markReminderSent(bookingId) {
    try {
        const sheets = await getSheetsClient();
        
        const appointments = await getAllAppointments();
        const rowIndex = appointments.findIndex(apt => apt.bookingId === bookingId);
        
        if (rowIndex === -1) {
            throw new Error('Appointment not found');
        }

        const sheetRow = rowIndex + 2;
        const sentTime = new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' });
        
        // Update reminder sent (column I) and status
        await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `${APPOINTMENTS_SHEET}!H${sheetRow}:I${sheetRow}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [['reminder_sent', sentTime]]
            }
        });

        console.log(`📤 Reminder marked as sent for: ${bookingId}`);
        return { bookingId, reminderSent: sentTime };
    } catch (error) {
        console.error('Error marking reminder sent:', error.message);
        throw error;
    }
}

module.exports = {
    generateBookingId,
    saveAppointment,
    getAllAppointments,
    getAppointmentsByDate,
    getAppointmentById,
    getAppointmentsNeedingReminder,
    updateAppointmentStatus,
    markReminderSent
};

