import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { EmptyState } from '../components/EmptyState.tsx'
import { useLibrary } from '../library/LibraryContext.tsx'
import { busiestDay, dailyBuckets } from '../stats/heatmap.ts'
import { derivePersonalities } from '../stats/personality.ts'
import { exportRangePresets, filterRange } from '../stats/ranges.ts'
import { discoveryMix, hourHistogram } from '../stats/taste.ts'
import { formatHoursListened } from '../stats/format.ts'
import { summaryStats, topArtists, topTracks } from '../stats/tops.ts'
export function Wrapped() {
  const { plays, hasExport } = useLibrary()
  const yearRange = useMemo(() => exportRangePresets().find((range) => range.id === '1y') ?? null, [])
  const slice = useMemo(() => filterRange(plays, yearRange), [plays, yearRange])
  const slides = useMemo(() => buildSlides(slice), [slice])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'ArrowRight' || event.key === ' ') {
        event.preventDefault()
        setIndex((value) => Math.min(slides.length - 1, value + 1))
      }
      if (event.key === 'ArrowLeft') {
        setIndex((value) => Math.max(0, value - 1))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [slides.length])

  if (!hasExport) {
    return (
      <EmptyState
        title="Wrapped needs your export"
        body="Spotify’s API cannot reconstruct a year of every stream. Import Extended Streaming History to play the story."
        actionTo="/import"
        actionLabel="Import history"
      />
    )
  }

  const slide = slides[index]
  if (!slide) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted">
        <p>Last 12 months · click or use arrow keys</p>
        <p>
          {index + 1} / {slides.length}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setIndex((value) => (value + 1) % slides.length)}
        className="relative min-h-[28rem] w-full overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-950 via-black to-stone-900 p-8 text-left sm:min-h-[32rem] sm:p-12"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.28 }}
            className="flex h-full min-h-[22rem] flex-col justify-end"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-accent">{slide.kicker}</p>
            <h1 className="mt-3 font-display text-4xl leading-tight sm:text-6xl">{slide.title}</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted sm:text-lg">{slide.body}</p>
          </motion.div>
        </AnimatePresence>
      </button>
      <div className="flex justify-between">
        <button
          type="button"
          className="text-sm text-muted hover:text-ink"
          onClick={() => setIndex((value) => Math.max(0, value - 1))}
        >
          Back
        </button>
        <button
          type="button"
          className="text-sm text-muted hover:text-ink"
          onClick={() => setIndex((value) => Math.min(slides.length - 1, value + 1))}
        >
          Next
        </button>
      </div>
    </div>
  )
}

type Slide = { kicker: string; title: string; body: string }

function buildSlides(plays: ReturnType<typeof filterRange>): Slide[] {
  const summary = summaryStats(plays)
  const tracks = topTracks(plays, 1)
  const artists = topArtists(plays, 1)
  const personalities = derivePersonalities(plays)
  const binge = busiestDay(dailyBuckets(plays))
  const hours = hourHistogram(plays)
  const peak = hours.reduce((best, point) => (point.plays > best.plays ? point : best), hours[0]!)
  const discovery = discoveryMix(plays)
  const night = hours.filter((h) => h.hour >= 22 || h.hour < 5).reduce((sum, h) => sum + h.plays, 0)
  const nightShare = summary.listenCount === 0 ? 0 : Math.round((night / summary.listenCount) * 100)

  return [
    {
      kicker: 'This year in sound',
      title: 'Ready for your story?',
      body: 'A recap from every stream that lasted 30 seconds or more.',
    },
    {
      kicker: 'Time spent',
      title: `${formatHoursListened(summary.msPlayed)} hours`,
      body: `${summary.listenCount.toLocaleString()} qualifying listens across ${summary.uniqueTracks.toLocaleString()} tracks.`,
    },
    {
      kicker: 'Top song',
      title: tracks[0]?.name ?? 'No top song yet',
      body: tracks[0]
        ? `${tracks[0].subtitle} · ${tracks[0].plays} plays`
        : 'Import a longer export to unlock this slide.',
    },
    {
      kicker: 'Top artist',
      title: artists[0]?.name ?? 'No top artist yet',
      body: artists[0] ? `${artists[0].plays} qualifying plays this year` : 'Need more listens.',
    },
    {
      kicker: 'Personality',
      title: personalities[0]?.title ?? 'Still listening',
      body: personalities[0]?.evidence ?? 'Keep importing history to get a sharper read.',
    },
    {
      kicker: 'Binge day',
      title: binge ? binge.date : 'No binge day',
      body: binge ? `${binge.plays} listens · your loudest day of the year` : 'No clustered listening days found.',
    },
    {
      kicker: nightShare >= 35 ? 'Night owl' : 'Clock',
      title: nightShare >= 35 ? 'You live after dark' : `Peak hour ${String(peak.hour).padStart(2, '0')}:00`,
      body:
        nightShare >= 35
          ? `${nightShare}% of listens after 10pm UTC.`
          : 'Most of your music landed in daylight — still plenty of late sessions.',
    },
    {
      kicker: 'Replay vs explore',
      title: discovery.replayShare >= 0.6 ? 'Comfort catalog' : 'Open ears',
      body: `${Math.round(discovery.replayShare * 100)}% of plays were tracks you already knew. ${discovery.onePlay.toLocaleString()} songs appeared only once.`,
    },
    {
      kicker: 'Until next time',
      title: 'That’s a wrap.',
      body: personalities
        .map((item) => item.title)
        .join(' · ')
        .concat(' — come back after the next export.'),
    },
  ]
}
