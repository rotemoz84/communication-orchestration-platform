/**
 * Call Tracking Service
 * Logs all incoming calls to Google Sheets for tracking
 */

const { getSheetsClient } = require('./googleAuth');
const crypto = require('crypto');

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const CALLS_SHEET = 'Calls';

/**
 * Generate a unique call tracking ID
 */
function generateCallId() {
    return 'CALL-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Save a call record to the Calls tracking sheet
 * @param {Object} callData - Call information
 * @param {string} callData.callerNumber - Caller's phone number
 * @param {string} callData.officeStatus - 'open' or 'closed'
 * @param {string} callData.outcome - 'answered', 'no_answer', 'whatsapp_sent', 'closed_hours'
 * @param {string} callData.twilioCallSid - Twilio's call SID (optional)
 * @param {string} callData.duration - Call duration in seconds (optional)
 * @param {string} callData.notes - Additional notes (optional)
 */
async function saveCallRecord(callData) {
    try {
        const sheets = await getSheetsClient();
        const callId = generateCallId();
        
        const { 
            callerNumber, 
            officeStatus, 
            outcome, 
            twilioCallSid,
            duration,
            notes 
        } = callData;
        
        // Format timestamp in Israel timezone
        const timestamp = new Date().toLocaleString('he-IL', { 
            timeZone: 'Asia/Jerusalem',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const row = [
            callId,                         // Call ID
            timestamp,                      // Timestamp
            callerNumber || 'unknown',      // Caller Number
            officeStatus || 'unknown',      // Office Status (open/closed)
            outcome || 'unknown',           // Outcome (answered/no_answer/whatsapp_sent/closed_hours)
            duration || '',                 // Duration (seconds)
            twilioCallSid || '',            // Twilio Call SID
            notes || ''                     // Notes
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: `${CALLS_SHEET}!A:H`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [row]
            }
        });

        console.log(`📊 Call tracked: ${callId} from ${callerNumber} - ${outcome}`);
        return { callId, ...callData, timestamp };
    } catch (error) {
        console.error('Error saving call record:', error.message);
        // Don't throw - we don't want call tracking failures to affect the IVR
        return null;
    }
}

/**
 * Update an existing call record with outcome
 * @param {string} callerNumber - The caller's phone number to find
 * @param {Object} updateData - Data to update
 */
async function updateCallRecord(callerNumber, updateData) {
    try {
        const sheets = await getSheetsClient();
        
        // Get all calls to find the most recent one from this caller
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${CALLS_SHEET}!A2:H`,
        });

        const rows = response.data.values || [];
        
        // Find the most recent call from this number (last occurrence)
        let rowIndex = -1;
        for (let i = rows.length - 1; i >= 0; i--) {
            if (rows[i][2] === callerNumber) {
                rowIndex = i;
                break;
            }
        }
        
        if (rowIndex === -1) {
            console.log(`No call record found for ${callerNumber}`);
            return null;
        }

        // Row number in sheet (add 2 for header row and 0-indexing)
        const sheetRow = rowIndex + 2;
        
        // Update outcome and duration if provided
        if (updateData.outcome) {
            await sheets.spreadsheets.values.update({
                spreadsheetId: SHEET_ID,
                range: `${CALLS_SHEET}!E${sheetRow}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [[updateData.outcome]]
                }
            });
        }

        if (updateData.duration) {
            await sheets.spreadsheets.values.update({
                spreadsheetId: SHEET_ID,
                range: `${CALLS_SHEET}!F${sheetRow}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [[updateData.duration]]
                }
            });
        }

        if (updateData.notes) {
            await sheets.spreadsheets.values.update({
                spreadsheetId: SHEET_ID,
                range: `${CALLS_SHEET}!H${sheetRow}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [[updateData.notes]]
                }
            });
        }

        console.log(`📊 Call record updated for ${callerNumber}`);
        return true;
    } catch (error) {
        console.error('Error updating call record:', error.message);
        return null;
    }
}

/**
 * Get all call records
 */
async function getAllCallRecords() {
    try {
        const sheets = await getSheetsClient();
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${CALLS_SHEET}!A2:H`,
        });

        const rows = response.data.values || [];
        
        return rows.map(row => ({
            callId: row[0],
            timestamp: row[1],
            callerNumber: row[2],
            officeStatus: row[3],
            outcome: row[4],
            duration: row[5],
            twilioCallSid: row[6],
            notes: row[7]
        }));
    } catch (error) {
        console.error('Error fetching call records:', error.message);
        throw new Error('Could not fetch call records');
    }
}

module.exports = {
    generateCallId,
    saveCallRecord,
    updateCallRecord,
    getAllCallRecords
};
