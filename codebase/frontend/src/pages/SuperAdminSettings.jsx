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

  if (loading) return <p className="text-sm text-navy/50 dark:text-cream/50">Loading…</p>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold font-display text-navy dark:text-cream">Platform Settings</h1>
        <p className="text-sm text-navy/50 dark:text-cream/50 mt-1">Control how new businesses are onboarded.</p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-terracotta/10 border border-terracotta/30 text-sm text-terracotta">{error}</div>
      )}
      {success && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/30 text-sm text-green-600 dark:text-green-400">Settings saved.</div>
      )}

      <form onSubmit={handleSave} className="bg-cream dark:bg-navy rounded-xl border border-navy/10 dark:border-cream/10 shadow-sm divide-y divide-navy/10 dark:divide-cream/10">
        {/* Require approval toggle */}
        <div className="px-6 py-5 flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-navy dark:text-cream">Require approval for new registrations</p>
            <p className="text-sm text-navy/50 dark:text-cream/50 mt-0.5">
              When on, new businesses must be approved before their trial starts.
              Turn off to auto-approve and start the trial immediately.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, require_approval: !f.require_approval }))}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
              form.require_approval ? 'bg-amber' : 'bg-navy/20 dark:bg-cream/20'
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
            <p className="text-sm font-medium text-navy dark:text-cream">Trial duration (days)</p>
            <p className="text-sm text-navy/50 dark:text-cream/50 mt-0.5">
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
            className="w-24 border border-navy/20 dark:border-cream/20 bg-cream dark:bg-navy/50 text-navy dark:text-cream rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-amber"
          />
        </div>

        <div className="px-6 py-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-amber hover:bg-amber/90 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
