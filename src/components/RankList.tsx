import type { RankedItem } from '../stats/tops.ts'
import { formatMinutes } from '../stats/format.ts'

export function RankList({ items, empty }: { items: RankedItem[]; empty: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">{empty}</p>
  }
  return (
    <ol className="space-y-3">
      {items.map((item, index) => (
        <li key={item.key} className="flex items-baseline gap-3">
          <span className="w-6 text-right text-xs tabular-nums text-muted">{index + 1}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-ink">{item.name}</p>
            {item.subtitle ? <p className="truncate text-xs text-muted">{item.subtitle}</p> : null}
          </div>
          <div className="text-right text-xs text-muted">
            <div>{item.plays} plays</div>
            <div>{formatMinutes(item.msPlayed)}</div>
          </div>
        </li>
      ))}
    </ol>
  )
}

export function SpotifyRankList({
  items,
}: {
  items: { id: string; title: string; subtitle: string; image?: string | null }[]
}) {
  if (items.length === 0) return <p className="text-sm text-muted">Nothing from Spotify yet.</p>
  return (
    <ol className="space-y-3">
      {items.map((item, index) => (
        <li key={item.id} className="flex items-center gap-3">
          <span className="w-6 text-right text-xs tabular-nums text-muted">{index + 1}</span>
          {item.image ? (
            <img src={item.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-line" />
          )}
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{item.title}</p>
            <p className="truncate text-xs text-muted">{item.subtitle}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
