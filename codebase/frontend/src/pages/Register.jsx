import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const PLANS = [
  {
    id: 'standard',
    name: 'Standard',
    price: '$49',
    features: ['Core booking features', 'Discount codes', 'Unlimited booking keys'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$89',
    features: ['Everything in Standard', 'Stripe Connect (Phase 3)', 'Invoices (Phase 3)'],
  },
]

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [plan, setPlan] = useState('standard')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const form = new FormData(e.target)
    const password = form.get('password')
    const confirm = form.get('confirm_password')

    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }

    setLoading(true)
    try {
      const me = await register(form.get('name'), form.get('email'), password, plan)
      navigate(me.status === 'pending_approval' ? '/subscription' : '/bookings')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Buhata Booking</h1>
        <p className="text-sm text-gray-500 mb-6">Create your business account</p>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        <p className="text-sm font-medium text-gray-700 mb-2">Choose your plan</p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {PLANS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlan(p.id)}
              className={`text-left rounded-lg border-2 p-4 transition-colors ${
                plan === p.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-baseline justify-between mb-2">
                <span className="font-semibold text-gray-900 text-sm">{p.name}</span>
                <span className="text-sm font-bold text-gray-900">
                  {p.price}<span className="text-xs font-normal text-gray-500">/mo</span>
                </span>
              </div>
              <ul className="space-y-1">
                {p.features.map((f) => (
                  <li key={f} className="text-xs text-gray-500 flex items-start gap-1">
                    <span className="text-blue-500 mt-0.5">✓</span>{f}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business name</label>
            <input name="name" type="text" required autoComplete="organization"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input name="email" type="email" required autoComplete="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input name="password" type="password" required autoComplete="new-password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
            <input name="confirm_password" type="password" required autoComplete="new-password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors">
            {loading ? 'Creating account…' : `Create ${PLANS.find(p => p.id === plan)?.name} account`}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
