import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import Badge from '../components/Badge'
import Spinner from '../components/Spinner'

function fmt(dt) {
  return new Date(dt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function InfoRow({ label, value }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-2.5 border-b border-navy/10 dark:border-cream/10 last:border-0">
      <dt className="text-sm text-navy/50 dark:text-cream/50">{label}</dt>
      <dd className="col-span-2 text-sm font-medium text-navy dark:text-cream">{value ?? '—'}</dd>
    </div>
  )
}

export default function BookingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [note, setNote] = useState('')
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')

  function load() {
    api.get(`/api/bookings/${id}`).then(setBooking).catch(() => setError('Booking not found'))
  }
  useEffect(load, [id])

  async function handleReview(action) {
    setWorking(true); setError('')
    try {
      await api.post(`/api/bookings/${id}/${action}`, { note: note || null })
      load()
      setNote('')
    } catch (err) {
      setError(err.message)
    } finally {
      setWorking(false)
    }
  }

  if (!booking) return error
    ? <p className="text-sm text-terracotta">{error}</p>
    : <Spinner />

  const reviewDisabledReason =
    booking.status === 'pending' ? "Customer hasn't uploaded a payment receipt yet" :
    booking.status === 'confirmed' ? "This booking has already been approved" :
    booking.status === 'rejected' ? "This booking has already been rejected" :
    !booking.payment ? "No receipt on file" :
    null

  const canReview = reviewDisabledReason === null

  return (
    <div>
      <div className="mb-4">
        <Link to="/bookings" className="text-sm text-amber hover:text-amber/70">← Bookings</Link>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold font-display text-navy dark:text-cream">Booking #{booking.booking_ref}</h1>
        <Badge value={booking.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer & booking info */}
        <div className="bg-cream dark:bg-navy rounded-xl border border-navy/10 dark:border-cream/10 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-navy/50 dark:text-cream/50 uppercase tracking-wide mb-3">Customer</h2>
          <dl>
            <InfoRow label="Name" value={booking.customer?.name} />
            <InfoRow label="Email" value={booking.customer?.email} />
            <InfoRow label="Phone" value={booking.customer?.phone} />
          </dl>
        </div>

        <div className="bg-cream dark:bg-navy rounded-xl border border-navy/10 dark:border-cream/10 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-navy/50 dark:text-cream/50 uppercase tracking-wide mb-3">Booking</h2>
          <dl>
            <InfoRow label="Event type" value={booking.event_type_name} />
            <InfoRow label="Total" value={`$${Number(booking.total_price).toFixed(2)}`} />
            <InfoRow label="Notes" value={booking.notes} />
            <InfoRow label="Created" value={fmt(booking.created_at)} />
          </dl>
        </div>

        {/* Sessions */}
        {booking.sessions?.length > 0 && (
          <div className="bg-cream dark:bg-navy rounded-xl border border-navy/10 dark:border-cream/10 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-navy/50 dark:text-cream/50 uppercase tracking-wide mb-3">Sessions</h2>
            <ul className="space-y-1">
              {booking.sessions.map(s => (
                <li key={s.id} className="text-sm text-navy dark:text-cream">{fmt(s.start_time)}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Add-ons */}
        {booking.add_ons?.length > 0 && (
          <div className="bg-cream dark:bg-navy rounded-xl border border-navy/10 dark:border-cream/10 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-navy/50 dark:text-cream/50 uppercase tracking-wide mb-3">Add-ons</h2>
            <ul className="space-y-1">
              {booking.add_ons.map(a => (
                <li key={a.id} className="flex justify-between text-sm text-navy dark:text-cream">
                  <span>{a.name}</span>
                  <span className="font-medium">${Number(a.price).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Attendees */}
        {booking.attendees?.length > 0 && (
          <div className="bg-cream dark:bg-navy rounded-xl border border-navy/10 dark:border-cream/10 shadow-sm p-6 lg:col-span-2">
            <h2 className="text-sm font-semibold text-navy/50 dark:text-cream/50 uppercase tracking-wide mb-3">
              Attendees ({booking.party_size})
            </h2>
            <div className="divide-y divide-navy/10 dark:divide-cream/10">
              {/* Primary booker */}
              <div className="py-3 first:pt-0">
                <p className="text-xs font-semibold text-navy/40 dark:text-cream/40 uppercase tracking-wide mb-1.5">Attendee 1 (Primary)</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 text-sm">
                  <span className="text-navy/50 dark:text-cream/50">Name</span><span className="font-medium text-navy dark:text-cream col-span-1 sm:col-span-2">{booking.customer?.name}</span>
                  {booking.customer?.email && <><span className="text-navy/50 dark:text-cream/50">Email</span><span className="text-navy/80 dark:text-cream/80 col-span-1 sm:col-span-2">{booking.customer.email}</span></>}
                  {booking.customer?.phone && <><span className="text-navy/50 dark:text-cream/50">Phone</span><span className="text-navy/80 dark:text-cream/80 col-span-1 sm:col-span-2">{booking.customer.phone}</span></>}
                </div>
              </div>
              {/* Additional attendees */}
              {booking.attendees.map((a, i) => (
                <div key={a.id} className="py-3">
                  <p className="text-xs font-semibold text-navy/40 dark:text-cream/40 uppercase tracking-wide mb-1.5">Attendee {i + 2}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 text-sm">
                    <span className="text-navy/50 dark:text-cream/50">Name</span><span className="font-medium text-navy dark:text-cream col-span-1 sm:col-span-2">{a.name}</span>
                    {a.email && <><span className="text-navy/50 dark:text-cream/50">Email</span><span className="text-navy/80 dark:text-cream/80 col-span-1 sm:col-span-2">{a.email}</span></>}
                    {a.phone && <><span className="text-navy/50 dark:text-cream/50">Phone</span><span className="text-navy/80 dark:text-cream/80 col-span-1 sm:col-span-2">{a.phone}</span></>}
                    {a.id_or_passport && <><span className="text-navy/50 dark:text-cream/50">ID / Passport</span><span className="text-navy/80 dark:text-cream/80 col-span-1 sm:col-span-2">{a.id_or_passport}</span></>}
                    {a.nationality && <><span className="text-navy/50 dark:text-cream/50">Nationality</span><span className="text-navy/80 dark:text-cream/80 col-span-1 sm:col-span-2">{a.nationality}</span></>}
                    {a.date_of_birth && <><span className="text-navy/50 dark:text-cream/50">Date of birth</span><span className="text-navy/80 dark:text-cream/80 col-span-1 sm:col-span-2">{a.date_of_birth}</span></>}
                    {a.special_requirements && <><span className="text-navy/50 dark:text-cream/50">Special requirements</span><span className="text-navy/80 dark:text-cream/80 col-span-1 sm:col-span-2">{a.special_requirements}</span></>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment */}
        {booking.payment && (
          <div className="bg-cream dark:bg-navy rounded-xl border border-navy/10 dark:border-cream/10 shadow-sm p-6 lg:col-span-2">
            <h2 className="text-sm font-semibold text-navy/50 dark:text-cream/50 uppercase tracking-wide mb-3">Payment</h2>
            <dl className="mb-4">
              <InfoRow label="Method" value={booking.payment.method} />
              <InfoRow label="Amount" value={`$${Number(booking.payment.amount).toFixed(2)}`} />
              <InfoRow label="Status" value={<Badge value={booking.payment.status} />} />
              {booking.payment.review_note && <InfoRow label="Review note" value={booking.payment.review_note} />}
              {booking.payment.reviewed_at && <InfoRow label="Reviewed at" value={fmt(booking.payment.reviewed_at)} />}
            </dl>

            {/* Receipt image */}
            <div>
              <p className="text-sm font-medium text-navy dark:text-cream mb-2">Receipt</p>
              <a
                href={`/api/bookings/${booking.id}/receipt`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block border border-navy/10 dark:border-cream/10 rounded-lg overflow-hidden hover:border-amber transition-colors"
              >
                <img
                  src={`/api/bookings/${booking.id}/receipt`}
                  alt="Receipt"
                  className="max-h-64 object-contain"
                  onError={e => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'block'
                  }}
                />
                <span style={{ display: 'none' }}
                  className="block px-4 py-3 text-sm text-amber font-medium">
                  View receipt file ↗
                </span>
              </a>
            </div>
          </div>
        )}

        {/* Review actions — always visible */}
        <div className="bg-cream dark:bg-navy rounded-xl border border-navy/10 dark:border-cream/10 shadow-sm p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold text-navy/50 dark:text-cream/50 uppercase tracking-wide mb-3">Review</h2>
          <p className="text-sm font-medium text-navy dark:text-cream mb-2">Note (optional)</p>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            disabled={!canReview}
            placeholder="Add a note visible to the customer on rejection…"
            className="w-full border border-navy/20 dark:border-cream/20 bg-cream dark:bg-navy/50 text-navy dark:text-cream rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-amber placeholder:text-navy/30 dark:placeholder:text-cream/30 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {error && <p className="text-sm text-terracotta mb-3">{error}</p>}
          <div className="flex items-center gap-3">
            <span title={reviewDisabledReason ?? undefined} className="inline-flex">
              <button onClick={() => handleReview('approve')} disabled={!canReview || working}
                className="bg-amber hover:bg-amber/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
                {working ? '…' : 'Approve'}
              </button>
            </span>
            <span title={reviewDisabledReason ?? undefined} className="inline-flex">
              <button onClick={() => handleReview('reject')} disabled={!canReview || working}
                className="bg-terracotta hover:bg-terracotta/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
                {working ? '…' : 'Reject'}
              </button>
            </span>
            {reviewDisabledReason && (
              <p className="text-xs text-navy/40 dark:text-cream/40 italic">{reviewDisabledReason}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
