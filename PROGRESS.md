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
| Booking number format | ✅ Done | `booking_ref` property on Booking model — `str(self.id).zfill(6)`. Included in `BookingOut` and `BookingPublicOut`. Pydantic picks it up via `from_attributes`. |
| Business contact info in public API | ✅ Done | `business_name` and `business_email` added to `BookingPublicOut`; populated in the booking router from the Business object. |
| Payment QR code images | ⬜ Pending | Business uploads a PayPal QR and/or Wise QR image via admin Settings. Stored in `UPLOAD_DIR/qr/`. Served by `GET /api/public/{key}/qr/{method}`. Booking page shows the image on the payment step alongside the username. |
| Email — booking created | ✅ Done | `send_booking_created(booking, business)` in `services/email.py`. Fires immediately on `POST /api/public/{booking_key}/bookings`. Includes booking ref, event name, party size, sessions, and PayPal/Wise payment instructions (or contact email fallback). |
| Party size — model + schema | ✅ Done | `party_size: int` (default 1, server_default "1") added to Booking model + migration `c3d4e5f6a7b8`. Added to `BookingCreate`, `BookingOut`, `BookingPublicOut`. Stored in DB; passed through to confirmation response and email. |
| Party size — capacity check | ✅ Done | `_check_session_capacity` updated to accept `party_size`; checks `available < party_size` and raises a clear error. `_resolve_sessions` passes `party_size` through from `create_booking`. |
| Attendee model | ✅ Done | `Attendee` model added (`booking_id` FK, `name`, `email`, `phone`). Migration `c3d4e5f6a7b8`. `AttendeeIn`/`AttendeeOut` schemas added. `BookingCreate.attendees` list accepted; stored in `create_booking`. `BookingOut.attendees` returned for admin detail view. |
| Attendee — extended fields | ⬜ Pending | Current Attendee only has name/email/phone. Event/travel use case requires id_or_passport, nationality, date_of_birth, special_requirements. Add fields + migration when the travel booking flow is built. |
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
| Bookings list + detail view | ✅ Fixed | `event_type_name: str` added to `BookingOut` via `@property event_type_name` on the Booking ORM model (lazy-loads the relationship). `Bookings.jsx` and `BookingDetail.jsx` updated to display the name. |
| Sessions — capacity / availability view | ✅ Done | `booked_count: int` added to `SessionOut`. `get_booked_counts()` helper added to `services/session.py` (single aggregate query, excludes rejected bookings). `list_all` session router endpoint now attaches counts. Sessions list displays `{booked}/{capacity} booked` per row. |
| Bookings — no approval button visible | ✅ Fixed | Review card always renders in `BookingDetail.jsx`. `reviewDisabledReason` string computed from booking status — passed to `title` on button wrapper `<span>` and shown as inline text below the buttons. Buttons disabled with `disabled:cursor-not-allowed` when not in `awaiting_payment` state. Textarea also disabled when not reviewable. |
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
| Business slug field — backend | ✅ Done | `slug` (nullable, unique, indexed, `String(100)`) added to Business model + migration `c3d4e5f6a7b8`. `BusinessDetail` returns it; `BusinessUpdate` accepts it with regex validation (lowercase, alphanumeric, hyphens, 3–100 chars). Duplicate slug returns HTTP 400. |
| Business slug — admin UI | ✅ Done | Slug field added to `Settings.jsx` with inline URL prefix (`{origin}/book/`), "Generate from business name" helper, and "Preview ↗" link. Business owner sets their slug and immediately gets a sharable booking link. |
| Slug resolver endpoint | ✅ Done | `GET /api/public/by-slug/{slug}` on `meta_router` (prefix `/api/public`). Returns `PublicBusinessOut`: name, slug, booking_key, email, paypal_username, wise_username. Registered in `main.py` before the `{booking_key}` router to avoid path parameter collision. |
| Booking page — React route | ✅ Done | `/book/:slug` added to `App.jsx` before the `/*` catch-all (no auth). `BookingPage.jsx` resolves slug → business info → event types on load. |
| Booking page — browse event types | ✅ Done | Event type cards: name, description, kind label, base price per person. Empty state when no events available. |
| Booking page — session picker | ✅ Done | RECURRING: sessions grouped by date, time-slot buttons per group, spots badge (amber ≤3, grey full, disabled if `available_spots < partySize`). PACKAGE FIXED: read-only list of committed sessions. PACKAGE CUSTOMER_PICKS: multi-select up to `required_session_count`. ONE_TIME: auto-selected, shown as info. Empty state message when no sessions available. |
| Booking page — party size | ✅ Done | +/− picker before session selector. Changing party size clears session selection. Price = `base_price × party_size + add-ons` (fixed in service layer too). Capacity check: sessions disabled when `available_spots < partySize`. |
| Booking page — add-on selector | ✅ Done | Toggle cards with name, description, price. Live summary sidebar updates total as selections change. |
| Booking page — attendee details | ✅ Done | When `partySize > 1`, shows `partySize − 1` extra attendee forms in checkout (name required, email + phone optional). Primary booker covered by customer form. Attendees submitted with booking. |
| Booking page — checkout (single page) | ✅ Done | Single-page checkout: customer info form + extra attendee forms (if party > 1) + payment instructions (account details for selected method) + method selector (shown only when both configured; auto-selected when only one) + file upload for receipt + "Confirm Booking" CTA. Booking created on submit, receipt uploaded immediately after. No payment method configured → amber notice with business email. |
| Booking page — confirmation screen | ✅ Done | Full-page confirmation with booking ref (#000001), event name, party size, total, session dates, and contact email. Status-aware message: awaiting_payment vs. pending (no payment method). |
| Pricing — base_price × party_size | ✅ Done | Fixed in `services/booking.py`: `total_price = base_price * party_size + addon_prices`. Previously add-ons only, party_size was ignored. |
| Booking page — SEO / meta | ⬜ Pending | Dynamic `<title>` and description per business using `document.title`. |
| Booking page — QR code display | ⬜ Pending | QR code images not yet supported (requires QR upload feature in admin Settings). Currently shows account username only. |
| Booking page — promo code | ⬜ Pending | Promo code input field on checkout. Requires discount codes API (Step 1). |

### Planned Feature Enhancements (prioritized backlog)

Features identified for future sprints, in rough priority order.

#### Per-event custom payment + QR code
Each event type can have its own payment configuration — the business uploads a QR code and payment details specific to that event. Shown on the booking page payment step instead of (or in addition to) the global business-level payment info.

#### Per-event payment toggle — RSVP mode
Event types have a payment toggle. When payment is off, the event becomes RSVP-only — no receipt upload, no payment instructions shown. Booking goes straight to confirmed status on submit.

#### Per-event visibility — public vs. private
Event types can be set to **Public** (appears on the booking page at `/book/{slug}`) or **Private** (hidden from the listing). Private events have an unlisted direct link — the business shares the link manually (e.g. via WhatsApp). Only people with the link can book.

#### Attendee management per event
Full attendee tracking from the admin dashboard: per-booking list of attendees with name, contact, payment status, and any other details. Group bookings (one person books for multiple people) share the same booking number and payment record — only the per-person fields (name, etc.) differ per attendee. Admin can filter and export.

#### Event photo gallery
Each event type can have a photo gallery — the business uploads images in the admin dashboard. Shown on the event detail card / booking page to give customers a visual preview.

---

#### Not prioritized
- Customizable booking page design (colours, fonts, layout)

---

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
| Party size field | ✅ Done | `party_size: int` on Booking model + migration. `BookingCreate` accepts it; stored in `create_booking`; included in `BookingOut` and `BookingPublicOut`. |
| Attendee details model | ⚠ Partial | `Attendee` model added (name, email, phone). Full travel fields (id_or_passport, nationality, DOB, special_requirements) deferred — see "Attendee — extended fields" above. |
| Admin — attendee list per booking | ⬜ Pending | `BookingOut.attendees` returned by API. Admin `BookingDetail.jsx` not yet updated to display them. CSV export not started. |
| Capacity check respects party size | ✅ Done | `_check_session_capacity` now takes `party_size`; raises a specific error if `available_spots < party_size`. Message differentiates "fully booked" from "not enough spots for your party size". |

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
