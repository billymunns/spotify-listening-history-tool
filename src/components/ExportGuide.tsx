export function ExportGuide() {
  return (
    <ol className="space-y-3 text-sm leading-6 text-muted">
      <li>
        <span className="font-medium text-ink">1. </span>
        Open Spotify on the web or desktop → account menu →{' '}
        <span className="text-ink">Account privacy</span>.
      </li>
      <li>
        <span className="font-medium text-ink">2. </span>
        Request <span className="text-ink">Extended streaming history</span>. Spotify emails a zip
        in a few days.
      </li>
      <li>
        <span className="font-medium text-ink">3. </span>
        Come back to Import and drop the zip or the{' '}
        <code className="rounded bg-black/40 px-1.5 py-0.5 text-xs text-accent">endsong_*.json</code> /{' '}
        <code className="rounded bg-black/40 px-1.5 py-0.5 text-xs text-accent">StreamingHistory*.json</code>{' '}
        files. Everything stays in this browser.
      </li>
    </ol>
  )
}
