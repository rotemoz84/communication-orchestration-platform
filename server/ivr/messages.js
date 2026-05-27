/**
 * IVR Messages
 * All voice messages used in the IVR system
 */

// Message placeholders - will be replaced with actual recordings or TTS
const IVR_MESSAGES = {
    // IVR_no_answer: Rep didn't answer after 4 rings
    IVR_no_answer: `
        מצטערים, אין מענה כרגע.
        להשארת בקשה לחזרה, הקישו 9.
    `,

    // Follow-up request confirmation while WhatsApp integration is deferred.
    IVR_request_received: `
        תודה! בקשתך התקבלה.
        נציג יחזור אליך בהקדם.
        להתראות.
    `,

    // Thank you and goodbye
    IVR_goodbye: `תודה שהתקשרת. להתראות.`,

    // Invalid input
    IVR_invalid_input: `בחירה לא תקינה.`,

    // Error
    IVR_error: `מצטערים, אירעה שגיאה. אנא נסה שוב מאוחר יותר.`
};

/**
 * Get message text by key
 * @param {string} key - Message key
 * @returns {string} Message text
 */
function getMessage(key) {
    return IVR_MESSAGES[key] || 'שלום';
}

/**
 * Update a message (for admin use)
 * @param {string} key - Message key
 * @param {string} text - New message text
 */
function setMessage(key, text) {
    if (IVR_MESSAGES.hasOwnProperty(key)) {
        IVR_MESSAGES[key] = text;
        console.log(`📝 Message ${key} updated`);
        return true;
    }
    return false;
}

/**
 * Get all messages (for admin view)
 */
function getAllMessages() {
    return { ...IVR_MESSAGES };
}

module.exports = {
    IVR_MESSAGES,
    getMessage,
    setMessage,
    getAllMessages
};
