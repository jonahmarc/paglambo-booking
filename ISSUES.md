# Issue Log

Running record of bugs encountered and how they were fixed.

---

## 2026-08-10 — Event type edit form silently fails

**Symptom:** Clicking Save in the Edit event type modal did nothing — no error, no update.

**Root cause:** The `kind` field was registered with `{ required: true }` in React Hook Form but rendered as a `disabled` HTML select. RHF includes `disabled` inputs in its internal state, but the interaction between `disabled` and the `required` validation rule caused `handleSubmit` to silently abort without calling `onSave`. No error was displayed because there was no `{errors.kind && ...}` in the JSX.

**Fix:** In edit mode, replaced the disabled `<select>` with a plain `<p>` tag showing the kind as text. Since the field is never registered in edit mode, there is no validation conflict. The PATCH payload is constructed explicitly to only include editable fields (`name`, `description`, `default_capacity`, `base_price`) — `kind` is never sent on edit.

**Files:** `codebase/frontend/src/pages/EventTypes.jsx`

---

## 2026-08-10 — Editing event type capacity did not update existing sessions

**Symptom:** Changing `default_capacity` on an event type saved the event type record but left all existing sessions at their old capacity.

**Root cause:** `update_event_type` only updated the `EventType` row itself. Sessions store their own `capacity` column independently, and nothing cascaded the change.

**Fix:** In `update_event_type`, after applying the field updates, check if `default_capacity` was among the changed fields. If so, emit a bulk UPDATE on all `SCHEDULED` sessions belonging to that event type in the same transaction.

**Files:** `codebase/backend/app/services/event_type.py`

---

## 2026-08-11 — Bookings list and detail showed database ID instead of event type name

**Symptom:** Bookings list displayed "Event #3" and booking detail showed "#3" for the event type — raw database ID with no human-readable name.

**Root cause:** `BookingOut` schema only included `event_type_id: int`. Both `Bookings.jsx` and `BookingDetail.jsx` rendered the raw ID because the name was never included in the API response.

**Fix:** Added `@property event_type_name` to the `Booking` ORM model (accesses the lazy-loaded `event_type` relationship). Added `event_type_name: str` to `BookingOut` — Pydantic's `from_attributes` picks up the property automatically. Updated `Bookings.jsx` line 60 and `BookingDetail.jsx` line 77 to render the name.

**Files:** `codebase/backend/app/models/booking.py`, `codebase/backend/app/schemas/booking.py`, `codebase/frontend/src/pages/Bookings.jsx`, `codebase/frontend/src/pages/BookingDetail.jsx`

---

## 2026-08-11 — Approve/Reject buttons completely hidden when booking is in pending state

**Symptom:** Admin opened a booking that was waiting for a customer to upload a receipt and saw no Approve or Reject buttons at all — no explanation of why, no indication of what to do next.

**Root cause:** `BookingDetail.jsx` wrapped the entire review section in `{canReview && (...)}` where `canReview = booking.status === 'awaiting_payment' && booking.payment`. When the booking was still `pending` (no receipt yet), the condition was false and the block was hidden entirely.

**Fix:** Replaced the hidden guard with a `reviewDisabledReason` string derived from booking status. The review card now always renders. Buttons are disabled with `disabled:cursor-not-allowed`; the reason string appears as a `title` attribute on the wrapping `<span>` (browser tooltip on hover) and as inline italic text below the buttons. The note textarea is also disabled when review is not actionable.

**Files:** `codebase/frontend/src/pages/BookingDetail.jsx`

---

## 2026-08-11 — Admin sessions list showed capacity only, not how many seats were taken

**Symptom:** Each session row in the admin sessions list showed "Cap: 10" but no indication of how many bookings had already claimed those spots. Admin had no way to see at a glance which sessions were filling up or fully booked.

**Root cause:** `SessionOut` schema only exposed `capacity`. The `_available_spots` calculation existed in `services/public.py` for the customer-facing API but was never wired to the admin session endpoint.

**Fix:** Added `booked_count: int = 0` to `SessionOut`. Added `get_booked_counts(db, session_ids)` helper to `services/session.py` — a single aggregate query over the `booking_sessions` join table, excluding rejected bookings (matching the same logic as the public `_available_spots`). Updated the `list_all` session router endpoint to fetch booked counts and attach them via `model_copy(update={...})`. Updated `Sessions.jsx` to display `{booked}/{capacity} booked` per session row.

**Files:** `codebase/backend/app/schemas/session.py`, `codebase/backend/app/services/session.py`, `codebase/backend/app/routers/session.py`, `codebase/frontend/src/pages/Sessions.jsx`

---

## 2026-08-11 — Admin booking detail showed raw numeric ID instead of zero-padded booking ref

**Symptom:** The booking detail page heading showed "Booking #7" instead of "Booking #000007".

**Root cause:** `BookingDetail.jsx` used `booking.id` (raw integer) in the `<h1>`. The `booking_ref` property was added to `BookingOut` and the API but the frontend template wasn't updated.

**Fix:** Changed `Booking #{booking.id}` to `Booking #{booking.booking_ref}` in `BookingDetail.jsx`.

**Files:** `codebase/frontend/src/pages/BookingDetail.jsx`

---

## 2026-08-11 — FIXED package sessions missing from booking summary sidebar

**Symptom:** When a customer selected a FIXED package event type on the booking page, the booking summary sidebar showed no sessions — even though the committed sessions were visible in the session picker section.

**Root cause:** `SummaryCard` displays sessions by filtering `allSessions` by `selectedSessionIds`. For FIXED packages, `selectedSessionIds` is always `[]` (the customer doesn't pick sessions; the backend auto-assigns pool sessions). So the filter returned nothing.

**Fix:** Computed `displaySessionIds` alongside `selectedSessionIds` in `BookingPage`. For FIXED packages it equals all pool session IDs; for everything else it equals `selectedSessionIds`. `SummaryCard` now receives `displaySessionIds` as the `sessionIds` prop.

**Files:** `codebase/frontend/src/pages/BookingPage.jsx`

---

## 2026-08-11 — Business slug was not editable — booking page URL could not be set

**Symptom:** The `slug` column existed in the database after the Round 2 migration, but there was no way to set it. `BusinessDetail` schema didn't include it, `BusinessUpdate` didn't accept it, and the Settings page had no slug field. The booking page at `/book/:slug` was fully built but no business could activate it.

**Root cause:** Round 2 only added the model and migration. The schema, service, router, and frontend Settings page were not updated to expose the field.

**Fix:** Added `slug: str | None` to `BusinessDetail` and `BusinessUpdate`. Added a Pydantic `@field_validator` that enforces lowercase-alphanumeric-hyphens, 3–100 chars. `update_business` service checks for slug uniqueness across other businesses and raises `ValueError` on conflict (surfaced as HTTP 400 in the router). Settings page gained a slug input with an inline URL prefix, a "Generate from business name" helper button, and a "Preview ↗" link.

**Files:** `codebase/backend/app/schemas/business.py`, `codebase/backend/app/services/business.py`, `codebase/backend/app/routers/business.py`, `codebase/frontend/src/pages/Settings.jsx`

---

## 2026-08-11 — Total price ignored party size

**Symptom:** A booking for 3 people at $50/person would be charged $50 instead of $150. Party size had no effect on the total.

**Root cause:** `create_booking` in `services/booking.py` calculated `total_price = event_type.base_price + sum(addon prices)` — party_size was stored on the booking but never factored into the price.

**Fix:** Changed to `total_price = event_type.base_price * data.party_size + sum(addon prices)`.

**Files:** `codebase/backend/app/services/booking.py`

---

## 2026-08-11 — Capacity check did not account for party size

**Symptom:** A group of 5 people could book a session that only had 2 spots remaining. The backend would accept the booking because it only checked `booked_count >= capacity` (session fully booked) rather than whether enough spots were available for the entire party.

**Root cause:** `_check_session_capacity` only blocked when a session was completely full. It had no concept of party size and took no `party_size` argument.

**Fix:** Added `party_size: int = 1` parameter to `_check_session_capacity`. Now checks `available_spots < party_size` instead of `booked_count >= capacity`. Error message distinguishes "fully booked" from "only N spots left — not enough for a party of M". Updated `_resolve_sessions` to accept and forward `party_size`, and `create_booking` to pass `data.party_size`.

**Files:** `codebase/backend/app/services/booking.py`

---

## 2026-08-11 — Package sessions not appearing on the public booking page

**Symptom:** After creating a package event type and adding sessions to it, the booking page showed an empty session picker ("No sessions available") even though sessions were visible in the admin Sessions page.

**Root cause:** The admin Sessions page creates sessions via `POST /api/event-types/{id}/sessions`, which inserts rows into the `sessions` table. However, the public API and booking engine both read from `pkg.pool_sessions` — the `package_session_pool` association table. Nothing ever populated that join table. The pool management API (`POST /api/packages/{id}/pool`) exists but was never called from the Sessions page.

**Fix:**
1. In `routers/session.py`, `create()` and `generate()` endpoints now check `et.package` after creating session(s); if the event type is a package, the new session(s) are appended to `et.package.pool_sessions` and committed in the same request.
2. Added `sync_sessions_to_pool(db, event_type_id)` in `services/session.py` — finds all sessions for the event type that are not yet in the pool and appends them.
3. Added `POST /api/event-types/{id}/sessions/sync-pool` endpoint (204 No Content) that calls the sync function.
4. In `Sessions.jsx`, when the loaded event type is a package, the `load()` function silently calls the sync endpoint after loading — this backfills any existing sessions that pre-date the router fix.

**Files:** `codebase/backend/app/services/session.py`, `codebase/backend/app/routers/session.py`, `codebase/frontend/src/pages/Sessions.jsx`

---

## 2026-08-10 — Hard-deleting an event type raised StaleDataError

**Symptom:** Deleting an event type with sessions crashed with:
```
sqlalchemy.orm.exc.StaleDataError: UPDATE statement on table 'sessions'
expected to update 30 row(s); 0 were matched.
```

**Root cause:** The delete routine first loaded `event_type.sessions` into SQLAlchemy's identity map (to collect session IDs for association cleanup), then bulk-deleted those session rows using `delete(synchronize_session=False)`. `False` skips updating the identity map, so SQLAlchemy still believed those 30 session objects were persistent. When `db.delete(event_type)` was called next, SQLAlchemy tried to emit UPDATE statements to deassociate the (already-deleted) sessions from their parent, matched 0 rows, and raised `StaleDataError`.

**Fix:** Changed `synchronize_session=False` to `synchronize_session="fetch"` on both the sessions and add-ons bulk deletes. `"fetch"` makes SQLAlchemy SELECT the affected rows first, evict them from the identity map, then DELETE — so the identity map is clean before the event type itself is removed.

**Files:** `codebase/backend/app/services/event_type.py`

---

## 2026-08-20 — QR code images feature added

**New feature, not a bug fix.** Added end-to-end QR code image support for PayPal and Wise payment methods.

**Backend:**
- `paypal_qr_path` and `wise_qr_path` columns added to the `businesses` table (migration `d4e5f6a7b8c9`).
- `has_paypal_qr` / `has_wise_qr` properties on the `Business` ORM model; exposed in `BusinessDetail` and `PublicBusinessOut`.
- `POST /api/business/qr/{method}` — authenticated upload, saves image to `UPLOAD_DIR/qr/{id}_{method}{ext}`.
- `DELETE /api/business/qr/{method}` — removes file from disk and clears DB path.
- `GET /api/public/{booking_key}/qr/{method}` — unauthenticated serve via `FileResponse`.
- `save_qr_file()` added to `services/payment.py` (mirrors `save_receipt_file` pattern; images only, 5 MB max).

**Admin Settings:**
- `QrUploader` component: upload/replace/remove per method with live image preview.
- Sits outside the main JSON form so file uploads don't interfere with the PATCH call.

**Booking page:**
- QR image renders inline under account details when the selected method has a QR on file.

**Files:** `codebase/backend/app/models/business.py`, `codebase/backend/app/schemas/business.py`, `codebase/backend/app/schemas/public.py`, `codebase/backend/app/routers/business.py`, `codebase/backend/app/routers/public.py`, `codebase/backend/app/services/payment.py`, `codebase/backend/alembic/versions/d4e5f6a7b8c9_qr_paths.py`, `codebase/frontend/src/pages/Settings.jsx`, `codebase/frontend/src/pages/BookingPage.jsx`
