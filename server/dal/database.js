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

        // Inquiries table for website contact form submissions
        await pool.query(`
            CREATE TABLE IF NOT EXISTS inquiries (
                id SERIAL PRIMARY KEY,
                inquiry_id VARCHAR(20) UNIQUE NOT NULL,
                timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                name VARCHAR(100),
                phone VARCHAR(20),
                email VARCHAR(100),
                service VARCHAR(100),
                pregnancy_week INTEGER,
                message TEXT,
                source VARCHAR(50) DEFAULT 'website',
                status VARCHAR(20) DEFAULT 'new',
                notes TEXT,
                is_relevant_customer VARCHAR(20) DEFAULT 'unknown' CHECK (is_relevant_customer IN ('relevant', 'not_relevant', 'potential', 'unknown')),
                communication_status VARCHAR(20) DEFAULT 'pending' CHECK (communication_status IN ('pending', 'active', 'completed', 'on_hold')),
                customer_notes TEXT,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create indexes for inquiries
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_inquiries_timestamp ON inquiries(timestamp);
            CREATE INDEX IF NOT EXISTS idx_inquiries_phone ON inquiries(phone);
            CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
        `);

        // Create trigger for inquiries updated_at
        await pool.query(`
            DROP TRIGGER IF EXISTS update_inquiries_updated_at ON inquiries;
            CREATE TRIGGER update_inquiries_updated_at
                BEFORE UPDATE ON inquiries
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `);

        // Job state table for tracking scheduled job execution
        await pool.query(`
            CREATE TABLE IF NOT EXISTS job_state (
                job_name VARCHAR(100) PRIMARY KEY,
                last_run_at TIMESTAMPTZ,
                last_success_at TIMESTAMPTZ,
                last_error TEXT,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create trigger for job_state updated_at
        await pool.query(`
            DROP TRIGGER IF EXISTS update_job_state_updated_at ON job_state;
            CREATE TRIGGER update_job_state_updated_at
                BEFORE UPDATE ON job_state
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `);

        // WhatsApp messages table for tracking WhatsApp conversations
        await pool.query(`
            CREATE TABLE IF NOT EXISTS whatsapp_messages (
                id SERIAL PRIMARY KEY,
                message_id VARCHAR(20) UNIQUE NOT NULL,
                timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                phone_number VARCHAR(20) NOT NULL,
                profile_name VARCHAR(100),
                message TEXT NOT NULL,
                direction VARCHAR(10) DEFAULT 'incoming' CHECK (direction IN ('incoming', 'outgoing')),
                twilio_message_sid VARCHAR(50) DEFAULT NULL,
                media_type VARCHAR(20) DEFAULT NULL,
                media_url TEXT DEFAULT NULL,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create indexes for whatsapp_messages
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp);
            CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone_number ON whatsapp_messages(phone_number);
            CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_direction ON whatsapp_messages(direction);
        `);

        // Create trigger for whatsapp_messages updated_at
        await pool.query(`
            DROP TRIGGER IF EXISTS update_whatsapp_messages_updated_at ON whatsapp_messages;
            CREATE TRIGGER update_whatsapp_messages_updated_at
                BEFORE UPDATE ON whatsapp_messages
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
