/**
 * Call Records API Routes
 * Endpoints for querying and managing call history
 */

const express = require('express');
const router = express.Router();
const { callRepository } = require('../dal');

/**
 * GET /api/calls
 * Get call records with optional filters
 * Query params: startDate, endDate, outcome, officeStatus, limit, offset
 */
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate, outcome, officeStatus, limit, offset } = req.query;
        
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

module.exports = router;
