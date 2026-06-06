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
const { requireAuth } = require('../middleware/requireAuth');
const { INQUIRY_CONSENT_POLICY_VERSION } = require('../constants');
const { notifyCriticalFailure } = require('../services/criticalAlerts');

const INQUIRY_FIELD_LIMITS = {
    name: 100,
    phone: 20,
    email: 100,
    service: 100,
    message: 1000
};

function hasSubmittedValue(value) {
    return value !== null;
}

function normalizeOptionalText(value) {
    if (typeof value !== 'string') {
        return null;
    }

    return value.trim() || null;
}

function normalizePregnancyWeek(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
    }

    return normalizeOptionalText(value);
}

function getSubmittedInquiryData(body = {}) {
    return {
        name: normalizeOptionalText(body.name),
        phone: normalizeOptionalText(body.phone),
        email: normalizeOptionalText(body.email),
        service: normalizeOptionalText(body.service),
        week: normalizePregnancyWeek(body.week),
        message: normalizeOptionalText(body.message),
        privacyConsent: body.privacyConsent === true,
        sensitiveDataConsent: body.sensitiveDataConsent === true
    };
}

/**
 * POST /api/inquiries
 * Create a new inquiry from website contact form
 * Email notification is handled by daily summary job (not per-inquiry)
 */
router.post('/', async (req, res) => {
    try {
        const {
            name,
            phone,
            email,
            service,
            week,
            message,
            privacyConsent,
            sensitiveDataConsent
        } = req.body;
        const normalized = {
            name: normalizeOptionalText(name),
            phone: normalizeOptionalText(phone),
            email: normalizeOptionalText(email),
            service: normalizeOptionalText(service),
            week: normalizePregnancyWeek(week),
            message: normalizeOptionalText(message)
        };
        const hasPhone = hasSubmittedValue(normalized.phone);
        const hasEmail = hasSubmittedValue(normalized.email);
        const hasPregnancyWeek = hasSubmittedValue(normalized.week);

        // Validation: Either phone or email must be provided
        if (!hasPhone && !hasEmail) {
            return res.status(400).json({ 
                error: 'Phone or email is required' 
            });
        }

        for (const [field, maxLength] of Object.entries(INQUIRY_FIELD_LIMITS)) {
            if (normalized[field] && normalized[field].length > maxLength) {
                return res.status(400).json({
                    error: `${field} exceeds the ${maxLength} character limit`
                });
            }
        }

        if (hasEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) {
            return res.status(400).json({
                error: 'Email format is invalid'
            });
        }

        if (
            hasPregnancyWeek
            && (!/^\d+$/.test(normalized.week) || Number(normalized.week) < 1 || Number(normalized.week) > 42)
        ) {
            return res.status(400).json({
                error: 'Pregnancy week must be a whole number between 1 and 42'
            });
        }

        if (privacyConsent !== true) {
            return res.status(400).json({
                error: 'Privacy consent is required'
            });
        }

        if (hasPregnancyWeek && sensitiveDataConsent !== true) {
            return res.status(400).json({
                error: 'Sensitive data consent is required when pregnancy week is provided'
            });
        }

        const inquiry = await inquiryRepository.create({
            ...normalized,
            source: 'website',
            privacyConsent: true,
            sensitiveDataConsent: hasPregnancyWeek ? true : false,
            consentPolicyVersion: INQUIRY_CONSENT_POLICY_VERSION,
            consentRecordedAt: new Date()
        });

        console.log(`✅ New website inquiry: ${inquiry.inquiryId} (will be included in daily summary)`);

        res.status(201).json({ 
            success: true, 
            inquiryId: inquiry.inquiryId 
        });
    } catch (error) {
        console.error('Error creating inquiry:', error.message);
        const body = req.body || {};
        await notifyCriticalFailure({
            key: 'inquiry:create:save_failed',
            title: 'Website inquiry failed to save',
            path: 'POST /api/inquiries',
            error,
            context: {
                source: 'website',
                lostData: getSubmittedInquiryData(body)
            }
        });
        res.status(500).json({ error: 'Failed to save inquiry' });
    }
});

/**
 * GET /api/inquiries
 * Get all inquiries with optional filters (admin only; default limit 10, sort date desc)
 */
router.get('/', requireAuth, async (req, res) => {
    try {
        const { startDate, endDate, status, source, search, limit, offset } = req.query;
        const searchTerm = typeof search === 'string' ? search.trim() : '';
        const filters = { startDate, endDate, status, source, search: searchTerm || undefined };

        const [inquiries, total] = await Promise.all([
            inquiryRepository.find({
                ...filters,
                limit: limit ? parseInt(limit) : 10,
                offset: offset ? parseInt(offset) : 0
            }),
            inquiryRepository.count(filters)
        ]);

        res.json({ items: inquiries, total });
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
router.get('/preview-summary', requireAuth, async (req, res) => {
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
        console.error('Preview error:', error.message);
        res.status(500).json({ error: 'Failed to preview inquiry summary' });
    }
});

/**
 * POST /api/inquiries/send-summary
 * Manually trigger the daily summary email (for testing)
 * MUST be defined before /:id route
 */
router.post('/send-summary', requireAuth, async (req, res) => {
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
        console.error('Summary error:', error.message);
        res.status(500).json({ error: 'Failed to send inquiry summary' });
    }
});

/**
 * GET /api/inquiries/:id
 * Get a specific inquiry by ID
 */
router.get('/:id', requireAuth, async (req, res) => {
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
router.patch('/:id', requireAuth, async (req, res) => {
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
