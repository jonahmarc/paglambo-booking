import { useEffect, useState } from 'react'
import { api } from '../api/client'

function fmtDate(dt) {
  return dt ? new Date(dt).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—'
}

function StatusBadge({ active }) {
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
      active ? 'bg-green-500/15 text-green-600 dark:text-green-400' : 'bg-navy/10 text-navy/50 dark:bg-cream/10 dark:text-cream/40'
    }`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

const INPUT_CLS = 'w-full border border-navy/20 dark:border-cream/20 bg-cream dark:bg-navy/50 text-navy dark:text-cream rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber placeholder:text-navy/30 dark:placeholder:text-cream/30'
const LABEL_CLS = 'block text-sm font-medium text-navy/80 dark:text-cream/80 mb-1'

function CreateModal({ onCreated, onClose }) {
  const [code, setCode] = useState('')
  const [type, setType] = useState('flat')
  const [value, setValue] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!code.trim() || !value) { setError('Code and value are required.'); return }
    setSubmitting(true); setError('')
    try {
      const created = await api.post('/api/discount-codes', {
        code: code.trim(),
        type,
        value: parseFloat(value),
        max_uses: maxUses ? parseInt(maxUses) : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      })
      onCreated(created)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-cream dark:bg-navy rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-5 border-b border-navy/10 dark:border-cream/10">
          <h2 className="text-lg font-semibold text-navy dark:text-cream">Create discount code</h2>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className={LABEL_CLS}>Code</label>
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. SUMMER20"
              className={`${INPUT_CLS} font-mono uppercase`}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS}>Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className={INPUT_CLS}
              >
                <option value="flat">Flat ($)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>
                {type === 'flat' ? 'Amount ($)' : 'Percentage (%)'}
              </label>
              <input
                value={value}
                onChange={e => setValue(e.target.value)}
                type="number"
                min="0.01"
                max={type === 'percentage' ? '100' : undefined}
                step="0.01"
                placeholder={type === 'flat' ? '10.00' : '20'}
                className={INPUT_CLS}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS}>
                Max uses <span className="text-navy/40 dark:text-cream/40 font-normal">(optional)</span>
              </label>
              <input
                value={maxUses}
                onChange={e => setMaxUses(e.target.value)}
                type="number"
                min="1"
                placeholder="Unlimited"
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>
                Expires <span className="text-navy/40 dark:text-cream/40 font-normal">(optional)</span>
              </label>
              <input
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
                type="date"
                className={INPUT_CLS}
              />
            </div>
          </div>
          {error && <p className="text-sm text-terracotta">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="bg-amber hover:bg-amber/90 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            >
              {submitting ? 'Creating…' : 'Create code'}
            </button>
            <button type="button" onClick={onClose} className="text-sm text-navy/50 dark:text-cream/50 hover:text-navy dark:hover:text-cream px-4 py-2">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function DiscountCodes() {
  const [codes, setCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    api.get('/api/discount-codes')
      .then(setCodes)
      .catch(() => setError('Failed to load discount codes'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function toggleActive(c) {
    try {
      const updated = await api.patch(`/api/discount-codes/${c.id}`, { is_active: !c.is_active })
      setCodes(prev => prev.map(x => x.id === updated.id ? updated : x))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-display text-navy dark:text-cream">Discount Codes</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-amber hover:bg-amber/90 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + New code
        </button>
      </div>

      {error && <p className="text-sm text-terracotta mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-navy/40 dark:text-cream/40">Loading…</p>
      ) : codes.length === 0 ? (
        <div className="bg-cream dark:bg-navy rounded-xl border border-navy/10 dark:border-cream/10 shadow-sm p-12 text-center">
          <p className="text-navy/40 dark:text-cream/40 text-sm mb-3">No discount codes yet.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="text-sm text-amber hover:text-amber/70 font-medium"
          >
            Create your first code
          </button>
        </div>
      ) : (
        <div className="bg-cream dark:bg-navy rounded-xl border border-navy/10 dark:border-cream/10 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy/10 dark:border-cream/10 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-navy/50 dark:text-cream/50 uppercase tracking-wide">Code</th>
                <th className="px-5 py-3 text-xs font-semibold text-navy/50 dark:text-cream/50 uppercase tracking-wide">Discount</th>
                <th className="px-5 py-3 text-xs font-semibold text-navy/50 dark:text-cream/50 uppercase tracking-wide">Uses</th>
                <th className="px-5 py-3 text-xs font-semibold text-navy/50 dark:text-cream/50 uppercase tracking-wide">Expires</th>
                <th className="px-5 py-3 text-xs font-semibold text-navy/50 dark:text-cream/50 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10 dark:divide-cream/10">
              {codes.map(c => (
                <tr key={c.id} className="hover:bg-navy/5 dark:hover:bg-cream/5 transition-colors">
                  <td className="px-5 py-3 font-mono font-semibold text-navy dark:text-cream">{c.code}</td>
                  <td className="px-5 py-3 text-navy/70 dark:text-cream/70">
                    {c.type === 'flat'
                      ? `$${Number(c.value).toFixed(2)} off`
                      : `${Number(c.value).toFixed(0)}% off`}
                  </td>
                  <td className="px-5 py-3 text-navy/50 dark:text-cream/50">
                    {c.use_count}{c.max_uses ? ` / ${c.max_uses}` : ''}
                  </td>
                  <td className="px-5 py-3 text-navy/50 dark:text-cream/50">{fmtDate(c.expires_at)}</td>
                  <td className="px-5 py-3"><StatusBadge active={c.is_active} /></td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => toggleActive(c)}
                      className="text-xs text-navy/40 dark:text-cream/40 hover:text-navy dark:hover:text-cream transition-colors"
                    >
                      {c.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateModal
          onCreated={code => { setCodes(prev => [code, ...prev]); setShowCreate(false) }}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}
