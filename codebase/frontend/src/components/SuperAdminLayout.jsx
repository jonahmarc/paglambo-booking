import { NavLink, useNavigate } from 'react-router-dom'
import { useSuperAdminAuth } from '../context/SuperAdminAuthContext'

const NAV = [
  { to: '/superadmin/businesses', label: 'Businesses' },
]

export default function SuperAdminLayout({ children }) {
  const { superAdmin, logout } = useSuperAdminAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/superadmin/login')
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-200">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Buhata Booking</p>
          <p className="mt-1 text-xs font-medium text-indigo-600 uppercase tracking-wide">Platform Admin</p>
          <p className="mt-1 text-sm font-medium text-gray-900 truncate">{superAdmin?.email}</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
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
        <div className="max-w-5xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  )
}
