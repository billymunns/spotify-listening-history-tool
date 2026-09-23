import { addDays, addMonths, addYears, startOfDay, startOfMonth, startOfYear } from 'date-fns'
import type { PlayEvent } from '../import/types.ts'

export type DateRange = {
  start: Date
  end: Date
  id: string
  label: string
}

export function utcDay(iso: string): string {
  return iso.slice(0, 10)
}

export function inRange(play: PlayEvent, range: DateRange): boolean {
  const t = new Date(play.timestamp).getTime()
  return t >= range.start.getTime() && t < range.end.getTime()
}

export function filterRange(plays: PlayEvent[], range: DateRange | null): PlayEvent[] {
  if (!range) return plays
  return plays.filter((play) => inRange(play, range))
}

export function coverageRange(plays: PlayEvent[]): { min: string; max: string } | null {
  if (plays.length === 0) return null
  const sorted = [...plays].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  if (!first || !last) return null
  return { min: first.timestamp, max: last.timestamp }
}

export function exportRangePresets(now = new Date()): DateRange[] {
  const end = addDays(startOfDay(now), 1)
  return [
    { id: '4w', label: 'Last 4 weeks', start: addDays(end, -28), end },
    { id: '6m', label: 'Last 6 months', start: addMonths(end, -6), end },
    { id: '1y', label: 'Last year', start: addYears(end, -1), end },
    { id: 'ytd', label: 'Year to date', start: startOfYear(now), end },
    { id: 'all', label: 'All time', start: new Date(0), end },
  ]
}

export function comparePresets(now = new Date()): { left: DateRange; right: DateRange }[] {
  const today = startOfDay(now)
  const thisMonthStart = startOfMonth(now)
  const lastMonthStart = addMonths(thisMonthStart, -1)
  const thisYearStart = startOfYear(now)
  const lastYearStart = addYears(thisYearStart, -1)
  return [
    {
      left: { id: 'this-month', label: 'This month', start: thisMonthStart, end: addDays(today, 1) },
      right: { id: 'last-month', label: 'Last month', start: lastMonthStart, end: thisMonthStart },
    },
    {
      left: { id: 'this-year', label: 'This year', start: thisYearStart, end: addDays(today, 1) },
      right: { id: 'last-year', label: 'Last year', start: lastYearStart, end: thisYearStart },
    },
  ]
}

export function customRange(startIso: string, endIso: string, id = 'custom'): DateRange {
  const start = new Date(`${startIso}T00:00:00.000Z`)
  const end = addDays(new Date(`${endIso}T00:00:00.000Z`), 1)
  return { id, label: `${startIso} → ${endIso}`, start, end }
}
