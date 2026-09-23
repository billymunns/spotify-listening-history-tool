import type { PlayEvent } from '../import/types.ts'
import { qualifyingListens } from '../import/parsers.ts'

export type RankedItem = {
  key: string
  name: string
  subtitle: string | null
  uri: string | null
  plays: number
  msPlayed: number
}

function trackKey(play: PlayEvent): string {
  return play.trackUri ?? `${play.artistName ?? 'unknown'}::${play.trackName ?? 'unknown'}`
}

export function totalMs(plays: PlayEvent[]): number {
  return plays.reduce((sum, play) => sum + play.msPlayed, 0)
}

export function uniqueTracks(plays: PlayEvent[]): number {
  return new Set(plays.map(trackKey)).size
}

export function uniqueArtists(plays: PlayEvent[]): number {
  return new Set(plays.map((play) => play.artistName ?? 'Unknown artist')).size
}

function rank(
  listens: PlayEvent[],
  keyOf: (play: PlayEvent) => string,
  nameOf: (play: PlayEvent) => string,
  subtitleOf: (play: PlayEvent) => string | null,
  uriOf: (play: PlayEvent) => string | null,
  limit: number,
): RankedItem[] {
  const map = new Map<string, RankedItem>()
  for (const play of listens) {
    const key = keyOf(play)
    const existing = map.get(key)
    if (existing) {
      existing.plays += 1
      existing.msPlayed += play.msPlayed
      if (!existing.uri && uriOf(play)) existing.uri = uriOf(play)
    } else {
      map.set(key, {
        key,
        name: nameOf(play),
        subtitle: subtitleOf(play),
        uri: uriOf(play),
        plays: 1,
        msPlayed: play.msPlayed,
      })
    }
  }
  return [...map.values()].sort((a, b) => b.msPlayed - a.msPlayed || b.plays - a.plays).slice(0, limit)
}

export function topTracks(plays: PlayEvent[], limit = 10): RankedItem[] {
  return rank(
    qualifyingListens(plays),
    trackKey,
    (play) => play.trackName ?? 'Unknown track',
    (play) => play.artistName,
    (play) => play.trackUri,
    limit,
  )
}

export function topArtists(plays: PlayEvent[], limit = 10): RankedItem[] {
  return rank(
    qualifyingListens(plays),
    (play) => play.artistName ?? 'Unknown artist',
    (play) => play.artistName ?? 'Unknown artist',
    () => null,
    () => null,
    limit,
  )
}

export function topAlbums(plays: PlayEvent[], limit = 10): RankedItem[] {
  return rank(
    qualifyingListens(plays).filter((play) => play.albumName),
    (play) => `${play.artistName ?? 'unknown'}::${play.albumName}`,
    (play) => play.albumName ?? 'Unknown album',
    (play) => play.artistName,
    () => null,
    limit,
  )
}

export function summaryStats(plays: PlayEvent[]) {
  const listens = qualifyingListens(plays)
  return {
    playCount: plays.length,
    listenCount: listens.length,
    msPlayed: totalMs(listens),
    uniqueTracks: uniqueTracks(listens),
    uniqueArtists: uniqueArtists(listens),
  }
}
