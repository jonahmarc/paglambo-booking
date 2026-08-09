# Buhata Booking — Build Progress

---

## Phase 0 — Foundation

| Task | Status | Notes |
|---|---|---|
| DigitalOcean VPS | ✅ Have it | Upgrade to 2GB RAM when bookings go live |
| SSH key pair for GitHub Actions | ✅ Done | Public key on VPS, private key in GitHub Secrets |
| PostgreSQL on VPS | ✅ Done | `buhata_booking` DB and user created |
| GitHub repo | ✅ Done | Pushed to GitHub |
| GitHub Actions deploy pipeline | ⬜ Pending | SSH deploy on push to `main` — defer until domain/production ready |
| `.env` on VPS | ⬜ Pending | Fill in production values — defer until domain/production ready |
| Nightly DB backup to DO Spaces | ⬜ Pending | Cron job on VPS |

---

## Phase 1 — Core Platform + WordPress

### Step 1: Backend Engine

| Task | Status | Notes |
|---|---|---|
| Project scaffold | ✅ Done | FastAPI skeleton in `codebase/backend/` |
| Database models | ✅ Done | Business, EventType, Session, Package, Booking, Payment, Customer + `booking_sessions`/`package_session_pool` association tables |
| Alembic migrations | ✅ Done | Initial schema migration applied to local DB |
| Admin auth (JWT) | ✅ Done | `POST /api/auth/register`, `/login`, `/refresh`, `GET /me` — access + refresh tokens, one login per Business |
| Superadmin model + migration | ✅ Done | Separate `super_admins` table — platform operator account, not mixed with Business |
| Superadmin auth endpoints | ✅ Done | `POST /api/superadmin/auth/login`, `GET /api/superadmin/auth/me`; JWT carries `role: superadmin` |
| Superadmin business management API | ✅ Done | `GET /api/superadmin/businesses`, `PATCH .../activate`, `.../deactivate` |
| Superadmin seed script | ✅ Done | `scripts/create_superadmin.py` — run once from `codebase/backend/` after migrations |
| Business CRUD API | ✅ Done | `GET /api/business`, `PATCH /api/business` — auth-gated, returns full business detail incl. payment usernames |
| Event type CRUD API | ✅ Done | `POST/GET /api/event-types`, `GET/PATCH/DELETE /api/event-types/{id}` — soft-delete, scoped to business |
| Session generation logic | ✅ Done | `POST /sessions` (manual), `POST /sessions/generate` (bulk from pattern), `GET/PATCH/DELETE /sessions/{id}` — timezone-aware, cancel = soft-delete |
| Package + date pool logic | ✅ Done | `/api/packages` CRUD + pool management (`POST/DELETE /api/packages/{id}/pool`) |
| Add-on + live estimate logic | ✅ Done | Admin CRUD (`/api/add-ons`); public estimate endpoint (`POST /api/estimate`) |
| Booking state machine | ✅ Done | Public `POST /api/public/{booking_key}/bookings`; admin `GET /api/bookings`; transition fns ready for receipt/review steps |
| Receipt upload endpoint | ✅ Done | `POST /api/public/{booking_key}/bookings/{id}/receipt` — multipart; saves to `UPLOAD_DIR/receipts/`; creates Payment; transitions booking to `awaiting_payment` |
| Admin payment review API | ✅ Done | `POST /api/bookings/{id}/approve`, `/reject`, `GET /api/bookings/{id}/receipt` |
| Email — booking confirmation | ✅ Done | Sent to customer on approve; via `send_booking_confirmed` |
| Email — receipt received | ✅ Done | Sent to admin on receipt upload; via `send_receipt_received` |
| Email — payment approved | ✅ Done | Combined with booking confirmation email |
| Email — payment rejected | ✅ Done | Sent to customer on reject; via `send_payment_rejected` |
| Public session listing API | ✅ Done | `GET /api/public/{key}/event-types` (incl. add-ons + package pool); `GET /api/public/{key}/event-types/{id}/sessions` |
| Group booking support | ⬜ Pending | Add `party_size` field to Booking; public widget lets customers book for multiple people; price = per-person rate × party_size |
| Discount codes API | ⬜ Pending | Standard + Pro feature; admin CRUD for codes (flat / percentage); public validate endpoint; applied at estimate + booking |
| API tests | ⬜ Pending | pytest |

### Step 1b: Platform Subscription Model

Business clients pay Buhata Booking a monthly subscription fee. Plans gate features. New registrations require superadmin approval before trial starts.

**Plans:** Standard $49/mo · Pro $89/mo (both manual receipt upload to platform)
**Standard includes:** All core booking features + discount codes
**Pro includes:** Standard + Stripe Connect (Phase 3) + Invoices · Future: Calendar sync, Deposits
**Booking key:** Unlimited WordPress installs on both plans

| Task | Status | Notes |
|---|---|---|
| Business model — subscription fields | ⬜ Pending | Add `plan` (standard/pro), `status` (pending_approval/trial/active/expired/suspended), `trial_ends_at`, `approved_at` to Business; migration |
| Approval toggle setting | ⬜ Pending | `PlatformSetting` table with key-value pairs; `require_approval` boolean; superadmin can flip it |
| Superadmin approval API | ⬜ Pending | `POST /api/superadmin/businesses/{id}/approve`, `/reject`; sets status to `trial` + sets `trial_ends_at` |
| Trial period logic | ⬜ Pending | Pre-launch: 2 months. Post-launch: 1 month. Controlled by platform setting. Access locked immediately on expiry. |
| Trial expiry reminders | ⬜ Pending | Email at 7 days, 3 days, 1 day before expiry; locked email on day of expiry |
| Plan feature gate middleware | ⬜ Pending | FastAPI dependency that checks `business.status == active/trial` and `business.plan` before allowing plan-gated endpoints |
| Platform subscription receipt upload | ⬜ Pending | `POST /api/subscriptions/receipt` — business uploads payment proof to Buhata Booking; creates SubscriptionPayment record |
| Superadmin subscription review API | ⬜ Pending | `GET /api/superadmin/subscription-payments`, `POST .../approve`, `.../reject`; approve sets status to `active` |
| Email — subscription payment received | ⬜ Pending | Notify superadmin when a business uploads receipt |
| Email — subscription approved/rejected | ⬜ Pending | Notify business of outcome |

### Step 2: Admin Dashboard

| Task | Status | Notes |
|---|---|---|
| React + Vite + Tailwind setup | ✅ Done | Vite 6, React 19, Tailwind v4, react-router-dom v7, react-hook-form |
| Login page | ✅ Done | Email + password, JWT stored in localStorage, auto-refresh |
| Business registration page | ✅ Done | `/register` route — name, email, password; calls existing `POST /api/auth/register` |
| Superadmin login page | ✅ Done | `/superadmin/login` — separate login page; calls superadmin auth endpoint |
| Superadmin dashboard | ✅ Done | Protected `/superadmin/*` area with its own layout; business list with activate/deactivate |
| UI branding — "Buhata Booking" | ✅ Done | Renamed in `index.html`, `Login.jsx`, `Layout.jsx`, and new pages |
| Business settings page | ✅ Done | Name, PayPal/Wise usernames, booking key (read-only) |
| Create / edit event types | ✅ Done | List, create modal, edit modal, activate/deactivate, link to sessions |
| Sessions list / calendar | ✅ Done | Manual add + bulk generate; cancel; linked from event types |
| Bookings list + detail view | ✅ Done | Status filter tabs; detail shows customer, sessions, add-ons, payment |
| Receipt review (approve/reject) | ✅ Done | Receipt image preview inline; approve/reject with optional note |
| Superadmin — approval queue | ⬜ Pending | Pending registrations tab; approve/reject with note; toggle to disable approval requirement globally |
| Superadmin — subscription payment review | ⬜ Pending | Incoming platform receipts tab; approve/reject to activate business subscription |
| Superadmin — business detail | ⬜ Pending | Plan, status, trial end date, payment history per business |
| Business — subscription status page | ⬜ Pending | Shows current plan, trial/expiry status, upload receipt for subscription payment |
| Business — plan selector | ⬜ Pending | Choose Standard or Pro at registration; upgradeable from settings |
| Discount codes UI (Standard + Pro) | ⬜ Pending | Create/manage codes (flat or %) from business dashboard |

### Step 3: Public Booking Widget

| Task | Status | Notes |
|---|---|---|
| Widget scaffold | ⬜ Pending | Vanilla JS, single embeddable script |
| Browse classes / events | ⬜ Pending | |
| Date / session picker | ⬜ Pending | Recurring classes |
| Package date-pool picker | ⬜ Pending | Customer picks from approved pool |
| Add-on selector + live estimate | ⬜ Pending | Price updates as selections change |
| PayPal / Wise instructions + QR display | ⬜ Pending | Shown after booking is placed |
| Receipt upload step | ⬜ Pending | Customer uploads proof of payment |
| Confirmation screen | ⬜ Pending | "We'll confirm once we verify your payment" |

### Step 4: WordPress Plugin

| Task | Status | Notes |
|---|---|---|
| PHP plugin scaffold | ⬜ Pending | |
| Embed widget via shortcode | ⬜ Pending | `[buhata_booking key="xxx"]` |
| Plugin settings page in WP admin | ⬜ Pending | Enter API URL and business key |

---

## Phase 2 — Standalone Hosted Booking Page

| Task | Status | Notes |
|---|---|---|
| Hosted booking page | ⬜ Not started | After Phase 1 is live with real clients |

---

## Phase 3 — Strengthen Payments

Pro plan features that require Stripe and more complex payment flows.

| Task | Status | Notes |
|---|---|---|
| Stripe Connect — business onboarding | ⬜ Not started | Pro only; business connects their own Stripe account via OAuth; stored per Business |
| Stripe Connect — booking payments | ⬜ Not started | Pro only; customers pay via Stripe on the booking widget as an alternative to manual receipt upload |
| Invoicing (Pro) | ⬜ Not started | Auto-generate invoices for confirmed bookings; PDF download |
| Partial / installment payments | ⬜ Not started | |
| Refund handling | ⬜ Not started | |
| Calendar sync (Pro — future) | ⬜ Not started | Sync sessions to Google Calendar / iCal |
| Deposits (Pro — future) | ⬜ Not started | Require a deposit at booking, remainder on arrival |

---

## Phase 4 — Shopify

| Task | Status | Notes |
|---|---|---|
| Shopify app | ⬜ Not started | After core product proven |

---

## Phase 5 — Scale

| Task | Status | Notes |
|---|---|---|
| Background job processing | ⬜ Not started | When task volume justifies it |
| Database read replicas / scaling | ⬜ Not started | |
| CDN for widget delivery | ⬜ Not started | |
