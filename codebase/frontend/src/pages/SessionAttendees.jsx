import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import BookingTable from '../components/BookingTable'

function fmt(dt) {
  return new Date(dt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export default function SessionAttendees() {
  const { id, sessionId } = useParams()
  const [session, setSession] = useState(null)
  const [eventType, setEventType] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get(`/api/event-types/${id}`),
      api.get(`/api/event-types/${id}/sessions/${sessionId}`),
      api.get(`/api/event-types/${id}/sessions/${sessionId}/bookings`),
    ])
      .then(([et, sess, bkgs]) => {
        setEventType(et)
        setSession(sess)
        setBookings(bkgs)
      })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false))
  }, [id, sessionId])

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <Link to={`/event-types/${id}/sessions`} className="text-sm text-blue-600 hover:text-blue-800">
          ← Sessions{eventType ? ` — ${eventType.name}` : ''}
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Session Attendees</h1>
          {session && (
            <p className="text-sm text-gray-500 mt-1">
              {fmt(session.start_time)}
              {session.end_time ? ` – ${fmt(session.end_time)}` : ''}
              {' · '}{session.booked_count ?? 0}/{session.capacity} booked
            </p>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <BookingTable
          bookings={bookings}
          loading={loading}
          emptyMessage="No bookings for this session."
          showEventType={false}
        />
      </div>
    </div>
  )
}
