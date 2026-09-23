import type { WorkerRequest, WorkerResponse } from './worker.ts'

export function parseFilesInWorker(files: File[]): Promise<WorkerResponse> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
    const timer = window.setTimeout(() => {
      worker.terminate()
      reject(new Error('Parsing timed out'))
    }, 120_000)

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      window.clearTimeout(timer)
      worker.terminate()
      if (event.data.error) reject(new Error(event.data.error))
      else resolve(event.data)
    }
    worker.onerror = (event) => {
      window.clearTimeout(timer)
      worker.terminate()
      reject(event.error ?? new Error(event.message || 'Worker failed'))
    }

    void Promise.all(files.map(async (file) => ({ name: file.name, buffer: await file.arrayBuffer() }))).then(
      (payload) => {
        const request: WorkerRequest = { files: payload }
        worker.postMessage(request)
      },
    )
  })
}
