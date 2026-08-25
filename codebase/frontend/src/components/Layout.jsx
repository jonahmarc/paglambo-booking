import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const NAV = [
  { to: '/bookings',        label: 'Bookings' },
  { to: '/event-types',     label: 'Event Types' },
  { to: '/discount-codes',  label: 'Discount Codes' },
  { to: '/subscription',    label: 'Subscription' },
  { to: '/settings',        label: 'Settings' },
]

const STATUS_BANNERS = {
  pending_approval: {
    cls: 'bg-amber/10 border-amber/30 text-amber',
    msg: 'Your account is pending approval. You\'ll receive an email once approved.',
  },
  expired: {
    cls: 'bg-terracotta/10 border-terracotta/30 text-terracotta',
    msg: 'Your subscription has expired. Your booking page is currently offline.',
    link: { to: '/subscription', label: 'Reactivate' },
  },
  rejected: {
    cls: 'bg-terracotta/10 border-terracotta/30 text-terracotta',
    msg: 'Your registration was not approved. Please contact support.',
  },
}

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

export default function Layout({ children }) {
  const { business, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const banner = business ? STATUS_BANNERS[business.status] : null

  return (
    <div className="h-screen flex bg-cream dark:bg-dark-base">
      <aside className="w-56 bg-navy dark:bg-dark-deep flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-cream/10">
          <p className="text-xs font-semibold text-amber uppercase tracking-widest">Paglambo Booking</p>
          <p className="mt-1 text-sm font-medium text-cream/60 truncate">{business?.name}</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-amber/15 text-amber'
                    : 'text-cream/55 hover:bg-cream/10 hover:text-cream'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-cream/10 space-y-1">
          <button
            onClick={toggle}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-cream/50 hover:bg-cream/10 hover:text-cream transition-colors"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-cream/50 hover:bg-cream/10 hover:text-cream transition-colors"
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
