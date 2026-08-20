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
    <div className="grid grid-cols-3 gap-2 py-2.5 border-b border-gray-100 last:border-0">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="col-span-2 text-sm font-medium text-gray-900">{value ?? '—'}</dd>
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
    ? <p className="text-sm text-red-600">{error}</p>
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
        <Link to="/bookings" className="text-sm text-blue-600 hover:text-blue-800">← Bookings</Link>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Booking #{booking.booking_ref}</h1>
        <Badge value={booking.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer & booking info */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Customer</h2>
          <dl>
            <InfoRow label="Name" value={booking.customer?.name} />
            <InfoRow label="Email" value={booking.customer?.email} />
            <InfoRow label="Phone" value={booking.customer?.phone} />
          </dl>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Booking</h2>
          <dl>
            <InfoRow label="Event type" value={booking.event_type_name} />
            <InfoRow label="Total" value={`$${Number(booking.total_price).toFixed(2)}`} />
            <InfoRow label="Notes" value={booking.notes} />
            <InfoRow label="Created" value={fmt(booking.created_at)} />
          </dl>
        </div>

        {/* Sessions */}
        {booking.sessions?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Sessions</h2>
            <ul className="space-y-1">
              {booking.sessions.map(s => (
                <li key={s.id} className="text-sm text-gray-700">{fmt(s.start_time)}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Add-ons */}
        {booking.add_ons?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Add-ons</h2>
            <ul className="space-y-1">
              {booking.add_ons.map(a => (
                <li key={a.id} className="flex justify-between text-sm text-gray-700">
                  <span>{a.name}</span>
                  <span className="font-medium">${Number(a.price).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Payment */}
        {booking.payment && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Payment</h2>
            <dl className="mb-4">
              <InfoRow label="Method" value={booking.payment.method} />
              <InfoRow label="Amount" value={`$${Number(booking.payment.amount).toFixed(2)}`} />
              <InfoRow label="Status" value={<Badge value={booking.payment.status} />} />
              {booking.payment.review_note && <InfoRow label="Review note" value={booking.payment.review_note} />}
              {booking.payment.reviewed_at && <InfoRow label="Reviewed at" value={fmt(booking.payment.reviewed_at)} />}
            </dl>

            {/* Receipt image */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Receipt</p>
              <a
                href={`/api/bookings/${booking.id}/receipt`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block border border-gray-200 rounded-lg overflow-hidden hover:border-blue-400 transition-colors"
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
                  className="block px-4 py-3 text-sm text-blue-600 font-medium">
                  View receipt file ↗
                </span>
              </a>
            </div>
          </div>
        )}

        {/* Review actions — always visible */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Review</h2>
          <p className="text-sm font-medium text-gray-700 mb-2">Note (optional)</p>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            disabled={!canReview}
            placeholder="Add a note visible to the customer on rejection…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
          />
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <div className="flex items-center gap-3">
            <span title={reviewDisabledReason ?? undefined} className="inline-flex">
              <button onClick={() => handleReview('approve')} disabled={!canReview || working}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
                {working ? '…' : 'Approve'}
              </button>
            </span>
            <span title={reviewDisabledReason ?? undefined} className="inline-flex">
              <button onClick={() => handleReview('reject')} disabled={!canReview || working}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
                {working ? '…' : 'Reject'}
              </button>
            </span>
            {reviewDisabledReason && (
              <p className="text-xs text-gray-400 italic">{reviewDisabledReason}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
