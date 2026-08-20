import { useEffect, useState } from 'react'
import { api } from '../api/client'
import BookingTable from '../components/BookingTable'
import Spinner from '../components/Spinner'

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
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grouped')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              viewMode === 'grouped' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            By event type
          </button>
          <button
            onClick={() => setViewMode('flat')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              viewMode === 'flat' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All bookings
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {STATUSES.map(s => (
          <button key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === s
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {viewMode === 'flat' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <BookingTable bookings={bookings} loading={loading} showEventType />
        </div>
      )}

      {viewMode === 'grouped' && loading && <Spinner />}

      {viewMode === 'grouped' && !loading && (
        Object.keys(grouped).length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <p className="px-6 py-8 text-sm text-gray-400 text-center">No bookings found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([eventTypeName, items]) => (
              <div key={eventTypeName} className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">{eventTypeName}</p>
                  <p className="text-xs text-gray-400">{items.length} booking{items.length !== 1 ? 's' : ''}</p>
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
