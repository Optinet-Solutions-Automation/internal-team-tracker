'use client'

import { useRouter } from 'next/navigation'

type Range = 'daily' | 'weekly' | 'monthly'

function toYMD(d: Date) {
  return d.toISOString().slice(0, 10)
}

function getMondayOf(d: Date) {
  const day = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((day + 6) % 7))
  return monday
}

function isAtOrAfterCurrentPeriod(range: Range, date: string): boolean {
  const now = new Date()
  const today = toYMD(now)

  if (range === 'daily') return date >= today

  if (range === 'weekly') {
    const thisMonday = toYMD(getMondayOf(now))
    const refMonday = toYMD(getMondayOf(new Date(date + 'T00:00:00')))
    return refMonday >= thisMonday
  }

  // monthly
  const thisMonth = today.slice(0, 7)
  return date.slice(0, 7) >= thisMonth
}

function shift(range: Range, date: string, direction: -1 | 1): string {
  const d = new Date(date + 'T00:00:00')
  if (range === 'daily')        d.setDate(d.getDate() + direction)
  else if (range === 'weekly')  d.setDate(d.getDate() + direction * 7)
  else                          d.setMonth(d.getMonth() + direction)
  return toYMD(d)
}

export default function ReportControls({ range, date }: { range: Range; date: string }) {
  const router = useRouter()

  function navigate(newRange: Range, newDate: string) {
    router.push(`/admin/reports?range=${newRange}&date=${newDate}`)
  }

  const atCurrent = isAtOrAfterCurrentPeriod(range, date)

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">

      {/* Range tabs */}
      <div className="flex rounded-xl bg-yt-bg-alt p-0.5 ring-1 ring-yt-border">
        {(['daily', 'weekly', 'monthly'] as const).map(r => (
          <button
            key={r}
            onClick={() => navigate(r, date)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              range === r
                ? 'bg-yt-card text-yt-text shadow-sm ring-1 ring-yt-border'
                : 'text-yt-text-secondary hover:text-yt-text'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Date navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => navigate(range, shift(range, date, -1))}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-yt-text-secondary ring-1 ring-yt-border transition-colors hover:bg-yt-bg-alt hover:text-yt-text"
          title="Previous"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {range === 'monthly' ? (
          <input
            type="month"
            value={date.slice(0, 7)}
            max={new Date().toISOString().slice(0, 7)}
            onChange={e => navigate(range, e.target.value + '-01')}
            className="rounded-lg bg-yt-card px-2 py-1 text-xs text-yt-text ring-1 ring-yt-border focus:outline-none"
          />
        ) : (
          <input
            type="date"
            value={date}
            max={toYMD(new Date())}
            onChange={e => navigate(range, e.target.value)}
            className="rounded-lg bg-yt-card px-2 py-1 text-xs text-yt-text ring-1 ring-yt-border focus:outline-none"
          />
        )}

        <button
          onClick={() => navigate(range, shift(range, date, 1))}
          disabled={atCurrent}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-yt-text-secondary ring-1 ring-yt-border transition-colors hover:bg-yt-bg-alt hover:text-yt-text disabled:cursor-not-allowed disabled:opacity-30"
          title="Next"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Print */}
      <button
        onClick={() => window.print()}
        className="flex items-center gap-1.5 rounded-xl bg-yt-card px-3 py-1.5 text-xs font-medium text-yt-text ring-1 ring-yt-border transition-colors hover:bg-yt-bg-alt"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        Print
      </button>
    </div>
  )
}
