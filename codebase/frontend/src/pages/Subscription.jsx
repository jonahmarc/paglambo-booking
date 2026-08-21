import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

const PLAN_PRICE = { standard: '$49', pro: '$89' }

function daysLeft(dateStr) {
  if (!dateStr) return null
  const diff = new Date(dateStr) - new Date()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function StatusCard({ status, plan, trialEndsAt }) {
  const days = daysLeft(trialEndsAt)

  if (status === 'pending_approval') {
    return (
      <div className="rounded-xl border border-amber/30 bg-amber/10 p-5">
        <p className="font-semibold text-amber mb-1">Awaiting approval</p>
        <p className="text-sm text-amber/80">
          Your registration is being reviewed. You'll receive an email once approved and your trial starts.
        </p>
      </div>
    )
  }
  if (status === 'trial') {
    return (
      <div className="rounded-xl border border-navy/20 dark:border-cream/20 bg-navy/5 dark:bg-cream/5 p-5">
        <p className="font-semibold text-navy dark:text-cream mb-1">Trial active</p>
        <p className="text-sm text-navy/70 dark:text-cream/70">
          {days !== null ? (
            days > 0
              ? `Your trial ends in ${days} day${days !== 1 ? 's' : ''} (${new Date(trialEndsAt).toLocaleDateString()}).`
              : 'Your trial ends today.'
          ) : 'Your trial is active.'}
          {' '}Submit a payment receipt below to keep your booking page live after the trial.
        </p>
      </div>
    )
  }
  if (status === 'active') {
    return (
      <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-5">
        <p className="font-semibold text-green-600 dark:text-green-400 mb-1">Subscription active</p>
        <p className="text-sm text-green-600/80 dark:text-green-400/80">Your subscription is active. Your booking page is live.</p>
      </div>
    )
  }
  if (status === 'expired') {
    return (
      <div className="rounded-xl border border-terracotta/30 bg-terracotta/10 p-5">
        <p className="font-semibold text-terracotta mb-1">Subscription expired</p>
        <p className="text-sm text-terracotta/80">
          Your trial or subscription has expired and your booking page is offline.
          Submit a payment receipt below to reactivate.
        </p>
      </div>
    )
  }
  if (status === 'rejected') {
    return (
      <div className="rounded-xl border border-terracotta/30 bg-terracotta/10 p-5">
        <p className="font-semibold text-terracotta mb-1">Registration not approved</p>
        <p className="text-sm text-terracotta/80">
          Your registration was not approved. Please contact us for more information.
        </p>
      </div>
    )
  }
  return null
}

export default function Subscription() {
  const { business } = useAuth()
  const [payments, setPayments] = useState([])
  const [loadingPayments, setLoadingPayments] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    api.get('/api/subscriptions/my-payments')
      .then(setPayments)
      .catch(() => {})
      .finally(() => setLoadingPayments(false))
  }, [])

  const canUpload = business && ['pending_approval', 'trial', 'expired'].includes(business.status)

  async function handleUpload(e) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) { setUploadError('Please select a file'); return }

    setUploading(true)
    setUploadError('')
    setUploadSuccess(false)
    try {
      const form = new FormData()
      form.append('file', file)
      const payment = await api.postForm('/api/subscriptions/receipt', form)
      setPayments((prev) => [payment, ...prev])
      setUploadSuccess(true)
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
    }
  }

  if (!business) return null

  const pendingPayment = payments.find((p) => p.status === 'pending')

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold font-display text-navy dark:text-cream">Subscription</h1>
          <p className="text-sm text-navy/50 dark:text-cream/50 mt-1">Manage your Buhata Booking plan.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
            business.plan === 'pro'
              ? 'bg-terracotta/10 text-terracotta'
              : 'bg-navy/10 text-navy dark:bg-cream/10 dark:text-cream/80'
          }`}>
            {business.plan === 'pro' ? 'Pro' : 'Standard'}
          </span>
          <span className="text-sm font-medium text-navy/50 dark:text-cream/50">{PLAN_PRICE[business.plan]}/mo</span>
        </div>
      </div>

      <StatusCard status={business.status} plan={business.plan} trialEndsAt={business.trial_ends_at} />

      {/* Upload receipt */}
      {canUpload && (
        <div className="mt-6 bg-cream dark:bg-navy rounded-xl border border-navy/10 dark:border-cream/10 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-navy dark:text-cream mb-1">Submit payment receipt</h2>
          <p className="text-sm text-navy/50 dark:text-cream/50 mb-4">
            Send <strong>{PLAN_PRICE[business.plan]}/month</strong> via PayPal or Wise,
            then upload a screenshot or receipt here for review.
          </p>

          {pendingPayment && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-amber/10 border border-amber/30 text-sm text-amber">
              You have a receipt pending review (submitted {new Date(pendingPayment.created_at).toLocaleDateString()}).
              We'll email you once it's verified.
            </div>
          )}

          {uploadSuccess && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/30 text-sm text-green-600 dark:text-green-400">
              Receipt submitted. We'll review it and email you shortly.
            </div>
          )}
          {uploadError && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-terracotta/10 border border-terracotta/30 text-sm text-terracotta">
              {uploadError}
            </div>
          )}

          <form onSubmit={handleUpload} className="flex items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="text-sm text-navy/60 dark:text-cream/60 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-navy/20 dark:file:border-cream/20 file:text-sm file:font-medium file:bg-cream dark:file:bg-navy file:text-navy dark:file:text-cream hover:file:bg-navy/5 dark:hover:file:bg-cream/5"
            />
            <button
              type="submit"
              disabled={uploading}
              className="shrink-0 bg-amber hover:bg-amber/90 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {uploading ? 'Uploading…' : 'Upload receipt'}
            </button>
          </form>
        </div>
      )}

      {/* Payment history */}
      {!loadingPayments && payments.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-navy dark:text-cream mb-3">Payment history</h2>
          <div className="bg-cream dark:bg-navy rounded-xl border border-navy/10 dark:border-cream/10 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-navy/5 dark:bg-cream/5 border-b border-navy/10 dark:border-cream/10">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-navy/60 dark:text-cream/60">Submitted</th>
                  <th className="text-left px-4 py-3 font-medium text-navy/60 dark:text-cream/60">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-navy/60 dark:text-cream/60">Reviewed</th>
                  <th className="text-left px-4 py-3 font-medium text-navy/60 dark:text-cream/60">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/10 dark:divide-cream/10">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 text-navy/60 dark:text-cream/60">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        p.status === 'approved' ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                          : p.status === 'rejected' ? 'bg-terracotta/15 text-terracotta'
                          : 'bg-amber/15 text-amber'
                      }`}>
                        {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-navy/50 dark:text-cream/50">
                      {p.reviewed_at ? new Date(p.reviewed_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-navy/50 dark:text-cream/50 text-xs">{p.review_note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
