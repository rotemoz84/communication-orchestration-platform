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
        
        // Check if file exists
        const fs = require('fs');
        if (!fs.existsSync(absolutePath)) {
            console.log('⚠️ Google service account key not found, Google features disabled');
            return null;
        }
        
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
        console.error('⚠️ Google Auth failed:', error.message);
        return null;
    }
}

/**
 * Get authenticated Google Sheets API client
 */
async function getSheetsClient() {
    const auth = await getAuthClient();
    if (!auth) return null;
    return google.sheets({ version: 'v4', auth });
}

/**
 * Get authenticated Google Calendar API client
 */
async function getCalendarClient() {
    const auth = await getAuthClient();
    if (!auth) return null;
    return google.calendar({ version: 'v3', auth });
}

module.exports = {
    getAuthClient,
    getSheetsClient,
    getCalendarClient
};
