import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { SAMPLE_PROFILE, SAMPLE_USER_ID } from '../data/sampleHistory.ts'
import { getMe } from '../api/spotify.ts'
import type { SpotifyUser } from '../api/types.ts'
import {
  buildAuthorizeUrl,
  createPkcePair,
  exchangeCode,
  getClientId,
  getRedirectUri,
  refreshAccessToken,
} from './pkce.ts'
import {
  clearPkce,
  clearSession,
  isDemoMode,
  isExpired,
  readPkce,
  readSession,
  sessionFromToken,
  setDemoMode,
  writePkce,
  writeSession,
  type Session,
} from './session.ts'

type AuthStatus = 'loading' | 'anon' | 'authed' | 'demo'

type AuthContextValue = {
  status: AuthStatus
  profile: SpotifyUser | null
  error: string | null
  clientIdReady: boolean
  userId: string | null
  login: () => Promise<void>
  logout: () => void
  enterDemo: () => void
  completeLogin: (code: string, state: string) => Promise<void>
  getToken: () => Promise<string>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [profile, setProfile] = useState<SpotifyUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [error, setError] = useState<string | null>(null)

  const clientIdReady = getClientId().length > 0

  const applySession = useCallback(async (next: Session) => {
    writeSession(next)
    setSession(next)
    const me = await getMe(next.accessToken)
    setProfile(me)
    setDemoMode(false)
    setStatus('authed')
  }, [])

  useEffect(() => {
    let cancelled = false
    async function boot() {
      if (isDemoMode()) {
        setProfile(SAMPLE_PROFILE)
        setStatus('demo')
        return
      }
      const existing = readSession()
      if (!existing) {
        if (!cancelled) {
          setStatus((current) => (current === 'authed' ? current : 'anon'))
        }
        return
      }
      try {
        let current = existing
        if (isExpired(existing) && existing.refreshToken) {
          const token = await refreshAccessToken(existing.refreshToken)
          current = sessionFromToken(token, existing)
        } else if (isExpired(existing)) {
          clearSession()
          if (!cancelled) setStatus('anon')
          return
        }
        if (cancelled) return
        await applySession(current)
      } catch (err) {
        clearSession()
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Session expired')
          setStatus('anon')
        }
      }
    }
    void boot()
    return () => {
      cancelled = true
    }
  }, [applySession])

  const login = useCallback(async () => {
    setError(null)
    if (!clientIdReady) {
      setError('Add VITE_SPOTIFY_CLIENT_ID to .env.local — see the README.')
      return
    }
    const { verifier, challenge, state } = await createPkcePair()
    writePkce({ verifier, state })
    window.location.assign(buildAuthorizeUrl(getClientId(), getRedirectUri(), challenge, state))
  }, [clientIdReady])

  const completeLogin = useCallback(
    async (code: string, state: string) => {
      const pending = readPkce()
      clearPkce()
      if (!pending || pending.state !== state) {
        throw new Error('Login state did not match. Try connecting again.')
      }
      const token = await exchangeCode(code, pending.verifier)
      await applySession(sessionFromToken(token, null))
    },
    [applySession],
  )

  const logout = useCallback(() => {
    clearSession()
    setDemoMode(false)
    setSession(null)
    setProfile(null)
    setStatus('anon')
    setError(null)
  }, [])

  const enterDemo = useCallback(() => {
    clearSession()
    setDemoMode(true)
    setSession(null)
    setProfile(SAMPLE_PROFILE)
    setStatus('demo')
    setError(null)
  }, [])

  const getToken = useCallback(async () => {
    if (!session) throw new Error('Not signed in')
    if (!isExpired(session)) return session.accessToken
    if (!session.refreshToken) throw new Error('Session expired')
    const token = await refreshAccessToken(session.refreshToken)
    const next = sessionFromToken(token, session)
    writeSession(next)
    setSession(next)
    return next.accessToken
  }, [session])

  const userId = status === 'demo' ? SAMPLE_USER_ID : profile?.id ?? null

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      profile,
      error,
      clientIdReady,
      userId,
      login,
      logout,
      enterDemo,
      completeLogin,
      getToken,
    }),
    [status, profile, error, clientIdReady, userId, login, logout, enterDemo, completeLogin, getToken],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
