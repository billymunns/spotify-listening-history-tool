import type { PlayEvent } from '../import/types.ts'

const TRACKS: { name: string; artist: string; album: string; uri: string; weight: number }[] = [
  { name: 'Midnight City', artist: 'M83', album: 'Hurry Up, We\'re Dreaming', uri: 'spotify:track:sample1', weight: 8 },
  { name: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', uri: 'spotify:track:sample2', weight: 10 },
  { name: 'Dreams', artist: 'Fleetwood Mac', album: 'Rumours', uri: 'spotify:track:sample3', weight: 6 },
  { name: 'Redbone', artist: 'Childish Gambino', album: 'Awaken, My Love!', uri: 'spotify:track:sample4', weight: 7 },
  { name: 'Motion Sickness', artist: 'Phoebe Bridgers', album: 'Stranger in the Alps', uri: 'spotify:track:sample5', weight: 5 },
  { name: 'Thinkin Bout You', artist: 'Frank Ocean', album: 'Channel Orange', uri: 'spotify:track:sample6', weight: 6 },
  { name: 'Time to Pretend', artist: 'MGMT', album: 'Oracular Spectacular', uri: 'spotify:track:sample7', weight: 4 },
  { name: 'Holocene', artist: 'Bon Iver', album: 'Bon Iver', uri: 'spotify:track:sample8', weight: 5 },
  { name: 'The Less I Know The Better', artist: 'Tame Impala', album: 'Currents', uri: 'spotify:track:sample9', weight: 9 },
  { name: 'Electric Feel', artist: 'MGMT', album: 'Oracular Spectacular', uri: 'spotify:track:sample10', weight: 4 },
  { name: 'Kyoto', artist: 'Phoebe Bridgers', album: 'Punisher', uri: 'spotify:track:sample11', weight: 3 },
  { name: 'Pink + White', artist: 'Frank Ocean', album: 'Blonde', uri: 'spotify:track:sample12', weight: 5 },
  { name: 'Instant Crush', artist: 'Daft Punk', album: 'Random Access Memories', uri: 'spotify:track:sample13', weight: 6 },
  { name: 'Get Lucky', artist: 'Daft Punk', album: 'Random Access Memories', uri: 'spotify:track:sample14', weight: 4 },
  { name: 'New Person, Same Old Mistakes', artist: 'Tame Impala', album: 'Currents', uri: 'spotify:track:sample15', weight: 3 },
]

const PLATFORMS = ['iOS 17.4 (iPhone)', 'OSX 14.2.0', 'web_player windows', 'not_applicable android', 'sony_ps5']

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pickWeighted(rand: () => number) {
  const total = TRACKS.reduce((sum, track) => sum + track.weight, 0)
  let n = rand() * total
  for (const track of TRACKS) {
    n -= track.weight
    if (n <= 0) return track
  }
  return TRACKS[0]!
}

export function buildSampleHistory(seed = 42, now = new Date()): PlayEvent[] {
  const rand = mulberry32(seed)
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 22, 0, 0)
  const start = end - 620 * 24 * 3_600_000
  const plays: PlayEvent[] = []
  let cursor = start

  while (cursor < end) {
    const dayOffset = 4 + Math.floor(rand() * 18)
    cursor += dayOffset * 3_600_000
    const hourBias = rand()
    const hour = hourBias > 0.62 ? 22 + Math.floor(rand() * 4) : 8 + Math.floor(rand() * 12)
    const date = new Date(cursor)
    date.setUTCHours(hour % 24, Math.floor(rand() * 60), 0, 0)
    const track = pickWeighted(rand)
    const skipped = rand() < 0.12
    const msPlayed = skipped ? 5_000 + Math.floor(rand() * 20_000) : 90_000 + Math.floor(rand() * 150_000)
    plays.push({
      timestamp: date.toISOString(),
      msPlayed,
      trackName: track.name,
      artistName: track.artist,
      albumName: track.album,
      trackUri: track.uri,
      skipped,
      platform: PLATFORMS[Math.floor(rand() * PLATFORMS.length)] ?? 'iOS',
    })
  }

  return plays.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

export const SAMPLE_USER_ID = 'demo'

export const SAMPLE_PROFILE = {
  id: SAMPLE_USER_ID,
  display_name: 'Demo listener',
  images: [] as { url: string }[],
}
