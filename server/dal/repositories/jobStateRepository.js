/**
 * Job State Repository
 * Tracks scheduled job execution state for reliability
 */

const { query } = require('../database');

/**
 * Get the state of a job
 * @param {string} jobName - Unique job identifier
 * @returns {Object|null} - Job state or null if not found
 */
async function getJobState(jobName) {
    try {
        const sql = 'SELECT * FROM job_state WHERE job_name = $1';
        const results = await query(sql, [jobName]);
        
        if (results.length === 0) {
            return null;
        }
        
        return mapRowToJobState(results[0]);
    } catch (error) {
        console.error('Error getting job state:', error.message);
        return null;
    }
}

/**
 * Update job state after a run
 * @param {string} jobName - Unique job identifier
 * @param {Object} updateData - State update data
 */
async function updateJobState(jobName, updateData) {
    try {
        const { success, error, metadata } = updateData;
        
        // Upsert the job state
        const sql = `
            INSERT INTO job_state (job_name, last_run_at, last_success_at, last_error, metadata)
            VALUES ($1, CURRENT_TIMESTAMP, $2, $3, $4)
            ON CONFLICT (job_name) 
            DO UPDATE SET 
                last_run_at = CURRENT_TIMESTAMP,
                last_success_at = CASE WHEN $2 IS NOT NULL THEN $2 ELSE job_state.last_success_at END,
                last_error = $3,
                metadata = COALESCE($4, job_state.metadata)
            RETURNING *
        `;
        
        const lastSuccessAt = success ? new Date() : null;
        const errorText = error || null;
        const metadataJson = metadata ? JSON.stringify(metadata) : null;
        
        const results = await query(sql, [jobName, lastSuccessAt, errorText, metadataJson]);
        
        if (results.length > 0) {
            console.log(`📊 Job state updated: ${jobName} (success: ${success})`);
            return mapRowToJobState(results[0]);
        }
        return null;
    } catch (err) {
        console.error('Error updating job state:', err.message);
        throw err;
    }
}

/**
 * Get the timestamp from which to query for pending items
 * Returns last_success_at if available, otherwise a default lookback
 * @param {string} jobName - Unique job identifier
 * @param {number} defaultLookbackHours - Default hours to look back if no previous run
 * @returns {Date} - Timestamp to query from
 */
async function getQueryFromTimestamp(jobName, defaultLookbackHours = 72) {
    const state = await getJobState(jobName);
    
    if (state && state.lastSuccessAt) {
        return new Date(state.lastSuccessAt);
    }
    
    // No previous successful run - use default lookback
    const lookbackDate = new Date();
    lookbackDate.setHours(lookbackDate.getHours() - defaultLookbackHours);
    return lookbackDate;
}

/**
 * Map database row to job state object
 */
function mapRowToJobState(row) {
    if (!row) return null;
    
    return {
        jobName: row.job_name,
        lastSuccessAt: row.last_success_at,
        lastRunAt: row.last_run_at,
        lastError: row.last_error,
        metadata: row.metadata || {},
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

module.exports = {
    getJobState,
    updateJobState,
    getQueryFromTimestamp
};
