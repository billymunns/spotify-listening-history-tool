import { describe, expect, it } from 'vitest'
import { isListen, looksLikeHistoryFile, parsePlayRecord, parseStreamingJson, qualifyingListens } from './parsers.ts'
import { LISTEN_MS } from './types.ts'

const extendedPlay = {
  ts: '2024-06-15T23:10:00Z',
  ms_played: 95_000,
  master_metadata_track_name: 'Holocene',
  master_metadata_album_artist_name: 'Bon Iver',
  master_metadata_album_album_name: 'Bon Iver',
  spotify_track_uri: 'spotify:track:abc',
  skipped: false,
  platform: 'iOS 17.4 (iPhone)',
}

const classicPlay = {
  endTime: '2024-06-15 23:10',
  artistName: 'Bon Iver',
  trackName: 'Holocene',
  msPlayed: 95_000,
}

describe('parsePlayRecord', () => {
  it('parses extended streaming history rows', () => {
    const play = parsePlayRecord(extendedPlay)
    expect(play).toMatchObject({
      trackName: 'Holocene',
      artistName: 'Bon Iver',
      albumName: 'Bon Iver',
      trackUri: 'spotify:track:abc',
      msPlayed: 95_000,
      skipped: false,
      platform: 'iOS 17.4 (iPhone)',
    })
    expect(play?.timestamp).toBe('2024-06-15T23:10:00.000Z')
  })

  it('parses classic StreamingHistory rows as UTC', () => {
    const play = parsePlayRecord(classicPlay)
    expect(play?.timestamp).toBe('2024-06-15T23:10:00.000Z')
    expect(play?.trackName).toBe('Holocene')
    expect(play?.albumName).toBeNull()
  })

  it('drops podcast / video rows without a track name', () => {
    expect(
      parsePlayRecord({
        ts: '2024-06-15T23:10:00Z',
        ms_played: 120_000,
        master_metadata_track_name: null,
        episode_name: 'A podcast',
      }),
    ).toBeNull()
  })
})

describe('parseStreamingJson', () => {
  it('warns when the file is not an array', () => {
    const result = parseStreamingJson({ not: 'an array' }, 'bad.json')
    expect(result.plays).toEqual([])
    expect(result.warnings[0]?.message).toMatch(/not a JSON array/)
  })

  it('keeps audio plays and notes skipped rows', () => {
    const result = parseStreamingJson([extendedPlay, { ts: '2024-01-01T00:00:00Z', ms_played: 10 }], 'endsong_0.json')
    expect(result.plays).toHaveLength(1)
    expect(result.warnings[0]?.message).toMatch(/Skipped 1/)
  })
})

describe('listen threshold', () => {
  it('counts a listen at 30 seconds', () => {
    expect(isListen({ ...parsePlayRecord(extendedPlay)!, msPlayed: LISTEN_MS })).toBe(true)
    expect(isListen({ ...parsePlayRecord(extendedPlay)!, msPlayed: LISTEN_MS - 1 })).toBe(false)
  })

  it('filters qualifying listens', () => {
    const short = { ...parsePlayRecord(extendedPlay)!, msPlayed: 12_000 }
    const full = parsePlayRecord(extendedPlay)!
    expect(qualifyingListens([short, full])).toEqual([full])
  })
})

describe('looksLikeHistoryFile', () => {
  it('accepts known export names and rejects video dumps', () => {
    expect(looksLikeHistoryFile('endsong_1.json')).toBe(true)
    expect(looksLikeHistoryFile('Streaming_History_Audio_2024.json')).toBe(true)
    expect(looksLikeHistoryFile('StreamingHistory0.json')).toBe(true)
    expect(looksLikeHistoryFile('Streaming_History_Video_2024.json')).toBe(false)
    expect(looksLikeHistoryFile('readme.txt')).toBe(false)
  })
})
