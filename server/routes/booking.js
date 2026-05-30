/**
 * Booking API Routes
 * Endpoints for managing booking availability
 */

const express = require('express');
const router = express.Router();
const adminRouter = express.Router();
const { getBookingSettings, clearCache } = require('../integrations/google/sheets');
const { getAvailableSlots, createBookingEvent } = require('../integrations/google/calendar');
const { requireAuth } = require('../middleware/requireAuth');

adminRouter.use(requireAuth);

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
 */
router.get('/slots', async (req, res, next) => {
    try {
        const { date, duration = 30 } = req.query;

        if (!date) {
            return res.status(400).json({ error: 'Date parameter is required' });
        }

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
 * Create a new booking (creates calendar event only)
 */
router.post('/reserve', async (req, res, next) => {
    try {
        const { name, email, phone, meetingTypeId, date, time, message } = req.body;

        if (!name || !email || !date || !time) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['name', 'email', 'date', 'time']
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        const settings = await getBookingSettings();
        const meetingType = settings.meetingTypes.find(mt => mt.id === meetingTypeId) 
            || settings.meetingTypes[0];

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

        res.status(201).json({
            success: true,
            message: 'Booking confirmed',
            booking: {
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
 * Clear the settings cache
 */
adminRouter.post('/refresh-settings', async (req, res) => {
    clearCache();
    res.json({ 
        success: true, 
        message: 'Settings cache cleared. Next request will fetch fresh data.' 
    });
});

module.exports = router;
module.exports.adminRouter = adminRouter;
