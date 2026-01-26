/**
 * Google API Authentication Service
 * Handles authentication with Google APIs using a service account
 */

const { google } = require('googleapis');
const path = require('path');
const { config } = require('../../config');

let authClient = null;

/**
 * Initialize and return the Google Auth client
 * Uses a service account for server-to-server authentication
 */
async function getAuthClient() {
    if (authClient) {
        return authClient;
    }

    try {
        const keyPath = config.google.serviceAccountKeyPath;
        const absolutePath = path.resolve(__dirname, '../..', keyPath);
        
        const auth = new google.auth.GoogleAuth({
            keyFile: absolutePath,
            scopes: [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/calendar',
                'https://www.googleapis.com/auth/calendar.events'
            ]
        });

        authClient = await auth.getClient();
        console.log('✅ Google Auth initialized successfully');
        return authClient;
    } catch (error) {
        console.error('❌ Failed to initialize Google Auth:', error.message);
        throw new Error('Google authentication failed. Check your service account key.');
    }
}

/**
 * Get authenticated Google Sheets API client
 */
async function getSheetsClient() {
    const auth = await getAuthClient();
    return google.sheets({ version: 'v4', auth });
}

/**
 * Get authenticated Google Calendar API client
 */
async function getCalendarClient() {
    const auth = await getAuthClient();
    return google.calendar({ version: 'v3', auth });
}

module.exports = {
    getAuthClient,
    getSheetsClient,
    getCalendarClient
};
