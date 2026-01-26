/**
 * Database Service
 * PostgreSQL database connection and utilities
 */

const { Pool } = require('pg');
const { config } = require('../config');

let pool = null;

/**
 * Initialize the database connection pool
 */
async function initDatabase() {
    if (pool) {
        return pool;
    }

    pool = new Pool({
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database,
        max: config.db.maxConnections,
        idleTimeoutMillis: config.db.idleTimeoutMs,
        connectionTimeoutMillis: config.db.connectionTimeoutMs,
    });

    // Test connection
    const client = await pool.connect();
    console.log('📦 Database pool initialized');
    client.release();
    
    // Create tables if they don't exist
    await createTables();
    
    return pool;
}

/**
 * Create required tables if they don't exist
 */
async function createTables() {
    try {
        // Create enum type for outcome (if not exists)
        await pool.query(`
            DO $$ BEGIN
                CREATE TYPE call_outcome AS ENUM (
                    'incoming',
                    'answered',
                    'no_answer_hangup',
                    'no_answer_whatsapp',
                    'closed_hours_whatsapp',
                    'menu_whatsapp',
                    'error'
                );
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Create enum type for office status (if not exists)
        await pool.query(`
            DO $$ BEGIN
                CREATE TYPE office_status AS ENUM ('open', 'closed', 'unknown');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Calls table for tracking incoming calls
        await pool.query(`
            CREATE TABLE IF NOT EXISTS calls (
                id SERIAL PRIMARY KEY,
                call_id VARCHAR(20) UNIQUE NOT NULL,
                timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                caller_number VARCHAR(20) NOT NULL,
                office_status office_status DEFAULT 'unknown',
                outcome call_outcome DEFAULT 'incoming',
                duration INTEGER DEFAULT NULL,
                twilio_call_sid VARCHAR(50) DEFAULT NULL,
                notes TEXT DEFAULT NULL,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create indexes for better query performance
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_calls_timestamp ON calls(timestamp);
            CREATE INDEX IF NOT EXISTS idx_calls_caller_number ON calls(caller_number);
            CREATE INDEX IF NOT EXISTS idx_calls_outcome ON calls(outcome);
            CREATE INDEX IF NOT EXISTS idx_calls_office_status ON calls(office_status);
        `);

        // Create trigger function for updating updated_at
        await pool.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        `);

        // Create trigger (if not exists)
        await pool.query(`
            DROP TRIGGER IF EXISTS update_calls_updated_at ON calls;
            CREATE TRIGGER update_calls_updated_at
                BEFORE UPDATE ON calls
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `);

        console.log('✅ Database tables ready');
    } catch (error) {
        console.error('Error creating tables:', error.message);
        throw error;
    }
}

/**
 * Get the database pool
 */
function getPool() {
    if (!pool) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return pool;
}

/**
 * Execute a query with parameters
 * @param {string} sql - SQL query (use $1, $2, etc. for parameters)
 * @param {Array} params - Query parameters
 */
async function query(sql, params = []) {
    const pool = getPool();
    const result = await pool.query(sql, params);
    return result.rows;
}

/**
 * Close the database connection pool
 */
async function closeDatabase() {
    if (pool) {
        await pool.end();
        pool = null;
        console.log('📦 Database pool closed');
    }
}

module.exports = {
    initDatabase,
    getPool,
    query,
    closeDatabase
};
