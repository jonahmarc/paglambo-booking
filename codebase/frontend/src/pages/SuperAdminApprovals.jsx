import { useEffect, useState } from 'react'
import { saFetch } from '../context/SuperAdminAuthContext'

const INPUT_CLS = 'w-full border border-navy/20 dark:border-cream/20 bg-cream dark:bg-navy/50 text-navy dark:text-cream rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber placeholder:text-navy/30 dark:placeholder:text-cream/30 resize-none'

export default function SuperAdminApprovals() {
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [working, setWorking] = useState(null)
  const [rejectNote, setRejectNote] = useState({})
  const [rejectOpen, setRejectOpen] = useState(null)

  useEffect(() => {
    saFetch('/api/superadmin/businesses', { method: 'GET' })
      .then((all) => setBusinesses(all.filter((b) => b.status === 'pending_approval')))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function approve(id) {
    setWorking(id)
    try {
      await saFetch(`/api/superadmin/businesses/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ note: null }),
      })
      setBusinesses((prev) => prev.filter((b) => b.id !== id))
    } catch (err) {
      setError(err.message)
    } finally {
      setWorking(null)
    }
  }

  async function reject(id) {
    setWorking(id)
    try {
      await saFetch(`/api/superadmin/businesses/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ note: rejectNote[id] || null }),
      })
      setBusinesses((prev) => prev.filter((b) => b.id !== id))
      setRejectOpen(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setWorking(null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold font-display text-navy dark:text-cream">Approvals</h1>
        <p className="text-sm text-navy/50 dark:text-cream/50 mt-1">New business registrations waiting for your review.</p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-terracotta/10 border border-terracotta/30 text-sm text-terracotta">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-navy/50 dark:text-cream/50">Loading…</p>
      ) : businesses.length === 0 ? (
        <div className="bg-cream dark:bg-navy rounded-xl border border-navy/10 dark:border-cream/10 shadow-sm p-8 text-center">
          <p className="text-sm text-navy/40 dark:text-cream/40">No pending registrations.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {businesses.map((b) => (
            <div key={b.id} className="bg-cream dark:bg-navy rounded-xl border border-navy/10 dark:border-cream/10 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-navy dark:text-cream">{b.name}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      b.plan === 'pro' ? 'bg-terracotta/10 text-terracotta' : 'bg-navy/10 text-navy dark:bg-cream/10 dark:text-cream/80'
                    }`}>
                      {b.plan === 'pro' ? 'Pro' : 'Standard'}
                    </span>
                  </div>
                  <p className="text-sm text-navy/50 dark:text-cream/50">{b.email}</p>
                  <p className="text-xs text-navy/40 dark:text-cream/40 mt-1">
                    Registered {new Date(b.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => approve(b.id)}
                    disabled={working === b.id}
                    className="text-sm font-medium px-4 py-2 rounded-lg bg-amber hover:bg-amber/90 text-white transition-colors disabled:opacity-50"
                  >
                    {working === b.id ? '…' : 'Approve'}
                  </button>
                  <button
                    onClick={() => setRejectOpen(rejectOpen === b.id ? null : b.id)}
                    disabled={working === b.id}
                    className="text-sm font-medium px-4 py-2 rounded-lg border border-navy/20 dark:border-cream/20 text-navy/60 dark:text-cream/60 hover:bg-navy/5 dark:hover:bg-cream/5 transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>

              {rejectOpen === b.id && (
                <div className="mt-4 pt-4 border-t border-navy/10 dark:border-cream/10">
                  <label className="block text-sm font-medium text-navy/80 dark:text-cream/80 mb-1">
                    Reason <span className="text-navy/40 dark:text-cream/40 font-normal">(optional — sent to the business)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={rejectNote[b.id] || ''}
                    onChange={(e) => setRejectNote((n) => ({ ...n, [b.id]: e.target.value }))}
                    className={INPUT_CLS}
                    placeholder="Optional reason…"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => reject(b.id)}
                      disabled={working === b.id}
                      className="text-sm font-medium px-4 py-2 rounded-lg bg-terracotta hover:bg-terracotta/90 text-white transition-colors disabled:opacity-50"
                    >
                      {working === b.id ? '…' : 'Confirm rejection'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
