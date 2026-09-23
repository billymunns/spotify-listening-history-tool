import { addDays } from 'date-fns'
import type { PlayEvent } from '../import/types.ts'
import { qualifyingListens } from '../import/parsers.ts'
import { utcDay } from './ranges.ts'

export type DayBucket = {
  date: string
  msPlayed: number
  plays: number
}

export function dailyBuckets(plays: PlayEvent[]): DayBucket[] {
  const map = new Map<string, DayBucket>()
  for (const play of qualifyingListens(plays)) {
    const date = utcDay(play.timestamp)
    const existing = map.get(date)
    if (existing) {
      existing.msPlayed += play.msPlayed
      existing.plays += 1
    } else {
      map.set(date, { date, msPlayed: play.msPlayed, plays: 1 })
    }
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date))
}

export function bucketMap(buckets: DayBucket[]): Map<string, DayBucket> {
  return new Map(buckets.map((bucket) => [bucket.date, bucket]))
}

function consecutiveStreak(dates: string[]): number {
  if (dates.length === 0) return 0
  let best = 1
  let current = 1
  for (let i = 1; i < dates.length; i += 1) {
    const prev = dates[i - 1]
    const next = dates[i]
    if (!prev || !next) continue
    const expected = addDays(new Date(`${prev}T00:00:00.000Z`), 1).toISOString().slice(0, 10)
    if (next === expected) {
      current += 1
      best = Math.max(best, current)
    } else {
      current = 1
    }
  }
  return best
}

export function longestStreak(buckets: DayBucket[]): number {
  return consecutiveStreak(buckets.map((bucket) => bucket.date))
}

export function currentStreak(buckets: DayBucket[], today = new Date()): number {
  if (buckets.length === 0) return 0
  const set = new Set(buckets.map((bucket) => bucket.date))
  let cursor = today.toISOString().slice(0, 10)
  if (!set.has(cursor)) {
    cursor = addDays(new Date(`${cursor}T00:00:00.000Z`), -1).toISOString().slice(0, 10)
  }
  let streak = 0
  while (set.has(cursor)) {
    streak += 1
    cursor = addDays(new Date(`${cursor}T00:00:00.000Z`), -1).toISOString().slice(0, 10)
  }
  return streak
}

export function busiestDay(buckets: DayBucket[]): DayBucket | null {
  if (buckets.length === 0) return null
  return buckets.reduce((best, bucket) => (bucket.msPlayed > best.msPlayed ? bucket : best))
}

export function heatmapGrid(startDate: string, endDate: string, buckets: DayBucket[]): (DayBucket | { date: string; msPlayed: 0; plays: 0 })[] {
  const map = bucketMap(buckets)
  const days: (DayBucket | { date: string; msPlayed: 0; plays: 0 })[] = []
  let cursor = startDate
  while (cursor <= endDate) {
    days.push(map.get(cursor) ?? { date: cursor, msPlayed: 0, plays: 0 })
    cursor = addDays(new Date(`${cursor}T00:00:00.000Z`), 1).toISOString().slice(0, 10)
  }
  return days
}
