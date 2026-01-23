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

const { getBookingSettings } = require('./googleSheets');
const { saveInquiry } = require('./inquiries');

// Bot messages in Hebrew
const BOT_MESSAGES = {
    // Initial message sent when redirecting from IVR
    bot_start: `שלום! 👋

אנחנו שמחים שפניתם אלינו.
לחצו על הכפתור למטה כדי להתחיל.`,

    // Main menu
    bot_menu: `מה תרצו לעשות?

1️⃣ מידע על המשרד
2️⃣ השארת הודעה`,

    // Office info - will be dynamically filled
    bot_office_info: `🏢 *מידע על המשרד*

📍 שעות פעילות:
{hours}

📞 ניתן ליצור קשר גם בטלפון בשעות הפעילות.`,

    // Request for message
    bot_ask_message: `📝 אנא כתבו את ההודעה שלכם ונציג יחזור אליכם בהקדם:`,

    // Ask for preferred time to call back
    bot_ask_time: `🕐 מתי נוח לכם שנחזור אליכם?

1️⃣ בוקר (08:00-12:00)
2️⃣ צהריים (12:00-16:00)
3️⃣ ערב (16:00-20:00)
4️⃣ בכל שעה`,

    // Thank you after message received
    bot_thank_you: `✅ תודה רבה!

ההודעה שלכם התקבלה ונציג יחזור אליכם בהקדם האפשרי.

שיהיה לכם יום נפלא! 🌟`,

    // Invalid input
    bot_invalid: `לא הבנתי את הבקשה.
אנא בחרו מהאפשרויות למטה.`,

    // Error message
    bot_error: `אירעה שגיאה. אנא נסו שוב מאוחר יותר.`
};

// Track conversation state per user (phone number -> state)
const conversationState = new Map();

// State constants
const STATES = {
    INITIAL: 'initial',
    MENU: 'menu',
    AWAITING_MESSAGE: 'awaiting_message',
    AWAITING_PREFERRED_TIME: 'awaiting_preferred_time',
    COMPLETED: 'completed'
};

// Preferred time options mapping
const PREFERRED_TIME_OPTIONS = {
    '1': 'morning',
    'morning': 'morning',
    'בוקר': 'morning',
    '2': 'noon',
    'noon': 'noon',
    'צהריים': 'noon',
    '3': 'evening',
    'evening': 'evening',
    'ערב': 'evening',
    '4': 'anytime',
    'anytime': 'anytime',
    'כל שעה': 'anytime',
    'בכל שעה': 'anytime'
};

// Hebrew display names for preferred times
const PREFERRED_TIME_DISPLAY = {
    'morning': 'בוקר',
    'noon': 'צהריים',
    'evening': 'ערב',
    'anytime': 'בכל שעה'
};

/**
 * Format working hours for display
 */
async function formatWorkingHours() {
    try {
        const settings = await getBookingSettings();
        const workingHours = settings.workingHours;
        
        const dayNames = {
            sunday: 'ראשון',
            monday: 'שני',
            tuesday: 'שלישי',
            wednesday: 'רביעי',
            thursday: 'חמישי',
            friday: 'שישי',
            saturday: 'שבת'
        };

        const lines = [];
        const dayOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        
        for (const day of dayOrder) {
            const hours = workingHours[day];
            if (hours) {
                lines.push(`יום ${dayNames[day]}: ${hours.start} - ${hours.end}`);
            } else {
                lines.push(`יום ${dayNames[day]}: סגור`);
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
            state: STATES.INITIAL,
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
    const ONE_HOUR = 60 * 60 * 1000;
    const now = Date.now();
    
    for (const [phone, data] of conversationState.entries()) {
        if (now - data.lastActivity > ONE_HOUR) {
            conversationState.delete(phone);
        }
    }
}

// Run cleanup every 30 minutes
setInterval(cleanupOldConversations, 30 * 60 * 1000);

/**
 * Generate response based on conversation state and user input
 * Returns: { message, buttons?, state }
 */
async function handleIncomingMessage(phoneNumber, messageBody, senderName = '') {
    const currentState = getState(phoneNumber);
    const input = messageBody.trim().toLowerCase();
    
    console.log(`📱 WhatsApp from ${phoneNumber} (state: ${currentState.state}): ${messageBody}`);

    try {
        switch (currentState.state) {
            case STATES.INITIAL:
                // User clicked "Start" button or sent initial message
                setState(phoneNumber, STATES.MENU);
                return {
                    message: BOT_MESSAGES.bot_menu,
                    buttons: [
                        { id: 'office_info', title: 'מידע על המשרד' },
                        { id: 'leave_message', title: 'השארת הודעה' }
                    ],
                    state: STATES.MENU
                };

            case STATES.MENU:
                // User selected menu option
                if (input === '1' || input === 'office_info' || input.includes('מידע')) {
                    // Show office info
                    const hours = await formatWorkingHours();
                    const message = BOT_MESSAGES.bot_office_info.replace('{hours}', hours);
                    
                    return {
                        message,
                        buttons: [
                            { id: 'back_menu', title: 'חזרה לתפריט' },
                            { id: 'leave_message', title: 'השארת הודעה' }
                        ],
                        state: STATES.MENU
                    };
                } 
                else if (input === '2' || input === 'leave_message' || input.includes('הודעה')) {
                    // Ask for message
                    setState(phoneNumber, STATES.AWAITING_MESSAGE, { name: senderName });
                    return {
                        message: BOT_MESSAGES.bot_ask_message,
                        state: STATES.AWAITING_MESSAGE
                    };
                }
                else if (input === 'back_menu' || input.includes('חזרה') || input.includes('תפריט')) {
                    // Back to menu
                    return {
                        message: BOT_MESSAGES.bot_menu,
                        buttons: [
                            { id: 'office_info', title: 'מידע על המשרד' },
                            { id: 'leave_message', title: 'השארת הודעה' }
                        ],
                        state: STATES.MENU
                    };
                }
                else {
                    // Invalid input, show menu again
                    return {
                        message: BOT_MESSAGES.bot_invalid,
                        buttons: [
                            { id: 'office_info', title: 'מידע על המשרד' },
                            { id: 'leave_message', title: 'השארת הודעה' }
                        ],
                        state: STATES.MENU
                    };
                }

            case STATES.AWAITING_MESSAGE:
                // User sent their message - store it and ask for preferred time
                setState(phoneNumber, STATES.AWAITING_PREFERRED_TIME, { 
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
                    state: STATES.AWAITING_PREFERRED_TIME
                };

            case STATES.AWAITING_PREFERRED_TIME:
                // User selected preferred time - now save the inquiry
                let preferredTime = 'anytime';
                
                // Check for button payload or text input
                const timeInput = input.replace('time_', '');
                if (PREFERRED_TIME_OPTIONS[timeInput]) {
                    preferredTime = PREFERRED_TIME_OPTIONS[timeInput];
                }

                const inquiry = {
                    name: currentState.name || senderName || 'WhatsApp User',
                    phone: phoneNumber,
                    message: currentState.message || '',
                    preferredTime: preferredTime,
                    source: 'whatsapp_bot'
                };

                await saveInquiry(inquiry);
                console.log(`✅ Inquiry saved from WhatsApp: ${phoneNumber} (preferred: ${preferredTime})`);

                setState(phoneNumber, STATES.COMPLETED);
                return {
                    message: BOT_MESSAGES.bot_thank_you,
                    buttons: [
                        { id: 'start_new', title: 'התחל שיחה חדשה' }
                    ],
                    state: STATES.COMPLETED
                };

            case STATES.COMPLETED:
                // User wants to start new conversation
                if (input === 'start_new' || input.includes('חדש') || input.includes('התחל')) {
                    setState(phoneNumber, STATES.MENU);
                    return {
                        message: BOT_MESSAGES.bot_menu,
                        buttons: [
                            { id: 'office_info', title: 'מידע על המשרד' },
                            { id: 'leave_message', title: 'השארת הודעה' }
                        ],
                        state: STATES.MENU
                    };
                }
                // Any other message also restarts
                setState(phoneNumber, STATES.MENU);
                return {
                    message: BOT_MESSAGES.bot_menu,
                    buttons: [
                        { id: 'office_info', title: 'מידע על המשרד' },
                        { id: 'leave_message', title: 'השארת הודעה' }
                    ],
                    state: STATES.MENU
                };

            default:
                // Reset to menu if unknown state
                setState(phoneNumber, STATES.MENU);
                return {
                    message: BOT_MESSAGES.bot_menu,
                    buttons: [
                        { id: 'office_info', title: 'מידע על המשרד' },
                        { id: 'leave_message', title: 'השארת הודעה' }
                    ],
                    state: STATES.MENU
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
    BOT_MESSAGES,
    STATES
};

