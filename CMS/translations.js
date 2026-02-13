// Translation system for Communication Management System
const translations = {
    en: {
        // Header
        title: "Communication Management System",
        refresh: "Refresh",
        lastUpdated: "Last updated",
        
        // Dashboard
        totalInquiries: "Total Inquiries",
        totalMessages: "WhatsApp Messages", 
        totalCalls: "Total Calls",
        newToday: "New Today",
        
        // Filters
        filters: "Filters",
        dateRange: "Date Range",
        allTime: "All Time",
        today: "Today",
        thisWeek: "This Week",
        thisMonth: "This Month",
        customRange: "Custom Range",
        customDateRange: "Custom Date Range",
        status: "Status",
        allStatus: "All Status",
        source: "Source",
        allSources: "All Sources",
        search: "Search by name, phone, email...",
        searchButton: "Search",
        clearFilters: "Clear Filters",
        
        // Tabs
        inquiries: "Inquiries",
        messages: "WhatsApp Messages",
        calls: "Call Records",
        
        // Table Headers
        date: "Date",
        name: "Name",
        contact: "Contact",
        service: "Service",
        source: "Source",
        status: "Status",
        actions: "Actions",
        
        // Detail modal
        inquiryDetails: "Inquiry Details",
        messageDetails: "Message Details",
        callDetails: "Call Details",
        close: "Close",
        
        // Status options
        statusNew: "New",
        statusContacted: "Contacted",
        statusInProgress: "In Progress",
        statusClosed: "Closed",
        
        // Source options
        sourceWebsite: "Website",
        sourceWhatsapp: "WhatsApp",
        sourcePhone: "Phone",
        
        // Loading messages
        loadingInquiries: "Loading inquiries...",
        loadingMessages: "Loading messages...",
        loadingCalls: "Loading call records...",
        
        // Error messages
        errorLoading: "Error loading data",
        errorSaving: "Error saving data",
        itemUpdated: "Item updated successfully",
        
        // Customer Detail Page
        backToCMS: "Back to CMS",
        edit: "Edit",
        addNote: "Add Note",
        editInquiry: "Edit Inquiry",
        customerUpdated: "Customer updated successfully",
        
        // Customer page components
        basicInfo: "Basic Information",
        healthInfo: "Health Information",
        requestHistory: "Request History",
        communicationHistory: "Communication History",
        contacts: "Contacts",
        primaryContact: "Primary Contact",
        additionalContacts: "Additional Contacts",
        addContact: "Add Contact",
        funnelProcess: "Funnel Process",
        firstCallDate: "First Call Date",
        hasNeed: "Has Need Clinic Can Provide?",
        familiarWithDoctor: "Familiar with Doctor?",
        understandsPricing: "Understands Pricing Advantage?",
        bookedSession: "Booked a Session?",
        bookedCallWithDoctor: "Booked a Call with Doctor?",
        nextFollowUp: "Next Follow-up",
        callLog: "Historic Call Log",
        fullName: "Full Name",
        phone: "Phone Number",
        email: "Email Address",
        address: "Address",
        pregnancyWeek: "Pregnancy Week",
        ultrasoundDate: "Ultrasound Scan Date",
        otherChildren: "Other Children",
        relationshipType: "Relationship Type",
        contactName: "Name",
        contactPhone: "Contact Phone",
        contactEmail: "Contact Email",
        save: "Save",
        cancel: "Cancel",
        
        // Outcome Values
        outcomeAnswered: "Answered",
        outcomeNoAnswerHangup: "No Answer - Hangup",
        outcomeNoAnswerWhatsapp: "No Answer - WhatsApp",
        outcomeClosedHoursWhatsapp: "Closed Hours - WhatsApp",
        outcomeMenuWhatsapp: "Menu - WhatsApp",
        outcomeIncoming: "Incoming",
        
        // Actions
        view: "View",
        edit: "Edit",
        save: "Save",
        cancel: "Cancel",
        delete: "Delete",
        close: "Close",
        
        // Modals
        inquiryDetails: "Inquiry Details",
        messageDetails: "Message Details", 
        callDetails: "Call Details",
        pregnancyWeek: "Pregnancy Week",
        notes: "Notes",
        twilioCallSid: "Twilio Call SID",
        profileName: "Profile Name",
        phoneNumber: "Phone Number",
        mediaType: "Media Type",
        mediaUrl: "Media URL",
        
        // Loading States
        loadingInquiries: "Loading inquiries...",
        loadingMessages: "Loading WhatsApp messages...",
        loadingCalls: "Loading call records...",
        noInquiries: "No inquiries found",
        noMessages: "No WhatsApp messages found", 
        noCalls: "No call records found",
        
        // Form Labels
        editInquiry: "Edit Inquiry",
        editMessage: "Edit Message",
        editCall: "Edit Call Record",
        isRelevantCustomer: "Relevant Customer",
        communicationStatus: "Communication Status",
        customerNotes: "Customer Notes",
        
        // Communication Status Values
        commStatusPending: "Pending",
        commStatusActive: "Active",
        commStatusCompleted: "Completed",
        commStatusOnHold: "On Hold",
        
        // Relevance Values
        relevanceRelevant: "Relevant",
        relevanceNotRelevant: "Not Relevant",
        relevancePotential: "Potential",
        relevanceUnknown: "Unknown",
        
        // Messages
        confirmDelete: "Are you sure you want to delete this item?",
        itemDeleted: "Item deleted successfully",
        itemUpdated: "Item updated successfully",
        errorLoading: "Failed to load data",
        errorSaving: "Failed to save changes",
        errorDeleting: "Failed to delete item",
        
        // Language
        language: "Language",
        english: "English",
        hebrew: "עברית"
    },
    
    he: {
        // Header
        title: "מערכת ניהול תקשורת",
        refresh: "רענן",
        lastUpdated: "עודכן לאחרונה",
        
        // Dashboard
        totalInquiries: "סה\"כ פניות",
        totalMessages: "הודעות וואטסאפ",
        totalCalls: "סה\"כ שיחות",
        newToday: "חדש היום",
        
        // Filters
        filters: "סינונים",
        dateRange: "טווח תאריכים",
        allTime: "כל הזמן",
        today: "היום",
        thisWeek: "השבוע",
        thisMonth: "החודש",
        customRange: "טווח מותאם אישית",
        customDateRange: "טווח תאריכים מותאם אישית",
        status: "סטטוס",
        allStatus: "כל הסטטוסים",
        source: "מקור",
        allSources: "כל המקורות",
        search: "חיפוש לפי שם, טלפון, אימייל...",
        searchButton: "חיפוש",
        clearFilters: "נקה סינונים",
        
        // Tabs
        inquiries: "פניות",
        messages: "הודעות וואטסאפ",
        calls: "רישומי שיחות",
        
        // Table Headers
        date: "תאריך",
        name: "שם",
        contact: "איש קשר",
        service: "שירות",
        phone: "טלפון",
        email: "אימייל",
        message: "הודעה",
        direction: "כיוון",
        duration: "משך",
        officeStatus: "סטטוס משרד",
        outcome: "תוצאה",
        actions: "פעולות",
        
        // Status Values
        statusNew: "חדש",
        statusContacted: "נוצר קשר",
        statusInProgress: "בתהליך",
        statusClosed: "סגור",
        
        // Source Values
        sourceWebsite: "אתר",
        sourceWhatsapp: "וואטסאפ",
        sourcePhone: "טלפון",
        
        // Direction Values
        incoming: "נכנסת",
        outgoing: "יוצאת",
        
        // Office Status Values
        officeOpen: "פתוח",
        officeClosed: "סגור",
        officeUnknown: "לא ידוע",
        
        // Outcome Values
        outcomeAnswered: "נענתה",
        outcomeNoAnswerHangup: "לא נענה - ניתוק",
        outcomeNoAnswerWhatsapp: "לא נענה - וואטסאפ",
        outcomeClosedHoursWhatsapp: "שעות סגירה - וואטסאפ",
        outcomeMenuWhatsapp: "תפריט - וואטסאפ",
        outcomeIncoming: "נכנסת",
        
        // Actions
        view: "צפה",
        edit: "ערוך",
        save: "שמור",
        cancel: "בטל",
        delete: "מחק",
        close: "סגור",
        
        // Modals
        inquiryDetails: "פרטי פנייה",
        messageDetails: "פרטי הודעה",
        callDetails: "פרטי שיחה",
        pregnancyWeek: "שבוע הריון",
        notes: "הערות",
        twilioCallSid: "מזהה שיחה Twilio",
        profileName: "שם פרופיל",
        phoneNumber: "מספר טלפון",
        mediaType: "סוג מדיה",
        mediaUrl: "כתובת מדיה",
        
        // Loading States
        loadingInquiries: "טוען פניות...",
        loadingMessages: "טוען הודעות וואטסאפ...",
        loadingCalls: "טוען רישומי שיחות...",
        noInquiries: "לא נמצאו פניות",
        noMessages: "לא נמצאו הודעות וואטסאפ",
        noCalls: "לא נמצאו רישומי שיחות",
        
        // Form Labels
        editInquiry: "ערוך פנייה",
        editMessage: "ערוך הודעה",
        editCall: "ערוך רישום שיחה",
        isRelevantCustomer: "לקוח רלוונטי",
        communicationStatus: "סטטוס תקשורת",
        customerNotes: "הערות לקוח",
        
        // Communication Status Values
        commStatusPending: "ממתין",
        commStatusActive: "פעיל",
        commStatusCompleted: "הושלם",
        commStatusOnHold: "מושהה",
        
        // Relevance Values
        relevanceRelevant: "רלוונטי",
        relevanceNotRelevant: "לא רלוונטי",
        relevancePotential: "פוטנציאלי",
        relevanceUnknown: "לא ידוע",
        
        // Messages
        confirmDelete: "האם אתה בטוח שברצונך למחוק פריט זה?",
        itemDeleted: "הפריט נמחק בהצלחה",
        itemUpdated: "הפריט עודכן בהצלחה",
        errorLoading: "טעינת נתונים נכשלה",
        errorSaving: "שמירת השינויים נכשלה",
        errorDeleting: "מחיקת הפריט נכשלה",
        
        // Language
        language: "שפה",
        english: "English",
        hebrew: "עברית"
    }
};

// Current language state
let currentLanguage = localStorage.getItem('cmsLanguage') || 'en';

// Translation function
function t(key) {
    return translations[currentLanguage][key] || translations.en[key] || key;
}

// Set language
function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('cmsLanguage', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    updateUI();
}

// Update UI with current language
function updateUI() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = t(key);
    });
    
    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        element.placeholder = t(key);
    });
    
    // Update title
    document.title = t('title');
}

// Initialize language on page load
document.addEventListener('DOMContentLoaded', function() {
    setLanguage(currentLanguage);
});
