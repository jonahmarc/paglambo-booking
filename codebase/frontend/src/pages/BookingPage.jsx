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

const INPUT_CLS = 'w-full border border-navy/20 dark:border-cream/20 bg-cream dark:bg-navy/50 text-navy dark:text-cream rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber placeholder:text-navy/30 dark:placeholder:text-cream/30'
const CARD_CLS = 'bg-cream dark:bg-navy rounded-xl border border-navy/10 dark:border-cream/10 shadow-sm p-6'
const SECTION_LABEL = 'text-xs font-semibold text-navy/50 dark:text-cream/50 uppercase tracking-wider mb-4'

// ─── Summary sidebar ─────────────────────────────────────────────────────────

function SummaryCard({ eventType, partySize, sessionIds, addonIds, allSessions, discountAmount = 0 }) {
  if (!eventType) return null
  const subtotal = calcTotal(eventType, partySize, addonIds)
  const total = subtotal - discountAmount
  const pickedSessions = allSessions.filter(s => sessionIds.includes(s.id))

  return (
    <div className={`${CARD_CLS} sticky top-6`}>
      <h3 className={SECTION_LABEL}>Booking summary</h3>
      <p className="font-semibold text-navy dark:text-cream mb-1">{eventType.name}</p>
      {partySize > 1 && (
        <p className="text-sm text-navy/50 dark:text-cream/50 mb-1">{partySize} people</p>
      )}
      {pickedSessions.length > 0 && (
        <ul className="text-sm text-navy/70 dark:text-cream/70 space-y-0.5 mb-2">
          {pickedSessions.map(s => (
            <li key={s.id}>• {fmtDate(s.start_time)} {fmtTime(s.start_time)}</li>
          ))}
        </ul>
      )}
      {addonIds.length > 0 && (
        <ul className="text-sm text-navy/50 dark:text-cream/50 space-y-0.5 mb-2">
          {addonIds.map(id => {
            const a = eventType.add_ons.find(x => x.id === id)
            return a ? <li key={id}>+ {a.name} ({fmtMoney(a.price)})</li> : null
          })}
        </ul>
      )}
      {discountAmount > 0 && (
        <p className="text-sm text-green-600 dark:text-green-400 mb-1">− {fmtMoney(discountAmount)} discount</p>
      )}
      <div className="border-t border-navy/10 dark:border-cream/10 pt-3 mt-3 flex justify-between items-center">
        <span className="text-sm font-medium text-navy/70 dark:text-cream/70">Total</span>
        <span className="text-lg font-bold text-navy dark:text-cream">{fmtMoney(total)}</span>
      </div>
    </div>
  )
}

// ─── Event type cards ─────────────────────────────────────────────────────────

function EventTypeCard({ et, onSelect }) {
  const kindLabel = { one_time: 'One-time', recurring: 'Class', package: 'Package' }
  return (
    <button
      onClick={() => onSelect(et)}
      className="text-left w-full bg-cream dark:bg-navy rounded-xl border border-navy/10 dark:border-cream/10 shadow-sm p-5 hover:border-amber dark:hover:border-amber hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-navy dark:text-cream text-base">{et.name}</h3>
        <span className="text-sm font-bold text-amber whitespace-nowrap">{fmtMoney(et.base_price)} / person</span>
      </div>
      {et.description && <p className="text-sm text-navy/50 dark:text-cream/50 mb-2">{et.description}</p>}
      <span className="inline-block text-xs font-medium bg-amber/10 text-amber px-2 py-0.5 rounded">
        {kindLabel[et.kind] ?? et.kind}
      </span>
    </button>
  )
}

// ─── Session picker ───────────────────────────────────────────────────────────

function SessionPicker({ eventType, partySize, sessions, selectedIds, onChange }) {
  const kind = eventType.kind
  const pkg = eventType.package

  if (kind === 'package' && pkg?.date_mode === 'fixed') {
    const pool = pkg.pool_sessions
    return (
      <div>
        <p className="text-sm font-medium text-navy/80 dark:text-cream/80 mb-2">
          This package includes {pool.length} session{pool.length !== 1 ? 's' : ''}:
        </p>
        {pool.length === 0
          ? <p className="text-sm text-navy/40 dark:text-cream/40 italic">No upcoming sessions scheduled yet.</p>
          : (
            <ul className="space-y-1">
              {pool.map(s => (
                <li key={s.id} className="text-sm text-navy/80 dark:text-cream/80 flex items-center gap-2">
                  <span className="text-amber">✓</span>
                  {fmtDate(s.start_time)} at {fmtTime(s.start_time)}
                  {s.end_time && <span className="text-navy/40 dark:text-cream/40">– {fmtTime(s.end_time)}</span>}
                </li>
              ))}
            </ul>
          )
        }
      </div>
    )
  }

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
        <p className="text-sm font-medium text-navy/80 dark:text-cream/80 mb-3">
          Choose {required} session{required !== 1 ? 's' : ''} ({selectedIds.length}/{required} selected):
        </p>
        {pool.length === 0
          ? <p className="text-sm text-navy/40 dark:text-cream/40 italic">No upcoming sessions available.</p>
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
                      checked
                        ? 'border-amber bg-amber/10 text-navy dark:text-cream'
                        : disabled
                          ? 'border-navy/10 dark:border-cream/10 bg-navy/5 dark:bg-cream/5 opacity-50 cursor-not-allowed'
                          : 'border-navy/15 dark:border-cream/15 bg-cream dark:bg-navy hover:border-amber/50'
                    }`}
                  >
                    <span>
                      <span className="font-medium">{fmtDate(s.start_time)}</span>
                      <span className="text-navy/50 dark:text-cream/50 ml-2">at {fmtTime(s.start_time)}</span>
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

  if (sessions.length === 0) {
    return <p className="text-sm text-navy/40 dark:text-cream/40 italic">No upcoming sessions available for this event.</p>
  }

  if (kind === 'one_time') {
    const s = sessions[0]
    if (!selectedIds.includes(s.id)) onChange([s.id])
    return (
      <div className="flex items-center gap-2 text-sm text-navy/80 dark:text-cream/80">
        <span className="text-amber">✓</span>
        <span className="font-medium">{fmtDate(s.start_time)}</span>
        <span className="text-navy/50 dark:text-cream/50">at {fmtTime(s.start_time)}</span>
        {s.end_time && <span className="text-navy/40 dark:text-cream/40">– {fmtTime(s.end_time)}</span>}
      </div>
    )
  }

  const groups = groupByDate(sessions)
  return (
    <div className="space-y-4">
      {groups.map(([dateKey, slots]) => (
        <div key={dateKey}>
          <p className="text-xs font-semibold text-navy/50 dark:text-cream/50 uppercase tracking-wide mb-1.5">
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
                    selected
                      ? 'border-amber bg-amber/10 text-navy dark:text-cream'
                      : !enough
                        ? 'border-navy/10 dark:border-cream/10 bg-navy/5 dark:bg-cream/5 opacity-50 cursor-not-allowed'
                        : 'border-navy/15 dark:border-cream/15 bg-cream dark:bg-navy hover:border-amber/50'
                  }`}
                >
                  <span className="font-medium">
                    {fmtTime(s.start_time)}
                    {s.end_time && <span className="text-navy/40 dark:text-cream/40 font-normal"> – {fmtTime(s.end_time)}</span>}
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
  if (spots < partySize) return <span className="text-xs text-navy/40 dark:text-cream/40">Full</span>
  if (spots <= 3) return <span className="text-xs font-medium text-amber">{spots} left</span>
  return <span className="text-xs text-navy/40 dark:text-cream/40">{spots} spots</span>
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
              selected
                ? 'border-amber bg-amber/10'
                : 'border-navy/15 dark:border-cream/15 bg-cream dark:bg-navy hover:border-amber/50'
            }`}
          >
            <span>
              <span className="font-medium text-navy dark:text-cream">{a.name}</span>
              {a.description && <span className="text-navy/50 dark:text-cream/50 ml-2">— {a.description}</span>}
            </span>
            <span className={`font-semibold ml-3 ${selected ? 'text-amber' : 'text-navy/70 dark:text-cream/70'}`}>
              + {fmtMoney(a.price)}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Checkout form ────────────────────────────────────────────────────────────

function CheckoutForm({ business, eventType, partySize, sessionIds, addonIds, onConfirmed, onDiscountChange, requiresPayment = true }) {
  const hasPayPal = !!business.paypal_username
  const hasWise = !!business.wise_username
  const hasPaymentMethods = (hasPayPal || hasWise) && requiresPayment

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
  const [promoCode, setPromoCode] = useState('')
  const [promoResult, setPromoResult] = useState(null)
  const [promoChecking, setPromoChecking] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const subtotal = calcTotal(eventType, partySize, addonIds)
  const discountAmount = promoResult?.valid ? Number(promoResult.discount_amount) : 0
  const total = subtotal - discountAmount

  async function applyPromo() {
    if (!promoCode.trim()) return
    setPromoChecking(true); setPromoResult(null)
    try {
      const result = await publicApi.post(
        `/api/public/${business.booking_key}/discount-codes/validate`,
        { code: promoCode.trim(), subtotal }
      )
      setPromoResult(result)
      if (result.valid) onDiscountChange(Number(result.discount_amount))
    } catch {
      setPromoResult({ valid: false, message: 'Could not validate code. Try again.' })
    } finally {
      setPromoChecking(false)
    }
  }

  function updateAttendee(i, field, val) {
    setExtraAttendees(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: val } : a))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) { setError('Name and email are required.'); return }
    if (extraAttendees.some(a => !a.name.trim())) { setError('All attendee names are required.'); return }
    if (requiresPayment && hasPaymentMethods && !paymentMethod) { setError('Please select a payment method.'); return }
    if (requiresPayment && hasPaymentMethods && !receiptFile) { setError('Please upload your payment receipt.'); return }

    setSubmitting(true); setError('')
    try {
      const booking = await publicApi.post(`/api/public/${business.booking_key}/bookings`, {
        event_type_id: eventType.id,
        customer: { name: name.trim(), email: email.trim(), phone: phone.trim() || null },
        party_size: partySize,
        session_ids: sessionIds,
        addon_ids: addonIds,
        discount_code: promoResult?.valid ? promoCode.trim() : null,
        attendees: extraAttendees.map(a => ({
          name: a.name.trim(),
          email: a.email.trim() || null,
          phone: a.phone.trim() || null,
        })),
      })

      if (requiresPayment && hasPaymentMethods && receiptFile) {
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
      <div className={CARD_CLS}>
        <h3 className={SECTION_LABEL}>Your details</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-navy/80 dark:text-cream/80 mb-1">
              Full name <span className="text-terracotta">*</span>
            </label>
            <input value={name} onChange={e => setName(e.target.value)} type="text" required
              className={INPUT_CLS} />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy/80 dark:text-cream/80 mb-1">
              Email <span className="text-terracotta">*</span>
            </label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" required
              className={INPUT_CLS} />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy/80 dark:text-cream/80 mb-1">
              Phone <span className="text-navy/40 dark:text-cream/40 font-normal">(optional)</span>
            </label>
            <input value={phone} onChange={e => setPhone(e.target.value)} type="tel"
              className={INPUT_CLS} />
          </div>
        </div>
      </div>

      {/* Extra attendees */}
      {extraAttendees.length > 0 && (
        <div className={CARD_CLS}>
          <h3 className={SECTION_LABEL}>Additional attendees</h3>
          <div className="space-y-4">
            {extraAttendees.map((a, i) => (
              <div key={i} className="border border-navy/10 dark:border-cream/10 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-navy/80 dark:text-cream/80">Attendee {i + 2}</p>
                <div>
                  <label className="block text-xs text-navy/60 dark:text-cream/60 mb-1">
                    Name <span className="text-terracotta">*</span>
                  </label>
                  <input value={a.name} onChange={e => updateAttendee(i, 'name', e.target.value)} type="text" required
                    className={INPUT_CLS} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-navy/60 dark:text-cream/60 mb-1">Email</label>
                    <input value={a.email} onChange={e => updateAttendee(i, 'email', e.target.value)} type="email"
                      className={INPUT_CLS} />
                  </div>
                  <div>
                    <label className="block text-xs text-navy/60 dark:text-cream/60 mb-1">Phone</label>
                    <input value={a.phone} onChange={e => updateAttendee(i, 'phone', e.target.value)} type="tel"
                      className={INPUT_CLS} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Promo code */}
      <div className={CARD_CLS}>
        <h3 className={SECTION_LABEL}>Promo code</h3>
        <div className="flex gap-2">
          <input
            value={promoCode}
            onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null) }}
            placeholder="Enter code"
            disabled={promoResult?.valid}
            className={`flex-1 border border-navy/20 dark:border-cream/20 bg-cream dark:bg-navy/50 text-navy dark:text-cream rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber placeholder:text-navy/30 dark:placeholder:text-cream/30 disabled:opacity-50`}
          />
          {promoResult?.valid ? (
            <button
              type="button"
              onClick={() => { setPromoCode(''); setPromoResult(null); onDiscountChange(0) }}
              className="text-sm text-terracotta hover:text-terracotta/70 px-3"
            >
              Remove
            </button>
          ) : (
            <button
              type="button"
              onClick={applyPromo}
              disabled={!promoCode.trim() || promoChecking}
              className="bg-navy/5 dark:bg-cream/10 hover:bg-navy/10 dark:hover:bg-cream/15 disabled:opacity-50 text-navy/70 dark:text-cream/70 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {promoChecking ? '…' : 'Apply'}
            </button>
          )}
        </div>
        {promoResult && (
          <p className={`text-xs mt-2 ${promoResult.valid ? 'text-green-600 dark:text-green-400' : 'text-terracotta'}`}>
            {promoResult.valid
              ? `✓ Code applied — ${fmtMoney(promoResult.discount_amount)} off`
              : promoResult.message}
          </p>
        )}
      </div>

      {/* Payment */}
      {!requiresPayment ? (
        <div className="bg-amber/10 border border-amber/30 rounded-xl p-5">
          <p className="text-sm font-medium text-amber mb-1">No payment required</p>
          <p className="text-sm text-navy/70 dark:text-cream/70">This is an RSVP event. Your spot will be confirmed immediately upon submission.</p>
        </div>
      ) : (
        <div className={CARD_CLS}>
          <h3 className={SECTION_LABEL}>Payment</h3>

          {hasPaymentMethods ? (
            <>
              <p className="text-sm text-navy/70 dark:text-cream/70 mb-4">
                Send <strong className="text-navy dark:text-cream">{fmtMoney(total)}</strong> to one of the accounts below,
                then upload your receipt to confirm your booking.
              </p>

              {hasPayPal && hasWise && (
                <div className="flex gap-3 mb-4">
                  {['paypal', 'wise'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        paymentMethod === m
                          ? 'border-amber bg-amber/10 text-amber'
                          : 'border-navy/15 dark:border-cream/15 text-navy/60 dark:text-cream/60 hover:border-navy/30 dark:hover:border-cream/30'
                      }`}
                    >
                      {m === 'paypal' ? 'PayPal' : 'Wise'}
                    </button>
                  ))}
                </div>
              )}

              {paymentMethod === 'paypal' && hasPayPal && (
                <div className="bg-navy/5 dark:bg-cream/5 rounded-lg p-4 mb-4 text-sm">
                  <p className="text-navy/50 dark:text-cream/50 mb-1">PayPal username</p>
                  <p className="font-semibold text-navy dark:text-cream text-base">{business.paypal_username}</p>
                  {business.has_paypal_qr && (
                    <div className="mt-3">
                      <p className="text-navy/40 dark:text-cream/40 text-xs mb-2">Scan QR to pay</p>
                      <img
                        src={`/api/public/${business.booking_key}/qr/paypal`}
                        alt="PayPal QR code"
                        className="w-36 h-36 object-contain bg-cream dark:bg-navy border border-navy/10 dark:border-cream/10 rounded-lg p-1"
                      />
                    </div>
                  )}
                </div>
              )}
              {paymentMethod === 'wise' && hasWise && (
                <div className="bg-navy/5 dark:bg-cream/5 rounded-lg p-4 mb-4 text-sm">
                  <p className="text-navy/50 dark:text-cream/50 mb-1">Wise username</p>
                  <p className="font-semibold text-navy dark:text-cream text-base">{business.wise_username}</p>
                  {business.has_wise_qr && (
                    <div className="mt-3">
                      <p className="text-navy/40 dark:text-cream/40 text-xs mb-2">Scan QR to pay</p>
                      <img
                        src={`/api/public/${business.booking_key}/qr/wise`}
                        alt="Wise QR code"
                        className="w-36 h-36 object-contain bg-cream dark:bg-navy border border-navy/10 dark:border-cream/10 rounded-lg p-1"
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-navy/80 dark:text-cream/80 mb-2">
                  Upload receipt <span className="text-terracotta">*</span>
                </p>
                <input ref={fileRef} type="file" accept="image/*,application/pdf"
                  onChange={e => setReceiptFile(e.target.files[0] || null)}
                  className="block w-full text-sm text-navy/50 dark:text-cream/50 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber/10 file:text-amber hover:file:bg-amber/20 cursor-pointer" />
                {receiptFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ {receiptFile.name}</p>
                )}
              </div>
            </>
          ) : (
            <div className="bg-amber/10 border border-amber/30 rounded-lg p-4 text-sm">
              <p className="font-medium text-amber mb-1">Payment instructions pending</p>
              <p className="text-navy/70 dark:text-cream/70">
                Contact us at{' '}
                <a href={`mailto:${business.email}`} className="text-amber underline underline-offset-2">
                  {business.email}
                </a>{' '}
                to arrange payment. Your booking will be reserved once confirmed.
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-terracotta bg-terracotta/10 rounded-lg px-4 py-3">{error}</p>
      )}

      <button type="submit" disabled={submitting}
        className="w-full bg-amber hover:bg-amber/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-colors">
        {submitting ? 'Confirming…' : requiresPayment ? 'Confirm Booking' : 'Reserve My Spot'}
      </button>
    </form>
  )
}

// ─── Confirmation ─────────────────────────────────────────────────────────────

function ConfirmationScreen({ booking, business, eventType }) {
  const isConfirmed = booking.status === 'confirmed'
  const isAwaitingPayment = booking.status === 'awaiting_payment'
  return (
    <div className="max-w-lg mx-auto text-center py-12 px-4">
      <div className="w-16 h-16 rounded-full bg-amber/15 flex items-center justify-center mx-auto mb-5">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-amber">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold font-display text-navy dark:text-cream mb-2">
        {isConfirmed ? 'Your spot is reserved!' : 'Booking received!'}
      </h2>
      <p className="text-navy/60 dark:text-cream/60 mb-6">
        {isConfirmed
          ? 'Your booking is confirmed. See you there!'
          : isAwaitingPayment
            ? "We've received your receipt and will confirm your booking by email."
            : `Contact ${business.email} to complete your payment and confirm the booking.`}
      </p>

      <div className={`${CARD_CLS} text-left space-y-3 mb-6`}>
        <div className="flex justify-between text-sm">
          <span className="text-navy/50 dark:text-cream/50">Booking ref</span>
          <span className="font-semibold text-navy dark:text-cream">#{booking.booking_ref}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-navy/50 dark:text-cream/50">Event</span>
          <span className="font-semibold text-navy dark:text-cream">{eventType.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-navy/50 dark:text-cream/50">People</span>
          <span className="font-semibold text-navy dark:text-cream">{booking.party_size}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-navy/50 dark:text-cream/50">Total</span>
          <span className="font-semibold text-navy dark:text-cream">{fmtMoney(booking.total_price)}</span>
        </div>
        {booking.sessions?.length > 0 && (
          <div className="pt-2 border-t border-navy/10 dark:border-cream/10">
            <p className="text-xs text-navy/40 dark:text-cream/40 uppercase tracking-wide mb-1">Sessions</p>
            {booking.sessions.map(s => (
              <p key={s.id} className="text-sm text-navy/80 dark:text-cream/80">
                {fmtDate(s.start_time)} at {fmtTime(s.start_time)}
              </p>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-navy/40 dark:text-cream/40 mb-6">
        A confirmation email has been sent to your inbox. Questions?{' '}
        <a href={`mailto:${business.email}`} className="text-amber underline underline-offset-2">
          {business.email}
        </a>
      </p>
      <a
        href={`/book/${business.slug}`}
        className="inline-block border border-navy/15 dark:border-cream/15 hover:bg-navy/5 dark:hover:bg-cream/5 text-navy/70 dark:text-cream/70 text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
      >
        ← Back to booking page
      </a>
    </div>
  )
}

// ─── Main booking page ───────────────────────────────────────────────────────

export default function BookingPage() {
  const { slug, eventTypeId } = useParams()

  const [phase, setPhase] = useState('loading')
  const [business, setBusiness] = useState(null)
  const [eventTypes, setEventTypes] = useState([])
  const [selectedEventType, setSelectedEventType] = useState(null)
  const [sessions, setSessions] = useState([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [partySize, setPartySize] = useState(1)
  const [selectedSessionIds, setSelectedSessionIds] = useState([])
  const [selectedAddonIds, setSelectedAddonIds] = useState([])
  const [appliedDiscount, setAppliedDiscount] = useState(0)
  const [confirmedBooking, setConfirmedBooking] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    publicApi.get(`/api/public/by-slug/${slug}`)
      .then(biz => {
        setBusiness(biz)
        if (eventTypeId) {
          return publicApi.get(`/api/public/${biz.booking_key}/event-types/${eventTypeId}`)
            .then(et => { setSelectedEventType(et); setPhase('configure') })
        }
        return publicApi.get(`/api/public/${biz.booking_key}/event-types`)
          .then(ets => { setEventTypes(ets); setPhase('events') })
      })
      .catch(err => { setError(err.message || 'This booking page could not be found.'); setPhase('error') })
  }, [slug, eventTypeId])

  useEffect(() => {
    if (!selectedEventType || !business) return
    const kind = selectedEventType.kind
    if (kind === 'package') { setSessions([]); return }
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
    setAppliedDiscount(0)
    setPhase('configure')
  }

  function handlePartySizeChange(n) {
    setPartySize(n)
    setSelectedSessionIds([])
  }

  function canCheckout() {
    if (!selectedEventType) return false
    const kind = selectedEventType.kind
    const pkg = selectedEventType.package
    if (kind === 'package' && pkg?.date_mode === 'fixed') return pkg.pool_sessions.length > 0
    if (kind === 'package' && pkg?.date_mode === 'customer_picks') {
      return selectedSessionIds.length === pkg.required_session_count
    }
    if (kind === 'one_time') return sessions.length > 0
    return selectedSessionIds.length > 0
  }

  function handleConfirmed(booking) {
    setConfirmedBooking(booking)
    setPhase('confirmed')
  }

  const allSessions = selectedEventType?.kind === 'package'
    ? (selectedEventType.package?.pool_sessions ?? [])
    : sessions

  const displaySessionIds = (
    selectedEventType?.kind === 'package' &&
    selectedEventType?.package?.date_mode === 'fixed'
  )
    ? allSessions.map(s => s.id)
    : selectedSessionIds

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-cream dark:bg-dark-base flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-cream dark:bg-dark-base flex items-center justify-center">
        <div className="text-center">
          <p className="text-navy/50 dark:text-cream/50 text-sm">{error || 'This booking page could not be found.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-dark-base">
      {/* Header */}
      <header className="bg-cream dark:bg-navy border-b border-navy/10 dark:border-cream/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          {phase !== 'events' && phase !== 'confirmed' && (
            <button
              onClick={() => {
                if (phase === 'checkout') setPhase('configure')
                else if (eventTypeId) { /* direct link — no list to go back to */ }
                else { setSelectedEventType(null); setPhase('events') }
              }}
              className={`text-sm text-amber hover:text-amber/70 font-medium ${phase === 'configure' && eventTypeId ? 'invisible' : ''}`}
            >
              ←
            </button>
          )}
          <div>
            <h1 className="font-bold font-display text-navy dark:text-cream">{business.name}</h1>
            {phase !== 'events' && selectedEventType && (
              <p className="text-xs text-navy/40 dark:text-cream/40">{selectedEventType.name}</p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* ── Event selection ── */}
        {phase === 'events' && (
          <div>
            <h2 className="text-xl font-bold font-display text-navy dark:text-cream mb-6">Choose an experience</h2>
            {eventTypes.length === 0
              ? <p className="text-sm text-navy/40 dark:text-cream/40 text-center py-12">No events available at this time.</p>
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
              <div className={CARD_CLS}>
                <h3 className={SECTION_LABEL}>How many people?</h3>
                <div className="flex items-center gap-4">
                  <button onClick={() => handlePartySizeChange(Math.max(1, partySize - 1))}
                    className="w-9 h-9 rounded-full border border-navy/20 dark:border-cream/20 text-navy dark:text-cream text-lg font-medium hover:bg-navy/5 dark:hover:bg-cream/5 transition-colors flex items-center justify-center">
                    −
                  </button>
                  <span className="text-2xl font-bold text-navy dark:text-cream w-8 text-center">{partySize}</span>
                  <button onClick={() => handlePartySizeChange(partySize + 1)}
                    className="w-9 h-9 rounded-full border border-navy/20 dark:border-cream/20 text-navy dark:text-cream text-lg font-medium hover:bg-navy/5 dark:hover:bg-cream/5 transition-colors flex items-center justify-center">
                    +
                  </button>
                  <span className="text-sm text-navy/50 dark:text-cream/50">person{partySize !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Session picker */}
              <div className={CARD_CLS}>
                <h3 className={SECTION_LABEL}>
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
                <div className={CARD_CLS}>
                  <h3 className={SECTION_LABEL}>Add-ons (optional)</h3>
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
                className="w-full bg-amber hover:bg-amber/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-colors"
              >
                Continue to checkout
              </button>
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

        {/* ── Checkout ── */}
        {phase === 'checkout' && selectedEventType && business && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold font-display text-navy dark:text-cream mb-6">Complete your booking</h2>
              <CheckoutForm
                business={business}
                eventType={selectedEventType}
                partySize={partySize}
                sessionIds={selectedSessionIds}
                addonIds={selectedAddonIds}
                onConfirmed={handleConfirmed}
                onDiscountChange={setAppliedDiscount}
                requiresPayment={selectedEventType?.requires_payment !== false}
              />
            </div>
            <div>
              <SummaryCard
                eventType={selectedEventType}
                partySize={partySize}
                sessionIds={displaySessionIds}
                addonIds={selectedAddonIds}
                allSessions={allSessions}
                discountAmount={appliedDiscount}
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
