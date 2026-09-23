import Dexie, { type Table } from 'dexie'
import { qualifyingListens } from './parsers.ts'
import type { ImportMeta, PlayEvent } from './types.ts'

export type StoredPlay = PlayEvent & {
  id?: number
  userId: string
}

class ListenDatabase extends Dexie {
  plays!: Table<StoredPlay, number>
  imports!: Table<ImportMeta, string>

  constructor() {
    super('listen-wrapped')
    this.version(1).stores({
      plays: '++id, userId, timestamp, trackUri, artistName',
      imports: 'userId',
    })
  }
}

export const db = new ListenDatabase()

export async function replaceUserHistory(
  userId: string,
  plays: PlayEvent[],
  fileNames: string[],
): Promise<ImportMeta> {
  const timestamps = plays.map((play) => play.timestamp).sort()
  const meta: ImportMeta = {
    userId,
    importedAt: new Date().toISOString(),
    fileNames,
    playCount: plays.length,
    listenCount: qualifyingListens(plays).length,
    minDate: timestamps[0] ?? null,
    maxDate: timestamps[timestamps.length - 1] ?? null,
  }

  await db.transaction('rw', db.plays, db.imports, async () => {
    await db.plays.where('userId').equals(userId).delete()
    if (plays.length > 0) {
      await db.plays.bulkAdd(plays.map((play) => ({ ...play, userId })))
    }
    await db.imports.put(meta)
  })

  return meta
}

export async function loadUserPlays(userId: string): Promise<PlayEvent[]> {
  const rows = await db.plays.where('userId').equals(userId).sortBy('timestamp')
  return rows.map((row) => ({
    timestamp: row.timestamp,
    msPlayed: row.msPlayed,
    trackName: row.trackName,
    artistName: row.artistName,
    albumName: row.albumName,
    trackUri: row.trackUri,
    skipped: row.skipped,
    platform: row.platform,
  }))
}

export async function loadUserImport(userId: string): Promise<ImportMeta | undefined> {
  return db.imports.get(userId)
}

export async function clearUserHistory(userId: string): Promise<void> {
  await db.transaction('rw', db.plays, db.imports, async () => {
    await db.plays.where('userId').equals(userId).delete()
    await db.imports.delete(userId)
  })
}
