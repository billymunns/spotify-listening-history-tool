export const LISTEN_MS = 30_000

export type PlayEvent = {
  timestamp: string
  msPlayed: number
  trackName: string | null
  artistName: string | null
  albumName: string | null
  trackUri: string | null
  skipped: boolean | null
  platform: string | null
}

export type ImportMeta = {
  userId: string
  importedAt: string
  fileNames: string[]
  playCount: number
  listenCount: number
  minDate: string | null
  maxDate: string | null
}

export type ParseWarning = {
  fileName: string
  message: string
}

export type ParseResult = {
  plays: PlayEvent[]
  fileNames: string[]
  warnings: ParseWarning[]
}
