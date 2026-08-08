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
| API tests | ⬜ Pending | pytest |

### Step 2: Admin Dashboard

| Task | Status | Notes |
|---|---|---|
| React + Vite + Tailwind setup | ✅ Done | Vite 6, React 19, Tailwind v4, react-router-dom v7, react-hook-form |
| Login page | ✅ Done | Email + password, JWT stored in localStorage, auto-refresh |
| Business settings page | ✅ Done | Name, PayPal/Wise usernames, booking key (read-only) |
| Create / edit event types | ✅ Done | List, create modal, edit modal, activate/deactivate, link to sessions |
| Sessions list / calendar | ✅ Done | Manual add + bulk generate; cancel; linked from event types |
| Bookings list + detail view | ✅ Done | Status filter tabs; detail shows customer, sessions, add-ons, payment |
| Receipt review (approve/reject) | ✅ Done | Receipt image preview inline; approve/reject with optional note |

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
