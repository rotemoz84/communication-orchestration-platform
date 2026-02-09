/**
 * Inquiries Routes
 * API endpoints for website contact form submissions
 * 
 * Note: Email notifications are NOT sent on inquiry creation.
 * Instead, a daily summary email is sent via the scheduled job.
 */

const express = require('express');
const router = express.Router();
const inquiryRepository = require('../dal/repositories/inquiryRepository');

/**
 * POST /api/inquiries
 * Create a new inquiry from website contact form
 * Email notification is handled by daily summary job (not per-inquiry)
 */
router.post('/', async (req, res) => {
    try {
        const { name, phone, email, service, week, message } = req.body;

        // Validation: Either phone or email must be provided
        if (!phone && !email) {
            return res.status(400).json({ 
                error: 'Phone or email is required' 
            });
        }

        const inquiry = await inquiryRepository.create({
            name,
            phone,
            email,
            service,
            week,
            message,
            source: 'website'
        });

        console.log(`✅ New website inquiry: ${inquiry.inquiryId} (will be included in daily summary)`);

        res.status(201).json({ 
            success: true, 
            inquiryId: inquiry.inquiryId 
        });
    } catch (error) {
        console.error('Error creating inquiry:', error.message);
        res.status(500).json({ error: 'Failed to save inquiry' });
    }
});

/**
 * GET /api/inquiries
 * Get all inquiries with optional filters
 */
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate, status, source, limit, offset } = req.query;
        
        const inquiries = await inquiryRepository.find({
            startDate,
            endDate,
            status,
            source,
            limit: limit ? parseInt(limit) : 100,
            offset: offset ? parseInt(offset) : 0
        });

        res.json(inquiries);
    } catch (error) {
        console.error('Error fetching inquiries:', error.message);
        res.status(500).json({ error: 'Failed to fetch inquiries' });
    }
});

/**
 * GET /api/inquiries/preview-summary
 * Preview the daily summary data without sending email (for testing)
 * MUST be defined before /:id route
 */
router.get('/preview-summary', async (req, res) => {
    try {
        const { inquirySummary } = require('../services');
        console.log('👁️ Preview inquiry summary requested');
        const { inquiries, fromTimestamp, toTimestamp } = await inquirySummary.getPendingInquiries();
        
        res.json({ 
            success: true,
            timeRange: {
                from: fromTimestamp.toISOString(),
                to: toTimestamp.toISOString()
            },
            inquiriesCount: inquiries.length,
            inquiries: inquiries
        });
    } catch (error) {
        console.error('Preview error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/inquiries/send-summary
 * Manually trigger the daily summary email (for testing)
 * MUST be defined before /:id route
 */
router.post('/send-summary', async (req, res) => {
    try {
        const { inquirySummary } = require('../services');
        console.log('📧 Manual inquiry summary requested');
        const result = await inquirySummary.triggerManualSummary();
        res.json({ 
            success: true, 
            message: 'Inquiry summary email sent',
            ...result
        });
    } catch (error) {
        console.error('Summary error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/inquiries/:id
 * Get a specific inquiry by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const inquiry = await inquiryRepository.findById(req.params.id);
        
        if (!inquiry) {
            return res.status(404).json({ error: 'Inquiry not found' });
        }

        res.json(inquiry);
    } catch (error) {
        console.error('Error fetching inquiry:', error.message);
        res.status(500).json({ error: 'Failed to fetch inquiry' });
    }
});

/**
 * PATCH /api/inquiries/:id
 * Update inquiry status/notes
 */
router.patch('/:id', async (req, res) => {
    try {
        const { status, notes } = req.body;
        
        const inquiry = await inquiryRepository.updateById(req.params.id, {
            status,
            notes
        });

        if (!inquiry) {
            return res.status(404).json({ error: 'Inquiry not found' });
        }

        res.json(inquiry);
    } catch (error) {
        console.error('Error updating inquiry:', error.message);
        res.status(500).json({ error: 'Failed to update inquiry' });
    }
});

module.exports = router;
