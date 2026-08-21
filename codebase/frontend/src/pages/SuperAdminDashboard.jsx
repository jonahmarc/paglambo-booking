import { useEffect, useState } from 'react'
import { saFetch } from '../context/SuperAdminAuthContext'

const STATUS_STYLE = {
  pending_approval: 'bg-amber/15 text-amber',
  trial:            'bg-navy/10 text-navy dark:bg-cream/10 dark:text-cream/80',
  active:           'bg-green-500/15 text-green-600 dark:text-green-400',
  expired:          'bg-terracotta/15 text-terracotta',
  rejected:         'bg-terracotta/15 text-terracotta',
  suspended:        'bg-navy/10 text-navy/50 dark:bg-cream/10 dark:text-cream/40',
}
const STATUS_LABEL = {
  pending_approval: 'Pending',
  trial:            'Trial',
  active:           'Active',
  expired:          'Expired',
  rejected:         'Rejected',
  suspended:        'Suspended',
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLE[status] || 'bg-navy/10 text-navy/50 dark:bg-cream/10 dark:text-cream/40'}`}>
      {STATUS_LABEL[status] || status}
    </span>
  )
}

function PlanBadge({ plan }) {
  return plan === 'pro'
    ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-terracotta/10 text-terracotta">Pro</span>
    : <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-navy/10 text-navy dark:bg-cream/10 dark:text-cream/80">Standard</span>
}

export default function SuperAdminDashboard() {
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toggling, setToggling] = useState(null)

  useEffect(() => {
    saFetch('/api/superadmin/businesses', { method: 'GET' })
      .then(setBusinesses)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function toggle(business) {
    setToggling(business.id)
    const action = business.is_active ? 'deactivate' : 'activate'
    try {
      const updated = await saFetch(`/api/superadmin/businesses/${business.id}/${action}`, { method: 'PATCH' })
      setBusinesses((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
    } catch (err) {
      setError(err.message)
    } finally {
      setToggling(null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold font-display text-navy dark:text-cream">Businesses</h1>
        <p className="text-sm text-navy/50 dark:text-cream/50 mt-1">All registered business accounts. Use Approvals to review pending registrations.</p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-terracotta/10 border border-terracotta/30 text-sm text-terracotta">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-navy/50 dark:text-cream/50">Loading…</p>
      ) : businesses.length === 0 ? (
        <p className="text-sm text-navy/50 dark:text-cream/50">No businesses registered yet.</p>
      ) : (
        <div className="bg-cream dark:bg-navy rounded-xl border border-navy/10 dark:border-cream/10 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-navy/5 dark:bg-cream/5 border-b border-navy/10 dark:border-cream/10">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-navy/60 dark:text-cream/60">Business</th>
                <th className="text-left px-4 py-3 font-medium text-navy/60 dark:text-cream/60">Email</th>
                <th className="text-left px-4 py-3 font-medium text-navy/60 dark:text-cream/60">Plan</th>
                <th className="text-left px-4 py-3 font-medium text-navy/60 dark:text-cream/60">Status</th>
                <th className="text-left px-4 py-3 font-medium text-navy/60 dark:text-cream/60">Trial ends</th>
                <th className="text-left px-4 py-3 font-medium text-navy/60 dark:text-cream/60">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10 dark:divide-cream/10">
              {businesses.map((b) => (
                <tr key={b.id} className="hover:bg-navy/5 dark:hover:bg-cream/5 transition-colors">
                  <td className="px-4 py-3 font-medium text-navy dark:text-cream">{b.name}</td>
                  <td className="px-4 py-3 text-navy/60 dark:text-cream/60">{b.email}</td>
                  <td className="px-4 py-3"><PlanBadge plan={b.plan} /></td>
                  <td className="px-4 py-3">
                    <StatusBadge status={b.status} />
                    {!b.is_active && b.status !== 'suspended' && (
                      <span className="ml-1 text-xs text-navy/40 dark:text-cream/40">(disabled)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-navy/50 dark:text-cream/50 text-xs">
                    {b.trial_ends_at ? new Date(b.trial_ends_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-navy/50 dark:text-cream/50">{new Date(b.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggle(b)}
                      disabled={toggling === b.id}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                        b.is_active
                          ? 'text-terracotta hover:bg-terracotta/10'
                          : 'text-green-600 dark:text-green-400 hover:bg-green-500/10'
                      }`}
                    >
                      {toggling === b.id ? '…' : b.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
