import { Link } from 'react-router-dom'
import Badge from './Badge'
import Spinner from './Spinner'

function fmt(dt) {
  return new Date(dt).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

export default function BookingTable({
  bookings,
  loading = false,
  emptyMessage = 'No bookings found.',
  showEventType = true,
}) {
  if (loading) return <Spinner />
  if (bookings.length === 0) {
    return <p className="px-6 py-8 text-sm text-gray-400 text-center">{emptyMessage}</p>
  }
  return (
    <div className="divide-y divide-gray-100">
      {bookings.map(b => (
        <Link key={b.id} to={`/bookings/${b.id}`}
          className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
          <p className="text-xs text-gray-400 w-20 shrink-0 font-mono">#{b.booking_ref}</p>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{b.customer?.name ?? '—'}</p>
            <p className="text-xs text-gray-400 mt-0.5">{b.customer?.email}</p>
          </div>
          {showEventType && (
            <p className="text-sm text-gray-600 truncate max-w-[160px] shrink-0">{b.event_type_name}</p>
          )}
          <p className="text-xs text-gray-500 shrink-0">{b.party_size} {b.party_size === 1 ? 'guest' : 'guests'}</p>
          <p className="text-sm font-semibold text-gray-700 w-20 text-right shrink-0">${Number(b.total_price).toFixed(2)}</p>
          <Badge value={b.status} />
          <p className="text-xs text-gray-400 w-24 text-right shrink-0">{fmt(b.created_at)}</p>
        </Link>
      ))}
    </div>
  )
}
