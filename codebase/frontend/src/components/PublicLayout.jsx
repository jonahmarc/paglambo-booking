import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

export default function PublicLayout({ children, altTo, altLabel }) {
  const { theme, toggle } = useTheme()

  return (
    <div className="min-h-screen bg-cream dark:bg-dark-base flex flex-col text-navy dark:text-cream">

      {/* Navbar */}
      <header className="border-b border-navy/10 dark:border-cream/10 sticky top-0 bg-cream/95 dark:bg-dark-base/95 backdrop-blur-sm z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold font-display text-navy dark:text-cream hover:opacity-80 transition-opacity">
            Buhata Booking
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="text-navy/40 dark:text-cream/40 hover:text-navy dark:hover:text-cream transition-colors text-base leading-none"
            >
              {theme === 'dark' ? '☀' : '☽'}
            </button>
            {altTo && (
              <Link
                to={altTo}
                className="bg-amber hover:bg-amber/90 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {altLabel}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main — orb background + centered content */}
      <main className="relative overflow-hidden flex-1 flex items-center justify-center p-4 py-16">
        {/* Orb A — terracotta, top-left */}
        <div
          className="pointer-events-none absolute -top-20 -left-20 w-96 h-96 rounded-full bg-terracotta blur-[120px]"
          style={{ animation: 'float-b 10s ease-in-out infinite' }}
        />
        {/* Orb B — amber, bottom-right */}
        <div
          className="pointer-events-none absolute -bottom-24 -right-16 w-80 h-80 rounded-full bg-amber blur-[110px]"
          style={{ animation: 'float-a 8s ease-in-out infinite 2s' }}
        />

        <div className="relative z-10 w-full">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-navy/10 dark:border-cream/10">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link to="/" className="font-display font-semibold text-navy dark:text-cream hover:opacity-80 transition-opacity text-sm">
            Buhata Booking
          </Link>
          <p className="text-xs text-navy/35 dark:text-cream/35">
            &copy; {new Date().getFullYear()} Buhata Booking. All rights reserved.
          </p>
          <Link
            to="/"
            className="text-xs text-navy/50 dark:text-cream/50 hover:text-navy dark:hover:text-cream transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </footer>
    </div>
  )
}
