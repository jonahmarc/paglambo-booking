import { Link } from 'react-router-dom'
import Badge from './Badge'
import Spinner from './Spinner'

function fmt(dt) {
  return new Date(dt).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

function LockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 inline-block shrink-0 text-navy/40 dark:text-cream/40">
      <path fillRule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v4A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5v-4A1.5 1.5 0 0 0 11 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z" clipRule="evenodd" />
    </svg>
  )
}

export default function BookingTable({
  bookings,
  loading = false,
  emptyMessage = 'No bookings found.',
  showEventType = true,
}) {
  if (loading) return <Spinner />
  if (bookings.length === 0) {
    return <p className="px-6 py-8 text-sm text-navy/40 dark:text-cream/40 text-center">{emptyMessage}</p>
  }
  return (
    <div className="divide-y divide-navy/10 dark:divide-cream/10">
      {bookings.map(b => (
        <Link key={b.id} to={`/bookings/${b.id}`}
          className="flex items-center gap-4 px-6 py-4 hover:bg-navy/5 dark:hover:bg-cream/5 transition-colors">
          <p className="text-xs text-navy/40 dark:text-cream/40 w-20 shrink-0 font-mono">#{b.booking_ref}</p>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-navy dark:text-cream">{b.customer?.name ?? '—'}</p>
            <p className="text-xs text-navy/50 dark:text-cream/50 mt-0.5">{b.customer?.email}</p>
          </div>
          {showEventType && (
            <span className="flex items-center gap-1 text-sm text-navy/70 dark:text-cream/70 truncate max-w-40 shrink-0">
              {b.event_type_visibility === 'private' && <LockIcon />}
              {b.event_type_name}
            </span>
          )}
          <p className="text-xs text-navy/50 dark:text-cream/50 shrink-0">{b.party_size} {b.party_size === 1 ? 'guest' : 'guests'}</p>
          <p className="text-sm font-semibold text-navy dark:text-cream w-20 text-right shrink-0">${Number(b.total_price).toFixed(2)}</p>
          <Badge value={b.status} />
          <p className="text-xs text-navy/40 dark:text-cream/40 w-24 text-right shrink-0">{fmt(b.created_at)}</p>
        </Link>
      ))}
    </div>
  )
}
