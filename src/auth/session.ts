import type { TokenResponse } from './pkce.ts'

const SESSION_KEY = 'listen.session'
const PKCE_KEY = 'listen.pkce'

export type Session = {
  accessToken: string
  refreshToken: string | null
  expiresAt: number
}

export type PkcePending = {
  verifier: string
  state: string
}

export function readSession(): Session | null {
  const raw = sessionStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Session
    if (!parsed.accessToken || !parsed.expiresAt) return null
    return parsed
  } catch {
    return null
  }
}

export function writeSession(session: Session): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY)
}

export function sessionFromToken(token: TokenResponse, previous?: Session | null): Session {
  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token ?? previous?.refreshToken ?? null,
    expiresAt: Date.now() + token.expires_in * 1000,
  }
}

export function isExpired(session: Session, skewMs = 60_000): boolean {
  return Date.now() + skewMs >= session.expiresAt
}

export function writePkce(pending: PkcePending): void {
  sessionStorage.setItem(PKCE_KEY, JSON.stringify(pending))
}

export function readPkce(): PkcePending | null {
  const raw = sessionStorage.getItem(PKCE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as PkcePending
  } catch {
    return null
  }
}

export function clearPkce(): void {
  sessionStorage.removeItem(PKCE_KEY)
}

const DEMO_KEY = 'listen.demo'

export function setDemoMode(on: boolean): void {
  if (on) sessionStorage.setItem(DEMO_KEY, '1')
  else sessionStorage.removeItem(DEMO_KEY)
}

export function isDemoMode(): boolean {
  return sessionStorage.getItem(DEMO_KEY) === '1'
}
