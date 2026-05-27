# Server API

Default local base URL:

```text
http://localhost:3003/api
```

`BASE_PATH` may prepend all routes in hosted deployments. Auth, inquiries,
and `/admin` are mounted only after the server has connected to PostgreSQL.

## Public Website Flow

`POST /inquiries` records a contact-form lead.

```json
{
  "name": "Patient name",
  "phone": "0501234567",
  "email": "",
  "service": "Consultation",
  "week": "12",
  "message": "Please call"
}
```

At least one of `phone` or `email` is required. A successful response is:

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
| `POST` | `/booking/refresh-settings` | Clear settings cache |

`POST /booking/reserve` requires `name`, `email`, `date`, and `time`. It
returns `409` if a requested slot is no longer available.

## Health And Sync

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Process health and configured timezone |
| `POST` | `/sync/calendar` | Manually sync Google Calendar data to Sheets |

## Calls And Migration Boundary

`/calls` exposes call record listing, stats, detail, editing, and outbound
Telnyx call initiation. These routes currently do not use admin session
protection.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/calls` | List records with date/outcome/office filters |
| `GET` | `/calls/recent` | List recent calls with optional filters |
| `GET` | `/calls/stats?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` | Aggregate call statistics |
| `GET` | `/calls/:id` | Read one call record |
| `PATCH` | `/calls/:id` | Change notes or outcome |
| `POST` | `/calls/outgoing` | Initiate a Telnyx outbound call |

`POST /calls/outgoing` accepts `{ "to": "+972...", "notes": "..." }`
and requires Telnyx configuration. Call records use the provider-neutral
`providerCallId` field for external voice-provider call identifiers.

`POST /voice/incoming` is the active Telnyx TeXML inbound entry point. It
records the incoming call, returns representative dialing TeXML during open
hours, and returns the closed-hours Hebrew menu TeXML otherwise.

`POST /voice/dial-callback` processes the result of dialing the representative.
An answered call is recorded and ended; an unsuccessful dial is recorded and
returns the Hebrew no-answer menu.

Inbound voice migration is still underway for the remaining callbacks.
`POST /voice/closed-menu`, `/voice/no-answer-menu`, `/voice/outgoing-status`,
and `/voice/status` currently return `501`.

WhatsApp is intentionally deferred to a future Meta implementation. Existing
paths under `/whatsapp` such as `/send`, `/incoming`, `/status`, and `/test`
return `501` and have no sending or receiving side effects.

Preferred IVR administration routes remain available under `/ivr`:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET`/`POST` | `/ivr/settings` | Read/update in-memory IVR settings |
| `POST` | `/ivr/emergency` | Enable or disable emergency mode |
| `GET` | `/ivr/status` | Read office-status decision |
| `GET` | `/ivr/queue` | Read in-memory queue |
| `POST` | `/ivr/queue/add` | Add queue entry for testing |
| `POST` | `/ivr/queue/remove` | Remove queue entry |
