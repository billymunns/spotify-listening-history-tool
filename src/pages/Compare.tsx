import { useEffect, useMemo, useState } from 'react'
import { getTopArtists, getTopTracks, trackRankItem } from '../api/spotify.ts'
import type { SpotifyArtist, SpotifyTimeRange, SpotifyTrack } from '../api/types.ts'
import { TIME_RANGE_LABELS } from '../api/types.ts'
import { useAuth } from '../auth/AuthContext.tsx'
import { Card, EmptyState } from '../components/EmptyState.tsx'
import { RankList, SpotifyRankList } from '../components/RankList.tsx'
import { ErrorState, LoadingState } from '../components/Status.tsx'
import { useLibrary } from '../library/LibraryContext.tsx'
import { compareRanges } from '../stats/compare.ts'
import { formatHoursListened, formatMinutes } from '../stats/format.ts'
import { analysisNow, comparePresets, customRange } from '../stats/ranges.ts'

export function Compare() {
  const { plays, hasExport } = useLibrary()
  const { status, getToken } = useAuth()
  const presets = useMemo(() => comparePresets(analysisNow(plays)), [plays])
  const [presetIndex, setPresetIndex] = useState(0)
  const [custom, setCustom] = useState({ leftStart: '', leftEnd: '', rightStart: '', rightEnd: '' })
  const [useCustom, setUseCustom] = useState(false)

  const comparison = useMemo(() => {
    if (!hasExport) return null
    if (useCustom && custom.leftStart && custom.leftEnd && custom.rightStart && custom.rightEnd) {
      return compareRanges(
        plays,
        customRange(custom.leftStart, custom.leftEnd, 'custom-left'),
        customRange(custom.rightStart, custom.rightEnd, 'custom-right'),
      )
    }
    const preset = presets[presetIndex]
    if (!preset) return null
    return compareRanges(plays, preset.left, preset.right)
  }, [hasExport, plays, presets, presetIndex, useCustom, custom])

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Compare</p>
        <h1 className="font-display text-4xl">This stretch vs that one</h1>
      </header>

      {hasExport && comparison ? (
        <>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset, index) => (
              <button
                key={preset.left.id}
                type="button"
                onClick={() => {
                  setUseCustom(false)
                  setPresetIndex(index)
                }}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  !useCustom && presetIndex === index ? 'bg-accent text-black' : 'border border-line text-muted'
                }`}
              >
                {preset.left.label} vs {preset.right.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setUseCustom(true)}
              className={`rounded-full px-3 py-1.5 text-sm ${
                useCustom ? 'bg-accent text-black' : 'border border-line text-muted'
              }`}
            >
              Custom
            </button>
          </div>

          {useCustom ? (
            <Card className="grid gap-3 sm:grid-cols-2">
              <DatePair
                label="Left range"
                start={custom.leftStart}
                end={custom.leftEnd}
                onStart={(value) => setCustom((c) => ({ ...c, leftStart: value }))}
                onEnd={(value) => setCustom((c) => ({ ...c, leftEnd: value }))}
              />
              <DatePair
                label="Right range"
                start={custom.rightStart}
                end={custom.rightEnd}
                onStart={(value) => setCustom((c) => ({ ...c, rightStart: value }))}
                onEnd={(value) => setCustom((c) => ({ ...c, rightEnd: value }))}
              />
            </Card>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <SnapshotCard title={comparison.left.range.label} snapshot={comparison.left} />
            <SnapshotCard title={comparison.right.range.label} snapshot={comparison.right} />
          </div>
          <Card>
            <p className="text-sm text-muted">
              Minutes {comparison.minutesDelta >= 0 ? 'up' : 'down'} {formatMinutes(Math.abs(comparison.minutesDelta))} ·
              listens {comparison.listensDelta >= 0 ? 'up' : 'down'} {Math.abs(comparison.listensDelta)}. New names in
              the left top 5: {comparison.newArtists.join(', ') || 'none'}.
            </p>
          </Card>
        </>
      ) : (
        <EmptyState
          title="Year-vs-year needs an export"
          body="Import your streaming history to compare months and years. Spotify-only comparison of official time ranges is below if you are signed in."
          actionTo="/import"
          actionLabel="Import history"
        />
      )}

      {status === 'authed' ? <ApiCompare getToken={getToken} /> : null}
    </div>
  )
}

function DatePair({
  label,
  start,
  end,
  onStart,
  onEnd,
}: {
  label: string
  start: string
  end: string
  onStart: (value: string) => void
  onEnd: (value: string) => void
}) {
  return (
    <label className="block text-sm">
      <span className="text-muted">{label}</span>
      <div className="mt-2 flex gap-2">
        <input
          type="date"
          value={start}
          onChange={(event) => onStart(event.target.value)}
          className="w-full rounded-xl border border-line bg-black px-3 py-2 text-ink"
        />
        <input
          type="date"
          value={end}
          onChange={(event) => onEnd(event.target.value)}
          className="w-full rounded-xl border border-line bg-black px-3 py-2 text-ink"
        />
      </div>
    </label>
  )
}

function SnapshotCard({
  title,
  snapshot,
}: {
  title: string
  snapshot: ReturnType<typeof compareRanges>['left']
}) {
  return (
    <Card>
      <h2 className="font-display text-2xl">{title}</h2>
      <p className="mt-2 text-sm text-muted">
        {formatHoursListened(snapshot.msPlayed)} hours · {snapshot.listenCount.toLocaleString()} listens
      </p>
      <div className="mt-4">
        <RankList items={snapshot.topTracks} empty="No listens in this range." />
      </div>
    </Card>
  )
}

const API_RANGES: SpotifyTimeRange[] = ['short_term', 'medium_term', 'long_term']

function ApiCompare({ getToken }: { getToken: () => Promise<string> }) {
  const [data, setData] = useState<Record<SpotifyTimeRange, { tracks: SpotifyTrack[]; artists: SpotifyArtist[] }> | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void (async () => {
      try {
        const token = await getToken()
        const entries = await Promise.all(
          API_RANGES.map(async (range) => {
            const [tracks, artists] = await Promise.all([getTopTracks(token, range, 5), getTopArtists(token, range, 5)])
            return [range, { tracks, artists }] as const
          }),
        )
        if (!cancelled) setData(Object.fromEntries(entries) as NonNullable<typeof data>)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Compare failed')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [getToken])

  return (
    <section className="space-y-4">
      <h2 className="font-display text-2xl">Spotify official ranges</h2>
      {loading ? <LoadingState label="Loading Spotify ranges…" /> : null}
      {error ? <ErrorState message={error} /> : null}
      {data ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {API_RANGES.map((range) => (
            <Card key={range}>
              <h3 className="mb-3 text-sm uppercase tracking-wide text-muted">{TIME_RANGE_LABELS[range]}</h3>
              <SpotifyRankList items={data[range].tracks.map(trackRankItem)} />
            </Card>
          ))}
        </div>
      ) : null}
    </section>
  )
}
