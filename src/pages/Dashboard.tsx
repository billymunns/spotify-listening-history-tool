import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getRecentlyPlayed, getTopArtists, getTopTracks, imageUrl } from '../api/spotify.ts'
import type { SpotifyArtist, SpotifyPlayHistory, SpotifyTimeRange, SpotifyTrack } from '../api/types.ts'
import { TIME_RANGE_LABELS } from '../api/types.ts'
import { useAuth } from '../auth/AuthContext.tsx'
import { Card } from '../components/EmptyState.tsx'
import { RankList, SpotifyRankList } from '../components/RankList.tsx'
import { ErrorState, LoadingState } from '../components/Status.tsx'
import { useLibrary } from '../library/LibraryContext.tsx'
import { formatCount, formatHoursListened } from '../stats/format.ts'
import { analysisNow, exportRangePresets, filterRange } from '../stats/ranges.ts'
import { hourHistogram } from '../stats/taste.ts'
import { summaryStats, topArtists, topTracks } from '../stats/tops.ts'

export function Dashboard() {
  const { status: authStatus, getToken } = useAuth()
  const { plays, hasExport, status: libStatus } = useLibrary()
  const [apiRange, setApiRange] = useState<SpotifyTimeRange>('short_term')
  const [exportRangeId, setExportRangeId] = useState('1y')
  const [tracks, setTracks] = useState<SpotifyTrack[]>([])
  const [artists, setArtists] = useState<SpotifyArtist[]>([])
  const [recent, setRecent] = useState<SpotifyPlayHistory[]>([])
  const [apiError, setApiError] = useState<string | null>(null)
  const [apiLoading, setApiLoading] = useState(false)

  useEffect(() => {
    if (authStatus !== 'authed') return
    let cancelled = false
    setApiLoading(true)
    setApiError(null)
    void (async () => {
      try {
        const token = await getToken()
        const [nextTracks, nextArtists, nextRecent] = await Promise.all([
          getTopTracks(token, apiRange, 10),
          getTopArtists(token, apiRange, 10),
          getRecentlyPlayed(token, 20),
        ])
        if (cancelled) return
        setTracks(nextTracks)
        setArtists(nextArtists)
        setRecent(nextRecent)
      } catch (err) {
        if (!cancelled) setApiError(err instanceof Error ? err.message : 'Spotify request failed')
      } finally {
        if (!cancelled) setApiLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [authStatus, apiRange, getToken])

  const presets = useMemo(() => exportRangePresets(analysisNow(plays)), [plays])
  const activeExportRange = presets.find((range) => range.id === exportRangeId) ?? presets[2] ?? null
  const exportSlice = useMemo(() => filterRange(plays, activeExportRange), [plays, activeExportRange])
  const summary = useMemo(() => summaryStats(exportSlice), [exportSlice])
  const hours = useMemo(() => hourHistogram(exportSlice), [exportSlice])

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Dashboard</p>
        <h1 className="font-display text-4xl">Always-on listening</h1>
        <p className="mt-2 text-sm text-muted">
          Live Spotify ranks on the left. Your imported play counts appear once you add a data export.
        </p>
      </header>

      {hasExport ? (
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {presets.map((range) => (
              <button
                key={range.id}
                type="button"
                onClick={() => setExportRangeId(range.id)}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  exportRangeId === range.id ? 'bg-accent text-black' : 'border border-line text-muted'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <Stat label="Hours" value={formatHoursListened(summary.msPlayed)} />
            <Stat label="Listens" value={formatCount(summary.listenCount)} />
            <Stat label="Tracks" value={formatCount(summary.uniqueTracks)} />
            <Stat label="Artists" value={formatCount(summary.uniqueArtists)} />
          </div>
          <Card>
            <h2 className="mb-4 font-display text-2xl">Listening by hour (UTC)</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hours}>
                  <XAxis dataKey="hour" stroke="#a3a39b" fontSize={11} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ background: '#141414', border: '1px solid #262626' }}
                    labelFormatter={(hour) => `${hour}:00 UTC`}
                  />
                  <Bar dataKey="plays" fill="#34d399" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="mb-4 font-display text-2xl">Most played songs</h2>
              <RankList items={topTracks(exportSlice, 8)} empty="No qualifying listens in this range." />
            </Card>
            <Card>
              <h2 className="mb-4 font-display text-2xl">Most played artists</h2>
              <RankList items={topArtists(exportSlice, 8)} empty="No qualifying listens in this range." />
            </Card>
          </div>
        </section>
      ) : libStatus === 'loading' ? (
        <LoadingState label="Checking for imported history…" />
      ) : (
        <Card>
          <h2 className="font-display text-2xl">Minutes and charts need a history file</h2>
          <p className="mt-2 text-sm text-muted">
            You can still use Spotify’s official tops below. Import an export on the Import page for
            full-year numbers.
          </p>
        </Card>
      )}

      {authStatus === 'authed' ? (
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TIME_RANGE_LABELS) as SpotifyTimeRange[]).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setApiRange(range)}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  apiRange === range ? 'bg-white text-black' : 'border border-line text-muted'
                }`}
              >
                Spotify · {TIME_RANGE_LABELS[range]}
              </button>
            ))}
          </div>
          {apiLoading ? <LoadingState label="Talking to Spotify…" /> : null}
          {apiError ? <ErrorState message={apiError} /> : null}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="mb-4 font-display text-2xl">Spotify top tracks</h2>
              <SpotifyRankList
                items={tracks.map((track) => ({
                  id: track.id,
                  title: track.name,
                  subtitle: track.artists.map((artist) => artist.name).join(', '),
                  image: imageUrl(track.album.images),
                }))}
              />
            </Card>
            <Card>
              <h2 className="mb-4 font-display text-2xl">Spotify top artists</h2>
              <SpotifyRankList
                items={artists.map((artist) => ({
                  id: artist.id,
                  title: artist.name,
                  subtitle: artist.genres.slice(0, 2).join(', ') || 'Artist',
                  image: imageUrl(artist.images),
                }))}
              />
            </Card>
          </div>
          <Card>
            <h2 className="mb-4 font-display text-2xl">Recently played</h2>
            <SpotifyRankList
              items={recent.map((item) => ({
                id: `${item.track.id}-${item.played_at}`,
                title: item.track.name,
                subtitle: new Date(item.played_at).toLocaleString(),
                image: imageUrl(item.track.album.images),
              }))}
            />
          </Card>
        </section>
      ) : (
        <p className="text-sm text-muted">Live Spotify ranks appear after you connect an account. Sample mode shows export stats only.</p>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl">{value}</p>
    </Card>
  )
}
