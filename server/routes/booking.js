/**
 * Booking API Routes
 * Endpoints for managing booking availability and reservations
 */

const express = require('express');
const router = express.Router();
const { getBookingSettings, clearCache } = require('../services/googleSheets');
const { getAvailableSlots, createBookingEvent } = require('../services/googleCalendar');
const { 
    saveAppointment, 
    getAppointmentById, 
    updateAppointmentStatus 
} = require('../services/appointments');

/**
 * GET /api/booking/settings
 * Returns booking configuration (meeting types, working hours)
 */
router.get('/settings', async (req, res, next) => {
    try {
        const settings = await getBookingSettings();
        res.json({
            meetingTypes: settings.meetingTypes,
            workingHours: settings.workingHours,
            settings: {
                advanceBookingDays: settings.settings.advanceBookingDays,
                timezone: settings.settings.timezone
            },
            lastUpdated: settings.lastUpdated
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/booking/slots
 * Returns available time slots for a specific date and meeting type
 * Query params:
 *   - date: YYYY-MM-DD format
 *   - duration: meeting duration in minutes (optional, defaults to 30)
 */
router.get('/slots', async (req, res, next) => {
    try {
        const { date, duration = 30 } = req.query;

        if (!date) {
            return res.status(400).json({ error: 'Date parameter is required' });
        }

        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ error: 'Date must be in YYYY-MM-DD format' });
        }

        const settings = await getBookingSettings();
        const slots = await getAvailableSlots(
            date,
            settings.workingHours,
            parseInt(duration),
            settings.settings.bufferTime,
            settings.settings.minNoticeHours
        );

        res.json({
            date,
            duration: parseInt(duration),
            slots,
            count: slots.length
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/booking/available-dates
 * Returns dates that have available slots for the next N days
 * Query params:
 *   - duration: meeting duration in minutes
 *   - days: number of days to check (default: 30)
 */
router.get('/available-dates', async (req, res, next) => {
    try {
        const { duration = 30, days = 30 } = req.query;
        const settings = await getBookingSettings();
        
        const availableDates = [];
        const today = new Date();
        
        for (let i = 0; i < parseInt(days); i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            
            const slots = await getAvailableSlots(
                dateStr,
                settings.workingHours,
                parseInt(duration),
                settings.settings.bufferTime,
                settings.settings.minNoticeHours
            );
            
            if (slots.length > 0) {
                availableDates.push({
                    date: dateStr,
                    dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
                    slotsCount: slots.length
                });
            }
        }

        res.json({
            duration: parseInt(duration),
            daysChecked: parseInt(days),
            availableDates,
            count: availableDates.length
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/booking/reserve
 * Create a new booking
 * Body: { name, email, phone, meetingTypeId, date, time, message }
 */
router.post('/reserve', async (req, res, next) => {
    try {
        const { name, email, phone, meetingTypeId, date, time, message } = req.body;

        // Validate required fields
        if (!name || !email || !date || !time) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['name', 'email', 'date', 'time']
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Get settings and meeting type
        const settings = await getBookingSettings();
        const meetingType = settings.meetingTypes.find(mt => mt.id === meetingTypeId) 
            || settings.meetingTypes[0];

        // Verify the slot is still available
        const slots = await getAvailableSlots(
            date,
            settings.workingHours,
            meetingType.duration,
            settings.settings.bufferTime,
            settings.settings.minNoticeHours
        );

        const requestedSlot = slots.find(slot => {
            const slotTime = new Date(slot.start).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }).replace(/^24/, '00');
            return slotTime === time || slot.time === time;
        });

        if (!requestedSlot) {
            return res.status(409).json({ 
                error: 'This time slot is no longer available',
                availableSlots: slots
            });
        }

        // Create the calendar event
        const event = await createBookingEvent({
            name,
            email,
            phone,
            date,
            time,
            message,
            meetingType
        });

        // Save to Appointments sheet for tracking
        const appointment = await saveAppointment({
            name,
            email,
            phone,
            date,
            time: requestedSlot.time,
            meetingType,
            eventId: event.eventId
        });

        res.status(201).json({
            success: true,
            message: 'Booking confirmed',
            booking: {
                bookingId: appointment.bookingId,
                name,
                email,
                date,
                time: requestedSlot.time,
                duration: meetingType.duration,
                meetingType: meetingType.name,
                eventId: event.eventId
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/booking/refresh-settings
 * Clear the settings cache to force reload from Google Sheets
 */
router.post('/refresh-settings', async (req, res) => {
    clearCache();
    res.json({ 
        success: true, 
        message: 'Settings cache cleared. Next request will fetch fresh data.' 
    });
});

/**
 * GET /api/booking/appointment/:id
 * Get appointment details by booking ID
 */
router.get('/appointment/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const appointment = await getAppointmentById(id);
        
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        res.json(appointment);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/booking/appointment/:id/confirm
 * Client confirms they are coming
 */
router.post('/appointment/:id/confirm', async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const appointment = await getAppointmentById(id);
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        await updateAppointmentStatus(id, 'confirmed');

        res.json({ 
            success: true, 
            message: 'Appointment confirmed',
            bookingId: id
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/booking/appointment/:id/cancel
 * Client requests to cancel (sets status to cancel_requested)
 */
router.post('/appointment/:id/cancel', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        
        const appointment = await getAppointmentById(id);
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        await updateAppointmentStatus(id, 'cancel_requested', notes || '');

        // TODO: Send notification to business owner

        res.json({ 
            success: true, 
            message: 'Cancellation request received',
            bookingId: id
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

