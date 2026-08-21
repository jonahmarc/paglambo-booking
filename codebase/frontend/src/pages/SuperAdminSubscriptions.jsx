import { useEffect, useState } from 'react'
import { saFetch } from '../context/SuperAdminAuthContext'

const PAYMENT_STATUS_STYLE = {
  pending:  'bg-amber/15 text-amber',
  approved: 'bg-green-500/15 text-green-600 dark:text-green-400',
  rejected: 'bg-terracotta/15 text-terracotta',
}

const INPUT_CLS = 'w-full border border-navy/20 dark:border-cream/20 bg-cream dark:bg-navy/50 text-navy dark:text-cream rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber placeholder:text-navy/30 dark:placeholder:text-cream/30 resize-none'

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
        <h1 className="text-xl font-semibold font-display text-navy dark:text-cream">Subscriptions</h1>
        <p className="text-sm text-navy/50 dark:text-cream/50 mt-1">Platform subscription receipts submitted by business clients.</p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-terracotta/10 border border-terracotta/30 text-sm text-terracotta">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-navy/50 dark:text-cream/50">Loading…</p>
      ) : (
        <>
          {/* Pending */}
          <h2 className="text-sm font-semibold text-navy dark:text-cream mb-3">
            Pending review {pending.length > 0 && <span className="ml-1 text-amber">({pending.length})</span>}
          </h2>
          {pending.length === 0 ? (
            <p className="text-sm text-navy/40 dark:text-cream/40 mb-8">No pending receipts.</p>
          ) : (
            <div className="space-y-3 mb-8">
              {pending.map((p) => (
                <div key={p.id} className="bg-cream dark:bg-navy rounded-xl border border-amber/30 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-navy dark:text-cream">{p.business.name}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          p.business.plan === 'pro' ? 'bg-terracotta/10 text-terracotta' : 'bg-navy/10 text-navy dark:bg-cream/10 dark:text-cream/80'
                        }`}>
                          {p.business.plan === 'pro' ? 'Pro' : 'Standard'}
                        </span>
                      </div>
                      <p className="text-sm text-navy/50 dark:text-cream/50">{p.business.email}</p>
                      <p className="text-xs text-navy/40 dark:text-cream/40 mt-1">
                        Submitted {new Date(p.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => openReceipt(p.id)}
                        className="text-sm font-medium px-3 py-2 rounded-lg border border-navy/20 dark:border-cream/20 text-navy/60 dark:text-cream/60 hover:bg-navy/5 dark:hover:bg-cream/5 transition-colors"
                      >
                        View receipt
                      </button>
                      <button
                        onClick={() => approve(p.id)}
                        disabled={working === p.id}
                        className="text-sm font-medium px-4 py-2 rounded-lg bg-amber hover:bg-amber/90 text-white transition-colors disabled:opacity-50"
                      >
                        {working === p.id ? '…' : 'Approve'}
                      </button>
                      <button
                        onClick={() => setRejectOpen(rejectOpen === p.id ? null : p.id)}
                        disabled={working === p.id}
                        className="text-sm font-medium px-4 py-2 rounded-lg border border-navy/20 dark:border-cream/20 text-navy/60 dark:text-cream/60 hover:bg-navy/5 dark:hover:bg-cream/5 transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>

                  {rejectOpen === p.id && (
                    <div className="mt-4 pt-4 border-t border-navy/10 dark:border-cream/10">
                      <label className="block text-sm font-medium text-navy/80 dark:text-cream/80 mb-1">
                        Reason <span className="text-navy/40 dark:text-cream/40 font-normal">(optional)</span>
                      </label>
                      <textarea
                        rows={2}
                        value={rejectNote[p.id] || ''}
                        onChange={(e) => setRejectNote((n) => ({ ...n, [p.id]: e.target.value }))}
                        className={INPUT_CLS}
                        placeholder="Optional reason…"
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => reject(p.id)}
                          disabled={working === p.id}
                          className="text-sm font-medium px-4 py-2 rounded-lg bg-terracotta hover:bg-terracotta/90 text-white transition-colors disabled:opacity-50"
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
              <h2 className="text-sm font-semibold text-navy dark:text-cream mb-3">Previously reviewed</h2>
              <div className="bg-cream dark:bg-navy rounded-xl border border-navy/10 dark:border-cream/10 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-navy/5 dark:bg-cream/5 border-b border-navy/10 dark:border-cream/10">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-navy/60 dark:text-cream/60">Business</th>
                      <th className="text-left px-4 py-3 font-medium text-navy/60 dark:text-cream/60">Plan</th>
                      <th className="text-left px-4 py-3 font-medium text-navy/60 dark:text-cream/60">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-navy/60 dark:text-cream/60">Reviewed</th>
                      <th className="text-left px-4 py-3 font-medium text-navy/60 dark:text-cream/60">Note</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy/10 dark:divide-cream/10">
                    {reviewed.map((p) => (
                      <tr key={p.id} className="hover:bg-navy/5 dark:hover:bg-cream/5 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-navy dark:text-cream">{p.business.name}</p>
                          <p className="text-xs text-navy/40 dark:text-cream/40">{p.business.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            p.business.plan === 'pro' ? 'bg-terracotta/10 text-terracotta' : 'bg-navy/10 text-navy dark:bg-cream/10 dark:text-cream/80'
                          }`}>
                            {p.business.plan === 'pro' ? 'Pro' : 'Standard'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${PAYMENT_STATUS_STYLE[p.status]}`}>
                            {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-navy/50 dark:text-cream/50">
                          {p.reviewed_at ? new Date(p.reviewed_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-navy/50 dark:text-cream/50 text-xs max-w-xs truncate">
                          {p.review_note || '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => openReceipt(p.id)}
                            className="text-xs text-amber hover:text-amber/70"
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
