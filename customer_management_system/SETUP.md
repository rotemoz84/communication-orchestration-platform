# Booking System Setup Guide

This guide will help you set up the Google Calendar and Google Sheets integration for your booking system.

## Overview

The booking system uses:
- **Google Sheets** - To store your working hours, meeting types, and settings (easy to update!)
- **Google Calendar** - To check your availability and create bookings

---

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Name it something like `booking-system`
4. Click **Create**

---

## Step 2: Enable Required APIs

1. In the Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for and enable these APIs:
   - **Google Sheets API**
   - **Google Calendar API**

---

## Step 3: Create a Service Account

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **Service Account**
3. Fill in:
   - Name: `booking-service`
   - ID: (auto-generated)
4. Click **Create and Continue**
5. Skip the optional steps and click **Done**

### Download the Key File

1. Click on your new service account
2. Go to the **Keys** tab
3. Click **Add Key** → **Create new key**
4. Choose **JSON** and click **Create**
5. Save the downloaded file as `service-account-key.json` in the `server/` folder

---

## Step 4: Create Your Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet
2. Name it `Booking Settings`
3. Create three sheets (tabs) with these exact names:

### Sheet 1: "Working Hours"

| Day | Start | End | Active |
|-----|-------|-----|--------|
| Sunday | | | FALSE |
| Monday | 09:00 | 17:00 | TRUE |
| Tuesday | 09:00 | 17:00 | TRUE |
| Wednesday | 09:00 | 17:00 | TRUE |
| Thursday | 09:00 | 17:00 | TRUE |
| Friday | 09:00 | 14:00 | TRUE |
| Saturday | | | FALSE |

### Sheet 2: "Meeting Types"

| Name | Duration | Description | Active |
|------|----------|-------------|--------|
| Free Consultation | 30 | Quick intro call | TRUE |
| Strategy Session | 60 | In-depth planning | TRUE |
| Workshop | 120 | Full workshop session | TRUE |

### Sheet 3: "Settings"

| Setting | Value |
|---------|-------|
| Buffer Time | 15 |
| Advance Booking Days | 60 |
| Minimum Notice Hours | 24 |
| Business Name | השם של העסק שלך |
| Business Phone | +972501234567 |
| Reminder Message | שלום {name}, תזכורת לפגישה שלך ב{date} בשעה {time}. לאישור או שינוי: {link} |
| Force Open | FALSE |

**Force Open**: Set to `TRUE` to accept calls during non-working hours (override for reps)

### Sheet 4: "Appointments"

Create this sheet with headers only (data will be added automatically):

| Booking ID | Date | Time | Client Name | Phone | Email | Service | Status | Reminder Sent | Response Time | Notes |
|------------|------|------|-------------|-------|-------|---------|--------|---------------|---------------|-------|

**Status values:**
- `new` - Just booked
- `reminder_sent` - Reminder SMS sent
- `confirmed` - Client confirmed ✅
- `cancel_requested` - Client wants to cancel ⚠️
- `cancelled` - Cancelled ❌

### Sheet 5: "Inquiries"

Create this sheet with headers only (data will be added automatically):

| ID | Name | Phone | Email | Service | Preferred Time | Message | Status | Created | Source |
|----|------|-------|-------|---------|----------------|---------|--------|---------|--------|

**Status values:**
- `new` - New inquiry
- `contacted` - Rep contacted client
- `scheduled` - Meeting scheduled
- `closed` - Inquiry resolved

**Source values:**
- `website` - From website contact form
- `whatsapp_bot` - From WhatsApp bot

### Share with Service Account

1. Copy the service account email from `service-account-key.json` (look for `client_email`)
   - It looks like: `booking-service@your-project.iam.gserviceaccount.com`
2. Click **Share** in Google Sheets
3. Paste the service account email
4. Give it **Editor** access (needed to write appointments)
5. Uncheck "Notify people" and click **Share**

### Get the Sheet ID

The Sheet ID is in the URL:
```
https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
```
Copy the `SHEET_ID_HERE` part.

---

## Step 5: Share Your Google Calendar

1. Go to [Google Calendar](https://calendar.google.com)
2. Find your calendar in the left sidebar
3. Click the three dots → **Settings and sharing**
4. Scroll to **Share with specific people**
5. Click **Add people**
6. Paste your service account email
7. Set permission to **Make changes to events**
8. Click **Send**

### Get the Calendar ID

- For your primary calendar: use your Gmail address (e.g., `you@gmail.com`)
- For other calendars: find it in **Settings** → **Integrate calendar** → **Calendar ID**

---

## Step 6: Set Up Twilio for SMS Reminders

### Create Twilio Account

1. Go to [Twilio](https://www.twilio.com/try-twilio) and sign up
2. Verify your phone number
3. Get your free trial credits ($15)

### Get Your Credentials

1. Go to [Twilio Console](https://console.twilio.com/)
2. Find your **Account SID** and **Auth Token** on the dashboard
3. Go to **Phone Numbers** → **Manage** → **Buy a number**
4. Get a number with SMS capability (~$1.15/month for US number)

### Note on Israeli Numbers

For sending SMS to Israeli numbers (+972), a US Twilio number works fine.
If you want a local Israeli number, it costs ~$6/month.

---

## Step 7: Configure the Server

Create a `.env` file in the `server/` folder:

```env
# Google API Credentials
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./service-account-key.json

# Your Google Sheet ID
GOOGLE_SHEET_ID=paste_your_sheet_id_here

# Your Google Calendar ID
GOOGLE_CALENDAR_ID=your_email@gmail.com

# Server settings
PORT=3003
BASE_URL=http://localhost:3003

# Your timezone (important for correct times!)
TIMEZONE=Asia/Jerusalem

# Twilio SMS (optional - for reminders)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Twilio WhatsApp (for IVR → WhatsApp flow)
TWILIO_WHATSAPP_NUMBER=+14155238886

# IVR Configuration
REP_PHONE_NUMBER=+972501234567  # Phone to forward calls to
```

Common timezone values:
- `America/New_York`
- `America/Los_Angeles`
- `Europe/London`
- `Europe/Paris`
- `Asia/Jerusalem`
- `Asia/Tokyo`

---

## Step 7: Install and Run

```bash
# Install dependencies
cd server
npm install

# Start the server
npm start
```

You should see:
```
🚀 Booking server running on http://localhost:3001
📅 Calendar ID: your_email@gmail.com
📊 Sheet ID: your_sheet_id
```

---

## Step 8: Test the System

1. Open `index.html` in your browser
2. Try booking a meeting
3. Check if it appears in your Google Calendar!

### API Endpoints for Testing

- Health check: `http://localhost:3001/api/health`
- Get settings: `http://localhost:3001/api/booking/settings`
- Get slots: `http://localhost:3001/api/booking/slots?date=2026-01-15&duration=30`

---

## Updating Your Settings

To change working hours, meeting types, or other settings:

1. Open your Google Sheet
2. Make changes
3. Wait up to 5 minutes for cache to refresh, OR
4. Call `POST /api/booking/refresh-settings` to force refresh

---

## Troubleshooting

### "Could not load booking settings"
- Check that the service account has access to your Google Sheet
- Verify the Sheet ID in your `.env` file
- Make sure the sheet tab names match exactly: "Working Hours", "Meeting Types", "Settings"

### "Could not fetch calendar availability"
- Check that the service account has access to your Google Calendar
- Verify the Calendar ID in your `.env` file
- Make sure the calendar is shared with the service account email

### Times are wrong
- Check your `TIMEZONE` setting in `.env`
- Make sure it matches your actual timezone

---

## Production Deployment

For production, you'll need to:

1. Deploy the server to a hosting service (Vercel, Railway, Heroku, etc.)
2. Update `API_BASE_URL` in `script.js` to your production URL
3. Set environment variables on your hosting platform
4. Host the frontend (or use a static site host like Netlify)

---

## SMS Reminders

The system sends SMS reminders daily at **10:00 AM Israel time** to all clients with appointments the next day.

### How It Works

1. Every day at 10:00 AM, the scheduler runs
2. It finds all appointments for tomorrow that haven't received a reminder
3. Sends SMS with a confirmation link
4. Client clicks link → confirms or requests cancellation
5. You see the status update in the Appointments sheet

### Testing Reminders

To manually trigger reminders (for testing):

```bash
# Using curl (or Postman)
curl -X POST http://localhost:3003/api/reminders/send
```

Or in PowerShell:
```powershell
Invoke-WebRequest -Method POST -Uri http://localhost:3003/api/reminders/send -UseBasicParsing
```

---

## IVR Phone System

The system includes an IVR (Interactive Voice Response) that handles incoming phone calls.

### How It Works

**When Office is OPEN:**
1. Play Message A (welcome menu)
2. Press 1 → Forward call to rep
   - If no answer after ~5 rings → Play Message B
   - Press 9 → Send WhatsApp
   - No press → Continue waiting for rep
3. Press 2 → Send WhatsApp message

**When Office is CLOSED:**
1. Play Message C (closed message)
2. Automatically send WhatsApp message

### Setting Up Twilio Voice

1. Go to [Twilio Console](https://console.twilio.com/)
2. Buy a phone number with **Voice** capability
3. Configure the webhook:
   - Go to **Phone Numbers** → your number
   - Under "Voice Configuration":
     - **Configure with**: Webhooks
     - **A call comes in**: `https://your-server.com/api/voice/incoming` (POST)
     - **Call status changes**: `https://your-server.com/api/voice/status` (POST)

### Setting Up WhatsApp (Twilio)

1. Go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Follow the sandbox setup (for testing)
3. For production, apply for WhatsApp Business API access
4. Configure the WhatsApp webhook:
   - **When a message comes in**: `https://your-server.com/api/whatsapp/incoming` (POST)
   - **Status callback URL**: `https://your-server.com/api/whatsapp/status` (POST)

---

## WhatsApp Bot

The system includes a WhatsApp chatbot for handling inquiries.

### Bot Flow

1. **bot_start** → Initial message sent when redirecting from IVR
2. **Main Menu** → Two options:
   - 1️⃣ Office Info → Shows working hours with back button
   - 2️⃣ Leave a Message → Client enters message → Saved to Inquiries sheet
3. **bot_thank_you** → Confirmation with "Start New Chat" button

### How Messages Are Saved

When a client leaves a message via WhatsApp:
1. The message is saved to the "Inquiries" sheet
2. The "Source" column shows `whatsapp_bot`
3. Rep can see and follow up from the sheet

### Testing the Bot

Test conversation flow:
```bash
# Start conversation
curl -X POST http://localhost:3003/api/whatsapp/test \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+972501234567", "message": "התחל"}'

# Reset user state (for testing)
curl -X POST http://localhost:3003/api/whatsapp/reset \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+972501234567"}'
```

### Bot Messages

The bot messages are defined in `server/services/whatsappBot.js`:
- `bot_start` - Initial welcome
- `bot_menu` - Main menu
- `bot_office_info` - Office hours (dynamically loaded from Sheet)
- `bot_ask_message` - Prompt for message
- `bot_thank_you` - Confirmation after message received

### Force Open Override

To allow reps to answer calls during non-working hours:

1. In your Google Sheet "Settings" tab, add a row:
   | Setting | Value |
   |---------|-------|
   | Force Open | FALSE |

2. Change to `TRUE` when you want to accept calls during off-hours
3. Change back to `FALSE` when done

### Customizing Messages

The IVR messages are defined in `server/services/ivr.js`. You can:
- Change the text for each message (A, B, C, D)
- Replace with audio file URLs for professional recordings
- Update the language settings

### Testing the IVR

Check IVR status:
```bash
curl http://localhost:3003/api/voice/status
```

To test locally, use [ngrok](https://ngrok.com/) to expose your server:
```bash
ngrok http 3003
```

Then update your Twilio webhook URL to the ngrok URL.

---

## File Structure

```
dad-land-page/
├── index.html              # Landing page
├── confirm.html            # Appointment confirmation page (Hebrew)
├── styles.css              # Styles
├── script.js               # Frontend JavaScript
├── SETUP.md                # This file
└── server/
    ├── package.json        # Dependencies
    ├── index.js            # Express server
    ├── .env                # Your configuration (create this!)
    ├── service-account-key.json  # Google credentials (download this!)
    ├── routes/
    │   ├── booking.js      # Booking API routes
    │   ├── inquiry.js      # Inquiry/callback request routes
    │   ├── voice.js        # IVR/Voice call routes (Twilio webhooks)
    │   └── whatsapp.js     # WhatsApp bot routes (Twilio webhooks)
    └── services/
        ├── googleAuth.js   # Authentication
        ├── googleSheets.js # Read settings
        ├── googleCalendar.js # Calendar operations
        ├── appointments.js # Appointment tracking
        ├── inquiries.js    # Inquiry/callback tracking
        ├── sms.js          # Twilio SMS service
        ├── whatsapp.js     # WhatsApp messaging service
        ├── whatsappBot.js  # WhatsApp bot conversation logic
        ├── ivr.js          # IVR message management
        ├── reminder.js     # Daily reminder scheduler
        ├── calendarSync.js # Calendar-to-Sheet sync
        └── sheetSetup.js   # Sheet formatting setup
```

