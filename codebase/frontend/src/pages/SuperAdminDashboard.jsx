import { useEffect, useState } from 'react'
import { saFetch } from '../context/SuperAdminAuthContext'

const STATUS_STYLE = {
  pending_approval: 'bg-amber-50 text-amber-700',
  trial:            'bg-blue-50 text-blue-700',
  active:           'bg-green-50 text-green-700',
  expired:          'bg-orange-50 text-orange-700',
  rejected:         'bg-red-50 text-red-700',
  suspended:        'bg-gray-100 text-gray-500',
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
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLE[status] || 'bg-gray-100 text-gray-500'}`}>
      {STATUS_LABEL[status] || status}
    </span>
  )
}

function PlanBadge({ plan }) {
  return plan === 'pro'
    ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">Pro</span>
    : <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">Standard</span>
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
        <h1 className="text-xl font-semibold text-gray-900">Businesses</h1>
        <p className="text-sm text-gray-500 mt-1">All registered business accounts. Use Approvals to review pending registrations.</p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : businesses.length === 0 ? (
        <p className="text-sm text-gray-500">No businesses registered yet.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Business</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Plan</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Trial ends</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {businesses.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{b.name}</td>
                  <td className="px-4 py-3 text-gray-600">{b.email}</td>
                  <td className="px-4 py-3"><PlanBadge plan={b.plan} /></td>
                  <td className="px-4 py-3">
                    <StatusBadge status={b.status} />
                    {!b.is_active && b.status !== 'suspended' && (
                      <span className="ml-1 text-xs text-gray-400">(disabled)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {b.trial_ends_at ? new Date(b.trial_ends_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(b.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggle(b)}
                      disabled={toggling === b.id}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                        b.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'
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
