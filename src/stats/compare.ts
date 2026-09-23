import type { PlayEvent } from '../import/types.ts'
import { filterRange, type DateRange } from './ranges.ts'
import { summaryStats, topArtists, topTracks, type RankedItem } from './tops.ts'

export type RangeSnapshot = {
  range: DateRange
  listenCount: number
  playCount: number
  msPlayed: number
  uniqueTracks: number
  uniqueArtists: number
  topTracks: RankedItem[]
  topArtists: RankedItem[]
}

export type CompareResult = {
  left: RangeSnapshot
  right: RangeSnapshot
  minutesDelta: number
  listensDelta: number
  sharedArtists: string[]
  newArtists: string[]
}

export function snapshotRange(plays: PlayEvent[], range: DateRange): RangeSnapshot {
  const slice = filterRange(plays, range)
  const summary = summaryStats(slice)
  return {
    range,
    listenCount: summary.listenCount,
    playCount: summary.playCount,
    msPlayed: summary.msPlayed,
    uniqueTracks: summary.uniqueTracks,
    uniqueArtists: summary.uniqueArtists,
    topTracks: topTracks(slice, 5),
    topArtists: topArtists(slice, 5),
  }
}

export function compareRanges(plays: PlayEvent[], left: DateRange, right: DateRange): CompareResult {
  const leftSnap = snapshotRange(plays, left)
  const rightSnap = snapshotRange(plays, right)
  const rightArtistNames = new Set(rightSnap.topArtists.map((item) => item.name))
  const leftArtistNames = leftSnap.topArtists.map((item) => item.name)
  return {
    left: leftSnap,
    right: rightSnap,
    minutesDelta: leftSnap.msPlayed - rightSnap.msPlayed,
    listensDelta: leftSnap.listenCount - rightSnap.listenCount,
    sharedArtists: leftArtistNames.filter((name) => rightArtistNames.has(name)),
    newArtists: leftArtistNames.filter((name) => !rightArtistNames.has(name)),
  }
}
