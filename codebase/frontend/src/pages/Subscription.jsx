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
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <p className="font-semibold text-amber-800 mb-1">Awaiting approval</p>
        <p className="text-sm text-amber-700">
          Your registration is being reviewed. You'll receive an email once approved and your trial starts.
        </p>
      </div>
    )
  }
  if (status === 'trial') {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
        <p className="font-semibold text-blue-800 mb-1">Trial active</p>
        <p className="text-sm text-blue-700">
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
      <div className="rounded-xl border border-green-200 bg-green-50 p-5">
        <p className="font-semibold text-green-800 mb-1">Subscription active</p>
        <p className="text-sm text-green-700">Your subscription is active. Your booking page is live.</p>
      </div>
    )
  }
  if (status === 'expired') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <p className="font-semibold text-red-800 mb-1">Subscription expired</p>
        <p className="text-sm text-red-700">
          Your trial or subscription has expired and your booking page is offline.
          Submit a payment receipt below to reactivate.
        </p>
      </div>
    )
  }
  if (status === 'rejected') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <p className="font-semibold text-red-800 mb-1">Registration not approved</p>
        <p className="text-sm text-red-700">
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
          <h1 className="text-xl font-semibold text-gray-900">Subscription</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your Buhata Booking plan.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
            business.plan === 'pro' ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {business.plan === 'pro' ? 'Pro' : 'Standard'}
          </span>
          <span className="text-sm font-medium text-gray-500">{PLAN_PRICE[business.plan]}/mo</span>
        </div>
      </div>

      <StatusCard status={business.status} plan={business.plan} trialEndsAt={business.trial_ends_at} />

      {/* Upload receipt */}
      {canUpload && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Submit payment receipt</h2>
          <p className="text-sm text-gray-500 mb-4">
            Send <strong>{PLAN_PRICE[business.plan]}/month</strong> via PayPal or Wise,
            then upload a screenshot or receipt here for review.
          </p>

          {pendingPayment && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
              You have a receipt pending review (submitted {new Date(pendingPayment.created_at).toLocaleDateString()}).
              We'll email you once it's verified.
            </div>
          )}

          {uploadSuccess && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
              Receipt submitted. We'll review it and email you shortly.
            </div>
          )}
          {uploadError && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {uploadError}
            </div>
          )}

          <form onSubmit={handleUpload} className="flex items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-gray-300 file:text-sm file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50"
            />
            <button
              type="submit"
              disabled={uploading}
              className="shrink-0 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {uploading ? 'Uploading…' : 'Upload receipt'}
            </button>
          </form>
        </div>
      )}

      {/* Payment history */}
      {!loadingPayments && payments.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Payment history</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Submitted</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Reviewed</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 text-gray-600">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        p.status === 'approved' ? 'bg-green-50 text-green-700'
                          : p.status === 'rejected' ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {p.reviewed_at ? new Date(p.reviewed_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{p.review_note || '—'}</td>
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
