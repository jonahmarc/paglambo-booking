# CLAUDE.md — Buhata Booking

Project context and decisions for AI-assisted development.

## What this project is

Buhata Booking is a booking and class management platform built for small businesses — starting with a cooking school and an event/travel package company. It runs as a FastAPI backend with a React admin dashboard and an embeddable public booking widget. The first delivery channel is WordPress.

## Tech stack

| Layer | Choice |
|---|---|
| Backend | FastAPI (Python 3.11+) |
| Database | PostgreSQL |
| Admin dashboard | React + Vite + Tailwind + React Hook Form |
| Booking widget | Vanilla JS — single embeddable `<script>` tag |
| WordPress plugin | PHP — thin wrapper around the widget |
| Email | Resend (free tier) |
| Hosting | DigitalOcean VPS (already provisioned) |
| Deployment | GitHub Actions → DigitalOcean VPS via SSH |

## Payment approach

**No Stripe. No payment gateway. Manual payment only.**

Customers pay via PayPal or Wise (QR code or username displayed at checkout). They then upload a screenshot or receipt as proof. The business owner reviews it in the admin dashboard and approves or rejects manually.

- Do NOT add Stripe, payment gateway SDKs, or automated payment confirmation logic.
- Payment states: `pending → awaiting_payment → confirmed` (or `rejected`).
- Receipt uploads are stored on the VPS (or DO Spaces when backups are set up).

## Email

Provider: Resend (free tier). API key is in `.env` as `RESEND_API_KEY`.

Domain is NOT yet purchased — Cloudflare domain + verified email is planned after the platform is working. Until then, use Resend sandbox/test mode. Do not assume a verified sending domain exists.

`RESEND_FROM_EMAIL` will be set once the Cloudflare domain is purchased and verified in Resend.

## Infrastructure

| Resource | Status | Notes |
|---|---|---|
| DigitalOcean VPS | ✅ Provisioned | 1GB RAM for now, upgrade to 2GB when traffic starts |
| PostgreSQL | Set up in Phase 0 | On the VPS |
| Domain | Not yet | Will be Cloudflare |
| GitHub repo | Not yet | User initializes Git in the root `/Buhata Booking/` folder |
| DO Spaces backups | Phase 0 | Nightly DB + file backups |

## Code layout

```
codebase/
├── backend/     FastAPI app
└── frontend/    React admin dashboard + embeddable booking widget
```

All code lives under `/codebase/`. The root folder (`/Buhata Booking/`) holds docs, artifacts, CLAUDE.md, and PROGRESS.md only.

## Build order

| Phase | Scope |
|---|---|
| 0 | Foundation — VPS, DB, deploy pipeline |
| 1 | Backend engine → Admin dashboard → Booking widget → WordPress plugin |
| 2 | Standalone hosted booking page (no WordPress required) |
| 3 | Strengthen payments — partial/installments, invoicing, refunds |
| 4 | Shopify app |
| 5 | Scale — background jobs, DB scaling, CDN |

## What NOT to build yet

- Stripe or any payment gateway
- Guided payment setup flow
- Standalone hosted booking page (Phase 2)
- Shopify app (Phase 4)
- Multiple languages or currencies
- SMS/text notifications (email only)
- Domain-dependent email (until Cloudflare domain is purchased and verified)
