import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

const FEATURES = [
  {
    icon: '📅',
    title: 'Smart Scheduling',
    desc: 'Create recurring classes, one-time events, or date-flexible packages. Customers pick their sessions and party size in one flow.',
  },
  {
    icon: '💳',
    title: 'Flexible Payments',
    desc: 'Accept PayPal and Wise payments manually. Share your QR code at checkout — no payment gateway fees, no hidden costs.',
  },
  {
    icon: '👥',
    title: 'Attendee Management',
    desc: "See who's coming to every session. Collect names, passport numbers, and special requirements. Track everything in one place.",
  },
  {
    icon: '🔗',
    title: 'Share Anywhere',
    desc: 'Get a unique booking URL to share on WhatsApp, Instagram, or your website — or embed it in WordPress with one shortcode.',
  },
]

const PLANS = [
  {
    id: 'standard',
    name: 'Standard',
    price: '$49',
    highlight: true,
    features: [
      'All core booking features',
      'Discount codes',
      'Unlimited booking keys',
      'PayPal & Wise payments',
      'Attendee management',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$89',
    highlight: false,
    features: [
      'Everything in Standard',
      'Stripe Connect (coming soon)',
      'Invoices & PDF exports (coming soon)',
      'Calendar sync (coming soon)',
      'Deposits (coming soon)',
    ],
  },
]

const STEPS = [
  {
    num: '01',
    title: 'Create your events',
    desc: 'Set up event types, sessions, pricing, and payment details in minutes.',
  },
  {
    num: '02',
    title: 'Share your booking link',
    desc: 'Get a unique URL — share it on social media, WhatsApp, or your website.',
  },
  {
    num: '03',
    title: 'Manage & confirm',
    desc: 'Review receipts, confirm bookings, and track attendees from your dashboard.',
  },
]

const INPUT_CLS =
  'w-full border border-navy/20 dark:border-cream/20 bg-cream dark:bg-navy/50 text-navy dark:text-cream rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber placeholder:text-navy/30 dark:placeholder:text-cream/30'

export default function LandingPage() {
  const { theme, toggle } = useTheme()
  const [contactStatus, setContactStatus] = useState('idle') // idle | loading | success | error
  const [contactError, setContactError] = useState('')

  async function handleContact(e) {
    e.preventDefault()
    setContactStatus('loading')
    setContactError('')
    const form = new FormData(e.target)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          email: form.get('email'),
          message: form.get('message'),
        }),
      })
      if (!res.ok) throw new Error()
      setContactStatus('success')
    } catch {
      setContactStatus('error')
      setContactError('Something went wrong. Email us directly at hello@paglamboBooking.com')
    }
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-dark-base text-navy dark:text-cream">

      {/* Navbar */}
      <header className="border-b border-navy/10 dark:border-cream/10 sticky top-0 bg-cream/95 dark:bg-dark-base/95 backdrop-blur-sm z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold font-display text-navy dark:text-cream">
            Paglambo Booking
          </span>
          <div className="flex items-center gap-4">
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="text-navy/40 dark:text-cream/40 hover:text-navy dark:hover:text-cream transition-colors text-base leading-none"
            >
              {theme === 'dark' ? '☀' : '☽'}
            </button>
            <Link
              to="/login"
              className="text-sm text-navy/70 dark:text-cream/70 hover:text-navy dark:hover:text-cream transition-colors hidden sm:inline"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="bg-amber hover:bg-amber/90 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — animated orb background */}
      <section className="relative overflow-hidden">
        {/* Orb A — amber, top-left */}
        <div
          className="pointer-events-none absolute -top-24 -left-24 w-[500px] h-[500px] rounded-full bg-amber blur-[130px]"
          style={{ animation: 'float-a 8s ease-in-out infinite' }}
        />
        {/* Orb B — terracotta, bottom-right */}
        <div
          className="pointer-events-none absolute -bottom-32 -right-16 w-[420px] h-[420px] rounded-full bg-terracotta blur-[110px]"
          style={{ animation: 'float-b 11s ease-in-out infinite 1.5s' }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-amber/10 border border-amber/20 text-amber text-xs font-semibold px-3 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-amber inline-block" />
            For classes, events &amp; bookable schedules
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold text-navy dark:text-cream mb-6 leading-tight">
            Accept bookings.<br className="hidden md:block" />
            Get paid.{' '}
            <span className="text-amber">Grow.</span>
          </h1>
          <p className="text-lg text-navy/60 dark:text-cream/60 max-w-xl mx-auto mb-10 leading-relaxed">
            A simple, powerful booking platform for small businesses — no payment
            gateway fees, no tech headaches.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-amber hover:bg-amber/90 text-white font-semibold px-8 py-3.5 rounded-lg transition-colors text-sm"
            >
              Start free trial
            </Link>
            <Link
              to="/login"
              className="border border-navy/20 dark:border-cream/20 text-navy dark:text-cream hover:bg-navy/5 dark:hover:bg-cream/5 font-medium px-8 py-3.5 rounded-lg transition-colors text-sm"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-5 text-xs text-navy/40 dark:text-cream/40">
            No credit card required · Free trial included
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-navy/10 dark:border-cream/10 bg-navy/3 dark:bg-dark-deep/50">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="font-display text-3xl font-bold text-navy dark:text-cream text-center mb-12">
            Everything you need to run your business
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-cream dark:bg-navy/40 rounded-xl border border-navy/10 dark:border-cream/10 p-6"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-navy dark:text-cream mb-2 text-sm">
                  {f.title}
                </h3>
                <p className="text-sm text-navy/60 dark:text-cream/60 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative overflow-hidden border-y border-navy/10 dark:border-cream/10 bg-navy/3 dark:bg-dark-deep/50">
        <div
          className="pointer-events-none absolute -top-20 -right-20 w-100 h-100 rounded-full bg-terracotta blur-[120px]"
          style={{ animation: 'float-b 10s ease-in-out infinite' }}
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-16 w-90 h-90 rounded-full bg-amber blur-[110px]"
          style={{ animation: 'float-a 9s ease-in-out infinite 2s' }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
          <h2 className="font-display text-3xl font-bold text-navy dark:text-cream text-center mb-3">
            Simple, transparent pricing
          </h2>
          <p className="text-center text-navy/50 dark:text-cream/50 text-sm mb-12">
            Start with a free trial. No credit card required.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {PLANS.map((p) => (
              <div
                key={p.id}
                className={`rounded-xl border-2 p-8 ${
                  p.highlight
                    ? 'border-amber bg-amber/4 dark:bg-amber/6'
                    : 'border-navy/10 dark:border-cream/10 bg-cream dark:bg-navy/30'
                }`}
              >
                {p.highlight && (
                  <span className="inline-block bg-amber text-white text-[11px] font-semibold px-2.5 py-0.5 rounded mb-4">
                    Most popular
                  </span>
                )}
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-widest text-navy/50 dark:text-cream/50 mb-1">
                    {p.name}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold font-display text-navy dark:text-cream">
                      {p.price}
                    </span>
                    <span className="text-navy/40 dark:text-cream/40 text-sm">/mo</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {p.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-navy/80 dark:text-cream/80"
                    >
                      <span className="text-amber mt-0.5 shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`block text-center font-medium py-2.5 rounded-lg text-sm transition-colors ${
                    p.highlight
                      ? 'bg-amber hover:bg-amber/90 text-white'
                      : 'border border-navy/20 dark:border-cream/20 text-navy dark:text-cream hover:bg-navy/5 dark:hover:bg-cream/5'
                  }`}
                >
                  Start free trial
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="font-display text-3xl font-bold text-navy dark:text-cream text-center mb-4">
          Up and running in minutes
        </h2>
        <p className="text-center text-navy/50 dark:text-cream/50 text-sm mb-14">
          Three steps and your booking page is live.
        </p>
        <div className="grid sm:grid-cols-3 gap-8">
          {STEPS.map((s, i) => (
            <div key={s.num} className="relative text-center">
              {i < STEPS.length - 1 && (
                <div className="hidden sm:block absolute top-6 left-[calc(50%+2rem)] right-0 border-t border-dashed border-navy/10 dark:border-cream/10" />
              )}
              <div className="w-12 h-12 rounded-full bg-amber text-white flex items-center justify-center mx-auto mb-5 relative z-10">
                <span className="font-bold text-sm">{s.num}</span>
              </div>
              <h3 className="font-semibold text-navy dark:text-cream mb-2 text-sm">
                {s.title}
              </h3>
              <p className="text-sm text-navy/60 dark:text-cream/60 leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-16 -right-24 w-96 h-96 rounded-full bg-amber blur-[120px]"
          style={{ animation: 'float-a 9s ease-in-out infinite 0.5s' }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-terracotta blur-[100px]"
          style={{ animation: 'float-b 12s ease-in-out infinite 3s' }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-2 gap-16 items-start">

          {/* Left — copy */}
          <div>
            <h2 className="font-display text-4xl font-bold text-navy dark:text-cream mb-4">
              Get in touch
            </h2>
            <p className="text-navy/60 dark:text-cream/60 leading-relaxed mb-8">
              Have questions about Paglambo Booking? Want to see a demo or learn
              more about what we can do for your business? Drop us a message
              and we'll get back to you shortly.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-navy/70 dark:text-cream/70">
                <span className="text-amber text-base">✉</span>
                hello@paglamboBooking.com
              </div>
              <div className="flex items-center gap-3 text-sm text-navy/70 dark:text-cream/70">
                <span className="text-amber text-base">⏱</span>
                We typically reply within one business day
              </div>
            </div>
          </div>

          {/* Right — form */}
          <div className="bg-cream dark:bg-navy/30 rounded-xl border border-navy/10 dark:border-cream/10 p-8">
            {contactStatus === 'success' ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">✉</div>
                <h3 className="font-display text-xl font-bold text-navy dark:text-cream mb-2">
                  Message sent!
                </h3>
                <p className="text-sm text-navy/60 dark:text-cream/60">
                  Thanks for reaching out. We'll get back to you soon.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContact} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-navy/80 dark:text-cream/80 mb-1">
                    Name
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="Your name"
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy/80 dark:text-cream/80 mb-1">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy/80 dark:text-cream/80 mb-1">
                    Message
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={5}
                    placeholder="Tell us about your business and what you need…"
                    className={`${INPUT_CLS} resize-none`}
                  />
                </div>

                {contactStatus === 'error' && (
                  <div className="px-4 py-3 rounded-lg bg-terracotta/10 border border-terracotta/30 text-sm text-terracotta">
                    {contactError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={contactStatus === 'loading'}
                  className="w-full bg-amber hover:bg-amber/90 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
                >
                  {contactStatus === 'loading' ? 'Sending…' : 'Send message'}
                </button>
              </form>
            )}
          </div>
        </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-navy/10 dark:border-cream/10">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display font-semibold text-navy dark:text-cream">
            Paglambo Booking
          </span>
          <p className="text-sm text-navy/35 dark:text-cream/35">
            &copy; {new Date().getFullYear()} Paglambo Booking. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link
              to="/login"
              className="text-navy/50 dark:text-cream/50 hover:text-navy dark:hover:text-cream transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="text-navy/50 dark:text-cream/50 hover:text-navy dark:hover:text-cream transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
