# Server API

Default local base URL:

```text
http://localhost:3003/api
```

`BASE_PATH` may prepend all routes in hosted deployments. Auth, inquiries,
call history, and `/admin` are mounted only after the server has connected to
PostgreSQL.

## Public Website Flow

`POST /inquiries` records a contact-form lead.

```json
{
  "name": "Patient name",
  "phone": "0501234567",
  "email": "",
  "service": "Consultation",
  "week": "12",
  "message": "Please call",
  "privacyConsent": true,
  "sensitiveDataConsent": true
}
```

At least one of `phone` or `email` and explicit `privacyConsent` are required.
Text fields are trimmed before storage. Limits are: `name`, `email`, and
`service` 100 characters; `phone` 20 characters; and `message` 1,000
characters. When supplied, `week` must be a whole number from 1 through 42.
When `week` is provided, explicit `sensitiveDataConsent` is also required. The
server stores the accepted consent flags with its current policy version and a
server-side timestamp. A successful response is:

```json
{ "success": true, "inquiryId": "INQ-..." }
```

## Admin Flow

The admin web page is served at `/admin`. These API routes use a server-side
session cookie:

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/auth/login` | Start session with email/password |
| `GET` | `/auth/me` | Return current user or `{ "user": null }` |
| `POST` | `/auth/logout` | End session |
| `GET` | `/inquiries` | List/filter inquiries; authentication required |
| `GET` | `/inquiries/:id` | Read one inquiry; authentication required |
| `PATCH` | `/inquiries/:id` | Edit status/notes; authentication required |
| `GET` | `/inquiries/preview-summary` | Preview pending summary; authentication required |
| `POST` | `/inquiries/send-summary` | Send summary; authentication required |

`GET /inquiries` accepts `startDate`, `endDate`, `status`, `source`, `search`,
`limit`, and `offset`.

## Booking API

Booking is exposed by the backend but is not currently submitted by the public
React lead form.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/booking/settings` | Google Sheet-backed booking settings |
| `GET` | `/booking/slots?date=YYYY-MM-DD&duration=30` | Available calendar slots |
| `GET` | `/booking/available-dates` | Dates with available slots |
| `POST` | `/booking/reserve` | Create a Google Calendar event for an available slot |
| `POST` | `/booking/refresh-settings` | Clear settings cache; authentication required |

`POST /booking/reserve` requires `name`, `email`, `date`, and `time`. It
returns `409` if a requested slot is no longer available.

## Health And Sync

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Process health and configured timezone |
| `GET` | `/ready` | Critical readiness checks for deploy promotion |
| `POST` | `/sync/calendar` | Manually sync Google Calendar data to Sheets; authentication required |

`GET /ready` returns `200` only when critical business paths are available:
required environment, PostgreSQL connection and tables, a rolled-back synthetic
inquiry insert, SMTP verification, Google Sheets booking settings, and Google
Calendar free/busy access. It returns `503` with per-check details when a
critical check fails. Failed runtime readiness checks also trigger a
rate-limited critical alert email.

Run the same gate before promoting a release:

```bash
npm run preflight
```

In production, startup also runs the critical readiness checks before listening.
For staging or another non-production environment, set
`REQUIRE_READY_ON_START=true` to get the same fail-fast behavior. The deployment
runner should start the new release on a temporary port, call `/api/ready`, and
only switch traffic after it returns `200`; otherwise stop the new release and
keep the current version serving traffic.

## Critical Alerts

Critical business-path failures send a rate-limited email through the SMTP
integration to `EMAIL_NOTIFICATION_TO`. Alerts are deduplicated by issue key for
60 minutes.

Alerted failures include:

- production startup DB/readiness failures
- failed `/ready` critical checks
- public inquiry save failure
- daily inquiry summary failure or skipped email delivery
- IVR follow-up notification or call-record update failure
- booking reservation failure after a submitted reservation request

When a submitted request could be lost, the alert includes the recoverable
request details, such as name, email, phone, requested service/date/time, and
message text. IVR follow-up alerts include the caller number and provider call
ID when available.

## Call History

`/calls` exposes the inbound IVR call record history and reporting endpoints.
All routes in this section require an authenticated admin session.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/calls` | List records with date/outcome/office filters; authentication required |
| `GET` | `/calls/recent` | List recent calls with optional filters; authentication required |
| `GET` | `/calls/stats?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` | Aggregate call statistics; authentication required |
| `GET` | `/calls/:id` | Read one call record; authentication required |
| `PATCH` | `/calls/:id` | Change notes or outcome; authentication required |

`POST /voice/incoming` is the active Telnyx TeXML inbound entry point. It
records the incoming call using the provider-neutral `providerCallId`, returns
representative dialing TeXML during open hours, and returns the closed-hours
Hebrew menu TeXML otherwise.

All active `/voice` callback routes require a valid Telnyx Ed25519 webhook
signature and a timestamp no more than five minutes from server time. Missing,
stale, or invalid signatures are rejected before route processing.

`POST /voice/dial-callback` processes the result of dialing the representative.
An answered call is recorded and ended; an unsuccessful dial records
`representative_unavailable` and returns the Hebrew no-answer menu.

`POST /voice/closed-menu` and `/voice/no-answer-menu` process the caller's
menu choice. Digit `9` records `closed_hours_followup_requested` or
`representative_unavailable_followup_requested` and sends the temporary
internal IVR notification email when it is configured; the spoken confirmation
only states that the request was received.

`POST /voice/status` remains disabled while no separate status-callback
requirement exists for the inbound IVR journey.

WhatsApp is intentionally deferred to a future Meta implementation. Existing
paths under `/whatsapp` such as `/send`, `/incoming`, `/status`, and `/test`
return `501` and have no sending or receiving side effects.

Preferred IVR administration routes remain available under `/ivr`. All require
an authenticated admin session and are not exposed as aliases under `/voice`:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET`/`POST` | `/ivr/settings` | Read/update in-memory IVR settings |
| `POST` | `/ivr/emergency` | Enable or disable emergency mode |
| `GET` | `/ivr/status` | Read office-status decision |
| `GET` | `/ivr/queue` | Read in-memory queue |
| `POST` | `/ivr/queue/add` | Add queue entry for testing |
| `POST` | `/ivr/queue/remove` | Remove queue entry |
