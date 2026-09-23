import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getTopArtists, getTracksByIds, uriToId } from '../api/spotify.ts'
import { useAuth } from '../auth/AuthContext.tsx'
import { Card, EmptyState } from '../components/EmptyState.tsx'
import { ErrorState } from '../components/Status.tsx'
import { useLibrary } from '../library/LibraryContext.tsx'
import { formatMinutes } from '../stats/format.ts'
import {
  discoveryMix,
  dowHistogram,
  hourHistogram,
  mergeGenres,
  platformMix,
  skipRate,
} from '../stats/taste.ts'
import { topAlbums } from '../stats/tops.ts'

export function Taste() {
  const { plays, hasExport } = useLibrary()
  const { status, getToken } = useAuth()
  const [genres, setGenres] = useState<{ name: string; weight: number }[]>([])
  const [eras, setEras] = useState<{ era: string; count: number }[]>([])
  const [error, setError] = useState<string | null>(null)

  const skip = useMemo(() => skipRate(plays), [plays])
  const discovery = useMemo(() => discoveryMix(plays), [plays])
  const platforms = useMemo(() => platformMix(plays), [plays])
  const hours = useMemo(() => hourHistogram(plays), [plays])
  const dow = useMemo(() => dowHistogram(plays), [plays])
  const albums = useMemo(() => topAlbums(plays, 6), [plays])

  useEffect(() => {
    if (status !== 'authed') return
    let cancelled = false
    void (async () => {
      try {
        const token = await getToken()
        const artists = await getTopArtists(token, 'long_term', 30)
        if (!cancelled) setGenres(mergeGenres(artists))
        const ids = [...new Set(plays.map((play) => uriToId(play.trackUri)).filter((id): id is string => !!id))].slice(0, 50)
        if (ids.length > 0) {
          const tracks = await getTracksByIds(token, ids)
          const buckets = new Map<string, number>()
          for (const track of tracks) {
            const year = Number(track.album?.release_date?.slice(0, 4))
            if (!Number.isFinite(year)) continue
            const era = year < 1990 ? 'Classic' : year < 2000 ? '90s' : year < 2010 ? '2000s' : year < 2020 ? '2010s' : '2020s'
            buckets.set(era, (buckets.get(era) ?? 0) + 1)
          }
          if (!cancelled) {
            setEras(
              ['Classic', '90s', '2000s', '2010s', '2020s']
                .map((era) => ({ era, count: buckets.get(era) ?? 0 }))
                .filter((row) => row.count > 0),
            )
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not enrich taste from Spotify')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [status, getToken, plays])

  if (!hasExport) {
    return (
      <EmptyState
        title="Taste is richer with history"
        body="Skip rate, platforms, and discovery come from your export. Connect Spotify later to layer genres and album eras."
        actionTo="/import"
        actionLabel="Import history"
      />
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Taste</p>
        <h1 className="font-display text-4xl">How you actually listen</h1>
      </header>
      {error ? <ErrorState message={error} /> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs uppercase text-muted">Skip / short play</p>
          <p className="font-display text-3xl">{Math.round(skip.rate * 100)}%</p>
          <p className="mt-1 text-xs text-muted">{skip.short} plays under 30s</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-muted">One-off tracks</p>
          <p className="font-display text-3xl">{discovery.onePlay.toLocaleString()}</p>
          <p className="mt-1 text-xs text-muted">{discovery.repeats.toLocaleString()} became repeats</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-muted">Replay share</p>
          <p className="font-display text-3xl">{Math.round(discovery.replayShare * 100)}%</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-display text-2xl">Hour of day</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hours}>
                <XAxis dataKey="hour" stroke="#a3a39b" fontSize={11} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: '#141414', border: '1px solid #262626' }} />
                <Bar dataKey="plays" fill="#34d399" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 font-display text-2xl">Day of week</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dow}>
                <XAxis dataKey="label" stroke="#a3a39b" fontSize={11} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: '#141414', border: '1px solid #262626' }} />
                <Bar dataKey="plays" fill="#6ee7b7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-display text-2xl">Platforms</h2>
          <ul className="space-y-2 text-sm">
            {platforms.map((platform) => (
              <li key={platform.name} className="flex justify-between">
                <span>{platform.name}</span>
                <span className="text-muted">{formatMinutes(platform.msPlayed)}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-4 font-display text-2xl">Albums you live in</h2>
          <ul className="space-y-2 text-sm">
            {albums.map((album) => (
              <li key={album.key} className="flex justify-between gap-3">
                <span className="truncate">
                  {album.name} <span className="text-muted">· {album.subtitle}</span>
                </span>
                <span className="text-muted">{album.plays}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {genres.length > 0 ? (
        <Card>
          <h2 className="mb-4 font-display text-2xl">Genres from Spotify</h2>
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => (
              <span key={genre.name} className="rounded-full bg-accent-dim px-3 py-1 text-sm text-accent">
                {genre.name}
              </span>
            ))}
          </div>
        </Card>
      ) : null}

      {eras.length > 0 ? (
        <Card>
          <h2 className="mb-4 font-display text-2xl">Eras (from album years)</h2>
          <ul className="space-y-2 text-sm">
            {eras.map((era) => (
              <li key={era.era} className="flex justify-between">
                <span>{era.era}</span>
                <span className="text-muted">{era.count} sampled tracks</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <p className="text-sm text-muted">
          Album eras appear when you are signed in to Spotify and your export includes track URIs.
        </p>
      )}
    </div>
  )
}
