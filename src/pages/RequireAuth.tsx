import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.tsx'
import { LoadingState } from '../components/Status.tsx'

export function RequireAuth() {
  const { status } = useAuth()
  if (status === 'loading') {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <LoadingState label="Restoring your session…" />
      </div>
    )
  }
  if (status === 'anon') return <Navigate to="/" replace />
  return <Outlet />
}
