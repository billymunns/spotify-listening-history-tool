import { LISTEN_MS, type ParseResult, type ParseWarning, type PlayEvent } from './types.ts'

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function strOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function toIso(value: string): string | null {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function classicEndTimeToIso(endTime: string): string | null {
  if (endTime.includes('T')) return toIso(endTime)
  // Classic export uses "YYYY-MM-DD HH:mm" in UTC
  return toIso(`${endTime.replace(' ', 'T')}Z`)
}

export function parsePlayRecord(row: unknown): PlayEvent | null {
  const r = asRecord(row)
  if (!r) return null

  if (typeof r.ts === 'string' && typeof r.ms_played === 'number') {
    const trackName = strOrNull(r.master_metadata_track_name)
    if (!trackName) return null
    const timestamp = toIso(r.ts)
    if (!timestamp) return null
    return {
      timestamp,
      msPlayed: r.ms_played,
      trackName,
      artistName: strOrNull(r.master_metadata_album_artist_name),
      albumName: strOrNull(r.master_metadata_album_album_name),
      trackUri: strOrNull(r.spotify_track_uri),
      skipped: typeof r.skipped === 'boolean' ? r.skipped : null,
      platform: strOrNull(r.platform),
    }
  }

  if (typeof r.endTime === 'string' && typeof r.msPlayed === 'number') {
    const trackName = strOrNull(r.trackName)
    if (!trackName) return null
    const timestamp = classicEndTimeToIso(r.endTime)
    if (!timestamp) return null
    return {
      timestamp,
      msPlayed: r.msPlayed,
      trackName,
      artistName: strOrNull(r.artistName),
      albumName: null,
      trackUri: null,
      skipped: null,
      platform: null,
    }
  }

  return null
}

export function parseStreamingJson(raw: unknown, fileName = 'history.json'): ParseResult {
  const warnings: ParseWarning[] = []
  if (!Array.isArray(raw)) {
    return {
      plays: [],
      fileNames: [fileName],
      warnings: [{ fileName, message: 'File is not a JSON array of plays' }],
    }
  }

  const plays: PlayEvent[] = []
  let skippedRows = 0
  for (const row of raw) {
    const parsed = parsePlayRecord(row)
    if (parsed) plays.push(parsed)
    else skippedRows += 1
  }

  if (plays.length === 0) {
    warnings.push({
      fileName,
      message: 'No audio plays found (podcasts, video, or an unrecognized format were skipped)',
    })
  } else if (skippedRows > 0) {
    warnings.push({
      fileName,
      message: `Skipped ${skippedRows} non-track row${skippedRows === 1 ? '' : 's'}`,
    })
  }

  return { plays, fileNames: [fileName], warnings }
}

export function looksLikeHistoryFile(fileName: string): boolean {
  const base = fileName.split('/').pop() ?? fileName
  const lower = base.toLowerCase()
  if (!lower.endsWith('.json')) return false
  if (lower.includes('video')) return false
  return (
    lower.startsWith('endsong') ||
    lower.includes('streaming_history_audio') ||
    lower.includes('streaminghistory') ||
    lower.includes('streaming_history')
  )
}

export function mergeParseResults(results: ParseResult[]): ParseResult {
  const plays: PlayEvent[] = []
  const fileNames: string[] = []
  const warnings: ParseWarning[] = []
  for (const result of results) {
    plays.push(...result.plays)
    fileNames.push(...result.fileNames)
    warnings.push(...result.warnings)
  }
  plays.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  return { plays, fileNames, warnings }
}

export function isListen(play: PlayEvent, thresholdMs = LISTEN_MS): boolean {
  return play.msPlayed >= thresholdMs
}

export function qualifyingListens(plays: PlayEvent[], thresholdMs = LISTEN_MS): PlayEvent[] {
  return plays.filter((play) => isListen(play, thresholdMs))
}
