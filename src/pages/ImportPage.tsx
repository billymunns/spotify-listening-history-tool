import { useState } from 'react'
import { Card } from '../components/EmptyState.tsx'
import { ExportGuide } from '../components/ExportGuide.tsx'
import { ErrorState, LoadingState } from '../components/Status.tsx'
import { useLibrary } from '../library/LibraryContext.tsx'
import { formatCount, formatDateRange } from '../stats/format.ts'

export function ImportPage() {
  const { status, meta, error, warnings, importFiles, loadSample, clearHistory, hasExport } = useLibrary()
  const [dragOver, setDragOver] = useState(false)

  async function handleFiles(fileList: FileList | File[] | null) {
    if (!fileList) return
    const files = [...fileList].filter((file) => /\.(json|zip)$/i.test(file.name) || file.type.includes('json') || file.type.includes('zip'))
    if (files.length === 0) return
    await importFiles(files)
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Import</p>
        <h1 className="font-display text-4xl">Bring in your full history</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Spotify’s live API only keeps a short window. Your official export unlocks Wrapped, the
          calendar, streaks, and year-over-year compare. Parsing happens on your machine.
        </p>
      </header>

      {status === 'loading' || status === 'importing' ? (
        <LoadingState label={status === 'importing' ? 'Reading files…' : 'Loading saved history…'} />
      ) : null}
      {error ? <ErrorState message={error} /> : null}

      <button
        type="button"
        onDragOver={(event) => {
          event.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragOver(false)
          void handleFiles(event.dataTransfer.files)
        }}
        onClick={() => document.getElementById('history-files')?.click()}
        className={`w-full rounded-3xl border border-dashed px-6 py-16 text-center ${
          dragOver ? 'border-accent bg-accent-dim/40' : 'border-line bg-panel'
        }`}
      >
        <p className="font-display text-2xl">Drop a zip or JSON files</p>
        <p className="mt-2 text-sm text-muted">or click to choose files from disk</p>
        <input
          id="history-files"
          type="file"
          accept=".json,.zip,application/json,application/zip"
          multiple
          className="hidden"
          onChange={(event) => {
            void handleFiles(event.target.files)
            event.target.value = ''
          }}
        />
      </button>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void loadSample()}
          className="rounded-full border border-line px-4 py-2 text-sm hover:bg-panel"
        >
          Load sample history
        </button>
        {hasExport ? (
          <button
            type="button"
            onClick={() => void clearHistory()}
            className="rounded-full border border-line px-4 py-2 text-sm text-red-200 hover:bg-red-950/40"
          >
            Remove imported history
          </button>
        ) : null}
      </div>

      {meta ? (
        <Card>
          <h2 className="font-display text-2xl">Current import</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Plays</dt>
              <dd>{formatCount(meta.playCount)}</dd>
            </div>
            <div>
              <dt className="text-muted">Listens (≥30s)</dt>
              <dd>{formatCount(meta.listenCount)}</dd>
            </div>
            <div>
              <dt className="text-muted">Coverage</dt>
              <dd>{formatDateRange(meta.minDate, meta.maxDate)}</dd>
            </div>
            <div>
              <dt className="text-muted">Imported</dt>
              <dd>{new Date(meta.importedAt).toLocaleString()}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-muted">{meta.fileNames.join(', ')}</p>
        </Card>
      ) : null}

      {warnings.length > 0 ? (
        <Card>
          <h2 className="text-sm font-medium text-ink">Notes</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {warnings.map((warning) => (
              <li key={`${warning.fileName}:${warning.message}`}>
                {warning.fileName}: {warning.message}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card>
        <h2 className="font-display text-2xl">How to request your data</h2>
        <div className="mt-4">
          <ExportGuide />
        </div>
      </Card>
    </div>
  )
}
