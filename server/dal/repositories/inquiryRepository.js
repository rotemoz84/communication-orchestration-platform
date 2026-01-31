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
            source = 'website'
        } = inquiryData;

        const sql = `
            INSERT INTO inquiries (inquiry_id, name, phone, email, service, pregnancy_week, message, source)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;

        const pregnancyWeek = week ? parseInt(week) : null;
        const result = await query(sql, [inquiryId, name, phone, email, service, pregnancyWeek, message, source]);

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
    findById,
    getAllInquiries,
    saveInquiry
};
