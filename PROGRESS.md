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
| Booking number format | ⬜ Pending | Display ID as 6-digit zero-padded string (000001, 000002…). Storage stays integer; formatting is display-only — `str(id).zfill(6)` in schema + frontend. |
| Business contact info in public API | ⬜ Pending | Add business email/phone to `BookingPublicOut` so the booking page can show contact details when no PayPal/Wise username is configured. |
| Payment QR code images | ⬜ Pending | Business uploads a PayPal QR and/or Wise QR image via admin Settings. Stored in `UPLOAD_DIR/qr/`. Served by `GET /api/public/{key}/qr/{method}`. Booking page shows the image on the payment step alongside the username. |
| Email — booking created | ⬜ Pending | Send email to customer immediately when booking is placed (before payment), containing: booking number, event name, session date(s), total due, and PayPal/Wise payment instructions. Currently email is only sent after admin approves. |
| Party size + multi-slot booking | ⬜ Pending | Add `party_size: int` (default 1) to Booking model + migration. Price = base_price × party_size + add-ons. Booking page: "How many people?" step before session picker. Capacity check: `available_spots >= party_size`. |
| Attendee details per person | ⬜ Pending | New `Attendee` model (booking_id FK, name, email, id_or_passport, nationality, date_of_birth, special_requirements). Collected on booking page when `party_size > 1` — one form block per person. Admin booking detail shows all attendees. Required for the event/travel use case (see below). |
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
| Business model — subscription fields | ✅ Done | `plan`, `status`, `trial_ends_at`, `approved_at` added to Business; migration `b2c3d4e5f6a7` |
| Approval toggle setting | ✅ Done | `platform_settings` table; `require_approval` + `trial_duration_days` seeded; `GET/PATCH /api/superadmin/settings` |
| Superadmin approval API | ✅ Done | `POST /api/superadmin/businesses/{id}/approve`, `/reject`; trial started on approve |
| Trial period logic | ✅ Done | Lazy-expire on every request (no background job needed yet); public widget blocked when expired |
| Trial expiry reminders | ⬜ Pending | Email functions written; sending requires a cron/background job (Phase 5) |
| Plan feature gate middleware | ✅ Done | `get_business_or_404` blocks widget if `status not in (trial, active)`; `get_current_business` allows login for expired/pending so they can upload receipt |
| Platform subscription receipt upload | ✅ Done | `POST /api/subscriptions/receipt`; `GET /api/subscriptions/my-payments` |
| Superadmin subscription review API | ✅ Done | `GET /api/superadmin/subscription-payments`, `POST .../approve`, `.../reject` |
| Email — new registration | ✅ Done | Superadmin notified on new registration; business notified if auto-approved |
| Email — registration approved/rejected | ✅ Done | Business emailed on approve/reject |
| Email — subscription payment received | ✅ Done | Superadmin notified when receipt uploaded |
| Email — subscription approved/rejected | ✅ Done | Business notified of outcome |

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
| Bookings list + detail view | ⚠ Bug | Bookings list shows `Event #<id>` (database ID) instead of the event type name. Both `Bookings.jsx` (line 60) and `BookingDetail.jsx` (line 77) use `event_type_id` only — the `BookingOut` schema must include `event_type_name`. |
| Sessions — capacity / availability view | ⬜ Pending | Admin cannot see how many slots are taken vs. available per session. The backend already calculates `available_spots` correctly (used in public API). Need to expose this in the admin sessions list. For recurring and package event types, capacity limit is per session (per day), not across all sessions. |
| Bookings — no approval button visible | ⚠ Bug/UX | Approve/Reject buttons in `BookingDetail.jsx` only render when `status === 'awaiting_payment' && payment exists`. Admin sees the booking but has no action to take until the customer submits a receipt, with no explanation why. Fix: always render the Approve/Reject buttons; disable them when the state isn't right; on hover over a disabled button show a tooltip explaining why (e.g. "Waiting for customer to upload payment receipt" when status is `pending`, "No receipt on file" if somehow state is wrong). Also add a status message in the UI explaining the current step in the flow. |
| Receipt review (approve/reject) | ✅ Done | Receipt image preview inline; approve/reject with optional note |
| Superadmin — approval queue | ✅ Done | `/superadmin/approvals` — pending registrations with approve/reject + note |
| Superadmin — subscription payment review | ✅ Done | `/superadmin/subscriptions` — receipt review with view/approve/reject; receipt served via `GET /api/superadmin/subscription-payments/{id}/receipt` |
| Superadmin — business detail | ✅ Done | Businesses list shows plan badge, status badge, trial end date, enable/disable toggle |
| Superadmin — settings | ✅ Done | `/superadmin/settings` — toggle require_approval, set trial_duration_days |
| Business — subscription status page | ✅ Done | `/subscription` — status card, receipt upload form, payment history |
| Business — plan selector | ✅ Done | Standard/Pro cards on `/register`; status-aware redirect after registration |
| Business — status banner | ✅ Done | Layout banner for pending/expired/rejected with link to subscription page |
| Discount codes UI (Standard + Pro) | ⬜ Pending | Create/manage codes (flat or %) from business dashboard |

### Step 3: JS Booking Widget — superseded, kept for reference only

> **The vanilla JS widget (`codebase/widget/`) is no longer the primary customer-facing channel.** It was built as a proof-of-concept but has been superseded by the hosted public booking page (Step 3b, now promoted to Step 3). All booking UX work — including fixes for the bugs noted below and all planned upgrades — will be built on the hosted page instead.
>
> **Known widget bugs (not being fixed here — equivalents must not appear on the booking page):**
> - Receipt upload: "Please select payment method" error when neither PayPal nor Wise username is set on the business.
> - Package sessions: pool sessions with past `start_time` are silently filtered by `_future_scheduled()` in the public service — widget shows empty list with no explanation.
> - Payment step: no QR code images, no business contact info in fallback message.
> - Sessions: available spots not shown for PACKAGE pool sessions.
>
> The widget code stays in `codebase/widget/` but will not be actively maintained. The WordPress plugin (Step 4) will embed the hosted booking page via iframe instead.

### Step 3b → now Step 3: Hosted Public Booking Page

**The primary customer-facing booking experience.** Accessible at `app.buhatabooking.com/book/bamboo-cooking-school` — no WordPress, no embed complexity. Business owners share the URL directly (WhatsApp, email, Instagram bio). Uses the existing React + Tailwind stack so it shares components with the admin dashboard and is easy to maintain. WordPress plugin iframes this page.

---

#### UX Reference: Courtogo, Eventbrite, Events Calendar, Amelia

These are studied as references for the booking page UX. Not copying — adapting what makes sense for our use cases (cooking classes + event/travel packages).

**Courtogo (courtogo.com)** — Philippine sports venue booking platform. Closest reference for the payment + receipt flow.
- No login required to browse or book. Customer stays anonymous until checkout.
- Venue detail page has a **time-slot grid**: rows = hourly slots, columns = courts/resources. Cells are color-coded — Free (white), Your selection (green), Taken (grey), Awaiting payment (amber). Tap to select; drag down to grab consecutive slots. Very visual availability at a glance.
- Booking summary appears below the grid while selecting, showing selected slot(s), total, "Proceed to Booking."
- **Checkout is ONE page** — not split into payment instructions then receipt upload. Left column: booking summary + promo code + total. Right column: customer info (name, email, phone) → payment section (GCash account name partially masked, mobile number, QR code with Save button, "Send ₱300.00 to this account") → drag-and-drop receipt upload area → single "Upload Payment to Continue" CTA. This is cleaner than our current two-step approach.
- QR code shown inline. Account details partially masked for privacy.

**Eventbrite** — event ticketing platform. Reference for event browsing + ticket quantity flow.
- Browse events by category, date, location. Event cards with featured image, title, date, price.
- Event detail page: large hero, date/time/location prominently shown, ticket type selector, quantity picker (= our party size), order summary with itemized breakdown.
- Checkout: customer info, order summary always visible on the right. Clean and linear.

**The Events Calendar / WooCommerce Tickets** — WordPress event plugin. Reference for event listing UX on a business's own site.
- Calendar view of upcoming events — month/week/list toggle.
- Event detail with "Get Tickets" CTA, capacity display ("X of Y tickets remaining").
- Useful framing: show remaining capacity prominently, not hidden.

**Amelia (booking plugin)** — appointment/service booking. Reference for class and recurring session booking.
- Service selection → visual calendar (available dates highlighted, past/full dates greyed out) → time slot list for selected date → customer info → confirmation.
- Key idea: the calendar makes it obvious which dates are bookable before the customer clicks into them. Not a flat list.
- Staff/resource assignment per booking — not applicable to us now but relevant if we add instructor assignment later.

**What we take from these for the booking page:**

| Pattern | Source | Apply to our page |
|---|---|---|
| No login to book | All | ✅ Already planned |
| Visual calendar / grid session picker | Courtogo, Amelia | For recurring CLASS events: calendar view showing available dates. Greyed-out = full or past. For packages: list with spots remaining. |
| Slot availability states shown visually | Courtogo | Show remaining spots per session prominently. Consider colour: available (green) / almost full (amber, e.g. ≤3 spots) / full (grey, hidden or disabled). |
| Checkout on ONE page | Courtogo | Combine customer info + payment instructions + QR + receipt upload on a single checkout page. Booking is created on submit, not before. Payment instructions and receipt upload are not separate page steps — they're sections on the same page. |
| Always-visible booking summary | Courtogo, Eventbrite | Sticky right-column summary on desktop, sticky bottom bar on mobile. Shows event name, session date(s), add-ons, total. Updates live as selections change. |
| Ticket quantity / party size | Eventbrite | "How many people?" shown early — affects capacity check and price, and determines number of attendee forms. |
| Remaining capacity shown | Events Calendar | e.g. "4 spots left" badge on session cards. Amber warning when low. |
| Promo code on checkout | Courtogo, Eventbrite | Input field in the booking summary section. |
| QR code inline | Courtogo | Business uploads QR for PayPal/Wise; shown on checkout next to account details. Save/download button. Amount to send shown dynamically from booking total. |

---

| Task | Status | Notes |
|---|---|---|
| Business slug field — backend | ⬜ Pending | Add `slug` (unique, URL-safe) to Business model + migration. Auto-generated from business name on registration (e.g. "Bamboo Cooking School" → "bamboo-cooking-school"). Admin can edit from Settings. |
| Slug resolver endpoint | ⬜ Pending | `GET /api/public/by-slug/{slug}` — returns `booking_key` + business name + contact info. Used by the booking page on load. |
| Booking page — React route | ⬜ Pending | New route `/book/:slug` in `App.jsx`, no auth required. Resolves slug → business, then renders the full booking flow. |
| Booking page — browse event types | ⬜ Pending | Cards showing event type name, description, kind (class/package), base price, available spots summary. Must not show past-only events. |
| Booking page — session picker | ⬜ Pending | Visual calendar/grid for CLASS (recurring) events: available dates highlighted, full/past dates greyed out. Clicking a date shows time slots for that day. Each session shows remaining spots; amber when ≤3 left, grey/disabled when full. PACKAGE FIXED: committed sessions shown read-only. PACKAGE CUSTOMER_PICKS: multi-select up to required count. Empty pool → clear "no upcoming sessions" message, not a blank screen. |
| Booking page — party size | ⬜ Pending | "How many people?" shown early in the flow, before session picker. Capacity check: `available_spots >= party_size`. Price = base_price × party_size + add-ons. Determines number of attendee detail forms. |
| Booking page — add-on selector | ⬜ Pending | Toggle cards per add-on. Live booking summary sidebar/bar updates total as selections change. |
| Booking page — attendee details | ⬜ Pending | When `party_size > 1`, collect per-person details (name, ID/passport, nationality, DOB, special requirements). One form block per person. Primary booker is person 1. |
| Booking page — checkout (single page) | ⬜ Pending | One page combining: customer info (name, email, phone) + booking summary (sticky right column on desktop, sticky bottom bar on mobile) + promo code field + payment instructions (PayPal/Wise username, QR code with Save button, "Send ₱X.XX to this account") + drag-and-drop receipt upload + single submit CTA. Booking is created on submit — not before. If neither payment method is set, show business contact details instead of QR. Method auto-selected when only one exists; selector shown when both exist. |
| Booking page — confirmation screen | ⬜ Pending | Full-page confirmation: 6-digit booking number, event name, session date(s), total paid, "We'll review your receipt and confirm by email." Confirmation email also sent at this point (see Step 1 — email on booking created). |
| Booking page — SEO / meta | ⬜ Pending | Dynamic `<title>` and description per business. |

### Step 4: WordPress Plugin

| Task | Status | Notes |
|---|---|---|
| PHP plugin scaffold | ⬜ Pending | |
| Embed via shortcode (iframe) | ⬜ Pending | `[buhata_booking slug="bamboo-cooking-school"]` — renders `<iframe src="https://app.buhatabooking.com/book/bamboo-cooking-school" ...>`. Simple wrapper around the hosted booking page. |
| Plugin settings page in WP admin | ⬜ Pending | Enter platform URL and business slug |

---

## Event & Travel Package Use Case (FIFA World Cup style)

A second client type beyond the cooking school: **event/travel package company**. Customers book ticket + hotel packages for a fixed event (e.g. a World Cup match). This requires the platform to handle multi-person bookings with individual attendee details.

**How it differs from a class booking:**

| Dimension | Cooking class | Event / travel package |
|---|---|---|
| Booking unit | 1 person books 1 session | Customer books N tickets (party_size ≥ 1) |
| Attendee data | Just the booker's name + email | Full details per person (name, passport, nationality, DOB) |
| Add-ons | Generic extras (e.g. apron kit) | Per-booking (e.g. hotel room — 1 room for the group, not per person) |
| Sessions | Recurring dates to pick from | Fixed match date(s), typically FIXED package date mode |
| Pricing | Per-session flat rate | Base price × party_size + optional add-ons |

**Required work (all tied to pending items in Step 1 above):**

| Task | Status | Notes |
|---|---|---|
| Party size field | ⬜ Pending | `party_size` on Booking model; booking page asks "How many people?" before session picker; price = base × party_size + add-ons |
| Attendee details model | ⬜ Pending | New `Attendee` table: name, id_or_passport, nationality, date_of_birth, special_requirements (per person, FK to Booking). Booking page shows one attendee form per party_size. |
| Admin — attendee list per booking | ⬜ Pending | Booking detail page shows all attendees in a table. Exportable to CSV for event organisers. |
| Capacity check respects party size | ⬜ Pending | On booking creation: `available_spots >= party_size`, not just `>= 1`. |

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
