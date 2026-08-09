import { useEffect, useState } from 'react'
import { saFetch } from '../context/SuperAdminAuthContext'

const PAYMENT_STATUS_STYLE = {
  pending:  'bg-amber-50 text-amber-700',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
}

export default function SuperAdminSubscriptions() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [working, setWorking] = useState(null)
  const [rejectNote, setRejectNote] = useState({})
  const [rejectOpen, setRejectOpen] = useState(null)

  useEffect(() => {
    saFetch('/api/superadmin/subscription-payments', { method: 'GET' })
      .then(setPayments)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function approve(id) {
    setWorking(id)
    try {
      const updated = await saFetch(`/api/superadmin/subscription-payments/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ review_note: null }),
      })
      setPayments((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    } catch (err) {
      setError(err.message)
    } finally {
      setWorking(null)
    }
  }

  async function reject(id) {
    setWorking(id)
    try {
      const updated = await saFetch(`/api/superadmin/subscription-payments/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ review_note: rejectNote[id] || null }),
      })
      setPayments((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      setRejectOpen(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setWorking(null)
    }
  }

  async function openReceipt(paymentId) {
    try {
      const access = localStorage.getItem('sa_access_token')
      const res = await fetch(`/api/superadmin/subscription-payments/${paymentId}/receipt`, {
        headers: access ? { Authorization: `Bearer ${access}` } : {},
      })
      if (!res.ok) { setError('Could not load receipt'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch {
      setError('Could not load receipt')
    }
  }

  const pending = payments.filter((p) => p.status === 'pending')
  const reviewed = payments.filter((p) => p.status !== 'pending')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Subscriptions</h1>
        <p className="text-sm text-gray-500 mt-1">Platform subscription receipts submitted by business clients.</p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <>
          {/* Pending */}
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Pending review {pending.length > 0 && <span className="ml-1 text-amber-600">({pending.length})</span>}
          </h2>
          {pending.length === 0 ? (
            <p className="text-sm text-gray-400 mb-8">No pending receipts.</p>
          ) : (
            <div className="space-y-3 mb-8">
              {pending.map((p) => (
                <div key={p.id} className="bg-white rounded-xl border border-amber-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900">{p.business.name}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          p.business.plan === 'pro' ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {p.business.plan === 'pro' ? 'Pro' : 'Standard'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{p.business.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Submitted {new Date(p.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => openReceipt(p.id)}
                        className="text-sm font-medium px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        View receipt
                      </button>
                      <button
                        onClick={() => approve(p.id)}
                        disabled={working === p.id}
                        className="text-sm font-medium px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50"
                      >
                        {working === p.id ? '…' : 'Approve'}
                      </button>
                      <button
                        onClick={() => setRejectOpen(rejectOpen === p.id ? null : p.id)}
                        disabled={working === p.id}
                        className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>

                  {rejectOpen === p.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <textarea
                        rows={2}
                        value={rejectNote[p.id] || ''}
                        onChange={(e) => setRejectNote((n) => ({ ...n, [p.id]: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                        placeholder="Optional reason…"
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => reject(p.id)}
                          disabled={working === p.id}
                          className="text-sm font-medium px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
                        >
                          {working === p.id ? '…' : 'Confirm rejection'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Reviewed */}
          {reviewed.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Previously reviewed</h2>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Business</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Plan</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Reviewed</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Note</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reviewed.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{p.business.name}</p>
                          <p className="text-xs text-gray-400">{p.business.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            p.business.plan === 'pro' ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {p.business.plan === 'pro' ? 'Pro' : 'Standard'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${PAYMENT_STATUS_STYLE[p.status]}`}>
                            {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {p.reviewed_at ? new Date(p.reviewed_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                          {p.review_note || '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => openReceipt(p.id)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
