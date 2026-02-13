# Admin Site – Implementation Plan (for verification)

**Goal:** Admin site at `https://api.drozyuval.com/admin` to manage inquiries (filter table, notes, status). Same-origin, session-based auth, with optional SSO and audit.

---

## 1. High-level architecture

| Item | Choice |
|------|--------|
| **Admin URL** | `https://api.drozyuval.com/admin` (same origin as API) |
| **Auth** | Session + HTTP-only cookie (no JWT in frontend) |
| **Session store** | PostgreSQL (reuse existing DB; table `sessions`) |
| **Login** | Password (bcrypt) **or** SSO (Google) – we can support both |
| **Audit** | Two tables: `audit_logins`, `audit_data_changes` |

**Request flow:**
- User goes to `https://api.drozyuval.com/admin` → if no session → redirect to `/admin/login`.
- After login → session cookie set → all requests to `/api/...` same-origin, cookie sent automatically.
- All admin API routes (inquiries list/update, etc.) go through auth middleware; unauthenticated → 401.

---

## 2. Auth & SSO – how it works

### Option A: Password-only (simplest)
- **Table:** `admin_users` (id, email, password_hash, display_name, created_at).
- **Login:** POST `/api/auth/login` with `{ email, password }` → verify bcrypt → create session, set cookie, write to `audit_logins`.
- **Logout:** POST `/api/auth/logout` → destroy session.
- **Session:** `express-session` with `connect-pg-simple`; session holds `userId`, `email`.

### Option B: Google SSO (optional, can add after A)
- **Flow:** "Sign in with Google" → redirect to Google → callback to our server → we get profile (email, name) → find or create `admin_users` row (no password), create session, set cookie, write to `audit_logins`.
- **Table:** Same `admin_users`; add columns e.g. `google_id`, `auth_provider` ('password' | 'google'). If using Google, `password_hash` can be NULL.
- **Config:** Google OAuth client (client ID + secret), redirect URI `https://api.drozyuval.com/api/auth/google/callback`.

### Option C: Both (password + Google)
- One user can have password and/or Google linked (same email). Login can be either path; session is the same. Audit log records `auth_method: 'password' | 'google'`.

**Recommendation:** Implement **A** first (password, single admin user is enough). Add **B/C** in a later step once base auth and audit work.

---

## 3. Audit – what we store

### 3.1 Login audit (`audit_logins`)
Record every login attempt (success and failure).

| Column | Purpose |
|--------|--------|
| `id` | PK |
| `timestamp` | When |
| `email` (or identifier) | Who (as typed; may be wrong on failure) |
| `success` | true / false |
| `auth_method` | `'password'` / `'google'` |
| `ip_address` | From `req.ip` or `X-Forwarded-For` (behind proxy) |
| `user_agent` | Optional; for support/debug |
| `user_id` | FK to `admin_users` if success (NULL if failure) |

**When we write:** In login handler (password or Google callback) and in failed-login branch.

### 3.2 Data change audit (`audit_data_changes`)
Record who changed what in the DB (inquiries and, later, other admin-editable entities).

| Column | Purpose |
|--------|--------|
| `id` | PK |
| `timestamp` | When |
| `user_id` | FK to `admin_users` |
| `action` | `'create'` / `'update'` / `'delete'` |
| `table_name` | e.g. `'inquiries'` |
| `record_id` | e.g. inquiry_id or primary key |
| `old_values` | JSONB snapshot before (for update/delete) – optional, can be large |
| `new_values` | JSONB snapshot after (for create/update) – optional |
| `ip_address` | From request |

**What to audit (for now):**
- **Inquiries:** PATCH `/api/inquiries/:id` (status, notes) → one row in `audit_data_changes`: action `'update'`, `table_name: 'inquiries'`, `record_id`, `new_values: { status, notes }` (and optionally `old_values` for diff).

**What we don’t audit (by default):**
- GET (reads). Can add "access audit" later if needed (who viewed which inquiry).
- Public endpoints (e.g. POST inquiry from website) – no admin user.

**Where we write:** In the route or service that performs the update (after successful DB update), or via a small helper used by admin routes.

---

## 4. Route protection

- **Public (no auth):**
  - `GET /api/health`
  - `POST /api/inquiries` (contact form)
  - Twilio webhooks (voice, WhatsApp), etc.
- **Admin-only (require session):**
  - `GET /api/inquiries` (list with filters)
  - `GET /api/inquiries/:id`
  - `PATCH /api/inquiries/:id`
  - `GET /api/inquiries/preview-summary`
  - `POST /api/inquiries/send-summary`
  - Any future admin endpoints (e.g. `GET /api/audit/logins`).

**Implementation:** Auth middleware that checks `req.session.userId`. If missing → 401 JSON or redirect to `/admin/login` (for browser). Apply this middleware to the "admin" router or to each admin route group.

---

## 5. Admin app (frontend)

- **Served from:** Same Express app. Static files (SPA build) under e.g. `admin/` or `admin-dist/`.
- **Route:** `GET /admin` and `GET /admin/*` → serve `admin/index.html` (or the built SPA) so client-side router can handle `/admin`, `/admin/login`, `/admin/inquiries`, etc.
- **API base URL:** Relative `/api` (same origin), so no CORS and cookie is sent.
- **Tech:** Can be a small React/Vite app (or simple HTML + JS). First milestone: login page + inquiries table + filters + edit status/notes.

---

## 6. Implementation steps (in order)

We can verify each step before moving on.

### Phase 1 – Foundation (no UI yet)
1. **DB migrations / schema**
   - Table `sessions` (for connect-pg-simple; or use package’s schema).
   - Table `admin_users` (id, email, password_hash, display_name, created_at).
   - Table `audit_logins` (as above).
   - Table `audit_data_changes` (as above).
2. **Session setup**
   - Install `express-session`, `connect-pg-simple`.
   - Configure session: secret from env, store in PG, cookie: httpOnly, secure (in prod), sameSite.
3. **Auth routes (API only)**
   - POST `/api/auth/login` (email + password) → validate, create session, write `audit_logins` (success).
   - POST `/api/auth/logout` → destroy session.
   - GET `/api/auth/me` → return current user (or 401) – for the frontend to check login state.
4. **Seed one admin user** (e.g. script or one-time migration) with hashed password so you can log in.
5. **Auth middleware** `requireAuth` – redirect or 401 if no `req.session.userId`. Apply to admin route group (or specific routes).

### Phase 2 – Protect inquiry admin API
6. **Apply `requireAuth`** to: GET/PATCH inquiries (list, by id, update), preview-summary, send-summary. Ensure public POST (create inquiry from website) stays unauthenticated.
7. **Audit data changes** – in PATCH handler for inquiries: after successful update, insert into `audit_data_changes` (user_id, action, table_name, record_id, new_values, old_values if desired, ip).

### Phase 3 – Admin UI
8. **Serve admin SPA** – static from Express at `/admin` and `/admin/*`.
9. **Login page** – form POST to `/api/auth/login`, on success redirect to `/admin` (or default dashboard).
10. **Inquiries page** – table with filters (status, date range, source), load via GET `/api/inquiries`, edit status/notes via PATCH, with audit already in place.

### Phase 4 – Optional enhancements
11. **Login audit in UI** – e.g. GET `/api/audit/logins` (admin-only), page in admin to view recent logins.
12. **Data change audit in UI** – GET `/api/audit/changes` (admin-only), filter by table/date/user.
13. **Google SSO** – add Google OAuth, callback, link to same `admin_users`/session, and log in `audit_logins` with `auth_method: 'google'`.

---

## 7. Environment / config

- `SESSION_SECRET` – long random string for signing session cookie (required in prod).
- Optional later: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` for SSO.
- No secrets in frontend; admin only gets session cookie.

---

## 8. Summary checklist for you to verify

- [ ] Admin at `https://api.drozyuval.com/admin`, same origin as API.
- [ ] Auth: session + HTTP-only cookie; session store in PostgreSQL.
- [ ] Login: password first; SSO (Google) optional later.
- [ ] Audit: `audit_logins` (every login attempt), `audit_data_changes` (inquiry updates and future admin mutations).
- [ ] All inquiry admin endpoints protected; public contact form and webhooks stay public.
- [ ] Implementation in phases: DB + session + auth API → protect routes + audit → admin UI → optional audit UI + SSO.

If this matches how you want it to work (including audit scope and SSO as a later step), we can lock this as the spec and start with Phase 1 in code next.
