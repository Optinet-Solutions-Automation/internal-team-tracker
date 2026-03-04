export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Avatar from '@/components/Avatar'
import WelcomeHeader from '@/components/WelcomeHeader'
import StatusDropdown from '@/components/StatusDropdown'
import TaskPanel, { type Task, type CompletedTask } from '@/components/TaskPanel'
import { PresenceProvider } from '@/components/PresenceContext'
import SignOutButton from '@/components/SignOutButton'
import type { ShiftStatus } from '@/lib/actions/presence'
import type { Department } from '@/lib/actions/tasks'
import { formatDuration, snapshotSeconds } from '@/lib/utils/time'

type PresenceStatus = 'online' | 'offline' | 'busy'

type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'admin' | 'employee'
  status: 'pending' | 'approved' | 'rejected'
  presence_status: PresenceStatus
  shift_status: ShiftStatus
  created_at: string
}

type CurrentTask = {
  user_id: string
  description: string
  department: Department
  total_seconds: number
  session_started_at: string | null
}

const shiftLabel: Record<ShiftStatus, string> = {
  off_shift:      'Off Shift',
  available:      'Available',
  busy:           'Busy',
  do_not_disturb: 'Do Not Disturb',
  be_right_back:  'Be Right Back',
  appear_away:    'Appear Away',
}

const presenceOrder: Record<PresenceStatus, number> = { online: 0, busy: 1, offline: 2 }

function presenceDot(p?: PresenceStatus) {
  if (p === 'online') return 'bg-emerald-400'
  if (p === 'busy')   return 'bg-red-400'
  return 'bg-zinc-300 dark:bg-zinc-600'
}

function presenceBadge(p?: PresenceStatus) {
  if (p === 'online') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
  if (p === 'busy')   return 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
  return 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
}

const deptBadge = {
  automation: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  webdev:     'bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400',
}
const deptLabel = { automation: 'Automation', webdev: 'Web Dev' }

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!myProfile || myProfile.status !== 'approved') redirect('/pending')

  const [
    { data: teamMembers },
    { data: myTasksRaw },
    { data: currentTasksRaw },
    { data: completedTasksRaw },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: true }),
    supabase
      .from('tasks')
      .select('id, description, department, is_current, total_seconds, session_started_at, created_at')
      .eq('user_id', user.id)
      .is('completed_at', null)
      .order('created_at', { ascending: true }),
    supabase
      .from('tasks')
      .select('user_id, description, department, total_seconds, session_started_at')
      .eq('is_current', true)
      .is('completed_at', null),
    supabase
      .from('tasks')
      .select('id, description, department, total_seconds, completed_at')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(20),
  ])

  const isAdmin = myProfile.role === 'admin'
  const myShiftStatus: ShiftStatus = myProfile.shift_status ?? 'off_shift'
  const myTasks: Task[] = myTasksRaw ?? []
  const myCompleted: CompletedTask[] = completedTasksRaw ?? []

  const currentTaskMap = new Map<string, CurrentTask>(
    (currentTasksRaw ?? []).map((t: CurrentTask) => [t.user_id, t])
  )

  const sorted = [...(teamMembers ?? [])].sort((a: Profile, b: Profile) => {
    const pa = presenceOrder[a.presence_status ?? 'offline']
    const pb = presenceOrder[b.presence_status ?? 'offline']
    return pa - pb
  })

  const onlineCount  = sorted.filter((m: Profile) => m.presence_status === 'online').length
  const busyCount    = sorted.filter((m: Profile) => m.presence_status === 'busy').length
  const offlineCount = sorted.filter((m: Profile) => !m.presence_status || m.presence_status === 'offline').length

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <PresenceProvider initialShiftStatus={myShiftStatus}>
      {/* Page wrapper — add bottom padding on mobile for fixed bottom nav */}
      <div className="min-h-screen bg-zinc-50 pb-20 dark:bg-zinc-950 md:pb-0">

        {/* ── Top Nav ── */}
        <nav className="sticky top-0 z-20 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/90">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-600">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="hidden text-sm font-semibold text-zinc-900 dark:text-zinc-50 sm:inline">
                Team Tracker
              </span>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2">
              <StatusDropdown />
              {/* Admin link — desktop only (mobile uses bottom nav) */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="hidden items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-violet-600/25 transition-colors hover:bg-violet-700 md:inline-flex"
                >
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                  Admin
                </Link>
              )}
              <SignOutButton action={signOut} />
            </div>
          </div>
        </nav>

        {/* ── Main Content ── */}
        <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">

          <WelcomeHeader
            userId={user.id}
            avatarUrl={myProfile.avatar_url}
            name={myProfile.full_name}
            email={myProfile.email}
            role={myProfile.role}
          />

          <TaskPanel initialTasks={myTasks} initialCompleted={myCompleted} />

          {/* Team section */}
          <section>
            {/* Section header */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Your Team</h2>
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {onlineCount > 0 && (
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </span>
                    {onlineCount} online
                  </span>
                )}
                {busyCount > 0 && (
                  <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                    {busyCount} busy
                  </span>
                )}
                {offlineCount > 0 && (
                  <span className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                    {offlineCount} offline
                  </span>
                )}
              </div>
            </div>

            {/* Team grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sorted.map((member: Profile) => {
                const memberPresence: PresenceStatus = member.presence_status ?? 'offline'
                const memberShift: ShiftStatus = member.shift_status ?? 'off_shift'
                const memberTask = currentTaskMap.get(member.id)
                const isMe = member.id === user.id
                return (
                  <div
                    key={member.id}
                    className={`flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 transition-shadow hover:shadow-sm dark:bg-zinc-900
                      ${isMe
                        ? 'ring-violet-200 dark:ring-violet-800/50'
                        : 'ring-zinc-200 dark:ring-zinc-800'
                      }`}
                  >
                    {/* Member header */}
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <Avatar avatarUrl={member.avatar_url} name={member.full_name} size="md" />
                        <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white dark:ring-zinc-900 ${presenceDot(memberPresence)}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                            {member.full_name ?? 'No name'}
                          </p>
                          {isMe && (
                            <span className="shrink-0 rounded-full bg-violet-100 px-1.5 py-0.5 text-xs font-medium text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">you</span>
                          )}
                        </div>
                        <p className="truncate text-xs text-zinc-400">{member.email}</p>
                      </div>
                    </div>

                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {member.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                          Employee
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${presenceBadge(memberPresence)}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${presenceDot(memberPresence)}`} />
                        {shiftLabel[memberShift]}
                      </span>
                    </div>

                    {/* Current task strip */}
                    {memberTask && (
                      <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2 dark:bg-zinc-800/60">
                        <svg className="h-3.5 w-3.5 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="min-w-0 flex-1 truncate text-xs text-zinc-600 dark:text-zinc-300">
                          {memberTask.description}
                        </p>
                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium ${deptBadge[memberTask.department]}`}>
                          {deptLabel[memberTask.department]}
                        </span>
                        {snapshotSeconds(memberTask.total_seconds, memberTask.session_started_at) > 0 && (
                          <span className="shrink-0 text-xs text-zinc-400 tabular-nums">
                            {formatDuration(snapshotSeconds(memberTask.total_seconds, memberTask.session_started_at))}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

        </main>

        {/* ── Mobile Bottom Nav ── */}
        <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-zinc-200/80 bg-white/95 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/95 md:hidden">
          <div className="flex h-16 items-center justify-around px-6">
            {/* Dashboard */}
            <Link href="/" className="flex flex-col items-center gap-1 min-w-[3rem]">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
                <svg className="h-4 w-4 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400">Home</span>
            </Link>

            {/* Admin — only for admins */}
            {isAdmin && (
              <Link href="/admin" className="flex flex-col items-center gap-1 min-w-[3rem]">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                  <svg className="h-4 w-4 text-zinc-500 dark:text-zinc-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Admin</span>
              </Link>
            )}
          </div>
        </nav>

      </div>
    </PresenceProvider>
  )
}
