const SCOPES = ['user-top-read', 'user-read-recently-played', 'user-read-email', 'user-read-private']

export const SPOTIFY_AUTHORIZE_URL = 'https://accounts.spotify.com/authorize'
export const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'

export function getClientId(): string {
  return import.meta.env.VITE_SPOTIFY_CLIENT_ID?.trim() ?? ''
}

export function getRedirectUri(): string {
  const fromEnv = import.meta.env.VITE_REDIRECT_URI?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  return `${window.location.origin}/callback`
}

function randomString(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (byte) => ('0' + (byte % 36).toString(36)).slice(-1)).join('')
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(plain))
}

export async function createPkcePair(): Promise<{ verifier: string; challenge: string; state: string }> {
  const verifier = randomString(64)
  const challenge = base64UrlEncode(await sha256(verifier))
  return { verifier, challenge, state: randomString(24) }
}

export function buildAuthorizeUrl(clientId: string, redirectUri: string, challenge: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: SCOPES.join(' '),
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state,
  })
  return `${SPOTIFY_AUTHORIZE_URL}?${params.toString()}`
}

export async function exchangeCode(code: string, verifier: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: getRedirectUri(),
    client_id: getClientId(),
    code_verifier: verifier,
  })
  return postToken(body)
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: getClientId(),
  })
  return postToken(body)
}

export type TokenResponse = {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  scope?: string
}

async function postToken(body: URLSearchParams): Promise<TokenResponse> {
  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Spotify token exchange failed (${response.status}): ${text}`)
  }
  return (await response.json()) as TokenResponse
}
