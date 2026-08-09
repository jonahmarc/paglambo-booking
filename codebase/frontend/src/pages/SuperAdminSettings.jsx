import { useEffect, useState } from 'react'
import { saFetch } from '../context/SuperAdminAuthContext'

export default function SuperAdminSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({ require_approval: true, trial_duration_days: 60 })

  useEffect(() => {
    saFetch('/api/superadmin/settings', { method: 'GET' })
      .then((s) => {
        setSettings(s)
        setForm({ require_approval: s.require_approval, trial_duration_days: s.trial_duration_days })
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const updated = await saFetch('/api/superadmin/settings', {
        method: 'PATCH',
        body: JSON.stringify(form),
      })
      setSettings(updated)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Platform Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Control how new businesses are onboarded.</p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">Settings saved.</div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {/* Require approval toggle */}
        <div className="px-6 py-5 flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-gray-900">Require approval for new registrations</p>
            <p className="text-sm text-gray-500 mt-0.5">
              When on, new businesses must be approved before their trial starts.
              Turn off to auto-approve and start the trial immediately.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, require_approval: !f.require_approval }))}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
              form.require_approval ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
                form.require_approval ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Trial duration */}
        <div className="px-6 py-5 flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-gray-900">Trial duration (days)</p>
            <p className="text-sm text-gray-500 mt-0.5">
              How many days a new business gets free access after approval.
              Currently set to <strong>{settings?.trial_duration_days} days</strong>.
            </p>
          </div>
          <input
            type="number"
            min={1}
            max={365}
            value={form.trial_duration_days}
            onChange={(e) => setForm((f) => ({ ...f, trial_duration_days: parseInt(e.target.value) || 1 }))}
            className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="px-6 py-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
