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

## 2026-08-10 — Hard-deleting an event type raised StaleDataError

**Symptom:** Deleting an event type with sessions crashed with:
```
sqlalchemy.orm.exc.StaleDataError: UPDATE statement on table 'sessions'
expected to update 30 row(s); 0 were matched.
```

**Root cause:** The delete routine first loaded `event_type.sessions` into SQLAlchemy's identity map (to collect session IDs for association cleanup), then bulk-deleted those session rows using `delete(synchronize_session=False)`. `False` skips updating the identity map, so SQLAlchemy still believed those 30 session objects were persistent. When `db.delete(event_type)` was called next, SQLAlchemy tried to emit UPDATE statements to deassociate the (already-deleted) sessions from their parent, matched 0 rows, and raised `StaleDataError`.

**Fix:** Changed `synchronize_session=False` to `synchronize_session="fetch"` on both the sessions and add-ons bulk deletes. `"fetch"` makes SQLAlchemy SELECT the affected rows first, evict them from the identity map, then DELETE — so the identity map is clean before the event type itself is removed.

**Files:** `codebase/backend/app/services/event_type.py`
