/**
 * WhatsApp Bot Service
 * Handles incoming WhatsApp messages and manages conversation flow
 * 
 * Flow:
 * 1. bot_start → Initial message with "Start" button
 * 2. Main menu → "Office Info" or "Leave a Message"
 * 3a. Office Info → Shows hours, button to go back
 * 3b. Leave a Message → Collects message → bot_thank_you
 */

const { getBookingSettings } = require('../google/sheets');
const { BOT_STATES, PREFERRED_TIME, HEBREW_DAYS, DAY_ORDER, CACHE_DURATION } = require('../../constants');

// Bot messages in Hebrew
const BOT_MESSAGES = {
    bot_start: `שלום! 👋

אנחנו שמחים שפניתם אלינו.
לחצו על הכפתור למטה כדי להתחיל.`,

    bot_menu: `מה תרצו לעשות?

1️⃣ מידע על המשרד
2️⃣ השארת הודעה`,

    bot_office_info: `🏢 *מידע על המשרד*

📍 שעות פעילות:
{hours}

📞 ניתן ליצור קשר גם בטלפון בשעות הפעילות.`,

    bot_ask_message: `📝 אנא כתבו את ההודעה שלכם ונציג יחזור אליכם בהקדם:`,

    bot_ask_time: `🕐 מתי נוח לכם שנחזור אליכם?

1️⃣ בוקר (08:00-12:00)
2️⃣ צהריים (12:00-16:00)
3️⃣ ערב (16:00-20:00)
4️⃣ בכל שעה`,

    bot_thank_you: `✅ תודה רבה!

ההודעה שלכם התקבלה ונציג יחזור אליכם בהקדם האפשרי.

שיהיה לכם יום נפלא! 🌟`,

    bot_invalid: `לא הבנתי את הבקשה.
אנא בחרו מהאפשרויות למטה.`,

    bot_error: `אירעה שגיאה. אנא נסו שוב מאוחר יותר.`
};

// Track conversation state per user
const conversationState = new Map();

// Preferred time options mapping
const PREFERRED_TIME_OPTIONS = {
    '1': PREFERRED_TIME.MORNING,
    'morning': PREFERRED_TIME.MORNING,
    'בוקר': PREFERRED_TIME.MORNING,
    '2': PREFERRED_TIME.NOON,
    'noon': PREFERRED_TIME.NOON,
    'צהריים': PREFERRED_TIME.NOON,
    '3': PREFERRED_TIME.EVENING,
    'evening': PREFERRED_TIME.EVENING,
    'ערב': PREFERRED_TIME.EVENING,
    '4': PREFERRED_TIME.ANYTIME,
    'anytime': PREFERRED_TIME.ANYTIME,
    'כל שעה': PREFERRED_TIME.ANYTIME,
    'בכל שעה': PREFERRED_TIME.ANYTIME
};

/**
 * Format working hours for display
 */
async function formatWorkingHours() {
    try {
        const settings = await getBookingSettings();
        const workingHours = settings.workingHours;

        const lines = [];
        
        for (const day of DAY_ORDER) {
            const hours = workingHours[day];
            if (hours) {
                lines.push(`יום ${HEBREW_DAYS[day]}: ${hours.start} - ${hours.end}`);
            } else {
                lines.push(`יום ${HEBREW_DAYS[day]}: סגור`);
            }
        }
        
        return lines.join('\n');
    } catch (error) {
        console.error('Error getting working hours:', error.message);
        return 'שעות פעילות: א-ה 09:00-17:00';
    }
}

/**
 * Get or create conversation state for a user
 */
function getState(phoneNumber) {
    if (!conversationState.has(phoneNumber)) {
        conversationState.set(phoneNumber, {
            state: BOT_STATES.INITIAL,
            lastActivity: Date.now()
        });
    }
    return conversationState.get(phoneNumber);
}

/**
 * Set conversation state for a user
 */
function setState(phoneNumber, newState, data = {}) {
    conversationState.set(phoneNumber, {
        state: newState,
        lastActivity: Date.now(),
        ...data
    });
}

/**
 * Clear old conversations (cleanup after 1 hour of inactivity)
 */
function cleanupOldConversations() {
    const now = Date.now();
    
    for (const [phone, data] of conversationState.entries()) {
        if (now - data.lastActivity > CACHE_DURATION.CONVERSATION) {
            conversationState.delete(phone);
        }
    }
}

// Run cleanup every 30 minutes
setInterval(cleanupOldConversations, 30 * 60 * 1000);

/**
 * Generate response based on conversation state and user input
 * @param {string} phoneNumber - User's phone number
 * @param {string} messageBody - Message content
 * @param {string} senderName - Sender's profile name
 * @param {Function} saveInquiryFn - Function to save inquiry (injected to avoid circular dep)
 */
async function handleIncomingMessage(phoneNumber, messageBody, senderName = '', saveInquiryFn = null) {
    const currentState = getState(phoneNumber);
    const input = messageBody.trim().toLowerCase();
    
    console.log(`📱 WhatsApp from ${phoneNumber} (state: ${currentState.state}): ${messageBody}`);

    try {
        switch (currentState.state) {
            case BOT_STATES.INITIAL:
                setState(phoneNumber, BOT_STATES.MENU);
                return {
                    message: BOT_MESSAGES.bot_menu,
                    buttons: [
                        { id: 'office_info', title: 'מידע על המשרד' },
                        { id: 'leave_message', title: 'השארת הודעה' }
                    ],
                    state: BOT_STATES.MENU
                };

            case BOT_STATES.MENU:
                if (input === '1' || input === 'office_info' || input.includes('מידע')) {
                    const hours = await formatWorkingHours();
                    const message = BOT_MESSAGES.bot_office_info.replace('{hours}', hours);
                    
                    return {
                        message,
                        buttons: [
                            { id: 'back_menu', title: 'חזרה לתפריט' },
                            { id: 'leave_message', title: 'השארת הודעה' }
                        ],
                        state: BOT_STATES.MENU
                    };
                } 
                else if (input === '2' || input === 'leave_message' || input.includes('הודעה')) {
                    setState(phoneNumber, BOT_STATES.AWAITING_MESSAGE, { name: senderName });
                    return {
                        message: BOT_MESSAGES.bot_ask_message,
                        state: BOT_STATES.AWAITING_MESSAGE
                    };
                }
                else if (input === 'back_menu' || input.includes('חזרה') || input.includes('תפריט')) {
                    return {
                        message: BOT_MESSAGES.bot_menu,
                        buttons: [
                            { id: 'office_info', title: 'מידע על המשרד' },
                            { id: 'leave_message', title: 'השארת הודעה' }
                        ],
                        state: BOT_STATES.MENU
                    };
                }
                else {
                    return {
                        message: BOT_MESSAGES.bot_invalid,
                        buttons: [
                            { id: 'office_info', title: 'מידע על המשרד' },
                            { id: 'leave_message', title: 'השארת הודעה' }
                        ],
                        state: BOT_STATES.MENU
                    };
                }

            case BOT_STATES.AWAITING_MESSAGE:
                setState(phoneNumber, BOT_STATES.AWAITING_PREFERRED_TIME, { 
                    name: currentState.name || senderName || 'WhatsApp User',
                    message: messageBody 
                });
                return {
                    message: BOT_MESSAGES.bot_ask_time,
                    buttons: [
                        { id: 'time_morning', title: 'בוקר' },
                        { id: 'time_noon', title: 'צהריים' },
                        { id: 'time_evening', title: 'ערב' },
                        { id: 'time_anytime', title: 'בכל שעה' }
                    ],
                    state: BOT_STATES.AWAITING_PREFERRED_TIME
                };

            case BOT_STATES.AWAITING_PREFERRED_TIME:
                let preferredTime = PREFERRED_TIME.ANYTIME;
                
                const timeInput = input.replace('time_', '');
                if (PREFERRED_TIME_OPTIONS[timeInput]) {
                    preferredTime = PREFERRED_TIME_OPTIONS[timeInput];
                }

                // Save inquiry if function provided
                if (saveInquiryFn) {
                    const inquiry = {
                        name: currentState.name || senderName || 'WhatsApp User',
                        phone: phoneNumber,
                        message: currentState.message || '',
                        preferredTime: preferredTime,
                        source: 'whatsapp_bot'
                    };

                    await saveInquiryFn(inquiry);
                    console.log(`✅ Inquiry saved from WhatsApp: ${phoneNumber} (preferred: ${preferredTime})`);
                }

                setState(phoneNumber, BOT_STATES.COMPLETED);
                return {
                    message: BOT_MESSAGES.bot_thank_you,
                    buttons: [
                        { id: 'start_new', title: 'התחל שיחה חדשה' }
                    ],
                    state: BOT_STATES.COMPLETED
                };

            case BOT_STATES.COMPLETED:
                setState(phoneNumber, BOT_STATES.MENU);
                return {
                    message: BOT_MESSAGES.bot_menu,
                    buttons: [
                        { id: 'office_info', title: 'מידע על המשרד' },
                        { id: 'leave_message', title: 'השארת הודעה' }
                    ],
                    state: BOT_STATES.MENU
                };

            default:
                setState(phoneNumber, BOT_STATES.MENU);
                return {
                    message: BOT_MESSAGES.bot_menu,
                    buttons: [
                        { id: 'office_info', title: 'מידע על המשרד' },
                        { id: 'leave_message', title: 'השארת הודעה' }
                    ],
                    state: BOT_STATES.MENU
                };
        }
    } catch (error) {
        console.error('Error handling WhatsApp message:', error.message);
        return {
            message: BOT_MESSAGES.bot_error,
            state: currentState.state
        };
    }
}

/**
 * Generate the initial bot_start message (for IVR redirect)
 */
function getBotStartMessage() {
    return {
        message: BOT_MESSAGES.bot_start,
        buttons: [
            { id: 'start_chat', title: 'התחל שיחה' }
        ]
    };
}

/**
 * Reset user conversation state (for testing)
 */
function resetUserState(phoneNumber) {
    conversationState.delete(phoneNumber);
    console.log(`🔄 Reset state for ${phoneNumber}`);
}

/**
 * Get all bot messages (for admin view)
 */
function getAllBotMessages() {
    return { ...BOT_MESSAGES };
}

module.exports = {
    handleIncomingMessage,
    getBotStartMessage,
    resetUserState,
    getAllBotMessages,
    BOT_MESSAGES
};
