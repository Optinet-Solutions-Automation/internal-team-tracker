export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import WelcomeHeader from '@/components/WelcomeHeader'
import StatusDropdown from '@/components/StatusDropdown'
import TaskPanel, { type Task, type CompletedTask } from '@/components/TaskPanel'
import { PresenceProvider } from '@/components/PresenceContext'
import SignOutButton from '@/components/SignOutButton'
import TeamSidebar from '@/components/TeamSidebar'
import type { ShiftStatus } from '@/lib/actions/presence'
import type { Department } from '@/lib/actions/tasks'

type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'admin' | 'employee'
  status: 'pending' | 'approved' | 'rejected'
  presence_status: 'online' | 'offline' | 'busy'
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

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <PresenceProvider initialShiftStatus={myShiftStatus}>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">

        {/* ── Top Nav ── */}
        <nav className="sticky top-0 z-20 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/90">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
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

            <div className="flex items-center gap-2">
              <StatusDropdown />
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
        <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
          <div className="flex items-start gap-6">

            {/* Left: dashboard content */}
            <div className="min-w-0 flex-1">
              <WelcomeHeader
                userId={user.id}
                avatarUrl={myProfile.avatar_url}
                name={myProfile.full_name}
                email={myProfile.email}
                role={myProfile.role}
              />
              <TaskPanel initialTasks={myTasks} initialCompleted={myCompleted} />
            </div>

            {/* Right: team sidebar
                w-0 on mobile so it takes no layout space (mobile button is fixed, escapes parent)
                w-64/w-72 on lg+ for the sticky inline sidebar */}
            <div className="w-0 shrink-0 lg:w-64 xl:w-72">
              <TeamSidebar
                members={(teamMembers ?? []) as Profile[]}
                currentTasks={(currentTasksRaw ?? []) as CurrentTask[]}
              />
            </div>

          </div>
        </main>


      </div>
    </PresenceProvider>
  )
}
