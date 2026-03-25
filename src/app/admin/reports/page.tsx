export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDuration } from '@/lib/utils/time'
import type { Department } from '@/lib/actions/tasks'
import ReportControls from '@/components/ReportControls'

type RangeType = 'daily' | 'weekly' | 'monthly'

type LogEntry = {
  id: string
  user_id: string
  task_id: string | null
  description: string
  department: Department
  log_date: string
}

type Profile = {
  id: string
  email: string
  full_name: string | null
}

type DayGroup = {
  date: string
  displayDate: string
  byUser: Map<string, LogEntry[]>
}

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getDateRange(range: RangeType, ref: Date): { startDate: string; endDate: string; label: string } {
  const anchor = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate())

  if (range === 'daily') {
    const dateStr = toYMD(anchor)
    return {
      startDate: dateStr,
      endDate: dateStr,
      label: anchor.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    }
  }

  if (range === 'weekly') {
    const dayOfWeek = anchor.getDay()
    const monday = new Date(anchor)
    monday.setDate(anchor.getDate() - ((dayOfWeek + 6) % 7))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return {
      startDate: toYMD(monday),
      endDate: toYMD(sunday),
      label: `${monday.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} – ${sunday.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
    }
  }

  // monthly
  const startOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const endOfMonth   = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)
  return {
    startDate: toYMD(startOfMonth),
    endDate:   toYMD(endOfMonth),
    label: anchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  }
}

const deptLabel: Record<Department, string> = { automation: 'Automation', webdev: 'Web Dev' }

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; date?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single()

  if (currentProfile?.status !== 'approved') redirect('/pending')
  if (currentProfile?.role !== 'admin') redirect('/')

  const params = await searchParams
  const range = (['daily', 'weekly', 'monthly'].includes(params.range ?? '')
    ? params.range
    : 'daily') as RangeType

  const refDate = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
    ? new Date(params.date + 'T00:00:00')
    : new Date()
  const dateParam = toYMD(refDate)

  const { startDate, endDate, label } = getDateRange(range, refDate)

  const [{ data: profilesRaw }, { data: logsRaw }] = await Promise.all([
    supabase.from('profiles').select('id, email, full_name').eq('status', 'approved'),
    supabase
      .from('daily_logs')
      .select('id, user_id, task_id, description, department, log_date')
      .gte('log_date', startDate)
      .lte('log_date', endDate)
      .order('log_date', { ascending: false }),
  ])

  const profileMap = new Map<string, Profile>(
    (profilesRaw ?? []).map((p: Profile) => [p.id, p])
  )
  const logs: LogEntry[] = (logsRaw ?? []) as LogEntry[]

  // Group by log_date, then by user
  const byDate = new Map<string, DayGroup>()
  for (const entry of logs) {
    const dateKey = entry.log_date
    const displayDate = new Date(dateKey + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    })
    if (!byDate.has(dateKey)) {
      byDate.set(dateKey, { date: dateKey, displayDate, byUser: new Map() })
    }
    const day = byDate.get(dateKey)!
    const list = day.byUser.get(entry.user_id) ?? []
    list.push(entry)
    day.byUser.set(entry.user_id, list)
  }

  const sortedDays = [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date))
  const totalEntries  = logs.length
  const activeMembers = new Set(logs.map(l => l.user_id)).size

  const rangeTitle = { daily: 'Daily Report', weekly: 'Weekly Report', monthly: 'Monthly Report' }[range]

  return (
    <div className="min-h-screen bg-yt-bg print:bg-white">

      {/* Nav — hidden when printing */}
      <nav className="sticky top-0 z-20 border-b border-yt-border/80 bg-yt-bg/90 backdrop-blur-md print:hidden">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-yt-text-secondary transition-colors hover:bg-yt-bg-alt hover:text-yt-text"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Admin Panel
            </Link>
            <span className="text-yt-border">/</span>
            <span className="text-sm font-semibold text-yt-text">Reports</span>
          </div>
          <ReportControls range={range} date={dateParam} />
        </div>
      </nav>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-6 sm:py-8 print:px-0 print:py-4">

        {/* Report header */}
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-yt-text-secondary print:text-gray-500">
            {rangeTitle}
          </p>
          <h1 className="text-2xl font-bold text-yt-text print:text-black">{label}</h1>
          <div className="mt-1 flex gap-3 text-sm text-yt-text-secondary print:text-gray-500">
            <span>{totalEntries} task log{totalEntries !== 1 ? 's' : ''}</span>
            <span>·</span>
            <span>{activeMembers} team member{activeMembers !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {sortedDays.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-yt-border py-16 print:hidden">
            <p className="text-sm font-semibold text-yt-text">No activity logged</p>
            <p className="mt-1 text-xs text-yt-text-secondary">No tasks were active during this period.</p>
          </div>
        ) : (
          <div className="space-y-10 print:space-y-8">
            {sortedDays.map(({ date, displayDate, byUser }) => (
              <section key={date} className="space-y-4">

                {/* Date heading — shown for weekly/monthly */}
                {range !== 'daily' && (
                  <h2 className="border-b border-yt-border pb-2 text-sm font-bold text-yt-text print:border-gray-300 print:text-black">
                    {displayDate}
                  </h2>
                )}

                <div className="space-y-4">
                  {[...byUser.entries()]
                    .sort(([aId], [bId]) => {
                      const a = profileMap.get(aId)?.full_name ?? ''
                      const b = profileMap.get(bId)?.full_name ?? ''
                      return a.localeCompare(b)
                    })
                    .map(([userId, entries]) => {
                      const profile = profileMap.get(userId)
                      return (
                        <div
                          key={userId}
                          className="rounded-2xl bg-yt-card p-5 ring-1 ring-yt-border print:rounded-none print:bg-white print:ring-0 print:border-b print:border-gray-200 print:pb-4"
                        >
                          <div className="mb-3">
                            <p className="text-sm font-semibold text-yt-text print:text-black">
                              {profile?.full_name ?? 'Unknown'}
                            </p>
                            <p className="text-xs text-yt-text-secondary print:text-gray-500">
                              {profile?.email}
                            </p>
                          </div>

                          <div className="space-y-2">
                            {entries.map(entry => (
                              <div key={entry.id} className="flex items-baseline gap-2 text-sm">
                                <span className="shrink-0 font-medium text-yt-text-secondary print:text-black">-</span>
                                <span className="flex-1 text-yt-text print:text-black">{entry.description}</span>
                                <span className="shrink-0 rounded-full bg-yt-bg-alt px-2 py-0.5 text-xs text-yt-text-secondary print:bg-transparent print:text-gray-500">
                                  {deptLabel[entry.department]}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </section>
            ))}
          </div>
        )}

      </main>
    </div>
  )
}
