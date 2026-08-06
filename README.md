# Buhata Booking

*Every class. Every package. One booking flow.*

A booking and scheduling platform for small businesses. Businesses set up their offerings — single sessions, recurring classes, or multi-part packages — and their customers book directly from the business's own website.

## Directory structure

```
Buhata Booking/
├── artifacts/               Product spec and brand identity docs
│   ├── booking-platform-spec.md
│   └── buhata-booking-brand-identity.md
├── codebase/
│   ├── backend/             FastAPI backend API
│   └── frontend/            React admin dashboard + embeddable booking widget
├── CLAUDE.md                AI context — project decisions and constraints
├── PROGRESS.md              Phase-by-phase build tracking
└── README.md                This file
```

## Tech stack

| Layer | Tech |
|---|---|
| Backend | Python 3.11+ / FastAPI |
| Database | PostgreSQL |
| Admin UI | React + Vite + Tailwind |
| Booking widget | Vanilla JS (embeddable `<script>`) |
| Email | Resend |
| Hosting | DigitalOcean VPS |
| Deploy | GitHub Actions |

## Payments

Manual only. Customers pay via PayPal or Wise and upload a receipt screenshot. Business owners approve manually via the admin dashboard.

## Getting started

- Backend: [codebase/backend/README.md](codebase/backend/README.md)
- Frontend: [codebase/frontend/README.md](codebase/frontend/README.md)
- Build plan: [artifacts/booking-platform-spec.md](artifacts/booking-platform-spec.md)
- Progress tracker: [PROGRESS.md](PROGRESS.md)
