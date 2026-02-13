# Communication Management System (CMS)

A modern web interface for visualizing and managing customer communications across multiple channels including website inquiries, WhatsApp messages, and phone calls.

## Features

### 📊 Data Visualization
- **Dashboard Statistics**: Real-time overview of all communications
- **Multi-channel View**: Unified view of inquiries, WhatsApp messages, and call records
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### 🔍 Advanced Filtering
- **Date Range Filtering**: Pre-defined ranges (Today, This Week, This Month) or custom date selection
- **Status Filtering**: Filter by communication status (New, Contacted, In Progress, Closed)
- **Source Filtering**: Filter by communication source (Website, WhatsApp, Phone)
- **Search Functionality**: Search by name, phone number, email, or message content

### 📋 Data Tables
- **Sortable Columns**: Click column headers to sort data
- **Detailed Views**: Click eye icon to view full details of any record
- **Status Indicators**: Color-coded badges for quick status identification
- **Hover Effects**: Interactive row highlighting for better UX

## Data Sources

### 📧 Website Inquiries
- Contact form submissions
- Includes name, phone, email, service requested, pregnancy week, and message
- Source tracking and status management

### 💬 WhatsApp Messages
- Incoming and outgoing WhatsApp messages
- Phone number and profile name tracking
- Message direction indicators
- Media support (images, documents, etc.)

### 📞 Call Records
- Incoming call tracking
- Office status (open/closed) recording
- Call outcomes (answered, no answer, WhatsApp redirect, etc.)
- Call duration tracking

## Getting Started

### Prerequisites
- Node.js server running with the updated API endpoints
- PostgreSQL database with the required tables
- Twilio integration for WhatsApp functionality

### Installation

1. **Start the Server**
   ```bash
   cd server
   npm start
   ```

2. **Open the CMS**
   Navigate to `http://localhost:3000/CMS/` in your browser

   Note: The server should be configured to serve static files from the CMS directory. You may need to add the following to your server's index.js:

   ```javascript
   // Serve static files
   app.use(express.static('CMS'));
   ```

### Database Setup

The system requires the following database tables:
- `inquiries` - Website contact form submissions
- `whatsapp_messages` - WhatsApp conversation history  
- `calls` - Incoming call records
- `job_state` - Scheduled job tracking

The database schema is automatically created when the server starts.

## API Endpoints

### Dashboard
- `GET /api/cms/dashboard` - Get dashboard statistics

### Inquiries
- `GET /api/cms/inquiries` - Get all inquiries with filters
- `GET /api/cms/inquiries/:id` - Get specific inquiry
- `PATCH /api/cms/inquiries/:id` - Update inquiry

### Customers
- `GET /api/cms/customers` - Get all customers with optional filters
- `GET /api/cms/customers/:id` - Get a specific customer
- `PATCH /api/cms/customers/:id` - Update customer information
- `GET /api/cms/messages` - Get WhatsApp messages with filters
- `GET /api/cms/messages/:id` - Get specific message

### Call Records
- `GET /api/cms/calls` - Get call records with filters
- `GET /api/cms/calls/:id` - Get specific call record

### Statistics
- `GET /api/cms/stats` - Get detailed statistics for date range

## Usage Guide

### Viewing Data
1. **Dashboard**: Overview cards show total counts and today's activity
2. **Tabs**: Switch between Inquiries, Messages, and Calls using the tab navigation
3. **Tables**: Each tab displays relevant data in a sortable table format

### Filtering Data
1. **Date Range**: Select from pre-defined ranges or choose custom dates
2. **Status/Source**: Use dropdown filters to narrow results
3. **Search**: Type in the search box to find specific records
4. **Apply**: Click the Search button to apply filters
5. **Clear**: Click Clear Filters to reset all filters

### Viewing Details
1. Click the eye icon (👁️) in any table row to view full details
2. A modal will display all available information for that record
3. Click Close or outside the modal to return to the table

### Sorting Data
1. Click any column header to sort by that field
2. Click again to reverse the sort direction
3. Sort indicators show current sort field and direction

## System Architecture

### 📊 Page 1: Inquiry Logger (Read-Only)
- **Lead Aggregation**: Automatically logs all incoming leads from multiple channels
  - Website contact form submissions
  - WhatsApp message interactions  
  - Incoming phone call records
- **Automatic Assessment**: AI-powered lead scoring based on:
  - Customer needs and requirements
  - Historical interaction data
  - Pregnancy week and service relevance
- **Lead Prioritization**: Smart sorting by:
  - Urgency level (immediate vs. scheduled needs)
  - Conversion potential (high, medium, low)
  - Time-sensitive factors (pregnancy week milestones)

### 👥 Page 2: Customer Management & Funnel (Editable)
Comprehensive customer relationship management with detailed tracking and funnel management.

#### 📋 Customer Profile Components
**Customer Request History**
- Current request and actual need tracking
- Complete edit history with timestamps
- Requirement evolution documentation
- Service preference changes over time

**Customer Health & Medical Information**
- Pregnancy week tracking with automatic milestone alerts
- Ultrasound scan dates and scheduling
- Previous children and family planning details
- Medical history relevant to clinic services
- Treatment progress tracking

**Customer Contact Details**
- Primary contact information: Name, phone, email, address
- Extended contact network management:
  - Partner details (multiple contacts supported)
  - Parent/guardian information
  - Emergency contacts
  - Referral source tracking
- Contact preference management (phone, WhatsApp, email)

#### 📞 Historic Call Log
- **Complete call history** with detailed metadata:
  - Date and time stamps
  - Contact mode (incoming, outgoing, missed)
  - Call handling status and outcomes
  - Duration and connection quality metrics
  - Follow-up task creation

#### 🎯 Inquiry Funnel Process (Editable)
**Multi-Stage Funnel Tracking**
- **First Contact**: Date, time, and channel details
- **Need Assessment**: 
  - Has a need that clinic can provide? ✓/✗
  - Service matching analysis
  - Potential customer classification
- **Relationship Building**:
  - Familiarity with specific doctors
  - Pricing advantage understanding
  - Trust level assessment
- **Conversion Tracking**:
  - Session booking status
  - Doctor consultation scheduling
  - Call completion rates
- **Follow-up Management**:
  - Automated reminders based on pregnancy week
  - Callback scheduling for promised follow-ups
  - Think-time tracking for decision periods
  - Event-triggered outreach (ultrasound dates, etc.)

#### 🔄 Workflow Automation
**Smart Reminder System**
- Pregnancy week-based automatic reminders
- Promise-based callback scheduling
- Decision deadline tracking
- Multi-contact coordination

**Communication Status Management**
- Real-time status updates across all channels
- Handoff tracking between team members
- Escalation management for urgent cases

## Future Development Phases

### Phase 2: Customer Management ✅ COMPLETED
- **Customer Profiles**: Unified customer view across all channels ✅
- **Relevance Tagging**: Mark customers as relevant/non-relevant ✅
- **Communication Status**: Track communication progress with each customer ✅
- **Customer Notes**: Add and edit notes for each customer ✅
- **Multi-language Support**: Hebrew/English with RTL layout ✅

### Phase 3: Advanced Features (In Progress)
- **Customer Detail Pages**: Individual customer pages with full history 📋
- **Extended Contact Network**: Partner, parent, and emergency contacts management 👥
- **Pregnancy Week Tracking**: Automated reminders and milestone alerts 🤰
- **Advanced Funnel Management**: Complete conversion tracking 🎯
- **Smart Assessment**: AI-powered lead scoring and needs analysis 🧠
- **Bulk Operations**: Select and update multiple records 📊
- **Export Functionality**: Export data to CSV/Excel 📤
- **Analytics Dashboard**: Advanced charts and trends 📈
- **Automated Workflows**: Rule-based customer management 🤖
- **Integration**: Connect with CRM systems 🔗

#### 📋 Customer Detail Page Components
**Primary Customer Information**
- Complete profile with photo upload capability
- Contact history across all channels (calls, messages, inquiries)
- Communication preference management
- Source attribution and referral tracking

**Request & Need Management**
- Current request with priority level
- Actual need assessment and validation
- Complete edit history with timestamps
- Service requirement evolution tracking
- Automated need-to-service matching

**Health & Medical Tracking**
- Pregnancy week calculator with milestone alerts
- Ultrasound scan date scheduling and reminders
- Previous children and family planning
- Medical history relevant to clinic services
- Treatment progress and outcome tracking

**Extended Contact Network**
- Partner details (multiple supported)
- Parent/guardian information
- Emergency contacts with relationship types
- Referral source and influence mapping
- Contact preference and availability management

**Historic Communication Log**
- Complete call history with detailed metadata
- WhatsApp conversation threading
- Email communication tracking
- Multi-channel interaction timeline
- Response time and outcome metrics

**Advanced Funnel Management**
- Multi-stage conversion tracking
- Automated next-step recommendations
- Decision deadline tracking
- Promise-based follow-up scheduling
- Pregnancy week-triggered outreach
- Conversion probability scoring

**Workflow Automation**
- Smart reminder system with multiple triggers
- Automated task assignment based on customer type
- Escalation rules for urgent cases
- Multi-contact coordination and handoff
- Performance analytics and optimization suggestions

### Frontend Technologies
- **HTML5**: Semantic markup
- **Tailwind CSS**: Utility-first styling
- **Vanilla JavaScript**: No framework dependencies
- **Font Awesome**: Icon library

### 🔗 Navigation & Access

#### From Main CMS (index.html)
- **View Customer**: Click eye icon (👁️) in any inquiry row → `customer.html?id={inquiryId}&mode=view`
- **Edit Customer**: Click edit icon (✏️) in any inquiry row → `customer.html?id={inquiryId}&mode=edit`
- **Direct Access**: Navigate directly to `customer.html?id={customerId}`

#### Customer Detail Page Features
- **Mode-based Display**: 
  - View mode: Read-only display of all customer information
  - Edit mode: Modal-based editing with save functionality
- **Tabbed Interface**: Organized information display across Profile, History, Contacts, Funnel
- **Responsive Design**: Works on desktop and mobile with RTL/LTR support

#### URL Structure
```
customer.html?id={customerId}&mode={view|edit}
```

- `id`: Customer unique identifier
- `mode`: Display mode (view/edit)
- Optional: Additional parameters can be added for specific tabs or filters

### Troubleshooting

### Common Issues

**MIME Type Errors**
- **Script not loading**: Browser may refuse to execute JavaScript with wrong MIME type
  - **Solution**: Ensure HTML files reference correct `.js` files
  - **Check**: Browser console for "Refused to execute script" errors
  - **Verify**: All `<script src="">` references point to existing files

**Navigation not working**
- **Customer pages not accessible**: 
  - **Check**: URL parameters are correctly formatted (`customer.html?id={id}&mode={view|edit}`)
  - **Verify**: Customer ID exists in database before redirecting
  - **Check**: API endpoint `/api/cms/customers/{id}` is implemented

**Data not loading**
- Check server is running and accessible
- Verify database connection
- Check browser console for JavaScript errors
- Ensure API endpoints are responding correctly

**Translation issues**
- **Missing keys**: Add missing translation keys to `translations.js`
- **Language switching**: Verify `setLanguage()` and `updateUI()` functions are working
- **Check**: All `data-i18n` attributes have corresponding translations

### Debug Mode
Open browser developer tools (F12) to:
- View console logs for errors
- Monitor network requests in Network tab
- Debug JavaScript issues in Sources tab
- Check MIME types and script loading

### Quick Validation Checklist
✅ **Server Running**: `npm start` shows no errors
✅ **Database Connected**: Tables created successfully
✅ **Scripts Loading**: No MIME type errors in console
✅ **Navigation Working**: Customer pages accessible via buttons
✅ **Translations Active**: All UI elements translated properly
✅ **API Responding**: All endpoints return expected data

---

**Version**: 2.0.0  
**Last Updated**: 2025-01-08  
**Status**: Phase 2 Complete - Customer Management & Multi-language Support  
**Next Phase**: Individual Customer Detail Pages with Advanced Features

## Support

For technical support or questions:
1. Check the browser console for error messages
2. Verify server logs for API issues
3. Ensure database tables are properly created
4. Check network connectivity to the server

---

**Version**: 2.0.0  
**Last Updated**: 2025-01-08  
**Status**: Phase 2 Complete - Customer Management & Multi-language Support

## Feature Requirements Status

### ✅ Completed Features (Phase 2)
- [x] Multi-language support (English/Hebrew) with RTL layout
- [x] Customer relevance tagging system  
- [x] Communication status management
- [x] Advanced editing capabilities for inquiries
- [x] Customer notes and internal notes fields
- [x] Translation system with localStorage persistence
- [x] Responsive RTL/LTR design

### 📋 Planned Features (Phase 3)
- [x] Individual customer detail pages with comprehensive information
- [ ] Extended contact network (partners, parents, emergency)
- [ ] Pregnancy week-based automated reminders
- [ ] Advanced funnel process tracking
- [ ] Historic call log with detailed metrics
- [ ] Customer request history with edit tracking
- [ ] Health treatments and medical information tracking
- [ ] Smart assessment and lead scoring
- [ ] Bulk operations and export functionality

#### 🎯 Customer Detail Page Implementation
**File Structure**
- `customer.html` - Main customer detail page with tabbed interface
- `customer.js` - JavaScript functionality for customer management
- Integration with existing translation system
- Responsive design with RTL/LTR support

**Page Components**
- **Customer Header**: Profile photo, name, status, quick actions
- **Profile Tab**: Basic info, health details, pregnancy tracking
- **History Tab**: Request history, communication timeline, edit tracking
- **Contacts Tab**: Primary contact + additional contacts management
- **Funnel Tab**: Conversion tracking, call log, follow-up management

**Technical Features**
- Tab-based navigation for organized information display
- Real-time data loading and updates
- Modal-based editing for all customer fields
- Pregnancy milestone calculations and alerts
- Contact network management with relationship types
- Historic communication timeline across all channels
- Automated next-follow-up calculations based on pregnancy week
