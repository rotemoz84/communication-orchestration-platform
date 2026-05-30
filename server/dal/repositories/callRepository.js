/**
 * Call Repository
 * Data access layer for call records
 */

const { query } = require('../database');
const crypto = require('crypto');

/**
 * Generate a unique call tracking ID
 */
function generateCallId() {
    return 'CALL-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Create a new call record
 * @param {Object} callData - Call information
 * @returns {Object} - Created call record with callId
 */
async function create(callData) {
    try {
        const callId = generateCallId();
        
        const { 
            callerNumber, 
            officeStatus = 'unknown', 
            outcome = 'incoming', 
            providerCallId = null,
            notes = null,
            direction = 'inbound',
            calleeNumber = null
        } = callData;

        const sql = `
            INSERT INTO calls (call_id, caller_number, office_status, outcome, provider_call_id, notes, direction, callee_number)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;

        const result = await query(sql, [callId, callerNumber, officeStatus, outcome, providerCallId, notes, direction, calleeNumber]);

        console.log(`📊 Call tracked: ${callId} (${direction}) - ${outcome}`);
        return mapRowToCall(result[0]);
    } catch (error) {
        console.error('Error saving call record:', error.message);
        return null;
    }
}

/**
 * Update the most recent call record for a phone number
 * @param {string} callerNumber - Phone number
 * @param {Object} updateData - Data to update
 */
async function updateByCallerNumber(callerNumber, updateData) {
    try {
        const { outcome, duration, notes } = updateData;
        
        const updates = [];
        const params = [];
        let paramIndex = 1;
        
        if (outcome) {
            updates.push(`outcome = $${paramIndex}`);
            params.push(outcome);
            paramIndex++;
        }
        if (duration !== undefined) {
            updates.push(`duration = $${paramIndex}`);
            params.push(parseInt(duration) || null);
            paramIndex++;
        }
        if (notes) {
            updates.push(`notes = $${paramIndex}`);
            params.push(notes);
            paramIndex++;
        }
        
        if (updates.length === 0) {
            console.log('No updates provided');
            return null;
        }

        const sql = `
            UPDATE calls 
            SET ${updates.join(', ')}
            WHERE id = (
                SELECT id FROM calls 
                WHERE caller_number = $${paramIndex}
                ORDER BY timestamp DESC
                LIMIT 1
            )
            RETURNING *
        `;
        
        params.push(callerNumber);
        
        const result = await query(sql, params);

        if (result.length > 0) {
            console.log('📊 Call record updated');
            return mapRowToCall(result[0]);
        }
        
        console.log('No matching call record found');
        return null;
    } catch (error) {
        console.error('Error updating call record:', error.message);
        return null;
    }
}

/**
 * Update a call record by provider call ID.
 * @param {string} providerCallId - Provider-issued call identifier
 * @param {Object} updateData - Data to update
 */
async function updateByProviderCallId(providerCallId, updateData) {
    try {
        const { outcome, duration, notes } = updateData;
        
        const updates = [];
        const params = [];
        let paramIndex = 1;
        
        if (outcome) {
            updates.push(`outcome = $${paramIndex}`);
            params.push(outcome);
            paramIndex++;
        }
        if (duration !== undefined) {
            updates.push(`duration = $${paramIndex}`);
            params.push(parseInt(duration) || null);
            paramIndex++;
        }
        if (notes) {
            updates.push(`notes = $${paramIndex}`);
            params.push(notes);
            paramIndex++;
        }
        
        if (updates.length === 0) {
            return null;
        }

        const sql = `
            UPDATE calls 
            SET ${updates.join(', ')}
            WHERE provider_call_id = $${paramIndex}
            RETURNING *
        `;
        
        params.push(providerCallId);
        
        const result = await query(sql, params);

        if (result.length > 0) {
            console.log('📊 Call record updated for provider call');
            return mapRowToCall(result[0]);
        }
        return null;
    } catch (error) {
        console.error('Error updating call record by provider ID:', error.message);
        return null;
    }
}

/**
 * Find call records with filters
 * @param {Object} filters - Query filters
 */
async function find(filters = {}) {
    try {
        const { 
            startDate, 
            endDate, 
            outcome, 
            officeStatus,
            limit = 100,
            offset = 0 
        } = filters;
        
        const conditions = [];
        const params = [];
        let paramIndex = 1;
        
        if (startDate) {
            conditions.push(`timestamp >= $${paramIndex}`);
            params.push(startDate + ' 00:00:00');
            paramIndex++;
        }
        if (endDate) {
            conditions.push(`timestamp <= $${paramIndex}`);
            params.push(endDate + ' 23:59:59');
            paramIndex++;
        }
        if (outcome) {
            conditions.push(`outcome = $${paramIndex}`);
            params.push(outcome);
            paramIndex++;
        }
        if (officeStatus) {
            conditions.push(`office_status = $${paramIndex}`);
            params.push(officeStatus);
            paramIndex++;
        }

        let sql = 'SELECT * FROM calls';
        
        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }
        
        sql += ` ORDER BY timestamp DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const results = await query(sql, params);
        return results.map(mapRowToCall);
    } catch (error) {
        console.error('Error fetching call records:', error.message);
        throw new Error('Could not fetch call records');
    }
}

/**
 * Find a call by its call ID
 * @param {string} callId - The call ID (e.g., 'CALL-ABCD1234')
 */
async function findById(callId) {
    try {
        const sql = 'SELECT * FROM calls WHERE call_id = $1';
        const results = await query(sql, [callId]);
        
        if (results.length === 0) {
            return null;
        }
        
        return mapRowToCall(results[0]);
    } catch (error) {
        console.error('Error fetching call by ID:', error.message);
        return null;
    }
}

/**
 * Get aggregated statistics for a date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 */
async function getStats(startDate, endDate) {
    try {
        const sql = `
            SELECT 
                COUNT(*)::int as total,
                SUM(CASE WHEN outcome = 'answered' THEN 1 ELSE 0 END)::int as answered,
                SUM(CASE WHEN outcome IN ('representative_unavailable', 'representative_unavailable_followup_requested') THEN 1 ELSE 0 END)::int as no_answer,
                SUM(CASE WHEN outcome IN ('representative_unavailable_followup_requested', 'closed_hours_followup_requested') THEN 1 ELSE 0 END)::int as followup_requested,
                SUM(CASE WHEN office_status = 'open' THEN 1 ELSE 0 END)::int as during_open,
                SUM(CASE WHEN office_status = 'closed' THEN 1 ELSE 0 END)::int as during_closed,
                SUM(CASE WHEN direction = 'inbound' THEN 1 ELSE 0 END)::int as inbound_calls,
                ROUND(AVG(CASE WHEN duration > 0 THEN duration ELSE NULL END)::numeric, 2) as avg_duration
            FROM calls
            WHERE timestamp >= $1 AND timestamp <= $2
        `;
        
        const results = await query(sql, [
            startDate + ' 00:00:00',
            endDate + ' 23:59:59'
        ]);
        
        return results[0] || {};
    } catch (error) {
        console.error('Error fetching call stats:', error.message);
        throw new Error('Could not fetch call statistics');
    }
}

/**
 * Get recent calls with filtering options
 */
async function getRecentCalls(limit = 50, filters = {}) {
    try {
        const { direction, outcome, startDate, endDate } = filters;
        
        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramIndex = 1;
        
        if (direction) {
            whereClause += ` AND direction = $${paramIndex}`;
            params.push(direction);
            paramIndex++;
        }
        
        if (outcome) {
            whereClause += ` AND outcome = $${paramIndex}`;
            params.push(outcome);
            paramIndex++;
        }
        
        if (startDate) {
            whereClause += ` AND timestamp >= $${paramIndex}`;
            params.push(startDate + ' 00:00:00');
            paramIndex++;
        }
        
        if (endDate) {
            whereClause += ` AND timestamp <= $${paramIndex}`;
            params.push(endDate + ' 23:59:59');
            paramIndex++;
        }
        
        const sql = `
            SELECT * FROM calls 
            ${whereClause}
            ORDER BY timestamp DESC 
            LIMIT $${paramIndex}
        `;
        
        params.push(limit);
        
        const results = await query(sql, params);
        return results.map(mapRowToCall);
    } catch (error) {
        console.error('Error fetching recent calls:', error.message);
        throw new Error('Could not fetch recent calls');
    }
}

/**
 * Map database row to call object
 */
function mapRowToCall(row) {
    if (!row) return null;
    
    return {
        id: row.id,
        callId: row.call_id,
        timestamp: row.timestamp,
        callerNumber: row.caller_number,
        calleeNumber: row.callee_number,
        officeStatus: row.office_status,
        outcome: row.outcome,
        duration: row.duration,
        providerCallId: row.provider_call_id,
        notes: row.notes,
        direction: row.direction,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

module.exports = {
    generateCallId,
    create,
    updateByCallerNumber,
    updateByProviderCallId,
    find,
    findById,
    getStats,
    getRecentCalls
};
