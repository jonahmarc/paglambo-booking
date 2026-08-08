import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import Badge from '../components/Badge'

const STATUSES = ['all', 'pending', 'awaiting_payment', 'confirmed', 'rejected']

function fmt(dt) {
  return new Date(dt).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

export default function Bookings() {
  const [bookings, setBookings] = useState([])
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState('')

  useEffect(() => {
    const q = filter === 'all' ? '' : `?status=${filter}`
    api.get(`/api/bookings${q}`).then(setBookings).catch(() => setError('Failed to load bookings'))
  }, [filter])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Bookings</h1>

      <div className="flex gap-2 mb-4">
        {STATUSES.map(s => (
          <button key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === s
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        {bookings.length === 0 && (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">No bookings found.</p>
        )}
        {bookings.map(b => (
          <Link key={b.id} to={`/bookings/${b.id}`}
            className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{b.customer?.name ?? '—'}</p>
              <p className="text-xs text-gray-400 mt-0.5">{b.customer?.email}</p>
            </div>
            <p className="text-sm text-gray-600 truncate max-w-[180px]">Event #{b.event_type_id}</p>
            <p className="text-sm font-semibold text-gray-700 w-20 text-right">${Number(b.total_price).toFixed(2)}</p>
            <Badge value={b.status} />
            <p className="text-xs text-gray-400 w-24 text-right">{fmt(b.created_at)}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
