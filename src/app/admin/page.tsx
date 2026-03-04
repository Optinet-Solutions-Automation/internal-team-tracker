export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Avatar from '@/components/Avatar'
import AdminTaskTimeEdit from '@/components/AdminTaskTimeEdit'
import AdminPendingActions from '@/components/AdminPendingActions'
import AdminRoleUpdate from '@/components/AdminRoleUpdate'
import AdminReapprove from '@/components/AdminReapprove'
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

const shiftLabel: Record<ShiftStatus, string> = {
  off_shift:      'Off Shift',
  available:      'Available',
  busy:           'Busy',
  do_not_disturb: 'Do Not Disturb',
  be_right_back:  'Be Right Back',
  appear_away:    'Appear Away',
}

function presenceDot(p?: PresenceStatus) {
  if (p === 'online') return 'bg-emerald-400'
  if (p === 'busy')   return 'bg-red-400'
  return 'bg-zinc-300 dark:bg-zinc-600'
}

type CurrentTask = {
  user_id: string
  description: string
  department: Department
  total_seconds: number
  session_started_at: string | null
}

type AdminTask = {
  id: string
  user_id: string
  description: string
  department: Department
  total_seconds: number
  session_started_at: string | null
  created_at: string
  completed_at: string | null
}

const deptBadge = {
  automation: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  webdev:     'bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400',
}
const deptLabel = { automation: 'Automation', webdev: 'Web Dev' }

function RoleBadge({ role }: { role: 'admin' | 'employee' }) {
  return role === 'admin' ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
      <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
      Admin
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
      <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
      Employee
    </span>
  )
}

export default async function AdminPage() {
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

  const [{ data: allProfiles }, { data: currentTasksRaw }, { data: allTasksRaw }] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: true }),
    supabase.from('tasks')
      .select('user_id, description, department, total_seconds, session_started_at')
      .eq('is_current', true)
      .is('completed_at', null),
    supabase.from('tasks')
      .select('id, user_id, description, department, total_seconds, session_started_at, created_at, completed_at')
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  const pending   = (allProfiles ?? []).filter((p: Profile) => p.status === 'pending')
  const approved  = (allProfiles ?? []).filter((p: Profile) => p.status === 'approved')
  const rejected  = (allProfiles ?? []).filter((p: Profile) => p.status === 'rejected')
  const total     = (allProfiles ?? []).length
  const onlineNow = approved.filter((p: Profile) => p.presence_status === 'online').length

  const currentTaskMap = new Map<string, CurrentTask>(
    (currentTasksRaw ?? []).map((t: CurrentTask) => [t.user_id, t])
  )
  const automationCount = (currentTasksRaw ?? []).filter((t: CurrentTask) => t.department === 'automation').length
  const webdevCount     = (currentTasksRaw ?? []).filter((t: CurrentTask) => t.department === 'webdev').length

  const tasksByUser = new Map<string, AdminTask[]>()
  for (const task of (allTasksRaw ?? []) as AdminTask[]) {
    const list = tasksByUser.get(task.user_id) ?? []
    list.push(task)
    tasksByUser.set(task.user_id, list)
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-20 dark:bg-zinc-950 md:pb-0">

      {/* ── Top Nav ── */}
      <nav className="sticky top-0 z-20 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/90">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Dashboard
            </Link>
            <span className="text-zinc-200 dark:text-zinc-700">/</span>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Admin Panel</span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            Admin
          </span>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-6 sm:py-8">

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            {
              label: 'Total Members',
              value: total,
              color: 'text-zinc-900 dark:text-zinc-50',
              bg: 'bg-zinc-100 dark:bg-zinc-800',
              icon: (
                <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ),
            },
            {
              label: 'Online Now',
              value: onlineNow,
              color: 'text-emerald-700 dark:text-emerald-400',
              bg: 'bg-emerald-50 dark:bg-emerald-900/20',
              icon: (
                <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M12 12a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              ),
            },
            {
              label: 'Approved',
              value: approved.length,
              color: 'text-blue-700 dark:text-blue-400',
              bg: 'bg-blue-50 dark:bg-blue-900/20',
              icon: (
                <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
            },
            {
              label: 'Pending',
              value: pending.length,
              color: 'text-amber-700 dark:text-amber-400',
              bg: 'bg-amber-50 dark:bg-amber-900/20',
              icon: (
                <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
            },
            {
              label: 'Rejected',
              value: rejected.length,
              color: 'text-red-600 dark:text-red-400',
              bg: 'bg-red-50 dark:bg-red-900/20',
              icon: (
                <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
            },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${stat.bg}`}>
                {stat.icon}
              </div>
              <div>
                <p className={`text-2xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
                <p className="mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Department Activity ── */}
        {(automationCount > 0 || webdevCount > 0) && (
          <div className="flex flex-wrap gap-3">
            <p className="w-full text-xs font-semibold uppercase tracking-wider text-zinc-400">Active tasks by dept.</p>
            {automationCount > 0 && (
              <div className="flex items-center gap-2.5 rounded-2xl bg-white px-4 py-3 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{automationCount}</span>
                <span className="text-sm text-zinc-500">in Automation</span>
              </div>
            )}
            {webdevCount > 0 && (
              <div className="flex items-center gap-2.5 rounded-2xl bg-white px-4 py-3 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{webdevCount}</span>
                <span className="text-sm text-zinc-500">in Web Dev</span>
              </div>
            )}
          </div>
        )}

        {/* ── Currently Working ── */}
        {currentTasksRaw && currentTasksRaw.length > 0 && (() => {
          const activeRows = (currentTasksRaw as CurrentTask[]).map(task => ({
            task,
            profile: (allProfiles ?? []).find((p: Profile) => p.id === task.user_id),
          })).filter(r => r.profile)

          return (
            <section>
              <div className="mb-4 flex items-center gap-2">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Currently Working</h2>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-400 px-1.5 text-xs font-bold text-white">
                  {activeRows.length}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {activeRows.map(({ task, profile }) => {
                  const secs = snapshotSeconds(task.total_seconds, task.session_started_at)
                  return (
                    <div key={task.user_id} className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <Avatar avatarUrl={profile!.avatar_url} name={profile!.full_name} size="sm" />
                          <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-1 ring-white dark:ring-zinc-900 ${presenceDot(profile!.presence_status)}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                            {profile!.full_name ?? 'No name'}
                          </p>
                          <p className="truncate text-xs text-zinc-400">{shiftLabel[(profile!.shift_status ?? 'off_shift') as ShiftStatus]}</p>
                        </div>
                      </div>
                      <div className="rounded-xl bg-zinc-50 px-3 py-2.5 dark:bg-zinc-800/60">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${deptBadge[task.department]}`}>
                            {deptLabel[task.department]}
                          </span>
                          <span className="flex items-center gap-1 text-xs font-semibold tabular-nums text-zinc-500 dark:text-zinc-400">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {secs > 0 ? formatDuration(secs) : '< 1m'}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs text-zinc-700 dark:text-zinc-300">{task.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })()}

        {/* ── Pending Approvals ── */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Pending Approvals</h2>
            {pending.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-xs font-bold text-white">
                {pending.length}
              </span>
            )}
          </div>

          {pending.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-12 dark:border-zinc-800">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/20">
                <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">All caught up!</p>
              <p className="mt-1 text-xs text-zinc-400">No pending requests right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((profile: Profile) => (
                <div key={profile.id} className="overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
                  {/* Amber accent for pending */}
                  <div className="h-0.5 w-full bg-gradient-to-r from-amber-400 to-orange-400" />
                  <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar avatarUrl={profile.avatar_url} name={profile.full_name} size="md" />
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          {profile.full_name ?? 'No name'}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{profile.email}</p>
                        <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                          Requested {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <AdminPendingActions
                      userId={profile.id}
                      userName={profile.full_name ?? profile.email}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Team Members ── */}
        <section>
          <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Team Members
            <span className="ml-2 text-sm font-normal text-zinc-400">({approved.length})</span>
          </h2>

          <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
            {approved.map((profile: Profile, i: number) => (
              <div
                key={profile.id}
                className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${i !== 0 ? 'border-t border-zinc-100 dark:border-zinc-800' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <Avatar avatarUrl={profile.avatar_url} name={profile.full_name} size="sm" />
                    <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-1 ring-white dark:ring-zinc-900 ${presenceDot(profile.presence_status)}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {profile.full_name ?? 'No name'}
                      </p>
                      {profile.id === user.id && (
                        <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">you</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs text-zinc-400">{profile.email}</p>
                      <span className={`text-xs font-medium
                        ${profile.presence_status === 'online'  ? 'text-emerald-600 dark:text-emerald-400' : ''}
                        ${profile.presence_status === 'busy'    ? 'text-red-500 dark:text-red-400' : ''}
                        ${!profile.presence_status || profile.presence_status === 'offline' ? 'text-zinc-400' : ''}
                      `}>
                        · {shiftLabel[profile.shift_status ?? 'off_shift']}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Current task */}
                {currentTaskMap.get(profile.id) && (() => {
                  const t = currentTaskMap.get(profile.id)!
                  const secs = snapshotSeconds(t.total_seconds, t.session_started_at)
                  return (
                    <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2 dark:bg-zinc-800/60">
                      <svg className="h-3.5 w-3.5 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="min-w-0 flex-1 truncate text-xs text-zinc-600 dark:text-zinc-300">
                        {t.description}
                      </p>
                      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium ${deptBadge[t.department]}`}>
                        {deptLabel[t.department]}
                      </span>
                      {secs > 0 && (
                        <span className="shrink-0 text-xs text-zinc-400 tabular-nums">{formatDuration(secs)}</span>
                      )}
                    </div>
                  )
                })()}

                <div className="flex items-center gap-3">
                  <RoleBadge role={profile.role} />

                  {profile.id !== user.id && (
                    <AdminRoleUpdate
                      userId={profile.id}
                      currentRole={profile.role}
                      userName={profile.full_name ?? profile.email}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Rejected ── */}
        {rejected.length > 0 && (
          <section>
            <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Rejected
              <span className="ml-2 text-sm font-normal text-zinc-400">({rejected.length})</span>
            </h2>
            <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
              {rejected.map((profile: Profile, i: number) => (
                <div
                  key={profile.id}
                  className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${i !== 0 ? 'border-t border-zinc-100 dark:border-zinc-800' : ''}`}
                >
                  <div className="flex items-center gap-3 opacity-60">
                    <Avatar avatarUrl={profile.avatar_url} name={profile.full_name} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{profile.full_name ?? 'No name'}</p>
                      <p className="text-xs text-zinc-400">{profile.email}</p>
                    </div>
                  </div>
                  <AdminReapprove
                    userId={profile.id}
                    userName={profile.full_name ?? profile.email}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Task Overview ── */}
        {tasksByUser.size > 0 && (
          <section>
            <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">Task Overview</h2>
            <div className="space-y-4">
              {[...(allProfiles ?? [])].filter((p: Profile) => tasksByUser.has(p.id)).map((profile: Profile) => {
                const tasks = tasksByUser.get(profile.id) ?? []
                return (
                  <div key={profile.id} className="overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
                    <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
                      <Avatar avatarUrl={profile.avatar_url} name={profile.full_name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          {profile.full_name ?? 'No name'}
                        </p>
                        <p className="truncate text-xs text-zinc-400">{profile.email}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {tasks.map((task: AdminTask) => {
                        const isActive = !task.completed_at
                        const displaySecs = isActive
                          ? snapshotSeconds(task.total_seconds, task.session_started_at)
                          : task.total_seconds
                        return (
                          <div key={task.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3">
                            <span className={`h-2 w-2 shrink-0 rounded-full ${task.session_started_at ? 'bg-emerald-400' : isActive ? 'bg-zinc-300 dark:bg-zinc-600' : 'bg-zinc-200 dark:bg-zinc-700'}`} />
                            <p className="min-w-0 flex-1 truncate text-xs text-zinc-700 dark:text-zinc-300">
                              {task.description}
                            </p>
                            <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium ${deptBadge[task.department]}`}>
                              {deptLabel[task.department]}
                            </span>
                            <span className="shrink-0 text-xs text-zinc-400" title="Created">
                              {new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            {task.completed_at ? (
                              <span className="shrink-0 text-xs text-zinc-400" title="Completed">
                                → {new Date(task.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            ) : (
                              <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                                active
                              </span>
                            )}
                            <AdminTaskTimeEdit taskId={task.id} totalSeconds={displaySecs} />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-zinc-200/80 bg-white/95 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/95 md:hidden">
        <div className="flex h-16 items-center justify-around px-6">
          <Link href="/" className="flex flex-col items-center gap-1 min-w-[3rem]">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
              <svg className="h-4 w-4 text-zinc-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Home</span>
          </Link>
          <Link href="/admin" className="flex flex-col items-center gap-1 min-w-[3rem]">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
              <svg className="h-4 w-4 text-violet-600 dark:text-violet-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400">Admin</span>
          </Link>
        </div>
      </nav>

    </div>
  )
}
