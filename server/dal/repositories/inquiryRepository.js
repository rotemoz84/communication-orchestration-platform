/**
 * Inquiry Repository
 * Data access layer for website contact form inquiries
 */

const { query } = require('../database');
const crypto = require('crypto');

/**
 * Generate a unique inquiry ID
 */
function generateInquiryId() {
    return 'INQ-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Create a new inquiry from contact form
 * @param {Object} inquiryData - Inquiry information
 * @returns {Object} - Created inquiry record
 */
async function create(inquiryData) {
    try {
        const inquiryId = generateInquiryId();
        
        const { 
            name = null,
            phone = null,
            email = null,
            service = null,
            week = null,
            message = null,
            source = 'website',
            privacyConsent = null,
            sensitiveDataConsent = null,
            consentPolicyVersion = null,
            consentRecordedAt = null
        } = inquiryData;

        const sql = `
            INSERT INTO inquiries (
                inquiry_id, name, phone, email, service, pregnancy_week, message, source,
                privacy_consent, sensitive_data_consent, consent_policy_version, consent_recorded_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `;

        // Handle pregnancy week - only convert if it's a valid number
        const parsedWeek = week ? parseInt(week) : null;
        const pregnancyWeek = (parsedWeek && !isNaN(parsedWeek)) ? parsedWeek : null;
        const result = await query(sql, [
            inquiryId, name, phone, email, service, pregnancyWeek, message, source,
            privacyConsent, sensitiveDataConsent, consentPolicyVersion, consentRecordedAt
        ]);

        console.log(`📝 Inquiry saved: ${inquiryId} from ${phone || email}`);
        return mapRowToInquiry(result[0]);
    } catch (error) {
        console.error('Error saving inquiry:', error.message);
        throw error;
    }
}

/**
 * Update inquiry status
 * @param {string} inquiryId - The inquiry ID
 * @param {Object} updateData - Data to update
 */
async function updateById(inquiryId, updateData) {
    try {
        const { status, notes } = updateData;
        
        const updates = [];
        const params = [];
        let paramIndex = 1;
        
        if (status) {
            updates.push(`status = $${paramIndex}`);
            params.push(status);
            paramIndex++;
        }
        if (notes !== undefined) {
            updates.push(`notes = $${paramIndex}`);
            params.push(notes);
            paramIndex++;
        }
        
        if (updates.length === 0) {
            return null;
        }

        const sql = `
            UPDATE inquiries 
            SET ${updates.join(', ')}
            WHERE inquiry_id = $${paramIndex}
            RETURNING *
        `;
        
        params.push(inquiryId);
        
        const result = await query(sql, params);

        if (result.length > 0) {
            console.log(`📝 Inquiry updated: ${inquiryId}`);
            return mapRowToInquiry(result[0]);
        }
        return null;
    } catch (error) {
        console.error('Error updating inquiry:', error.message);
        throw error;
    }
}

/**
 * Find inquiries with filters
 * @param {Object} filters - Query filters
 */
async function find(filters = {}) {
    try {
        const { 
            startDate, 
            endDate, 
            status,
            source,
            search,
            limit = 100,
            offset = 0 
        } = filters;
        
        const conditions = [];
        const params = [];
        let paramIndex = 1;
        
        if (search && String(search).trim()) {
            const pattern = '%' + String(search).trim() + '%';
            conditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`);
            params.push(pattern);
            paramIndex++;
        }
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
        if (status) {
            conditions.push(`status = $${paramIndex}`);
            params.push(status);
            paramIndex++;
        }
        if (source) {
            conditions.push(`source = $${paramIndex}`);
            params.push(source);
            paramIndex++;
        }

        let sql = 'SELECT * FROM inquiries';
        
        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }
        
        sql += ` ORDER BY timestamp DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const results = await query(sql, params);
        return results.map(mapRowToInquiry);
    } catch (error) {
        console.error('Error fetching inquiries:', error.message);
        throw error;
    }
}

/**
 * Count inquiries with same filters as find (no limit/offset)
 * @param {Object} filters - Same filter keys as find
 * @returns {number}
 */
async function count(filters = {}) {
    try {
        const { startDate, endDate, status, source, search } = filters;
        const conditions = [];
        const params = [];
        let paramIndex = 1;

        if (search && String(search).trim()) {
            const term = String(search).trim();
            const pattern = '%' + term + '%';
            conditions.push(`(COALESCE(name, '') ILIKE $${paramIndex} OR COALESCE(email, '') ILIKE $${paramIndex} OR COALESCE(phone, '') ILIKE $${paramIndex})`);
            params.push(pattern);
            paramIndex++;
        }
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
        if (status) {
            conditions.push(`status = $${paramIndex}`);
            params.push(status);
            paramIndex++;
        }
        if (source) {
            conditions.push(`source = $${paramIndex}`);
            params.push(source);
            paramIndex++;
        }

        let sql = 'SELECT COUNT(*)::int AS total FROM inquiries';
        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }
        const results = await query(sql, params);
        return results[0] ? results[0].total : 0;
    } catch (error) {
        console.error('Error counting inquiries:', error.message);
        throw error;
    }
}

/**
 * Find an inquiry by ID
 * @param {string} inquiryId - The inquiry ID
 */
async function findById(inquiryId) {
    try {
        const sql = 'SELECT * FROM inquiries WHERE inquiry_id = $1';
        const results = await query(sql, [inquiryId]);
        
        if (results.length === 0) {
            return null;
        }
        
        return mapRowToInquiry(results[0]);
    } catch (error) {
        console.error('Error fetching inquiry:', error.message);
        return null;
    }
}

/**
 * Find inquiries within a timestamp range
 * Used by the daily summary job to get new inquiries since last run
 * @param {Date} fromTimestamp - Start of the range
 * @param {Date} toTimestamp - End of the range
 * @returns {Array} - List of inquiries in the range
 */
async function findByTimestampRange(fromTimestamp, toTimestamp) {
    try {
        const sql = `
            SELECT * FROM inquiries 
            WHERE timestamp >= $1 AND timestamp <= $2
            ORDER BY timestamp ASC
        `;
        
        const results = await query(sql, [fromTimestamp, toTimestamp]);
        return results.map(mapRowToInquiry);
    } catch (error) {
        console.error('Error fetching inquiries by timestamp range:', error.message);
        throw error;
    }
}

/**
 * Get all inquiries (for backward compatibility)
 */
async function getAllInquiries() {
    return find({ limit: 1000 });
}

/**
 * Save inquiry (alias for create, for backward compatibility)
 */
async function saveInquiry(inquiryData) {
    return create(inquiryData);
}

/**
 * Map database row to inquiry object
 */
function mapRowToInquiry(row) {
    if (!row) return null;
    
    return {
        id: row.id,
        inquiryId: row.inquiry_id,
        timestamp: row.timestamp,
        name: row.name,
        phone: row.phone,
        email: row.email,
        service: row.service,
        pregnancyWeek: row.pregnancy_week,
        message: row.message,
        source: row.source,
        privacyConsent: row.privacy_consent,
        sensitiveDataConsent: row.sensitive_data_consent,
        consentPolicyVersion: row.consent_policy_version,
        consentRecordedAt: row.consent_recorded_at,
        status: row.status,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

module.exports = {
    generateInquiryId,
    create,
    updateById,
    find,
    count,
    findById,
    findByTimestampRange,
    getAllInquiries,
    saveInquiry
};
