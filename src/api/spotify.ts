import type { SpotifyArtist, SpotifyPlayHistory, SpotifyTimeRange, SpotifyTrack, SpotifyUser } from './types.ts'

const API = 'https://api.spotify.com/v1'

export class SpotifyApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(token: string, path: string): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const text = await response.text()
    throw new SpotifyApiError(response.status, text || response.statusText)
  }
  return (await response.json()) as T
}

export function getMe(token: string): Promise<SpotifyUser> {
  return request<SpotifyUser>(token, '/me')
}

export function getTopTracks(token: string, timeRange: SpotifyTimeRange, limit = 20): Promise<SpotifyTrack[]> {
  return request<{ items: SpotifyTrack[] }>(
    token,
    `/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
  ).then((data) => data.items)
}

export function getTopArtists(token: string, timeRange: SpotifyTimeRange, limit = 20): Promise<SpotifyArtist[]> {
  return request<{ items: SpotifyArtist[] }>(
    token,
    `/me/top/artists?time_range=${timeRange}&limit=${limit}`,
  ).then((data) => data.items)
}

export function getRecentlyPlayed(token: string, limit = 50): Promise<SpotifyPlayHistory[]> {
  return request<{ items: SpotifyPlayHistory[] }>(token, `/me/player/recently-played?limit=${limit}`).then(
    (data) => data.items,
  )
}

export async function getTracksByIds(token: string, ids: string[]): Promise<SpotifyTrack[]> {
  const unique = [...new Set(ids.filter(Boolean))].slice(0, 50)
  if (unique.length === 0) return []
  const data = await request<{ tracks: (SpotifyTrack | null)[] }>(token, `/tracks?ids=${unique.join(',')}`)
  return data.tracks.filter((track): track is SpotifyTrack => track !== null)
}

export function uriToId(uri: string | null): string | null {
  if (!uri) return null
  const parts = uri.split(':')
  return parts[2] ?? null
}

export function imageUrl(images: { url: string }[] | undefined): string | null {
  return images?.[0]?.url ?? images?.[images.length - 1]?.url ?? null
}
