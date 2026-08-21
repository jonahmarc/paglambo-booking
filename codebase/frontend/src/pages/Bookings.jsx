import { useEffect, useState } from 'react'
import { api } from '../api/client'
import BookingTable from '../components/BookingTable'
import Spinner from '../components/Spinner'

function LockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 shrink-0 text-navy/40 dark:text-cream/40">
      <path fillRule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v4A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5v-4A1.5 1.5 0 0 0 11 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z" clipRule="evenodd" />
    </svg>
  )
}

const STATUSES = ['all', 'pending', 'awaiting_payment', 'confirmed', 'rejected']

export default function Bookings() {
  const [bookings, setBookings] = useState([])
  const [filter, setFilter] = useState('all')
  const [viewMode, setViewMode] = useState('grouped')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    const q = filter === 'all' ? '' : `?status=${filter}`
    api.get(`/api/bookings${q}`)
      .then(setBookings)
      .catch(() => setError('Failed to load bookings'))
      .finally(() => setLoading(false))
  }, [filter])

  const grouped = bookings.reduce((acc, b) => {
    const key = b.event_type_name ?? 'Unknown'
    if (!acc[key]) acc[key] = []
    acc[key].push(b)
    return acc
  }, {})

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-display text-navy dark:text-cream">Bookings</h1>
        <div className="flex items-center gap-1 bg-navy/10 dark:bg-cream/10 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grouped')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              viewMode === 'grouped'
                ? 'bg-cream dark:bg-navy text-navy dark:text-cream shadow-sm'
                : 'text-navy/50 dark:text-cream/50 hover:text-navy dark:hover:text-cream'
            }`}
          >
            By event type
          </button>
          <button
            onClick={() => setViewMode('flat')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              viewMode === 'flat'
                ? 'bg-cream dark:bg-navy text-navy dark:text-cream shadow-sm'
                : 'text-navy/50 dark:text-cream/50 hover:text-navy dark:hover:text-cream'
            }`}
          >
            All bookings
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUSES.map(s => (
          <button key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === s
                ? 'bg-amber text-white'
                : 'bg-cream border border-navy/20 text-navy/60 hover:bg-navy/5 dark:bg-navy dark:border-cream/20 dark:text-cream/60 dark:hover:bg-cream/5'
            }`}>
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-terracotta mb-4">{error}</p>}

      {viewMode === 'flat' && (
        <div className="bg-cream dark:bg-navy rounded-xl border border-navy/10 dark:border-cream/10 shadow-sm">
          <BookingTable bookings={bookings} loading={loading} showEventType />
        </div>
      )}

      {viewMode === 'grouped' && loading && <Spinner />}

      {viewMode === 'grouped' && !loading && (
        Object.keys(grouped).length === 0 ? (
          <div className="bg-cream dark:bg-navy rounded-xl border border-navy/10 dark:border-cream/10 shadow-sm">
            <p className="px-6 py-8 text-sm text-navy/40 dark:text-cream/40 text-center">No bookings found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([eventTypeName, items]) => (
              <div key={eventTypeName} className="bg-cream dark:bg-navy rounded-xl border border-navy/10 dark:border-cream/10 shadow-sm">
                <div className="px-6 py-3 border-b border-navy/10 dark:border-cream/10 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    {items[0]?.event_type_visibility === 'private' && <LockIcon />}
                    <p className="text-sm font-semibold text-navy dark:text-cream">{eventTypeName}</p>
                  </span>
                  <p className="text-xs text-navy/40 dark:text-cream/40">{items.length} booking{items.length !== 1 ? 's' : ''}</p>
                </div>
                <BookingTable bookings={items} loading={false} showEventType={false} />
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
