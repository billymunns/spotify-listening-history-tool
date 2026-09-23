import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext.tsx'
import { buildSampleHistory, SAMPLE_USER_ID } from '../data/sampleHistory.ts'
import { clearUserHistory, loadUserImport, loadUserPlays, replaceUserHistory } from '../import/db.ts'
import { parseFilesInWorker } from '../import/runWorker.ts'
import type { ImportMeta, ParseWarning, PlayEvent } from '../import/types.ts'

type LibraryStatus = 'idle' | 'loading' | 'ready' | 'importing' | 'error'

type LibraryContextValue = {
  status: LibraryStatus
  plays: PlayEvent[]
  meta: ImportMeta | null
  error: string | null
  warnings: ParseWarning[]
  hasExport: boolean
  importFiles: (files: File[]) => Promise<void>
  loadSample: () => Promise<void>
  clearHistory: () => Promise<void>
}

const LibraryContext = createContext<LibraryContextValue | null>(null)

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { userId, status: authStatus } = useAuth()
  const [status, setStatus] = useState<LibraryStatus>('idle')
  const [plays, setPlays] = useState<PlayEvent[]>([])
  const [meta, setMeta] = useState<ImportMeta | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<ParseWarning[]>([])

  const reload = useCallback(async (id: string) => {
    setStatus('loading')
    setError(null)
    try {
      const [nextPlays, nextMeta] = await Promise.all([loadUserPlays(id), loadUserImport(id)])
      setPlays(nextPlays)
      setMeta(nextMeta ?? null)
      setStatus('ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load saved history')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    if (!userId || authStatus === 'anon' || authStatus === 'loading') {
      setPlays([])
      setMeta(null)
      setStatus('idle')
      return
    }
    void (async () => {
      await reload(userId)
      if (authStatus === 'demo') {
        const existing = await loadUserPlays(userId)
        if (existing.length === 0) {
          const sample = buildSampleHistory()
          const nextMeta = await replaceUserHistory(userId, sample, ['sample-history.json'])
          setPlays(sample)
          setMeta(nextMeta)
          setStatus('ready')
        }
      }
    })()
  }, [userId, authStatus, reload])

  const importFiles = useCallback(
    async (files: File[]) => {
      if (!userId) throw new Error('Sign in first')
      setStatus('importing')
      setError(null)
      try {
        const result = await parseFilesInWorker(files)
        if (result.plays.length === 0) {
          setWarnings(result.warnings)
          setError('No plays found in those files.')
          setStatus('ready')
          return
        }
        const nextMeta = await replaceUserHistory(userId, result.plays, result.fileNames)
        setPlays(result.plays)
        setMeta(nextMeta)
        setWarnings(result.warnings)
        setStatus('ready')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Import failed')
        setStatus('error')
      }
    },
    [userId],
  )

  const loadSample = useCallback(async () => {
    const id = userId ?? SAMPLE_USER_ID
    setStatus('importing')
    const sample = buildSampleHistory()
    const nextMeta = await replaceUserHistory(id, sample, ['sample-history.json'])
    setPlays(sample)
    setMeta(nextMeta)
    setWarnings([])
    setError(null)
    setStatus('ready')
  }, [userId])

  const clearHistory = useCallback(async () => {
    if (!userId) return
    await clearUserHistory(userId)
    setPlays([])
    setMeta(null)
    setWarnings([])
    setStatus('ready')
  }, [userId])

  const value = useMemo<LibraryContextValue>(
    () => ({
      status,
      plays,
      meta,
      error,
      warnings,
      hasExport: plays.length > 0,
      importFiles,
      loadSample,
      clearHistory,
    }),
    [status, plays, meta, error, warnings, importFiles, loadSample, clearHistory],
  )

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext)
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider')
  return ctx
}
