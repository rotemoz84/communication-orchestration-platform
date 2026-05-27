# Booking Configuration Reference And Legacy Prototype Status

## Status

The files in this directory are a legacy static prototype. Its JavaScript
still calls old `/api/inquiry/*` and appointment-confirmation endpoints that
the current server does not expose, so it is not the active public clinic site.
The active public frontend lives in `site_clinic/`.

This document is retained because the Google configuration model is still used
by the active server booking and office-hours services.

## Active Backend Dependencies

The server uses:

- Google Sheets for working hours, meeting types, and general booking settings.
- Google Calendar for busy-time lookup and event creation.
- PostgreSQL for public inquiries and admin authentication.
- Telnyx TeXML for the inbound IVR flow.

WhatsApp API routes are disabled pending a later Meta implementation.

## Google Setup

1. Create a Google Cloud project.
2. Enable Google Sheets API and Google Calendar API.
3. Create a service account and download its JSON credentials.
4. Put the credentials at the configured
   `GOOGLE_SERVICE_ACCOUNT_KEY_PATH`, typically
   `server/service-account-key.json`.
5. Share both the settings sheet and relevant calendar with the service
   account.

Configure:

```env
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./service-account-key.json
GOOGLE_SHEET_ID=your-google-sheet-id
GOOGLE_CALENDAR_ID=your-calendar-id
TIMEZONE=Asia/Jerusalem
```

## Sheet Layout Used By Current Server

Create these worksheet tabs with the shown column shapes.

### `Working Hours`

| Day | Start | End | Active |
| --- | --- | --- | --- |
| Sunday | 09:00 | 17:00 | DEFAULT |
| Monday | 09:00 | 17:00 | DEFAULT |

The server accepts `OPEN` to force a day open, `CLOSED` to force it closed,
and otherwise checks `Start`/`End` times.

### `Meeting Types`

| Name | Duration | Description | Active |
| --- | --- | --- | --- |
| Consultation | 30 | Initial discussion | TRUE |

Only active meeting types are exposed by booking settings.

### `Settings`

| Setting | Value |
| --- | --- |
| Buffer Time | 15 |
| Advance Booking Days | 60 |
| Minimum Notice Hours | 24 |

### `Appointments`

Calendar synchronization writes appointment information to an `Appointments`
tab. Preserve this tab if calendar sync is used.

## Relevant Active Endpoints

```text
GET  /api/health
GET  /api/booking/settings
GET  /api/booking/slots?date=YYYY-MM-DD&duration=30
GET  /api/booking/available-dates
POST /api/booking/reserve
POST /api/booking/refresh-settings
POST /api/sync/calendar
```

Public inquiry collection is now `POST /api/inquiries`, used by
`site_clinic/`; it is not the obsolete prototype endpoint
`/api/inquiry/submit`.

## Intentionally Not Documented As Active

- The old Twilio voice/WhatsApp setup.
- A WhatsApp bot writing inquiries to Sheets.
- Static-prototype appointment confirmation endpoints.
- SMS reminder endpoints.

Those existed as earlier design ideas or prototype instructions but do not
describe the current mounted application routes.
