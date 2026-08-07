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
| Business CRUD API | ✅ Done | `GET /api/business`, `PATCH /api/business` — auth-gated, returns full business detail incl. payment usernames |
| Event type CRUD API | ✅ Done | `POST/GET /api/event-types`, `GET/PATCH/DELETE /api/event-types/{id}` — soft-delete, scoped to business |
| Session generation logic | ✅ Done | `POST /sessions` (manual), `POST /sessions/generate` (bulk from pattern), `GET/PATCH/DELETE /sessions/{id}` — timezone-aware, cancel = soft-delete |
| Package + date pool logic | ⬜ Pending | Fixed-date and customer-picks variants |
| Add-on + live estimate logic | ⬜ Pending | Price calculation for configurable packages |
| Booking state machine | ⬜ Pending | `pending → awaiting_payment → confirmed / rejected` |
| Receipt upload endpoint | ⬜ Pending | Customer uploads screenshot/photo as payment proof |
| Admin payment review API | ⬜ Pending | Approve or reject uploaded receipt |
| Email — booking confirmation | ⬜ Pending | Resend, triggered on confirmed booking |
| Email — receipt received | ⬜ Pending | Notify admin when receipt is uploaded |
| Email — payment approved | ⬜ Pending | Notify customer when admin approves |
| Email — payment rejected | ⬜ Pending | Notify customer when admin rejects |
| Public session listing API | ⬜ Pending | What the booking widget calls |
| API tests | ⬜ Pending | pytest |

### Step 2: Admin Dashboard

| Task | Status | Notes |
|---|---|---|
| React + Vite + Tailwind setup | ⬜ Pending | |
| Login page | ⬜ Pending | |
| Business settings page | ⬜ Pending | PayPal/Wise payment details, branding |
| Create / edit event types | ⬜ Pending | |
| Sessions list / calendar | ⬜ Pending | Capacity at a glance |
| Bookings list + detail view | ⬜ Pending | |
| Receipt review (approve/reject) | ⬜ Pending | View uploaded image, one-click action |

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

| Task | Status | Notes |
|---|---|---|
| Partial / installment payments | ⬜ Not started | |
| Invoicing | ⬜ Not started | |
| Refund handling | ⬜ Not started | |

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
