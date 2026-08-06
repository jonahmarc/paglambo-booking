# Booking & class management platform — spec & roadmap

## 1. Platform strategy

Build order: WordPress first, then a standalone hosted version, then Shopify.

- **WordPress first** — you already have real clients and real problems to solve (the cooking class business, the event/package business), and you know the WordPress ecosystem well. This lets you prove the idea works with real money changing hands before investing further.
- **One platform underneath everything** — the booking engine itself isn't tied to WordPress. WordPress is just the first "front door" into it. Later channels (a standalone booking site, Shopify) don't require rebuilding the core, just adding a new way for people to reach it.
- **Shopify last** — Shopify has its own rules for how apps are built, installed, and reviewed before they can be listed, which makes it a bigger, more specialized project on its own. Worth doing once the core product has already proven itself elsewhere.

## 2. Technology choices

### Backend
| Layer | Choice |
|---|---|
| Framework | FastAPI (Python) |
| Database | PostgreSQL |
| Scheduled tasks | Built-in scheduling for now (reminder emails, generating recurring sessions) |
| Hosting | Your existing DigitalOcean VPS |
| Deployment | Automated deploy pipeline via GitHub Actions |

### Admin dashboard
| Layer | Choice |
|---|---|
| Framework | React |
| Styling | Tailwind |
| Forms | React Hook Form |

### Public booking widget
| Layer | Choice |
|---|---|
| Framework | Lightweight, framework-independent component |
| Delivery | Single embeddable script — works on WordPress, Shopify, or any website |
| Access | Each business gets its own key so their booking data stays separate |

### Budget notes
- A slightly larger VPS (2GB RAM instead of 1GB) will be noticeably more comfortable once real bookings start coming in. You can develop on the smaller one for now.
- Set up automatic nightly backups of the database and uploaded files (like payment receipts) to inexpensive cloud storage, so nothing is lost if the server has an issue.
- Each business using the platform connects their own Stripe account, so payments go directly to them rather than through you.

## 3. How the platform is organized

Everything in the platform is built around a few flexible concepts, so the same system can run a cooking class business and a travel package business without being rebuilt for each.

- **Business account** — each client using the platform (the cooking school, the travel/events company) gets their own account and their own data.
- **Class or event type** — a template a business creates once, describing what they're offering. This is where they decide: is this a one-time thing, a recurring class, or a package? A cooking class might repeat every weekday. A travel package might be a bundle the customer configures.
- **Scheduled session** — each individual date/time a class or event actually happens, generated automatically from the class/event type's pattern.
- **Package** — a bundle of sessions sold together. Some packages have fixed dates set by the business. Others let the customer pick their own dates from an approved list (e.g. "choose any 8 weekday sessions this month").
- **Add-ons and estimates** — for more complex bookings (like choosing a hotel tier and number of guests for an event package), the system calculates a live estimated cost as the customer makes selections, before they commit to paying.
- **Booking** — a customer's actual reservation, tracked from "awaiting payment" through to "confirmed."
- **Payment** — supports both automatic card payments (Stripe) and manual bank transfers, where a customer uploads proof of payment and the business manually confirms it.
- **Customer record** — contact details tied to each business's bookings.

## 4. MVP feature list

### What a business owner (admin) can do
- Create a class or event type and choose how it's scheduled (one-time, recurring, or package)
- Set capacity limits per session
- Set pricing, including configurable pricing for packages with add-ons (like hotel tier or headcount)
- Choose which payment methods are accepted for each offering
- View all bookings and their payment status in one place
- Manually approve or reject bank transfer payments after reviewing an uploaded receipt
- See remaining capacity for any upcoming session at a glance

### What a customer experiences
- Browse available classes or events on the business's own website (WordPress, or wherever it's embedded)
- For recurring classes: pick an available date/time
- For packages with a date pool: choose preferred dates from the allowed options
- For configurable packages (like an event with hotel + guest count): make selections and see an estimated cost update live before checking out
- Pay by card instantly, or choose bank transfer and upload proof of payment
- Receive a confirmation once payment is verified

### Not included in the first version
- Guided setup flow for connecting Stripe (businesses enter their Stripe details manually at first)
- A separately hosted booking site outside of WordPress (comes in the next phase)
- A Shopify version (comes later)
- Multiple languages or currencies
- Text message notifications (email only, to start)

## 5. Build order and roadmap

### Phase 0 — Set up the foundation
Get the server, database, and deployment pipeline running so every following phase has somewhere to build on.

### Phase 1 — Core platform + WordPress (MVP)
Built in four steps, in order:

1. **Build the backend engine** — the system that stores businesses, class/event types, sessions, packages, bookings, and payments, and handles logic like generating recurring sessions and calculating package estimates.
2. **Build a basic admin dashboard** — just enough for a business owner to create their offerings and see their bookings. It doesn't need to look polished yet, it needs to work.
3. **Build the public booking widget** — the actual booking experience customers use: browsing, selecting dates or packages, seeing estimates, and paying. This is the core product.
4. **Build the WordPress plugin** — a small plugin that places the booking widget on a WordPress page. Because all the real logic already lives in the widget and backend, this step is quick.

Once this phase is done, deploy it for your two real clients and use their actual usage to find what's missing or confusing before building anything further.

### Phase 2 — Reach beyond WordPress
Turn the same booking widget into a standalone hosted booking page, so any business can use the platform even without a WordPress site. This is the point where it becomes a real subscription product rather than a plugin tied to one platform.

### Phase 3 — Strengthen payments
Add a guided setup flow so businesses can connect their own Stripe account without manual configuration, support partial or installment payments, and add proper invoicing and refund handling.

### Phase 4 — Shopify
Build a dedicated Shopify version following Shopify's app requirements, so merchants can install it directly from the Shopify App Store.

### Phase 5 — Scale as needed
As usage grows, add more infrastructure capacity (background job processing, database scaling, faster content delivery for the widget) — only once real usage numbers justify it.
