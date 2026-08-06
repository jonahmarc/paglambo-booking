# Frontend

Two deliverables built from this directory:

## 1. Admin Dashboard

React web app for business owners to manage their offerings, view bookings, and approve or reject payment receipts.

**Stack:** React + Vite + Tailwind CSS + React Hook Form

**Status:** Not started — begins in Phase 1, Step 2.

## 2. Public Booking Widget

Lightweight embeddable JavaScript component. Customers use it to browse classes, pick dates or packages, configure add-ons, see a live price estimate, and submit their booking with payment proof.

Delivered as a single `<script>` tag — works on WordPress, any static site, or any CMS.

**Stack:** Vanilla JS, no framework dependency.

**Status:** Not started — begins in Phase 1, Step 3.

---

## Setup (when Phase 1 Step 2 begins)

```bash
cd codebase/frontend
npm install
npm run dev
```

Admin dashboard dev server: http://localhost:5173

The widget will have its own build output (`dist/widget.js`) that can be included via `<script>` on any site.

## Brand colors (reference)

| Name | Hex | Used for |
|---|---|---|
| Amber | `#C8841A` | Primary actions (Book now, Confirm) |
| Deep Slate | `#1A2E3D` | Admin dashboard chrome, text |
| Terracotta | `#C85A38` | Urgency cues (limited slots, pending payment) |
| Warm Cream | `#FAF5EB` | Booking widget background |
