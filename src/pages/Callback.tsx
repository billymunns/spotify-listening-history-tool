import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.tsx'
import { ErrorState, LoadingState } from '../components/Status.tsx'

export function Callback() {
  const [params] = useSearchParams()
  const { completeLogin } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const err = params.get('error')
    const code = params.get('code')
    const state = params.get('state')
    if (err) {
      setError(`Spotify returned: ${err}`)
      return
    }
    if (!code || !state) {
      setError('Missing login code. Return home and try again.')
      return
    }
    void completeLogin(code, state)
      .then(() => navigate('/dashboard', { replace: true }))
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : 'Login failed')
      })
  }, [params, completeLogin, navigate])

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col justify-center px-6">
      {error ? <ErrorState message={error} /> : <LoadingState label="Finishing Spotify login…" />}
    </div>
  )
}
