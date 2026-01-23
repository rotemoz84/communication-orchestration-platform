/**
 * Inquiries Service
 * Manages callback requests/inquiries in Google Sheets
 */

const { getSheetsClient } = require('./googleAuth');
const crypto = require('crypto');

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const INQUIRIES_SHEET = 'Inquiries';

/**
 * Generate a unique inquiry ID
 */
function generateInquiryId() {
    return 'INQ-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Save a new inquiry to the Inquiries sheet
 */
async function saveInquiry(inquiryData) {
    try {
        const sheets = await getSheetsClient();
        const inquiryId = generateInquiryId();
        
        const { name, phone, email, service, preferredTime, message, source } = inquiryData;
        
        // Format timestamp in Israel timezone
        const created = new Date().toLocaleString('he-IL', { 
            timeZone: 'Asia/Jerusalem',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const row = [
            inquiryId,                    // ID
            name,                         // Name
            phone,                        // Phone
            email || '',                  // Email
            service || '',                // Service
            preferredTime || 'anytime',   // Preferred Time
            message || '',                // Message
            'new',                        // Status
            created,                      // Created
            source || 'website'           // Source (website/whatsapp_bot)
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: `${INQUIRIES_SHEET}!A:J`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [row]
            }
        });

        console.log(`📝 Inquiry saved: ${inquiryId} from ${name} (source: ${source || 'website'})`);
        return { inquiryId, ...inquiryData, created };
    } catch (error) {
        console.error('Error saving inquiry:', error.message);
        throw new Error('Could not save inquiry');
    }
}

/**
 * Get all inquiries from the sheet
 */
async function getAllInquiries() {
    try {
        const sheets = await getSheetsClient();
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${INQUIRIES_SHEET}!A2:J`,
        });

        const rows = response.data.values || [];
        
        return rows.map(row => ({
            inquiryId: row[0],
            name: row[1],
            phone: row[2],
            email: row[3],
            service: row[4],
            preferredTime: row[5],
            message: row[6],
            status: row[7] || 'new',
            created: row[8],
            source: row[9] || 'website'
        }));
    } catch (error) {
        console.error('Error fetching inquiries:', error.message);
        throw new Error('Could not fetch inquiries');
    }
}

/**
 * Update inquiry status
 */
async function updateInquiryStatus(inquiryId, status) {
    try {
        const sheets = await getSheetsClient();
        
        // Find the row with this inquiry ID
        const inquiries = await getAllInquiries();
        const rowIndex = inquiries.findIndex(inq => inq.inquiryId === inquiryId);
        
        if (rowIndex === -1) {
            throw new Error('Inquiry not found');
        }

        // Row number in sheet (add 2 for header row and 0-indexing)
        const sheetRow = rowIndex + 2;
        
        await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `${INQUIRIES_SHEET}!H${sheetRow}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[status]]
            }
        });

        console.log(`📝 Inquiry ${inquiryId} status updated to: ${status}`);
        return { inquiryId, status };
    } catch (error) {
        console.error('Error updating inquiry:', error.message);
        throw new Error('Could not update inquiry');
    }
}

module.exports = {
    generateInquiryId,
    saveInquiry,
    getAllInquiries,
    updateInquiryStatus
};

