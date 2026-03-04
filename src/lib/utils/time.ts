export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0m'
  if (seconds < 60) return '< 1m'
  const m = Math.floor(seconds / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const rm = m % 60
  if (h < 24) return rm > 0 ? `${h}h ${rm}m` : `${h}h`
  const d = Math.floor(h / 24)
  const rh = h % 24
  return rh > 0 ? `${d}d ${rh}h` : `${d}d`
}

export function snapshotSeconds(totalSeconds: number, sessionStartedAt: string | null): number {
  if (!sessionStartedAt) return totalSeconds
  return totalSeconds + Math.floor((Date.now() - new Date(sessionStartedAt).getTime()) / 1000)
}
