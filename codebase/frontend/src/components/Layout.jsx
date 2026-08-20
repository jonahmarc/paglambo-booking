import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/bookings',        label: 'Bookings' },
  { to: '/event-types',     label: 'Event Types' },
  { to: '/discount-codes',  label: 'Discount Codes' },
  { to: '/subscription',    label: 'Subscription' },
  { to: '/settings',        label: 'Settings' },
]

const STATUS_BANNERS = {
  pending_approval: {
    cls: 'bg-amber-50 border-amber-200 text-amber-800',
    msg: 'Your account is pending approval. You\'ll receive an email once approved.',
  },
  expired: {
    cls: 'bg-red-50 border-red-200 text-red-800',
    msg: 'Your subscription has expired. Your booking page is currently offline.',
    link: { to: '/subscription', label: 'Reactivate' },
  },
  rejected: {
    cls: 'bg-red-50 border-red-200 text-red-800',
    msg: 'Your registration was not approved. Please contact support.',
  },
}

export default function Layout({ children }) {
  const { business, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const banner = business ? STATUS_BANNERS[business.status] : null

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-200">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Buhata Booking</p>
          <p className="mt-1 text-sm font-medium text-gray-900 truncate">{business?.name}</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        {banner && (
          <div className={`border-b px-6 py-3 text-sm flex items-center gap-3 ${banner.cls}`}>
            <span>{banner.msg}</span>
            {banner.link && (
              <Link to={banner.link.to} className="font-semibold underline underline-offset-2">
                {banner.link.label}
              </Link>
            )}
          </div>
        )}
        <div className="max-w-5xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  )
}
