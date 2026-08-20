import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { publicApi } from '../api/client'
import Spinner from '../components/Spinner'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(dt) {
  return new Date(dt).toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}
function fmtTime(dt) {
  return new Date(dt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}
function fmtMoney(n) {
  return `$${Number(n).toFixed(2)}`
}

function groupByDate(sessions) {
  const map = new Map()
  for (const s of sessions) {
    const key = new Date(s.start_time).toDateString()
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(s)
  }
  return [...map.entries()]
}

function calcTotal(eventType, partySize, selectedAddonIds) {
  const base = Number(eventType.base_price) * partySize
  const extras = selectedAddonIds.reduce((sum, id) => {
    const a = eventType.add_ons.find(x => x.id === id)
    return sum + (a ? Number(a.price) : 0)
  }, 0)
  return base + extras
}

// ─── Summary sidebar ─────────────────────────────────────────────────────────

function SummaryCard({ eventType, partySize, sessionIds, addonIds, allSessions }) {
  if (!eventType) return null
  const total = calcTotal(eventType, partySize, addonIds)
  const pickedSessions = allSessions.filter(s => sessionIds.includes(s.id))

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sticky top-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Booking summary</h3>
      <p className="font-semibold text-gray-900 mb-1">{eventType.name}</p>
      {partySize > 1 && (
        <p className="text-sm text-gray-500 mb-1">{partySize} people</p>
      )}
      {pickedSessions.length > 0 && (
        <ul className="text-sm text-gray-600 space-y-0.5 mb-2">
          {pickedSessions.map(s => (
            <li key={s.id}>• {fmtDate(s.start_time)} {fmtTime(s.start_time)}</li>
          ))}
        </ul>
      )}
      {addonIds.length > 0 && (
        <ul className="text-sm text-gray-500 space-y-0.5 mb-2">
          {addonIds.map(id => {
            const a = eventType.add_ons.find(x => x.id === id)
            return a ? <li key={id}>+ {a.name} ({fmtMoney(a.price)})</li> : null
          })}
        </ul>
      )}
      <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">Total</span>
        <span className="text-lg font-bold text-gray-900">{fmtMoney(total)}</span>
      </div>
    </div>
  )
}

// ─── Event type cards ─────────────────────────────────────────────────────────

function EventTypeCard({ et, onSelect }) {
  const kindLabel = { one_time: 'One-time class', recurring: 'Class', package: 'Package' }
  return (
    <button
      onClick={() => onSelect(et)}
      className="text-left w-full bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-blue-400 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-gray-900 text-base">{et.name}</h3>
        <span className="text-sm font-bold text-blue-700 whitespace-nowrap">{fmtMoney(et.base_price)} / person</span>
      </div>
      {et.description && <p className="text-sm text-gray-500 mb-2">{et.description}</p>}
      <span className="inline-block text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
        {kindLabel[et.kind] ?? et.kind}
      </span>
    </button>
  )
}

// ─── Session picker ───────────────────────────────────────────────────────────

function SessionPicker({ eventType, partySize, sessions, selectedIds, onChange }) {
  const kind = eventType.kind
  const pkg = eventType.package

  // FIXED package — sessions are pre-committed, just show them
  if (kind === 'package' && pkg?.date_mode === 'fixed') {
    const pool = pkg.pool_sessions
    return (
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">
          This package includes {pool.length} session{pool.length !== 1 ? 's' : ''}:
        </p>
        {pool.length === 0
          ? <p className="text-sm text-gray-400 italic">No upcoming sessions scheduled yet.</p>
          : (
            <ul className="space-y-1">
              {pool.map(s => (
                <li key={s.id} className="text-sm text-gray-700 flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  {fmtDate(s.start_time)} at {fmtTime(s.start_time)}
                  {s.end_time && <span className="text-gray-400">– {fmtTime(s.end_time)}</span>}
                </li>
              ))}
            </ul>
          )
        }
      </div>
    )
  }

  // CUSTOMER_PICKS package — multi-select from pool
  if (kind === 'package' && pkg?.date_mode === 'customer_picks') {
    const required = pkg.required_session_count
    const pool = pkg.pool_sessions

    function toggleSession(id) {
      if (selectedIds.includes(id)) {
        onChange(selectedIds.filter(x => x !== id))
      } else if (selectedIds.length < required) {
        onChange([...selectedIds, id])
      }
    }

    return (
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">
          Choose {required} session{required !== 1 ? 's' : ''} ({selectedIds.length}/{required} selected):
        </p>
        {pool.length === 0
          ? <p className="text-sm text-gray-400 italic">No upcoming sessions available.</p>
          : (
            <div className="space-y-2">
              {pool.map(s => {
                const enough = s.available_spots >= partySize
                const checked = selectedIds.includes(s.id)
                const disabled = !enough || (!checked && selectedIds.length >= required)
                return (
                  <button
                    key={s.id}
                    onClick={() => !disabled && toggleSession(s.id)}
                    disabled={disabled && !checked}
                    className={`w-full text-left flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors ${
                      checked ? 'border-blue-500 bg-blue-50' :
                      disabled ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed' :
                      'border-gray-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    <span>
                      <span className="font-medium">{fmtDate(s.start_time)}</span>
                      <span className="text-gray-500 ml-2">at {fmtTime(s.start_time)}</span>
                    </span>
                    <SpotsBadge spots={s.available_spots} partySize={partySize} />
                  </button>
                )
              })}
            </div>
          )
        }
      </div>
    )
  }

  // ONE_TIME or RECURRING — pick one session from the fetched sessions list
  if (sessions.length === 0) {
    return <p className="text-sm text-gray-400 italic">No upcoming sessions available for this event.</p>
  }

  // ONE_TIME: auto-select the single session (can't be changed)
  if (kind === 'one_time') {
    const s = sessions[0]
    if (!selectedIds.includes(s.id)) onChange([s.id])
    return (
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <span className="text-green-500">✓</span>
        <span className="font-medium">{fmtDate(s.start_time)}</span>
        <span className="text-gray-500">at {fmtTime(s.start_time)}</span>
        {s.end_time && <span className="text-gray-400">– {fmtTime(s.end_time)}</span>}
      </div>
    )
  }

  // RECURRING — grouped by date
  const groups = groupByDate(sessions)
  return (
    <div className="space-y-4">
      {groups.map(([dateKey, slots]) => (
        <div key={dateKey}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            {fmtDate(slots[0].start_time)}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {slots.map(s => {
              const enough = s.available_spots >= partySize
              const selected = selectedIds.includes(s.id)
              return (
                <button
                  key={s.id}
                  onClick={() => enough && onChange(selected ? [] : [s.id])}
                  disabled={!enough}
                  className={`text-left flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors ${
                    selected ? 'border-blue-500 bg-blue-50' :
                    !enough ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed' :
                    'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <span className="font-medium">
                    {fmtTime(s.start_time)}
                    {s.end_time && <span className="text-gray-400 font-normal"> – {fmtTime(s.end_time)}</span>}
                  </span>
                  <SpotsBadge spots={s.available_spots} partySize={partySize} />
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function SpotsBadge({ spots, partySize }) {
  if (spots < partySize) return <span className="text-xs text-gray-400">Full</span>
  if (spots <= 3) return <span className="text-xs font-medium text-amber-600">{spots} left</span>
  return <span className="text-xs text-gray-400">{spots} spots</span>
}

// ─── Add-on selector ─────────────────────────────────────────────────────────

function AddonSelector({ addons, selectedIds, onChange }) {
  if (!addons.length) return null
  function toggle(id) {
    onChange(selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id])
  }
  return (
    <div className="space-y-2">
      {addons.map(a => {
        const selected = selectedIds.includes(a.id)
        return (
          <button
            key={a.id}
            onClick={() => toggle(a.id)}
            className={`w-full text-left flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors ${
              selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'
            }`}
          >
            <span>
              <span className="font-medium">{a.name}</span>
              {a.description && <span className="text-gray-500 ml-2">— {a.description}</span>}
            </span>
            <span className={`font-semibold ml-3 ${selected ? 'text-blue-700' : 'text-gray-700'}`}>
              + {fmtMoney(a.price)}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Checkout form ────────────────────────────────────────────────────────────

function CheckoutForm({ business, eventType, partySize, sessionIds, addonIds, onConfirmed }) {
  const hasPayPal = !!business.paypal_username
  const hasWise = !!business.wise_username
  const hasPaymentMethods = hasPayPal || hasWise

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [extraAttendees, setExtraAttendees] = useState(
    Array.from({ length: Math.max(0, partySize - 1) }, () => ({ name: '', email: '', phone: '' }))
  )
  const [paymentMethod, setPaymentMethod] = useState(
    hasPayPal && !hasWise ? 'paypal' : hasWise && !hasPayPal ? 'wise' : null
  )
  const [receiptFile, setReceiptFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const total = calcTotal(eventType, partySize, addonIds)

  function updateAttendee(i, field, val) {
    setExtraAttendees(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: val } : a))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) { setError('Name and email are required.'); return }
    if (extraAttendees.some(a => !a.name.trim())) { setError('All attendee names are required.'); return }
    if (hasPaymentMethods && !paymentMethod) { setError('Please select a payment method.'); return }
    if (hasPaymentMethods && !receiptFile) { setError('Please upload your payment receipt.'); return }

    setSubmitting(true); setError('')
    try {
      const booking = await publicApi.post(`/api/public/${business.booking_key}/bookings`, {
        event_type_id: eventType.id,
        customer: { name: name.trim(), email: email.trim(), phone: phone.trim() || null },
        party_size: partySize,
        session_ids: sessionIds,
        addon_ids: addonIds,
        attendees: extraAttendees.map(a => ({
          name: a.name.trim(),
          email: a.email.trim() || null,
          phone: a.phone.trim() || null,
        })),
      })

      if (hasPaymentMethods && receiptFile) {
        const fd = new FormData()
        fd.append('method', paymentMethod)
        fd.append('amount', total.toFixed(2))
        fd.append('file', receiptFile)
        await publicApi.postForm(
          `/api/public/${business.booking_key}/bookings/${booking.id}/receipt`,
          fd
        )
      }

      onConfirmed(booking)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer info */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Your details</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name <span className="text-red-500">*</span></label>
            <input value={name} onChange={e => setName(e.target.value)} type="text" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
            <input value={phone} onChange={e => setPhone(e.target.value)} type="tel"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      {/* Extra attendees */}
      {extraAttendees.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Additional attendees
          </h3>
          <div className="space-y-4">
            {extraAttendees.map((a, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-gray-700">Attendee {i + 2}</p>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Name <span className="text-red-500">*</span></label>
                  <input value={a.name} onChange={e => updateAttendee(i, 'name', e.target.value)} type="text" required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Email</label>
                    <input value={a.email} onChange={e => updateAttendee(i, 'email', e.target.value)} type="email"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Phone</label>
                    <input value={a.phone} onChange={e => updateAttendee(i, 'phone', e.target.value)} type="tel"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Payment</h3>

        {hasPaymentMethods ? (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Send <strong>{fmtMoney(total)}</strong> to one of the accounts below,
              then upload your receipt to confirm your booking.
            </p>

            {/* Method selector — shown only when both are available */}
            {hasPayPal && hasWise && (
              <div className="flex gap-3 mb-4">
                {['paypal', 'wise'].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      paymentMethod === m
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {m === 'paypal' ? 'PayPal' : 'Wise'}
                  </button>
                ))}
              </div>
            )}

            {/* Account details */}
            {paymentMethod === 'paypal' && hasPayPal && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm">
                <p className="text-gray-500 mb-1">PayPal username</p>
                <p className="font-semibold text-gray-900 text-base">{business.paypal_username}</p>
                {business.has_paypal_qr && (
                  <div className="mt-3">
                    <p className="text-gray-500 text-xs mb-2">Scan QR to pay</p>
                    <img
                      src={`/api/public/${business.booking_key}/qr/paypal`}
                      alt="PayPal QR code"
                      className="w-36 h-36 object-contain bg-white border border-gray-200 rounded-lg p-1"
                    />
                  </div>
                )}
              </div>
            )}
            {paymentMethod === 'wise' && hasWise && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm">
                <p className="text-gray-500 mb-1">Wise username</p>
                <p className="font-semibold text-gray-900 text-base">{business.wise_username}</p>
                {business.has_wise_qr && (
                  <div className="mt-3">
                    <p className="text-gray-500 text-xs mb-2">Scan QR to pay</p>
                    <img
                      src={`/api/public/${business.booking_key}/qr/wise`}
                      alt="Wise QR code"
                      className="w-36 h-36 object-contain bg-white border border-gray-200 rounded-lg p-1"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Receipt upload */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Upload receipt <span className="text-red-500">*</span></p>
              <input ref={fileRef} type="file" accept="image/*,application/pdf"
                onChange={e => setReceiptFile(e.target.files[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
              {receiptFile && (
                <p className="text-xs text-green-600 mt-1">✓ {receiptFile.name}</p>
              )}
            </div>
          </>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            <p className="font-medium mb-1">Payment instructions pending</p>
            <p>Contact us at <a href={`mailto:${business.email}`} className="underline">{business.email}</a> to arrange payment. Your booking will be reserved once confirmed.</p>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>}

      <button type="submit" disabled={submitting}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-colors">
        {submitting ? 'Confirming…' : 'Confirm Booking'}
      </button>
    </form>
  )
}

// ─── Confirmation ─────────────────────────────────────────────────────────────

function ConfirmationScreen({ booking, business, eventType }) {
  return (
    <div className="max-w-lg mx-auto text-center py-12 px-4">
      <div className="text-5xl mb-4">✓</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking received!</h2>
      <p className="text-gray-500 mb-6">
        {booking.status === 'awaiting_payment'
          ? "We've received your receipt and will confirm your booking by email."
          : `Contact ${business.email} to complete your payment and confirm the booking.`}
      </p>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-left space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Booking ref</span>
          <span className="font-semibold text-gray-900">#{booking.booking_ref}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Event</span>
          <span className="font-semibold text-gray-900">{eventType.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">People</span>
          <span className="font-semibold text-gray-900">{booking.party_size}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Total</span>
          <span className="font-semibold text-gray-900">{fmtMoney(booking.total_price)}</span>
        </div>
        {booking.sessions?.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Sessions</p>
            {booking.sessions.map(s => (
              <p key={s.id} className="text-sm text-gray-700">
                {fmtDate(s.start_time)} at {fmtTime(s.start_time)}
              </p>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">
        A confirmation email has been sent to your inbox. Questions? Contact{' '}
        <a href={`mailto:${business.email}`} className="underline">{business.email}</a>.
      </p>
    </div>
  )
}

// ─── Main booking page ───────────────────────────────────────────────────────

export default function BookingPage() {
  const { slug } = useParams()

  const [phase, setPhase] = useState('loading') // loading | events | configure | checkout | confirmed | error
  const [business, setBusiness] = useState(null)
  const [eventTypes, setEventTypes] = useState([])
  const [selectedEventType, setSelectedEventType] = useState(null)
  const [sessions, setSessions] = useState([]) // only for ONE_TIME / RECURRING
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [partySize, setPartySize] = useState(1)
  const [selectedSessionIds, setSelectedSessionIds] = useState([])
  const [selectedAddonIds, setSelectedAddonIds] = useState([])
  const [confirmedBooking, setConfirmedBooking] = useState(null)
  const [error, setError] = useState('')

  // Load business and event types
  useEffect(() => {
    publicApi.get(`/api/public/by-slug/${slug}`)
      .then(biz => {
        setBusiness(biz)
        return publicApi.get(`/api/public/${biz.booking_key}/event-types`)
      })
      .then(ets => {
        setEventTypes(ets)
        setPhase('events')
      })
      .catch(err => { setError(err.message); setPhase('error') })
  }, [slug])

  // Load sessions when an event type is selected (ONE_TIME / RECURRING only)
  useEffect(() => {
    if (!selectedEventType || !business) return
    const kind = selectedEventType.kind
    if (kind === 'package') {
      setSessions([])
      return
    }
    setSessionsLoading(true)
    publicApi.get(`/api/public/${business.booking_key}/event-types/${selectedEventType.id}/sessions`)
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setSessionsLoading(false))
  }, [selectedEventType, business])

  function selectEventType(et) {
    setSelectedEventType(et)
    setPartySize(1)
    setSelectedSessionIds([])
    setSelectedAddonIds([])
    setPhase('configure')
  }

  function handlePartySizeChange(n) {
    setPartySize(n)
    setSelectedSessionIds([]) // clear selections when party size changes
  }

  // Is the selection valid enough to proceed to checkout?
  function canCheckout() {
    if (!selectedEventType) return false
    const kind = selectedEventType.kind
    const pkg = selectedEventType.package
    if (kind === 'package' && pkg?.date_mode === 'fixed') return pkg.pool_sessions.length > 0
    if (kind === 'package' && pkg?.date_mode === 'customer_picks') {
      return selectedSessionIds.length === pkg.required_session_count
    }
    if (kind === 'one_time') return sessions.length > 0
    return selectedSessionIds.length > 0 // recurring — must pick a session
  }

  function handleConfirmed(booking) {
    setConfirmedBooking(booking)
    setPhase('confirmed')
  }

  // All sessions for summary (package uses pool sessions)
  const allSessions = selectedEventType?.kind === 'package'
    ? (selectedEventType.package?.pool_sessions ?? [])
    : sessions

  // For FIXED packages the customer can't pick sessions — show all pool sessions in the summary
  const displaySessionIds = (
    selectedEventType?.kind === 'package' &&
    selectedEventType?.package?.date_mode === 'fixed'
  )
    ? allSessions.map(s => s.id)
    : selectedSessionIds

  // ── Render ─────────────────────────────────────────────────────────────────

  if (phase === 'loading') {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Spinner /></div>
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-sm">{error || 'This booking page could not be found.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          {phase !== 'events' && phase !== 'confirmed' && (
            <button
              onClick={() => {
                if (phase === 'checkout') setPhase('configure')
                else { setSelectedEventType(null); setPhase('events') }
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              ←
            </button>
          )}
          <div>
            <h1 className="font-bold text-gray-900">{business.name}</h1>
            {phase !== 'events' && selectedEventType && (
              <p className="text-xs text-gray-400">{selectedEventType.name}</p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* ── Event selection ── */}
        {phase === 'events' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Choose an experience</h2>
            {eventTypes.length === 0
              ? <p className="text-sm text-gray-400 text-center py-12">No events available at this time.</p>
              : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {eventTypes.map(et => <EventTypeCard key={et.id} et={et} onSelect={selectEventType} />)}
                </div>
              )
            }
          </div>
        )}

        {/* ── Configure: party size + sessions + add-ons ── */}
        {phase === 'configure' && selectedEventType && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Party size */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">How many people?</h3>
                <div className="flex items-center gap-4">
                  <button onClick={() => handlePartySizeChange(Math.max(1, partySize - 1))}
                    className="w-9 h-9 rounded-full border border-gray-300 text-gray-700 text-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center">
                    −
                  </button>
                  <span className="text-2xl font-bold text-gray-900 w-8 text-center">{partySize}</span>
                  <button onClick={() => handlePartySizeChange(partySize + 1)}
                    className="w-9 h-9 rounded-full border border-gray-300 text-gray-700 text-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center">
                    +
                  </button>
                  <span className="text-sm text-gray-500">person{partySize !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Session picker */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  {selectedEventType.kind === 'package'
                    ? selectedEventType.package?.date_mode === 'fixed' ? 'Included sessions' : 'Choose your sessions'
                    : 'Choose a date & time'}
                </h3>
                {sessionsLoading
                  ? <Spinner />
                  : (
                    <SessionPicker
                      eventType={selectedEventType}
                      partySize={partySize}
                      sessions={sessions}
                      selectedIds={selectedSessionIds}
                      onChange={setSelectedSessionIds}
                    />
                  )
                }
              </div>

              {/* Add-ons */}
              {selectedEventType.add_ons?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Add-ons (optional)</h3>
                  <AddonSelector
                    addons={selectedEventType.add_ons}
                    selectedIds={selectedAddonIds}
                    onChange={setSelectedAddonIds}
                  />
                </div>
              )}

              <button
                onClick={() => setPhase('checkout')}
                disabled={!canCheckout()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-colors"
              >
                Continue to checkout
              </button>
            </div>

            {/* Summary sidebar */}
            <div>
              <SummaryCard
                eventType={selectedEventType}
                partySize={partySize}
                sessionIds={displaySessionIds}
                addonIds={selectedAddonIds}
                allSessions={allSessions}
              />
            </div>
          </div>
        )}

        {/* ── Checkout ── */}
        {phase === 'checkout' && selectedEventType && business && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Complete your booking</h2>
              <CheckoutForm
                business={business}
                eventType={selectedEventType}
                partySize={partySize}
                sessionIds={selectedSessionIds}
                addonIds={selectedAddonIds}
                onConfirmed={handleConfirmed}
              />
            </div>
            <div>
              <SummaryCard
                eventType={selectedEventType}
                partySize={partySize}
                sessionIds={displaySessionIds}
                addonIds={selectedAddonIds}
                allSessions={allSessions}
              />
            </div>
          </div>
        )}

        {/* ── Confirmation ── */}
        {phase === 'confirmed' && confirmedBooking && (
          <ConfirmationScreen
            booking={confirmedBooking}
            business={business}
            eventType={selectedEventType}
          />
        )}
      </main>
    </div>
  )
}
