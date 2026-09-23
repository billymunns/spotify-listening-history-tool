import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.tsx'
import { useLibrary } from '../library/LibraryContext.tsx'

const LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/wrapped', label: 'Wrapped' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/taste', label: 'Taste' },
  { to: '/compare', label: 'Compare' },
  { to: '/import', label: 'Import' },
]

export function Layout() {
  const { profile, status, logout } = useAuth()
  const { hasExport } = useLibrary()

  return (
    <div className="min-h-svh bg-bg text-ink">
      <div className="mx-auto flex min-h-svh max-w-6xl flex-col lg:flex-row">
        <aside className="border-b border-line lg:w-64 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between px-5 py-4 lg:block lg:px-6 lg:py-8">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-accent">Listen</p>
              <p className="font-display text-2xl">Your story</p>
            </div>
            <div className="hidden text-xs text-muted lg:mt-6 lg:block">
              <p className="truncate text-ink">{profile?.display_name ?? 'Listener'}</p>
              <p>{status === 'demo' ? 'Sample data mode' : hasExport ? 'History imported' : 'Live Spotify only'}</p>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-4">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-full px-3 py-2 text-sm ${
                    isActive ? 'bg-accent text-black' : 'text-muted hover:bg-panel hover:text-ink'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={logout}
              className="whitespace-nowrap rounded-full px-3 py-2 text-left text-sm text-muted hover:bg-panel hover:text-ink"
            >
              Sign out
            </button>
          </nav>
        </aside>
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
