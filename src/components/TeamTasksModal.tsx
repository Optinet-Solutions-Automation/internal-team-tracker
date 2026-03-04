'use client'

import { useState, useEffect, useTransition } from 'react'
import { getUserTasks, type UserTask, type Department } from '@/lib/actions/tasks'
import { snapshotSeconds, formatDuration } from '@/lib/utils/time'
import Avatar from './Avatar'

type Member = {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
}

const deptCfg: Record<Department, { label: string; pill: string }> = {
  automation: { label: 'Automation', pill: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' },
  webdev:     { label: 'Web Dev',    pill: 'bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400' },
}

function TaskRow({ task }: { task: UserTask }) {
  const secs = snapshotSeconds(task.total_seconds, task.session_started_at)
  const isActive = !task.completed_at

  return (
    <div className="flex items-start gap-3 rounded-xl px-3 py-2.5">
      <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
        task.session_started_at ? 'bg-emerald-400' :
        isActive ? 'bg-zinc-300 dark:bg-zinc-600' :
        'bg-zinc-200 dark:bg-zinc-700'
      }`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-zinc-800 dark:text-zinc-200">{task.description}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${deptCfg[task.department].pill}`}>
            {deptCfg[task.department].label}
          </span>
          {secs > 0 && (
            <span className="text-xs text-zinc-400 tabular-nums">{formatDuration(secs)}</span>
          )}
          {task.completed_at && (
            <span className="text-xs text-zinc-400">
              · {new Date(task.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {!task.completed_at && task.session_started_at && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              active
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TeamTasksModal({
  member,
  onClose,
}: {
  member: Member
  onClose: () => void
}) {
  const [tasks, setTasks] = useState<UserTask[] | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      const data = await getUserTasks(member.id)
      setTasks(data)
    })
  }, [member.id])

  const active    = tasks?.filter(t => !t.completed_at) ?? []
  const completed = tasks?.filter(t =>  t.completed_at) ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800"
        style={{ maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <Avatar avatarUrl={member.avatar_url} name={member.full_name} size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {member.full_name ?? 'No name'}
            </p>
            <p className="truncate text-xs text-zinc-400">{member.email}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {isPending ? (
            <div className="flex items-center justify-center py-14">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            </div>
          ) : tasks !== null && tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                <svg className="h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-sm text-zinc-500">No tasks yet</p>
            </div>
          ) : (
            <>
              {active.length > 0 && (
                <div className="p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Active · {active.length}
                  </p>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {active.map(t => <TaskRow key={t.id} task={t} />)}
                  </div>
                </div>
              )}
              {completed.length > 0 && (
                <div className={`p-4 ${active.length > 0 ? 'border-t border-zinc-100 dark:border-zinc-800' : ''}`}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Completed · {completed.length}
                  </p>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {completed.map(t => <TaskRow key={t.id} task={t} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
