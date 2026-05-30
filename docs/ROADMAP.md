# Project Roadmap

## Purpose

This is the working project backlog. Add new work here, mark completed work
with `[x]`, and keep unfinished work marked `[ ]`. It separates code changes
from hosting, provider, and product decisions so each item can be completed and
reviewed independently.

## Completed Work

- [x] Admin-only inquiry, call-history, booking-management, IVR-management, and
  manual calendar-sync routes require an authenticated session.
- [x] Public inquiry input is trimmed and bounded before storage.
- [x] API failures no longer return raw operational exception details.
- [x] Application logs avoid direct personal and provider identifiers.
- [x] Active Telnyx voice callbacks verify Ed25519 signatures over the exact raw
  request body and reject missing, invalid, or stale signatures before route
  processing.
- [x] SQL queries reviewed on 2026-05-30 use PostgreSQL parameters for user input.
  Dynamic query fragments are selected from fixed application-defined column
  clauses rather than request values.

## Security Backlog

Complete these as separate reviewed changes.

### [ ] Public Booking Endpoint

Decision needed: disable `POST /api/booking/reserve` if the public site will not
use it. If retained:

- [ ] Trim and bound every accepted value.
- [ ] Validate date, time, meeting type, phone, and message fields.
- [ ] Add rate limiting and payload-size limits.
- [ ] Review which personal fields need to be stored in Google Calendar and copied
  to Google Sheets.

### [ ] Inquiry Summary Email HTML Escaping

Escape every inquiry field before interpolating it into the internal HTML
summary email. Public inquiry text must render as text rather than HTML.

### [ ] PHP Fallback Hardening

Keep the fallback only if it is still operationally required:

- [ ] Return a fixed server-error response rather than raw exception details.
- [ ] Restrict wildcard CORS to the intended clinic origins.
- [ ] Neutralize spreadsheet-formula prefixes before writing CSV cells.
- [ ] Move `leads.csv` outside the public document root or deny web access to it.
- [ ] Confirm file permissions and backup handling on the hosting account.

### [ ] SMTP TLS Verification

Remove permissive SMTP certificate handling. Production email delivery must
verify the SMTP server certificate instead of using
`rejectUnauthorized: false`.

### [ ] Rate Limits And Input Bounds

Add request throttling and explicit payload limits for:

- [ ] Admin login and cron-login.
- [ ] Public inquiry submission.
- [ ] Public booking submission if retained.
- [ ] Telnyx callback routes, without blocking legitimate provider retries.
- [ ] Admin-editable inquiry and call notes.
- [ ] Provider callback field lengths before database writes.

### [ ] Admin Request And Production Configuration Protection

- [ ] Add CSRF protection or strict origin validation for authenticated mutations.
- [ ] Remove localhost CORS origins when running in production.
- [ ] Add security-relevant audit logging for login failures and admin mutations
  without collecting unnecessary personal data.
- [ ] Review session, cron, SMTP, database, Google, and Telnyx secrets before
  deployment and rotate any value that has been shared insecurely.
- [ ] Keep production credentials least-privileged and outside the repository.

### [ ] Database Transport And Storage Protection

The application currently stores inquiry and call PII as readable PostgreSQL
columns. Admin passwords are hashed, but PII fields are not encrypted by the
application.

For the production database:

- [ ] Enable provider-side SSL enforcement.
- [ ] Add verified PostgreSQL TLS configuration to the application using a trusted
  CA certificate and `rejectUnauthorized: true`.
- [ ] Confirm the provider encrypts database disks and backups at rest.
- [ ] Decide whether application-level field encryption is needed for sensitive
  fields such as pregnancy week, inquiry message, and notes.
- [ ] Design field encryption before implementation: phone and email search and
  indexing require a deliberate searchable-token strategy.

## Telnyx Voice Rollout

The code-side inbound TeXML flow is implemented. These provider and live-test
tasks remain.

### [x] Code-Side Voice Flow

- [x] Generate TeXML for incoming calls, dialing, menus, and hangup responses.
- [x] Persist provider-neutral call IDs and outcomes.
- [x] Send the interim internal email when a caller requests follow-up.
- [x] Verify Telnyx Ed25519 webhook signatures before route processing.
- [x] Keep WhatsApp routes disabled until the later Meta phase.

### [ ] Portal Setup

- [ ] Buy a Telnyx number with voice capability.
- [ ] Create a Telnyx TeXML Application.
- [ ] Configure its inbound voice URL:

  ```text
  POST https://api.drozyuval.com/api/voice/incoming
  ```

- [ ] Assign the Telnyx number to the TeXML Application.
- [ ] Enable dialing permissions needed to reach the representative mobile number.
- [ ] Copy the Telnyx public key from **Keys & Credentials > Public Key**.

### [ ] Production Values

Configure the deployed server:

```env
BASE_URL=https://api.drozyuval.com
REP_PHONE_NUMBER=+...
IVR_FALLBACK_EMAIL_TO=...
TELNYX_PUBLIC_KEY=...
```

Configure the SMTP values documented in `server/.env.example` while the
interim follow-up email remains active.

### [ ] Direct Telnyx Validation

Before forwarding the clinic number:

- [ ] Call the Telnyx number directly during open hours and confirm the
  representative mobile rings.
- [ ] Test busy and unanswered representative calls.
- [ ] Test a closed-hours call.
- [ ] Press `9` in both follow-up menu paths and confirm the interim internal email
  arrives with the expected reason.
- [ ] Confirm the server records the original caller number and provider call ID.
- [ ] Send an unsigned manual webhook request and confirm it returns `403` without
  creating a call record.
- [ ] Confirm valid Telnyx callbacks pass signature verification in production.

### [ ] Clinic Number Forwarding

After direct validation passes:

- [ ] Configure the current clinic phone provider to forward calls to the Telnyx
  number.
- [ ] Place an end-to-end call through the existing clinic number.
- [ ] Confirm forwarding preserves the patient's original caller ID.
- [ ] Repeat the open-hours, no-answer, closed-hours, and key-`9` paths.

### [ ] Live Follow-Up Decisions

- [ ] Keep `/api/voice/status` disabled unless live testing identifies a concrete
  event that needs separate status tracking.
- [ ] Decide whether call recording is needed. Active TeXML does not currently
  record calls, but the repository still has a recording setting. Align its
  default and documented example to disabled unless the clinic has approved
  the purpose, notice, access, and retention handling.
- [ ] Replace the interim email only in the future Meta WhatsApp phase. Do not add
  Telnyx messaging configuration for that work.

## Future Meta WhatsApp Phase

This is intentionally deferred until voice rollout is stable:

- [ ] Register the selected number with Meta WhatsApp Cloud API.
- [ ] Add template-based business-initiated messages.
- [ ] Verify Meta webhook signatures.
- [ ] Add inbound message handling if required.
- [ ] Replace the interim IVR follow-up email.
- [ ] Update the spoken confirmation only after a real WhatsApp send is available.

## Suggested Order

1. Finish security backlog items 2, 3, and 4.
2. Decide whether the public booking endpoint remains enabled.
3. Add request limits and admin mutation protection.
4. Add verified PostgreSQL TLS before enabling provider-side SSL enforcement.
5. Complete Telnyx portal setup and direct live testing.
6. Forward the clinic number only after direct Telnyx validation passes.
7. Revisit field-level database encryption and Meta WhatsApp as separate
   design phases.
