import { describe, expect, it } from 'vitest'
import type { PlayEvent } from '../import/types.ts'
import { compareRanges } from './compare.ts'
import { currentStreak, dailyBuckets, longestStreak } from './heatmap.ts'
import { derivePersonalities } from './personality.ts'
import { analysisNow, customRange, exportRangePresets, filterRange } from './ranges.ts'
import { discoveryMix, skipRate } from './taste.ts'
import { summaryStats, topArtists, topTracks } from './tops.ts'

function play(partial: Partial<PlayEvent> & { timestamp: string; msPlayed: number; trackName: string }): PlayEvent {
  return {
    artistName: 'Artist',
    albumName: 'Album',
    trackUri: `spotify:track:${partial.trackName}`,
    skipped: false,
    platform: 'iOS',
    ...partial,
  }
}

const sample: PlayEvent[] = [
  play({ timestamp: '2024-01-01T23:00:00.000Z', msPlayed: 120_000, trackName: 'Night One', artistName: 'Owl' }),
  play({ timestamp: '2024-01-02T23:10:00.000Z', msPlayed: 180_000, trackName: 'Night Two', artistName: 'Owl' }),
  play({ timestamp: '2024-01-03T08:00:00.000Z', msPlayed: 200_000, trackName: 'Morning', artistName: 'Lark' }),
  play({ timestamp: '2024-01-03T08:05:00.000Z', msPlayed: 12_000, trackName: 'Skip Me', artistName: 'Lark', skipped: true }),
  play({ timestamp: '2024-01-03T09:00:00.000Z', msPlayed: 240_000, trackName: 'Morning', artistName: 'Lark' }),
  play({ timestamp: '2025-02-01T12:00:00.000Z', msPlayed: 90_000, trackName: 'Later', artistName: 'New' }),
]

describe('tops and threshold', () => {
  it('ignores sub-30s plays in rankings', () => {
    const tracks = topTracks(sample, 5)
    expect(tracks.map((item) => item.name)).not.toContain('Skip Me')
    expect(tracks[0]?.name).toBe('Morning')
    expect(tracks[0]?.plays).toBe(2)
  })

  it('ranks artists by listening time', () => {
    expect(topArtists(sample, 1)[0]?.name).toBe('Lark')
  })

  it('summarizes qualifying listens only', () => {
    const summary = summaryStats(sample)
    expect(summary.playCount).toBe(6)
    expect(summary.listenCount).toBe(5)
    expect(summary.uniqueArtists).toBe(3)
  })
})

describe('heatmap and streaks', () => {
  it('buckets qualifying listens by UTC day', () => {
    const buckets = dailyBuckets(sample)
    expect(buckets.find((bucket) => bucket.date === '2024-01-03')?.plays).toBe(2)
    expect(buckets.find((bucket) => bucket.date === '2024-01-03')?.msPlayed).toBe(440_000)
  })

  it('computes longest and current streaks', () => {
    const buckets = dailyBuckets(sample.filter((item) => item.timestamp.startsWith('2024-01')))
    expect(longestStreak(buckets)).toBe(3)
    expect(currentStreak(buckets, new Date('2024-01-03T20:00:00.000Z'))).toBe(3)
    expect(currentStreak(buckets, new Date('2024-01-05T20:00:00.000Z'))).toBe(0)
  })
})

describe('compare ranges', () => {
  it('compares two explicit windows', () => {
    const result = compareRanges(
      sample,
      customRange('2024-01-01', '2024-01-31', 'jan'),
      customRange('2025-02-01', '2025-02-28', 'feb'),
    )
    expect(result.left.listenCount).toBe(4)
    expect(result.right.listenCount).toBe(1)
    expect(result.listensDelta).toBe(3)
    expect(result.left.topArtists[0]?.name).toBe('Lark')
    expect(result.right.topArtists[0]?.name).toBe('New')
  })
})

describe('taste helpers', () => {
  it('computes skip rate from short and skipped plays', () => {
    const rate = skipRate(sample)
    expect(rate.short).toBe(1)
    expect(rate.skipped).toBe(1)
    expect(rate.rate).toBeCloseTo(1 / 6)
  })

  it('treats multi-play tracks as repeats', () => {
    const mix = discoveryMix(sample)
    expect(mix.repeats).toBe(1)
    expect(mix.onePlay).toBe(3)
  })
})

describe('analysis now', () => {
  it('anchors last-year presets to the latest play when history is older than today', () => {
    const now = new Date('2026-09-23T12:00:00.000Z')
    const anchor = analysisNow(sample, now)
    expect(anchor.toISOString().startsWith('2025-02-01')).toBe(true)
    const year = exportRangePresets(anchor).find((range) => range.id === '1y')
    expect(filterRange(sample, year ?? null).length).toBeGreaterThan(0)
  })
})

describe('personality', () => {
  it('returns explainable labels', () => {
    const labels = derivePersonalities(sample)
    expect(labels.length).toBeGreaterThan(0)
    expect(labels[0]?.evidence.length).toBeGreaterThan(10)
  })
})
