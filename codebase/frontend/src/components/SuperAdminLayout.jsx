import { NavLink, useNavigate } from 'react-router-dom'
import { useSuperAdminAuth } from '../context/SuperAdminAuthContext'

const NAV = [
  { to: '/superadmin/businesses',    label: 'Businesses' },
  { to: '/superadmin/approvals',     label: 'Approvals' },
  { to: '/superadmin/subscriptions', label: 'Subscriptions' },
  { to: '/superadmin/settings',      label: 'Settings' },
]

export default function SuperAdminLayout({ children }) {
  const { superAdmin, logout } = useSuperAdminAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/superadmin/login')
  }

  return (
    <div className="min-h-screen flex bg-cream dark:bg-dark-base">
      <aside className="w-56 bg-navy dark:bg-dark-deep flex flex-col">
        <div className="px-5 py-5 border-b border-cream/10">
          <p className="text-xs font-semibold text-amber uppercase tracking-widest">Paglambo Booking</p>
          <p className="mt-1 text-xs font-medium text-amber/70 uppercase tracking-wide">Platform Admin</p>
          <p className="mt-1 text-sm font-medium text-cream/60 truncate">{superAdmin?.email}</p>
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
        <div className="px-3 py-4 border-t border-cream/10">
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-cream/50 hover:bg-cream/10 hover:text-cream transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  )
}
