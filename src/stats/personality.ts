import type { PlayEvent } from '../import/types.ts'
import { qualifyingListens } from '../import/parsers.ts'
import { albumLoyalty, artistLoyalty, catalogBreadth, discoveryMix, dowHistogram, hourHistogram } from './taste.ts'
import { topTracks } from './tops.ts'

export type Personality = {
  title: string
  evidence: string
}

function shareAfterHour(plays: PlayEvent[], hour: number): number {
  const listens = qualifyingListens(plays)
  if (listens.length === 0) return 0
  const count = listens.filter((play) => new Date(play.timestamp).getUTCHours() >= hour || new Date(play.timestamp).getUTCHours() < 5).length
  return count / listens.length
}

function shareBeforeHour(plays: PlayEvent[], hour: number): number {
  const listens = qualifyingListens(plays)
  if (listens.length === 0) return 0
  const count = listens.filter((play) => {
    const h = new Date(play.timestamp).getUTCHours()
    return h >= 5 && h < hour
  }).length
  return count / listens.length
}

export function derivePersonalities(plays: PlayEvent[], genres: string[] = []): Personality[] {
  const listens = qualifyingListens(plays)
  if (listens.length === 0) return []

  const results: Personality[] = []
  const nightShare = shareAfterHour(plays, 22)
  const earlyShare = shareBeforeHour(plays, 9)
  const hours = hourHistogram(plays)
  const peakHour = hours.reduce((best, point) => (point.plays > best.plays ? point : best))
  const weekend = dowHistogram(plays).filter((d) => d.dow === 0 || d.dow === 6)
  const weekendPlays = weekend.reduce((sum, d) => sum + d.plays, 0)
  const weekendShare = weekendPlays / listens.length
  const discovery = discoveryMix(plays)
  const top = topTracks(plays, 1)[0]
  const topShare = top ? top.plays / listens.length : 0

  if (nightShare >= 0.35) {
    results.push({
      title: 'Night Owl',
      evidence: `${Math.round(nightShare * 100)}% of your listens happened after 10pm UTC`,
    })
  } else if (earlyShare >= 0.3) {
    results.push({
      title: 'Early Bird',
      evidence: `${Math.round(earlyShare * 100)}% of your listens landed before 9am UTC`,
    })
  } else {
    results.push({
      title: peakHour.hour >= 12 && peakHour.hour < 17 ? 'Afternoon Regular' : 'All-day Listener',
      evidence: `Your peak hour is ${String(peakHour.hour).padStart(2, '0')}:00 UTC`,
    })
  }

  if (discovery.replayShare >= 0.65 || topShare >= 0.08) {
    results.push({
      title: 'Replay Machine',
      evidence: top
        ? `${top.name} ate ${Math.round(topShare * 100)}% of qualifying plays`
        : `${Math.round(discovery.replayShare * 100)}% of plays were tracks you already knew`,
    })
  } else if (catalogBreadth(plays) >= 0.7) {
    results.push({
      title: 'Explorer',
      evidence: `${Math.round(catalogBreadth(plays) * 100)}% of listens were unique tracks`,
    })
  } else {
    results.push({
      title: 'Balanced Browser',
      evidence: `${discovery.onePlay.toLocaleString()} one-off tracks and ${discovery.repeats.toLocaleString()} repeats`,
    })
  }

  if (albumLoyalty(plays) >= 0.28) {
    results.push({
      title: 'Album Loyalist',
      evidence: `${Math.round(albumLoyalty(plays) * 100)}% of listening sat in your top 3 albums`,
    })
  } else if (artistLoyalty(plays) >= 0.35) {
    results.push({
      title: 'Artist Loyalist',
      evidence: `${Math.round(artistLoyalty(plays) * 100)}% of listening sat with your top 3 artists`,
    })
  } else if (genres.length >= 8) {
    results.push({
      title: 'Genre Hopper',
      evidence: `Spotify tagged you with ${genres.length} distinct genres`,
    })
  } else if (weekendShare >= 0.4) {
    results.push({
      title: 'Weekend Warrior',
      evidence: `${Math.round(weekendShare * 100)}% of listens landed on Saturday or Sunday`,
    })
  }

  return results.slice(0, 3)
}
