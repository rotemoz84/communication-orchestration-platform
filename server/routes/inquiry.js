/**
 * Inquiry API Routes
 * Endpoints for managing callback requests/inquiries
 */

const express = require('express');
const router = express.Router();
const { saveInquiry, getAllInquiries, updateInquiryStatus } = require('../services/inquiries');
const { getBookingSettings } = require('../services/googleSheets');

/**
 * GET /api/inquiry/services
 * Returns available services for the inquiry form
 */
router.get('/services', async (req, res, next) => {
    try {
        const settings = await getBookingSettings();
        res.json({
            services: settings.meetingTypes.map(mt => ({
                id: mt.id,
                name: mt.name,
                description: mt.description
            }))
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/inquiry/submit
 * Submit a new callback request
 * Body: { name, phone, email, service, preferredTime, message }
 */
router.post('/submit', async (req, res, next) => {
    try {
        const { name, phone, email, service, preferredTime, message } = req.body;

        // Validate required fields
        if (!name || !phone) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['name', 'phone']
            });
        }

        // Validate phone format (basic check)
        const phoneClean = phone.replace(/[\s\-\(\)]/g, '');
        if (phoneClean.length < 9) {
            return res.status(400).json({ error: 'Invalid phone number' });
        }

        // Validate email format if provided
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: 'Invalid email format' });
            }
        }

        // Save the inquiry
        const inquiry = await saveInquiry({
            name,
            phone,
            email,
            service,
            preferredTime,
            message
        });

        res.status(201).json({
            success: true,
            message: 'Inquiry received',
            inquiry: {
                inquiryId: inquiry.inquiryId,
                name,
                created: inquiry.created
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/inquiry/list
 * Get all inquiries (for admin/rep use)
 */
router.get('/list', async (req, res, next) => {
    try {
        const inquiries = await getAllInquiries();
        res.json({
            inquiries,
            count: inquiries.length
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/inquiry/:id/status
 * Update inquiry status
 * Body: { status }
 */
router.patch('/:id/status', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['new', 'contacted', 'scheduled', 'closed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                error: 'Invalid status',
                validStatuses 
            });
        }

        const result = await updateInquiryStatus(id, status);
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

