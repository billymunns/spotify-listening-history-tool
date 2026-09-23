import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.tsx'
import { ErrorState } from '../components/Status.tsx'

export function Landing() {
  const { status, login, enterDemo, error, clientIdReady } = useAuth()

  if (status === 'authed' || status === 'demo') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-svh bg-bg text-ink">
      <div className="mx-auto flex min-h-svh max-w-5xl flex-col justify-center px-6 py-16">
        <p className="text-xs uppercase tracking-[0.25em] text-accent">Personal listening atlas</p>
        <h1 className="mt-4 max-w-3xl font-display text-5xl leading-[1.05] sm:text-7xl">
          Your own Wrapped, any day of the year.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-muted sm:text-lg">
          Connect Spotify for live tops and recently played. Optionally drop your official data
          export for minutes, streaks, a calendar, taste patterns, and year-vs-year comparisons.
          Files never leave this browser.
        </p>

        <ul className="mt-8 grid gap-3 text-sm text-muted sm:grid-cols-2">
          <li className="rounded-2xl border border-line bg-panel px-4 py-3">1. Connect Spotify</li>
          <li className="rounded-2xl border border-line bg-panel px-4 py-3">2. See live stats immediately</li>
          <li className="rounded-2xl border border-line bg-panel px-4 py-3">3. Import history when the zip arrives</li>
          <li className="rounded-2xl border border-line bg-panel px-4 py-3">4. Play your Wrapped story</li>
        </ul>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => void login()}
            disabled={status === 'loading'}
            className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-black disabled:opacity-60"
          >
            Connect Spotify
          </button>
          <button
            type="button"
            onClick={enterDemo}
            className="rounded-full border border-line px-6 py-3 text-sm font-medium text-ink hover:bg-panel"
          >
            Explore with sample data
          </button>
        </div>

        {!clientIdReady ? (
          <p className="mt-4 max-w-xl text-sm text-amber-200">
            Spotify login needs a Client ID in <code>.env.local</code>. Sample data still works —
            see the README to create a Developer app.
          </p>
        ) : null}

        {error ? (
          <div className="mt-6 max-w-xl">
            <ErrorState message={error} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
