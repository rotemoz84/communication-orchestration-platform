/**
 * WhatsApp Message Repository
 * Data access layer for WhatsApp messages
 */

const { query } = require('../database');
const crypto = require('crypto');

/**
 * Generate a unique message ID
 */
function generateMessageId() {
    return 'MSG-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Create a new WhatsApp message record
 * @param {Object} messageData - Message information
 * @returns {Object} - Created message record
 */
async function create(messageData) {
    try {
        const messageId = generateMessageId();
        
        const { 
            phoneNumber, 
            profileName, 
            message, 
            direction = 'incoming', // 'incoming' or 'outgoing'
            twilioMessageSid = null,
            mediaType = null,
            mediaUrl = null
        } = messageData;

        const sql = `
            INSERT INTO whatsapp_messages (message_id, phone_number, profile_name, message, direction, twilio_message_sid, media_type, media_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;

        const result = await query(sql, [messageId, phoneNumber, profileName, message, direction, twilioMessageSid, mediaType, mediaUrl]);

        console.log(`💬 WhatsApp message saved: ${messageId} from ${phoneNumber}`);
        return mapRowToMessage(result[0]);
    } catch (error) {
        console.error('Error saving WhatsApp message:', error.message);
        throw error;
    }
}

/**
 * Find WhatsApp messages with filters
 * @param {Object} filters - Query filters
 */
async function find(filters = {}) {
    try {
        const { 
            startDate, 
            endDate, 
            phoneNumber,
            direction,
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
        if (phoneNumber) {
            conditions.push(`phone_number = $${paramIndex}`);
            params.push(phoneNumber);
            paramIndex++;
        }
        if (direction) {
            conditions.push(`direction = $${paramIndex}`);
            params.push(direction);
            paramIndex++;
        }

        let sql = 'SELECT * FROM whatsapp_messages';
        
        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }
        
        sql += ` ORDER BY timestamp DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const results = await query(sql, params);
        return results.map(mapRowToMessage);
    } catch (error) {
        console.error('Error fetching WhatsApp messages:', error.message);
        throw error;
    }
}

/**
 * Find a WhatsApp message by its message ID
 * @param {string} messageId - The message ID
 */
async function findById(messageId) {
    try {
        const sql = 'SELECT * FROM whatsapp_messages WHERE message_id = $1';
        const results = await query(sql, [messageId]);
        
        if (results.length === 0) {
            return null;
        }
        
        return mapRowToMessage(results[0]);
    } catch (error) {
        console.error('Error fetching WhatsApp message by ID:', error.message);
        return null;
    }
}

/**
 * Get WhatsApp messages for a specific phone number
 * @param {string} phoneNumber - Phone number
 * @param {number} limit - Maximum number of messages to return
 */
async function findByPhoneNumber(phoneNumber, limit = 50) {
    try {
        const sql = `
            SELECT * FROM whatsapp_messages 
            WHERE phone_number = $1 
            ORDER BY timestamp DESC 
            LIMIT $2
        `;
        
        const results = await query(sql, [phoneNumber, limit]);
        return results.map(mapRowToMessage);
    } catch (error) {
        console.error('Error fetching messages by phone number:', error.message);
        throw error;
    }
}

/**
 * Get conversation statistics for a date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 */
async function getStats(startDate, endDate) {
    try {
        const sql = `
            SELECT 
                COUNT(*)::int as total_messages,
                COUNT(DISTINCT phone_number)::int as unique_contacts,
                SUM(CASE WHEN direction = 'incoming' THEN 1 ELSE 0 END)::int as incoming_messages,
                SUM(CASE WHEN direction = 'outgoing' THEN 1 ELSE 0 END)::int as outgoing_messages,
                COUNT(DISTINCT DATE(timestamp))::int as active_days
            FROM whatsapp_messages
            WHERE timestamp >= $1 AND timestamp <= $2
        `;
        
        const results = await query(sql, [
            startDate + ' 00:00:00',
            endDate + ' 23:59:59'
        ]);
        
        return results[0] || {};
    } catch (error) {
        console.error('Error fetching WhatsApp message stats:', error.message);
        throw error;
    }
}

/**
 * Map database row to message object
 */
function mapRowToMessage(row) {
    if (!row) return null;
    
    return {
        id: row.id,
        messageId: row.message_id,
        timestamp: row.timestamp,
        phoneNumber: row.phone_number,
        profileName: row.profile_name,
        message: row.message,
        direction: row.direction,
        twilioMessageSid: row.twilio_message_sid,
        mediaType: row.media_type,
        mediaUrl: row.media_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

module.exports = {
    generateMessageId,
    create,
    find,
    findById,
    findByPhoneNumber,
    getStats
};
