# Admin Site Status And Remaining Work

The server currently serves a small same-origin admin application from
`/admin` when PostgreSQL connects successfully during startup.

## Implemented

- Password login through `POST /api/auth/login`, with bcrypt password hashes.
- PostgreSQL-backed session cookie through `express-session` and
  `connect-pg-simple`.
- `GET /api/auth/me` and `POST /api/auth/logout`.
- Admin UI for inquiry list/filtering and status/notes editing.
- Protection of inquiry read/update/summary endpoints through `requireAuth`.
- Public inquiry creation through `POST /api/inquiries`.
- One-time admin creation through `scripts/seed-admin.js`.

Required configuration:

```env
SESSION_SECRET=long-random-value
SESSION_MAX_AGE_HOURS=1
```

Database configuration is also required; without a successful database
connection the auth, inquiry, and admin static routes are not mounted.

## Not Implemented

- Login audit and inquiry-change audit tables or writes.
- Google SSO.
- Audit viewing UI.

These are possible follow-up features, not behavior that operators should
expect today.

## Planned Follow-Up Context

The earlier admin plan intended audit coverage after the current inquiry UI was
working:

- `audit_logins`: record successful and failed login attempts with timestamp,
  entered email, user ID where known, authentication method, IP address, and
  optional user-agent data.
- `audit_data_changes`: record admin mutations such as inquiry status/notes
  changes with user ID, timestamp, affected record ID, operation, and old/new
  JSON values where needed.
- Optional Google SSO may later create the same session shape as password
  login and use the same audit model.

None of these records are written by current code. This section preserves the
desired direction without presenting it as delivered behavior.

## Access Boundary

Public route:

```text
POST /api/inquiries
```

Session-required routes:

```text
GET   /api/inquiries
GET   /api/inquiries/:id
PATCH /api/inquiries/:id
GET   /api/inquiries/preview-summary
POST  /api/inquiries/send-summary
```
