export function formatMinutes(ms: number): string {
  const totalMinutes = Math.round(ms / 60_000)
  if (totalMinutes < 60) return `${totalMinutes} min`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours < 24) return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`
  const days = Math.floor(hours / 24)
  const remHours = hours % 24
  return remHours === 0 ? `${days}d` : `${days}d ${remHours}h`
}

export function formatHoursListened(ms: number): string {
  const hours = ms / 3_600_000
  if (hours < 10) return hours.toFixed(1)
  return Math.round(hours).toLocaleString()
}

export function formatCount(n: number): string {
  return n.toLocaleString()
}

export function formatDateRange(minIso: string | null, maxIso: string | null): string {
  if (!minIso || !maxIso) return 'No dates'
  const start = minIso.slice(0, 10)
  const end = maxIso.slice(0, 10)
  return start === end ? start : `${start} → ${end}`
}

export function percent(part: number, whole: number): number {
  if (whole <= 0) return 0
  return Math.round((part / whole) * 100)
}
