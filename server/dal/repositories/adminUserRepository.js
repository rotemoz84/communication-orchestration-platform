/**
 * Admin User Repository
 * Data access for admin site login (email + password)
 */

const { query } = require('../database');

/**
 * Find admin user by email
 * @param {string} email
 * @returns {Object|null} User without password_hash, or null
 */
async function findByEmail(email) {
    const rows = await query(
        'SELECT id, email, password_hash, display_name, created_at FROM admin_users WHERE email = $1',
        [email.trim().toLowerCase()]
    );
    return rows[0] || null;
}

/**
 * Find admin user by ID (for session lookup)
 * @param {number} id
 * @returns {Object|null} User without password_hash, or null
 */
async function findById(id) {
    const rows = await query(
        'SELECT id, email, display_name, created_at FROM admin_users WHERE id = $1',
        [id]
    );
    return rows[0] || null;
}

/**
 * Create admin user (for seed script)
 * @param {Object} data - { email, passwordHash, displayName }
 */
async function create(data) {
    const { email, passwordHash, displayName } = data;
    const rows = await query(
        `INSERT INTO admin_users (email, password_hash, display_name)
         VALUES ($1, $2, $3)
         RETURNING id, email, display_name, created_at`,
        [email.trim().toLowerCase(), passwordHash, displayName || null]
    );
    return rows[0];
}

module.exports = {
    findByEmail,
    findById,
    create
};
