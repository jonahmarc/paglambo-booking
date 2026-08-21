import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PublicLayout from '../components/PublicLayout'

const INPUT_CLS = 'w-full border border-navy/20 dark:border-cream/20 bg-cream dark:bg-navy/50 text-navy dark:text-cream rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber placeholder:text-navy/30 dark:placeholder:text-cream/30'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const form = new FormData(e.target)
    try {
      await login(form.get('email'), form.get('password'))
      navigate('/bookings')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PublicLayout altTo="/register" altLabel="Get started">
      <div className="bg-cream dark:bg-navy rounded-xl shadow-sm border border-navy/10 dark:border-cream/10 w-full max-w-sm mx-auto p-8">
        <h1 className="text-2xl font-bold font-display text-navy dark:text-cream mb-1">Sign in</h1>
        <p className="text-sm text-navy/50 dark:text-cream/50 mb-6">Welcome back to Buhata Booking</p>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-terracotta/10 border border-terracotta/30 text-sm text-terracotta">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy/80 dark:text-cream/80 mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy/80 dark:text-cream/80 mb-1">Password</label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={INPUT_CLS}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber hover:bg-amber/90 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-navy/50 dark:text-cream/50">
          Don't have an account?{' '}
          <Link to="/register" className="text-amber hover:text-amber/80 font-medium">
            Register
          </Link>
        </p>
      </div>
    </PublicLayout>
  )
}
