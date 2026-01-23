/**
 * Sheet Setup Service
 * Configures Google Sheet formatting, validation, and styling
 */

const { getSheetsClient } = require('./googleAuth');

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const APPOINTMENTS_SHEET = 'Appointments';

// Status options for dropdown
const STATUS_OPTIONS = [
    'new',
    'reminder_sent', 
    'confirmed',
    'cancel_requested',
    'cancelled'
];

/**
 * Get the sheet ID (gid) for the Appointments tab
 */
async function getAppointmentsSheetId() {
    const sheets = await getSheetsClient();
    
    const response = await sheets.spreadsheets.get({
        spreadsheetId: SHEET_ID
    });
    
    const appointmentsSheet = response.data.sheets.find(
        sheet => sheet.properties.title === APPOINTMENTS_SHEET
    );
    
    if (!appointmentsSheet) {
        throw new Error(`Sheet "${APPOINTMENTS_SHEET}" not found`);
    }
    
    return appointmentsSheet.properties.sheetId;
}

/**
 * Set up the Appointments sheet with proper formatting and validation
 */
async function setupAppointmentsSheet() {
    console.log('🔧 Setting up Appointments sheet formatting...');
    
    const sheets = await getSheetsClient();
    const sheetId = await getAppointmentsSheetId();
    
    const requests = [
        // Column A: Booking ID - Plain text
        {
            repeatCell: {
                range: {
                    sheetId: sheetId,
                    startRowIndex: 1,
                    startColumnIndex: 0,
                    endColumnIndex: 1
                },
                cell: {
                    userEnteredFormat: {
                        numberFormat: { type: 'TEXT' }
                    }
                },
                fields: 'userEnteredFormat.numberFormat'
            }
        },
        
        // Column B: Date - Date format
        {
            repeatCell: {
                range: {
                    sheetId: sheetId,
                    startRowIndex: 1,
                    startColumnIndex: 1,
                    endColumnIndex: 2
                },
                cell: {
                    userEnteredFormat: {
                        numberFormat: { 
                            type: 'DATE',
                            pattern: 'dd/mm/yyyy'
                        }
                    }
                },
                fields: 'userEnteredFormat.numberFormat'
            }
        },
        
        // Column C: Time - Time format
        {
            repeatCell: {
                range: {
                    sheetId: sheetId,
                    startRowIndex: 1,
                    startColumnIndex: 2,
                    endColumnIndex: 3
                },
                cell: {
                    userEnteredFormat: {
                        numberFormat: { 
                            type: 'TIME',
                            pattern: 'hh:mm am/pm'
                        }
                    }
                },
                fields: 'userEnteredFormat.numberFormat'
            }
        },
        
        // Column D: Client Name - Plain text
        {
            repeatCell: {
                range: {
                    sheetId: sheetId,
                    startRowIndex: 1,
                    startColumnIndex: 3,
                    endColumnIndex: 4
                },
                cell: {
                    userEnteredFormat: {
                        numberFormat: { type: 'TEXT' }
                    }
                },
                fields: 'userEnteredFormat.numberFormat'
            }
        },
        
        // Column E: Phone - Plain text (to preserve formatting like +972)
        {
            repeatCell: {
                range: {
                    sheetId: sheetId,
                    startRowIndex: 1,
                    startColumnIndex: 4,
                    endColumnIndex: 5
                },
                cell: {
                    userEnteredFormat: {
                        numberFormat: { type: 'TEXT' }
                    }
                },
                fields: 'userEnteredFormat.numberFormat'
            }
        },
        
        // Column F: Email - Plain text
        {
            repeatCell: {
                range: {
                    sheetId: sheetId,
                    startRowIndex: 1,
                    startColumnIndex: 5,
                    endColumnIndex: 6
                },
                cell: {
                    userEnteredFormat: {
                        numberFormat: { type: 'TEXT' }
                    }
                },
                fields: 'userEnteredFormat.numberFormat'
            }
        },
        
        // Column H: Status - Data validation dropdown
        {
            setDataValidation: {
                range: {
                    sheetId: sheetId,
                    startRowIndex: 1,
                    startColumnIndex: 7,
                    endColumnIndex: 8
                },
                rule: {
                    condition: {
                        type: 'ONE_OF_LIST',
                        values: STATUS_OPTIONS.map(opt => ({ userEnteredValue: opt }))
                    },
                    showCustomUi: true,
                    strict: true
                }
            }
        },
        
        // Column I: Reminder Sent - Date/time format
        {
            repeatCell: {
                range: {
                    sheetId: sheetId,
                    startRowIndex: 1,
                    startColumnIndex: 8,
                    endColumnIndex: 9
                },
                cell: {
                    userEnteredFormat: {
                        numberFormat: { 
                            type: 'DATE_TIME',
                            pattern: 'dd/mm/yyyy hh:mm'
                        }
                    }
                },
                fields: 'userEnteredFormat.numberFormat'
            }
        },
        
        // Column J: Response Time - Date/time format
        {
            repeatCell: {
                range: {
                    sheetId: sheetId,
                    startRowIndex: 1,
                    startColumnIndex: 9,
                    endColumnIndex: 10
                },
                cell: {
                    userEnteredFormat: {
                        numberFormat: { 
                            type: 'DATE_TIME',
                            pattern: 'dd/mm/yyyy hh:mm'
                        }
                    }
                },
                fields: 'userEnteredFormat.numberFormat'
            }
        },
        
        // Format header row (row 1) - Bold
        {
            repeatCell: {
                range: {
                    sheetId: sheetId,
                    startRowIndex: 0,
                    endRowIndex: 1,
                    startColumnIndex: 0,
                    endColumnIndex: 11
                },
                cell: {
                    userEnteredFormat: {
                        textFormat: { bold: true },
                        backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 }
                    }
                },
                fields: 'userEnteredFormat.textFormat,userEnteredFormat.backgroundColor'
            }
        },
        
        // Freeze header row
        {
            updateSheetProperties: {
                properties: {
                    sheetId: sheetId,
                    gridProperties: {
                        frozenRowCount: 1
                    }
                },
                fields: 'gridProperties.frozenRowCount'
            }
        },
        
        // Auto-resize columns
        {
            autoResizeDimensions: {
                dimensions: {
                    sheetId: sheetId,
                    dimension: 'COLUMNS',
                    startIndex: 0,
                    endIndex: 11
                }
            }
        }
    ];

    // Add conditional formatting for status column
    const conditionalFormattingRequests = [
        // Green for 'confirmed'
        {
            addConditionalFormatRule: {
                rule: {
                    ranges: [{
                        sheetId: sheetId,
                        startRowIndex: 1,
                        startColumnIndex: 7,
                        endColumnIndex: 8
                    }],
                    booleanRule: {
                        condition: {
                            type: 'TEXT_EQ',
                            values: [{ userEnteredValue: 'confirmed' }]
                        },
                        format: {
                            backgroundColor: { red: 0.85, green: 0.95, blue: 0.85 },
                            textFormat: { foregroundColor: { red: 0.2, green: 0.5, blue: 0.2 } }
                        }
                    }
                },
                index: 0
            }
        },
        // Red for 'cancel_requested'
        {
            addConditionalFormatRule: {
                rule: {
                    ranges: [{
                        sheetId: sheetId,
                        startRowIndex: 1,
                        startColumnIndex: 7,
                        endColumnIndex: 8
                    }],
                    booleanRule: {
                        condition: {
                            type: 'TEXT_EQ',
                            values: [{ userEnteredValue: 'cancel_requested' }]
                        },
                        format: {
                            backgroundColor: { red: 1, green: 0.9, blue: 0.9 },
                            textFormat: { foregroundColor: { red: 0.8, green: 0.2, blue: 0.2 } }
                        }
                    }
                },
                index: 1
            }
        },
        // Gray for 'cancelled'
        {
            addConditionalFormatRule: {
                rule: {
                    ranges: [{
                        sheetId: sheetId,
                        startRowIndex: 1,
                        startColumnIndex: 7,
                        endColumnIndex: 8
                    }],
                    booleanRule: {
                        condition: {
                            type: 'TEXT_EQ',
                            values: [{ userEnteredValue: 'cancelled' }]
                        },
                        format: {
                            backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                            textFormat: { 
                                foregroundColor: { red: 0.5, green: 0.5, blue: 0.5 },
                                strikethrough: true
                            }
                        }
                    }
                },
                index: 2
            }
        },
        // Yellow for 'reminder_sent' (waiting for response)
        {
            addConditionalFormatRule: {
                rule: {
                    ranges: [{
                        sheetId: sheetId,
                        startRowIndex: 1,
                        startColumnIndex: 7,
                        endColumnIndex: 8
                    }],
                    booleanRule: {
                        condition: {
                            type: 'TEXT_EQ',
                            values: [{ userEnteredValue: 'reminder_sent' }]
                        },
                        format: {
                            backgroundColor: { red: 1, green: 0.95, blue: 0.8 },
                            textFormat: { foregroundColor: { red: 0.7, green: 0.5, blue: 0 } }
                        }
                    }
                },
                index: 3
            }
        },
        // Blue for 'new'
        {
            addConditionalFormatRule: {
                rule: {
                    ranges: [{
                        sheetId: sheetId,
                        startRowIndex: 1,
                        startColumnIndex: 7,
                        endColumnIndex: 8
                    }],
                    booleanRule: {
                        condition: {
                            type: 'TEXT_EQ',
                            values: [{ userEnteredValue: 'new' }]
                        },
                        format: {
                            backgroundColor: { red: 0.85, green: 0.92, blue: 1 },
                            textFormat: { foregroundColor: { red: 0.2, green: 0.4, blue: 0.7 } }
                        }
                    }
                },
                index: 4
            }
        }
    ];

    try {
        // Apply formatting
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SHEET_ID,
            requestBody: {
                requests: [...requests, ...conditionalFormattingRequests]
            }
        });

        console.log('✅ Sheet formatting applied successfully!');
        console.log('   - Status column has dropdown with options');
        console.log('   - Date/time columns formatted');
        console.log('   - Conditional colors for status');
        console.log('   - Header row frozen and styled');
        
        return { success: true };
    } catch (error) {
        console.error('❌ Error setting up sheet:', error.message);
        throw error;
    }
}

/**
 * Set up the Inquiries sheet with proper formatting and validation
 */
async function setupInquiriesSheet() {
    console.log('🔧 Setting up Inquiries sheet formatting...');
    
    const sheets = await getSheetsClient();
    
    // Get Inquiries sheet ID
    const response = await sheets.spreadsheets.get({
        spreadsheetId: SHEET_ID
    });
    
    const inquiriesSheet = response.data.sheets.find(
        sheet => sheet.properties.title === 'Inquiries'
    );
    
    if (!inquiriesSheet) {
        console.log('⚠️ Inquiries sheet not found - please create it first');
        return { success: false, error: 'Inquiries sheet not found' };
    }
    
    const sheetId = inquiriesSheet.properties.sheetId;

    // Inquiry status options
    const inquiryStatusOptions = ['new', 'contacted', 'scheduled', 'closed'];

    const requests = [
        // Format header row - Bold with background
        {
            repeatCell: {
                range: {
                    sheetId: sheetId,
                    startRowIndex: 0,
                    endRowIndex: 1,
                    startColumnIndex: 0,
                    endColumnIndex: 9
                },
                cell: {
                    userEnteredFormat: {
                        textFormat: { bold: true },
                        backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 }
                    }
                },
                fields: 'userEnteredFormat.textFormat,userEnteredFormat.backgroundColor'
            }
        },
        
        // Freeze header row
        {
            updateSheetProperties: {
                properties: {
                    sheetId: sheetId,
                    gridProperties: {
                        frozenRowCount: 1
                    }
                },
                fields: 'gridProperties.frozenRowCount'
            }
        },
        
        // Column H: Status - Data validation dropdown
        {
            setDataValidation: {
                range: {
                    sheetId: sheetId,
                    startRowIndex: 1,
                    startColumnIndex: 7,
                    endColumnIndex: 8
                },
                rule: {
                    condition: {
                        type: 'ONE_OF_LIST',
                        values: inquiryStatusOptions.map(opt => ({ userEnteredValue: opt }))
                    },
                    showCustomUi: true,
                    strict: true
                }
            }
        },
        
        // Auto-resize columns
        {
            autoResizeDimensions: {
                dimensions: {
                    sheetId: sheetId,
                    dimension: 'COLUMNS',
                    startIndex: 0,
                    endIndex: 9
                }
            }
        }
    ];

    // Conditional formatting for status
    const conditionalFormattingRequests = [
        // Green for 'scheduled'
        {
            addConditionalFormatRule: {
                rule: {
                    ranges: [{
                        sheetId: sheetId,
                        startRowIndex: 1,
                        startColumnIndex: 7,
                        endColumnIndex: 8
                    }],
                    booleanRule: {
                        condition: {
                            type: 'TEXT_EQ',
                            values: [{ userEnteredValue: 'scheduled' }]
                        },
                        format: {
                            backgroundColor: { red: 0.85, green: 0.95, blue: 0.85 },
                            textFormat: { foregroundColor: { red: 0.2, green: 0.5, blue: 0.2 } }
                        }
                    }
                },
                index: 0
            }
        },
        // Yellow for 'contacted'
        {
            addConditionalFormatRule: {
                rule: {
                    ranges: [{
                        sheetId: sheetId,
                        startRowIndex: 1,
                        startColumnIndex: 7,
                        endColumnIndex: 8
                    }],
                    booleanRule: {
                        condition: {
                            type: 'TEXT_EQ',
                            values: [{ userEnteredValue: 'contacted' }]
                        },
                        format: {
                            backgroundColor: { red: 1, green: 0.95, blue: 0.8 },
                            textFormat: { foregroundColor: { red: 0.7, green: 0.5, blue: 0 } }
                        }
                    }
                },
                index: 1
            }
        },
        // Blue for 'new'
        {
            addConditionalFormatRule: {
                rule: {
                    ranges: [{
                        sheetId: sheetId,
                        startRowIndex: 1,
                        startColumnIndex: 7,
                        endColumnIndex: 8
                    }],
                    booleanRule: {
                        condition: {
                            type: 'TEXT_EQ',
                            values: [{ userEnteredValue: 'new' }]
                        },
                        format: {
                            backgroundColor: { red: 0.85, green: 0.92, blue: 1 },
                            textFormat: { foregroundColor: { red: 0.2, green: 0.4, blue: 0.7 } }
                        }
                    }
                },
                index: 2
            }
        },
        // Gray for 'closed'
        {
            addConditionalFormatRule: {
                rule: {
                    ranges: [{
                        sheetId: sheetId,
                        startRowIndex: 1,
                        startColumnIndex: 7,
                        endColumnIndex: 8
                    }],
                    booleanRule: {
                        condition: {
                            type: 'TEXT_EQ',
                            values: [{ userEnteredValue: 'closed' }]
                        },
                        format: {
                            backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                            textFormat: { foregroundColor: { red: 0.5, green: 0.5, blue: 0.5 } }
                        }
                    }
                },
                index: 3
            }
        }
    ];

    try {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SHEET_ID,
            requestBody: {
                requests: [...requests, ...conditionalFormattingRequests]
            }
        });

        console.log('✅ Inquiries sheet formatting applied!');
        return { success: true };
    } catch (error) {
        console.error('❌ Error setting up Inquiries sheet:', error.message);
        throw error;
    }
}

module.exports = {
    setupAppointmentsSheet,
    setupInquiriesSheet,
    STATUS_OPTIONS
};

