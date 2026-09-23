export type SpotifyUser = {
  id: string
  display_name: string | null
  email?: string
  images: { url: string }[]
}

export type SpotifyTimeRange = 'short_term' | 'medium_term' | 'long_term'

export type SpotifyArtist = {
  id: string
  name: string
  genres?: string[]
  images?: { url: string }[]
  popularity?: number
}

export type SpotifyTrack = {
  id: string
  name: string
  uri: string
  duration_ms?: number
  album?: {
    name: string
    release_date?: string
    images?: { url: string }[]
  }
  artists?: { id: string; name: string }[]
}

export type SpotifyPlayHistory = {
  played_at: string
  track: SpotifyTrack | null
}

export const TIME_RANGE_LABELS: Record<SpotifyTimeRange, string> = {
  short_term: 'Last 4 weeks',
  medium_term: 'Last 6 months',
  long_term: 'All time (approx.)',
}
