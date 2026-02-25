/**
 * Call Records API Routes
 * Endpoints for querying and managing call history
 */

const express = require('express');
const router = express.Router();
const { createOutgoing, updateByTwilioSid, findById, getStats, getRecentCalls } = require('../dal/repositories/callRepository');
const { config, isTelnyxConfigured } = require('../config');
const callRepository = require('../dal/repositories/callRepository');

// Import Telnyx only if configured
let createCall;
try {
    createCall = require('../integrations/telnyx/voice').createCall;
} catch (error) {
    console.log('⚠️ Telnyx not available, using mock mode');
    createCall = null;
}

/**
 * POST /api/calls/outgoing
 * Initiate an outgoing call
 * Body: { to: string, notes?: string }
 */
router.post('/outgoing', async (req, res) => {
    try {
        const { to, notes } = req.body;
        
        if (!to) {
            return res.status(400).json({ error: 'Phone number is required' });
        }
        
        if (!isTelnyxConfigured()) {
            return res.status(500).json({ error: 'Telnyx not configured' });
        }
        
        // Create call record first
        const callRecord = await callRepository.createOutgoing({
            calleeNumber: to,
            notes
        });
        
        if (!callRecord) {
            return res.status(500).json({ error: 'Failed to create call record' });
        }
        
        // Initiate Telnyx call
        const telnyxCall = await createCall(to, config.telnyx.phoneNumber, {
            record: true,
            connectionId: config.telnyx.connectionId
        });
        
        if (!telnyxCall.success) {
            return res.status(500).json({ error: telnyxCall.error });
        }
        
        // Update call record with Telnyx call ID
        await callRepository.updateByTwilioSid(telnyxCall.callId, {
            outcome: 'outgoing_initiated'
        });
        
        console.log(`📞 Outgoing call initiated: ${callRecord.callId} to ${to}`);
        
        res.json({
            success: true,
            callId: callRecord.callId,
            telnyxCallId: telnyxCall.callId,
            status: 'initiated'
        });
        
    } catch (error) {
        console.error('Error initiating outgoing call:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/calls
 * Get call records with optional filters
 * Query params: startDate, endDate, outcome, officeStatus, direction, limit, offset
 */
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate, outcome, officeStatus, direction, limit, offset } = req.query;
        
        const records = await callRepository.find({
            startDate,
            endDate,
            outcome,
            officeStatus,
            limit: limit ? parseInt(limit) : 100,
            offset: offset ? parseInt(offset) : 0
        });
        
        res.json({
            success: true,
            count: records.length,
            records
        });
    } catch (error) {
        console.error('Error fetching calls:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/calls/recent
 * Get recent calls with enhanced filtering
 * Query params: limit, direction, outcome, startDate, endDate
 */
router.get('/recent', async (req, res) => {
    try {
        const { limit = 50, direction, outcome, startDate, endDate } = req.query;
        
        const calls = await callRepository.getRecentCalls(parseInt(limit), {
            direction,
            outcome,
            startDate,
            endDate
        });
        
        res.json({
            success: true,
            count: calls.length,
            calls
        });
    } catch (error) {
        console.error('Error fetching recent calls:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/calls/stats
 * Get call statistics for a date range
 * Query params: startDate, endDate (required)
 */
router.get('/stats', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ 
                error: 'startDate and endDate are required' 
            });
        }
        
        const stats = await callRepository.getStats(startDate, endDate);
        
        res.json({
            success: true,
            period: { startDate, endDate },
            stats
        });
    } catch (error) {
        console.error('Error fetching call stats:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/calls/:id
 * Get a specific call record by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const call = await callRepository.findById(id);
        
        if (!call) {
            return res.status(404).json({ error: 'Call not found' });
        }
        
        res.json({
            success: true,
            call
        });
    } catch (error) {
        console.error('Error fetching call:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /api/calls/:id
 * Update call notes or other fields
 * Body: { notes?: string, outcome?: string }
 */
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { notes, outcome } = req.body;
        
        const updateData = {};
        if (notes !== undefined) updateData.notes = notes;
        if (outcome !== undefined) updateData.outcome = outcome;
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }
        
        // Find the call first to get the caller number
        const call = await callRepository.findById(id);
        if (!call) {
            return res.status(404).json({ error: 'Call not found' });
        }
        
        const updatedCall = await callRepository.updateByCallerNumber(
            call.callerNumber, 
            updateData
        );
        
        res.json({
            success: true,
            call: updatedCall
        });
    } catch (error) {
        console.error('Error updating call:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
