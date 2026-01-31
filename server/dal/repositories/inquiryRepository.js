/**
 * Inquiry Repository
 * Handles inquiry/callback request database operations
 */

const { getPool } = require('../database');
const crypto = require('crypto');

/**
 * Generate a unique inquiry ID
 */
function generateInquiryId() {
    return 'INQ-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Save a new inquiry
 * @param {Object} inquiryData - Inquiry information
 */
async function saveInquiry(inquiryData) {
    // For now, just log - we'll implement the full DB version later
    const inquiryId = generateInquiryId();
    console.log(`📝 Inquiry saved: ${inquiryId}`, inquiryData);
    return { inquiryId, ...inquiryData };
}

/**
 * Get all inquiries
 */
async function getAllInquiries() {
    // TODO: Implement when table is created
    return [];
}

module.exports = {
    generateInquiryId,
    saveInquiry,
    getAllInquiries
};
