/**
 * Data Access Layer (DAL) Index
 * Central export for all database operations
 */

const database = require('./database');
const callRepository = require('./repositories/callRepository');

module.exports = {
    // Database connection
    initDatabase: database.initDatabase,
    closeDatabase: database.closeDatabase,
    query: database.query,
    getPool: database.getPool,
    
    // Repositories
    callRepository
};
