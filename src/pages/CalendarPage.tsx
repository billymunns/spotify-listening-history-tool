import { useMemo, useState } from 'react'
import { EmptyState, Card } from '../components/EmptyState.tsx'
import { useLibrary } from '../library/LibraryContext.tsx'
import { qualifyingListens } from '../import/parsers.ts'
import { currentStreak, dailyBuckets, heatmapGrid, longestStreak } from '../stats/heatmap.ts'
import { utcDay } from '../stats/ranges.ts'
import { formatMinutes } from '../stats/format.ts'

export function CalendarPage() {
  const { plays, hasExport, meta } = useLibrary()
  const [selected, setSelected] = useState<string | null>(null)

  const buckets = useMemo(() => dailyBuckets(plays), [plays])
  const start = meta?.minDate ? utcDay(meta.minDate) : buckets[0]?.date
  const end = meta?.maxDate ? utcDay(meta.maxDate) : buckets[buckets.length - 1]?.date
  const grid = useMemo(() => (start && end ? heatmapGrid(start, end, buckets) : []), [start, end, buckets])
  const selectedPlays = useMemo(
    () => (selected ? qualifyingListens(plays).filter((play) => utcDay(play.timestamp) === selected) : []),
    [plays, selected],
  )

  if (!hasExport) {
    return (
      <EmptyState
        title="Calendar needs a history file"
        body="A GitHub-style heatmap is built from every qualifying listen in your export."
        actionTo="/import"
        actionLabel="Import history"
      />
    )
  }

  const maxMs = Math.max(1, ...buckets.map((bucket) => bucket.msPlayed))

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Calendar</p>
        <h1 className="font-display text-4xl">Every listening day</h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-xs uppercase text-muted">Current streak</p>
          <p className="font-display text-3xl">{currentStreak(buckets)} days</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-muted">Longest streak</p>
          <p className="font-display text-3xl">{longestStreak(buckets)} days</p>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap gap-1">
          {grid.map((day) => {
            const intensity = day.msPlayed / maxMs
            const bg =
              day.plays === 0
                ? '#1a1a1a'
                : `color-mix(in oklab, #34d399 ${Math.round(20 + intensity * 80)}%, #052e16)`
            return (
              <button
                key={day.date}
                type="button"
                title={`${day.date}: ${day.plays} listens`}
                onClick={() => setSelected(day.date)}
                className={`h-3.5 w-3.5 rounded-sm ${selected === day.date ? 'ring-2 ring-white' : ''}`}
                style={{ background: bg }}
              />
            )
          })}
        </div>
        <p className="mt-4 text-xs text-muted">Click a day for the track list. Color is minutes listened.</p>
      </Card>

      {selected ? (
        <Card>
          <h2 className="font-display text-2xl">{selected}</h2>
          <p className="text-sm text-muted">
            {selectedPlays.length} listens · {formatMinutes(selectedPlays.reduce((sum, play) => sum + play.msPlayed, 0))}
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {selectedPlays.map((play, index) => (
              <li key={`${play.timestamp}-${index}`} className="flex justify-between gap-4">
                <span className="truncate">
                  {play.trackName} <span className="text-muted">· {play.artistName}</span>
                </span>
                <span className="tabular-nums text-muted">{formatMinutes(play.msPlayed)}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  )
}
