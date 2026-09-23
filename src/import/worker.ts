import JSZip from 'jszip'
import { looksLikeHistoryFile, mergeParseResults, parseStreamingJson } from './parsers.ts'
import type { ParseResult } from './types.ts'

export type WorkerFile = {
  name: string
  buffer: ArrayBuffer
}

export type WorkerRequest = {
  files: WorkerFile[]
}

export type WorkerResponse = ParseResult & {
  error?: string
}

function decodeText(buffer: ArrayBuffer): string {
  return new TextDecoder('utf-8').decode(buffer)
}

function parseJsonFile(name: string, buffer: ArrayBuffer): ParseResult {
  try {
    const raw: unknown = JSON.parse(decodeText(buffer))
    return parseStreamingJson(raw, name)
  } catch {
    return {
      plays: [],
      fileNames: [name],
      warnings: [{ fileName: name, message: 'Could not parse JSON' }],
    }
  }
}

async function parseZip(name: string, buffer: ArrayBuffer): Promise<ParseResult[]> {
  const zip = await JSZip.loadAsync(buffer)
  const results: ParseResult[] = []
  const entries = Object.values(zip.files)
  const jsonEntries = entries.filter((entry) => !entry.dir && looksLikeHistoryFile(entry.name))
  const fallback = jsonEntries.length > 0 ? jsonEntries : entries.filter((entry) => !entry.dir && entry.name.toLowerCase().endsWith('.json'))

  if (fallback.length === 0) {
    return [
      {
        plays: [],
        fileNames: [name],
        warnings: [{ fileName: name, message: 'Zip did not contain any JSON history files' }],
      },
    ]
  }

  for (const entry of fallback) {
    const content = await entry.async('arraybuffer')
    results.push(parseJsonFile(`${name}:${entry.name}`, content))
  }
  return results
}

async function handle(request: WorkerRequest): Promise<WorkerResponse> {
  const results: ParseResult[] = []
  for (const file of request.files) {
    if (file.name.toLowerCase().endsWith('.zip')) {
      results.push(...(await parseZip(file.name, file.buffer)))
    } else {
      results.push(parseJsonFile(file.name, file.buffer))
    }
  }
  return mergeParseResults(results)
}

function post(result: WorkerResponse) {
  ;(self as unknown as { postMessage: (value: WorkerResponse) => void }).postMessage(result)
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  void handle(event.data)
    .then((result) => {
      post(result)
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to parse files'
      post({
        plays: [],
        fileNames: [],
        warnings: [],
        error: message,
      })
    })
}
