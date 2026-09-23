import type { PlayEvent } from '../import/types.ts'
import { qualifyingListens } from '../import/parsers.ts'
import { topAlbums, topArtists, uniqueTracks } from './tops.ts'

export type HourPoint = { hour: number; plays: number; msPlayed: number }
export type DowPoint = { dow: number; label: string; plays: number; msPlayed: number }
export type PlatformPoint = { name: string; plays: number; msPlayed: number }
export type GenrePoint = { name: string; weight: number }

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function hourHistogram(plays: PlayEvent[]): HourPoint[] {
  const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, plays: 0, msPlayed: 0 }))
  for (const play of qualifyingListens(plays)) {
    const hour = new Date(play.timestamp).getUTCHours()
    const bucket = hours[hour]
    if (!bucket) continue
    bucket.plays += 1
    bucket.msPlayed += play.msPlayed
  }
  return hours
}

export function dowHistogram(plays: PlayEvent[]): DowPoint[] {
  const days = DOW_LABELS.map((label, dow) => ({ dow, label, plays: 0, msPlayed: 0 }))
  for (const play of qualifyingListens(plays)) {
    const dow = new Date(play.timestamp).getUTCDay()
    const bucket = days[dow]
    if (!bucket) continue
    bucket.plays += 1
    bucket.msPlayed += play.msPlayed
  }
  return days
}

export function platformMix(plays: PlayEvent[]): PlatformPoint[] {
  const map = new Map<string, PlatformPoint>()
  for (const play of qualifyingListens(plays)) {
    const name = normalizePlatform(play.platform)
    const existing = map.get(name)
    if (existing) {
      existing.plays += 1
      existing.msPlayed += play.msPlayed
    } else {
      map.set(name, { name, plays: 1, msPlayed: play.msPlayed })
    }
  }
  return [...map.values()].sort((a, b) => b.msPlayed - a.msPlayed)
}

export function normalizePlatform(platform: string | null): string {
  if (!platform) return 'Unknown'
  const p = platform.toLowerCase()
  if (p.includes('android') || p.includes('ios') || p.includes('iphone')) return 'Phone'
  if (p.includes('osx') || p.includes('win') || p.includes('linux') || p.includes('desktop')) return 'Computer'
  if (p.includes('web')) return 'Web player'
  if (p.includes('speaker') || p.includes('sonos') || p.includes('cast') || p.includes('alexa')) return 'Speaker'
  if (p.includes('tv') || p.includes('xbox') || p.includes('playstation') || p.includes('ps5')) return 'TV / console'
  return platform
}

export function skipRate(plays: PlayEvent[]): { skipped: number; short: number; total: number; rate: number } {
  let skipped = 0
  let short = 0
  let skippedOrShort = 0
  for (const play of plays) {
    const isSkipped = play.skipped === true
    const isShort = play.msPlayed < 30_000
    if (isSkipped) skipped += 1
    if (isShort) short += 1
    if (isSkipped || isShort) skippedOrShort += 1
  }
  return {
    skipped,
    short,
    total: plays.length,
    rate: plays.length === 0 ? 0 : skippedOrShort / plays.length,
  }
}

export function discoveryMix(plays: PlayEvent[]): { onePlay: number; repeats: number; replayShare: number } {
  const listens = qualifyingListens(plays)
  const counts = new Map<string, number>()
  for (const play of listens) {
    const key = play.trackUri ?? `${play.artistName}::${play.trackName}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  let onePlay = 0
  let repeats = 0
  let replayPlays = 0
  for (const count of counts.values()) {
    if (count === 1) onePlay += 1
    else {
      repeats += 1
      replayPlays += count
    }
  }
  return {
    onePlay,
    repeats,
    replayShare: listens.length === 0 ? 0 : replayPlays / listens.length,
  }
}

export function mergeGenres(artists: { name: string; genres: string[] }[], limit = 12): GenrePoint[] {
  const weights = new Map<string, number>()
  artists.forEach((artist, index) => {
    const weight = Math.max(1, artists.length - index)
    for (const genre of artist.genres) {
      weights.set(genre, (weights.get(genre) ?? 0) + weight)
    }
  })
  return [...weights.entries()]
    .map(([name, weight]) => ({ name, weight }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit)
}

export function albumLoyalty(plays: PlayEvent[]): number {
  const listens = qualifyingListens(plays)
  if (listens.length === 0) return 0
  const albums = topAlbums(plays, 3)
  const topMs = albums.reduce((sum, album) => sum + album.msPlayed, 0)
  const total = listens.reduce((sum, play) => sum + play.msPlayed, 0)
  return total === 0 ? 0 : topMs / total
}

export function artistLoyalty(plays: PlayEvent[]): number {
  const listens = qualifyingListens(plays)
  if (listens.length === 0) return 0
  const artists = topArtists(plays, 3)
  const topMs = artists.reduce((sum, artist) => sum + artist.msPlayed, 0)
  const total = listens.reduce((sum, play) => sum + play.msPlayed, 0)
  return total === 0 ? 0 : topMs / total
}

export function catalogBreadth(plays: PlayEvent[]): number {
  const listens = qualifyingListens(plays)
  if (listens.length === 0) return 0
  return uniqueTracks(listens) / listens.length
}
