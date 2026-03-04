'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  addTask, setCurrentTask, completeTask, updateTask, deleteTask, restoreTask,
  type Department,
} from '@/lib/actions/tasks'
import ConfirmDialog from './ConfirmDialog'

export type Task = {
  id: string
  description: string
  department: Department
  is_current: boolean
  total_seconds: number
  session_started_at: string | null
  created_at: string
}

export type CompletedTask = {
  id: string
  description: string
  department: Department
  total_seconds: number
  completed_at: string
}

// ─── helpers ────────────────────────────────────────────────

function fmt(s: number): string {
  if (s <= 0) return '0m'
  if (s < 60) return '< 1m'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60), rm = m % 60
  if (h < 24) return rm > 0 ? `${h}h ${rm}m` : `${h}h`
  const d = Math.floor(h / 24), rh = h % 24
  return rh > 0 ? `${d}d ${rh}h` : `${d}d`
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ─── sub-components ─────────────────────────────────────────

function LiveTimer({ totalSeconds, sessionStartedAt }: { totalSeconds: number; sessionStartedAt: string | null }) {
  const calc = () =>
    totalSeconds + (sessionStartedAt
      ? Math.floor((Date.now() - new Date(sessionStartedAt).getTime()) / 1000)
      : 0)

  const [elapsed, setElapsed] = useState(calc)

  useEffect(() => {
    if (!sessionStartedAt) { setElapsed(totalSeconds); return }
    setElapsed(calc())
    const id = setInterval(() => setElapsed(calc()), 1000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalSeconds, sessionStartedAt])

  return <span className="tabular-nums">{fmt(elapsed)}</span>
}

const deptCfg = {
  automation: {
    label: 'Automation',
    pill: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    dot:  'bg-amber-400',
  },
  webdev: {
    label: 'Web Dev',
    pill: 'bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400',
    dot:  'bg-sky-400',
  },
} as const

function DeptBadge({ d }: { d: Department }) {
  const c = deptCfg[d]
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${c.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}

function InlineEditForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: { desc: string; dept: Department }
  onSave: (desc: string, dept: Department) => void
  onCancel: () => void
}) {
  const [desc, setDesc] = useState(initial.desc)
  const [dept, setDept] = useState<Department>(initial.dept)
  return (
    <form
      onSubmit={e => { e.preventDefault(); if (desc.trim()) onSave(desc.trim(), dept) }}
      className="flex flex-1 flex-wrap items-center gap-2"
    >
      <input
        autoFocus
        value={desc}
        onChange={e => setDesc(e.target.value)}
        maxLength={120}
        className="min-w-0 flex-1 rounded-xl border border-violet-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-violet-700 dark:bg-zinc-800 dark:text-zinc-50"
      />
      <select
        value={dept}
        onChange={e => setDept(e.target.value as Department)}
        className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      >
        <option value="automation">Automation</option>
        <option value="webdev">Web Dev</option>
      </select>
      <div className="flex gap-1.5">
        <button type="submit" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </button>
        <button type="button" onClick={onCancel} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </form>
  )
}

// ─── dots menu ───────────────────────────────────────────────

type MenuItem = {
  label: string
  icon: React.ReactNode
  onClick: () => void
  danger?: boolean
}

function DotsMenu({ menuId, openMenu, setOpenMenu, items }: {
  menuId: string
  openMenu: string | null
  setOpenMenu: (id: string | null) => void
  items: MenuItem[]
}) {
  const isOpen = openMenu === menuId
  return (
    <div className="relative shrink-0">
      <button
        onClick={e => { e.stopPropagation(); setOpenMenu(isOpen ? null : menuId) }}
        className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-xl bg-white py-1 shadow-lg ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700"
          onClick={e => e.stopPropagation()}
        >
          {items.map(item => (
            <button
              key={item.label}
              onClick={() => { setOpenMenu(null); item.onClick() }}
              className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition-colors
                ${item.danger
                  ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                  : 'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-700'
                }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── icons ───────────────────────────────────────────────────

const EditIcon = (
  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const CheckIcon = (
  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
)

const DeleteIcon = (
  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const RestoreIcon = (
  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
  </svg>
)

// ─── main component ─────────────────────────────────────────

export default function TaskPanel({
  initialTasks,
  initialCompleted,
}: {
  initialTasks: Task[]
  initialCompleted: CompletedTask[]
}) {
  const [tasks, setTasks]         = useState<Task[]>(initialTasks)
  const [completed, setCompleted] = useState<CompletedTask[]>(initialCompleted)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAdd, setShowAdd]     = useState(false)
  const [showDone, setShowDone]   = useState(false)
  const [newDesc, setNewDesc]     = useState('')
  const [newDept, setNewDept]     = useState<Department>('automation')
  const [isPending, startTransition] = useTransition()
  const [confirm, setConfirm] = useState<{ action: 'delete' | 'complete' | 'restore'; id: string } | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  useEffect(() => { setTasks(initialTasks) },    [initialTasks])
  useEffect(() => { setCompleted(initialCompleted) }, [initialCompleted])

  // Close any open menu when clicking outside
  useEffect(() => {
    if (!openMenu) return
    function close() { setOpenMenu(null) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [openMenu])

  // ── handlers ──────────────────────────────────────────────

  function handleSetCurrent(id: string) {
    const now = new Date()
    setTasks(prev => prev.map(t => {
      if (t.id === id)
        return { ...t, is_current: true, session_started_at: now.toISOString() }
      if (t.is_current) {
        const elapsed = t.session_started_at
          ? Math.floor((now.getTime() - new Date(t.session_started_at).getTime()) / 1000) : 0
        return { ...t, is_current: false, session_started_at: null, total_seconds: t.total_seconds + elapsed }
      }
      return t
    }))
    startTransition(async () => {
      try { await setCurrentTask(id) } catch { setTasks(initialTasks) }
    })
  }

  function handleComplete(id: string) {
    setConfirm({ action: 'complete', id })
  }

  function confirmComplete(id: string) {
    const now = new Date()
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const elapsed = task.session_started_at
      ? Math.floor((now.getTime() - new Date(task.session_started_at).getTime()) / 1000) : 0
    const finalSecs = task.total_seconds + elapsed
    setTasks(prev => prev.filter(t => t.id !== id))
    setCompleted(prev => [{
      id, description: task.description, department: task.department,
      total_seconds: finalSecs, completed_at: now.toISOString(),
    }, ...prev])
    startTransition(async () => {
      try { await completeTask(id) } catch { setTasks(initialTasks); setCompleted(initialCompleted) }
    })
  }

  function handleEdit(id: string, desc: string, dept: Department) {
    setEditingId(null)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, description: desc, department: dept } : t))
    startTransition(async () => {
      try { await updateTask(id, desc, dept) } catch { setTasks(initialTasks) }
    })
  }

  function handleDelete(id: string) {
    setConfirm({ action: 'delete', id })
  }

  function confirmDelete(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id))
    startTransition(async () => {
      try { await deleteTask(id) } catch { setTasks(initialTasks) }
    })
  }

  function handleRestore(id: string) {
    setConfirm({ action: 'restore', id })
  }

  function confirmRestore(id: string) {
    const task = completed.find(t => t.id === id)
    if (!task) return
    setCompleted(prev => prev.filter(t => t.id !== id))
    setTasks(prev => [...prev, {
      id: task.id,
      description: task.description,
      department: task.department,
      is_current: false,
      total_seconds: task.total_seconds,
      session_started_at: null,
      created_at: new Date().toISOString(),
    }])
    startTransition(async () => {
      try { await restoreTask(id) } catch { setTasks(initialTasks); setCompleted(initialCompleted) }
    })
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newDesc.trim()) return
    setNewDesc('')
    setShowAdd(false)
    startTransition(() => addTask(newDesc.trim(), newDept))
  }

  const current = tasks.find(t => t.is_current)
  const queue   = tasks.filter(t => !t.is_current)

  // ── render ────────────────────────────────────────────────

  return (
    <>
    <section className="mb-8">

      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">My Tasks</h2>
          {tasks.length > 0 && (
            <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-zinc-200 px-1.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
              {tasks.length}
            </span>
          )}
        </div>
        <button
          onClick={() => { setShowAdd(v => !v); setNewDesc('') }}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 active:scale-95
            ${showAdd
              ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
              : 'bg-violet-600 text-white shadow-sm shadow-violet-600/25 hover:bg-violet-700'}`}
        >
          {showAdd ? (
            <>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Add Task
            </>
          )}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="mb-3 overflow-hidden rounded-2xl bg-white ring-2 ring-violet-300 dark:bg-zinc-900 dark:ring-violet-700/60">
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <input
              autoFocus
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="What are you working on?"
              maxLength={120}
              className="min-w-0 flex-1 bg-transparent text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none dark:text-zinc-50"
            />
            <div className="flex items-center gap-2">
              <select
                value={newDept}
                onChange={e => setNewDept(e.target.value as Department)}
                className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 sm:flex-none"
              >
                <option value="automation">Automation</option>
                <option value="webdev">Web Dev</option>
              </select>
              <button
                type="submit"
                disabled={!newDesc.trim() || isPending}
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-violet-700 disabled:opacity-50 active:scale-95"
              >
                Add
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Empty */}
      {tasks.length === 0 && !showAdd && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-12 dark:border-zinc-800">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
            <svg className="h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">No active tasks</p>
          <p className="mt-1 text-xs text-zinc-400">Add one to let your team know what you&apos;re working on.</p>
        </div>
      )}

      {tasks.length > 0 && (
        <div className="space-y-2">

          {/* Currently working on */}
          {current && (
            <div className="rounded-2xl bg-white ring-2 ring-violet-300 dark:bg-zinc-900 dark:ring-violet-700/60">
              {/* Active header */}
              <div className="flex items-center justify-between rounded-t-2xl bg-violet-50 px-4 py-2.5 dark:bg-violet-900/20">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-500 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                    Currently working on
                  </p>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <LiveTimer totalSeconds={current.total_seconds} sessionStartedAt={current.session_started_at} />
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 px-4 py-3.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                  <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
                </span>
                {editingId === current.id ? (
                  <InlineEditForm
                    initial={{ desc: current.description, dept: current.department }}
                    onSave={(d, dept) => handleEdit(current.id, d, dept)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <p className="min-w-0 flex-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {current.description}
                    </p>
                    <DeptBadge d={current.department} />
                    <DotsMenu
                      menuId={`current-${current.id}`}
                      openMenu={openMenu}
                      setOpenMenu={setOpenMenu}
                      items={[
                        { label: 'Edit', icon: EditIcon, onClick: () => setEditingId(current.id) },
                        { label: 'Mark as done', icon: CheckIcon, onClick: () => handleComplete(current.id) },
                        { label: 'Delete', icon: DeleteIcon, onClick: () => handleDelete(current.id), danger: true },
                      ]}
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Queue */}
          {queue.length > 0 && (
            <div className="rounded-2xl bg-white ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
              <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {current ? 'In Progress' : 'Task queue'}
                </p>
                {current && (
                  <span className="text-xs text-zinc-400">— double-click to switch</span>
                )}
              </div>
              {queue.map((task, i) => (
                <div
                  key={task.id}
                  className={`group flex items-center gap-3 px-4 py-3 ${i !== 0 ? 'border-t border-zinc-100 dark:border-zinc-800' : ''}`}
                >
                  {editingId === task.id ? (
                    <>
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                        <span className="h-2.5 w-2.5 rounded-full border-2 border-zinc-300 dark:border-zinc-600" />
                      </span>
                      <InlineEditForm
                        initial={{ desc: task.description, dept: task.department }}
                        onSave={(d, dept) => handleEdit(task.id, d, dept)}
                        onCancel={() => setEditingId(null)}
                      />
                    </>
                  ) : (
                    <>
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                        <span className="h-2.5 w-2.5 rounded-full border-2 border-zinc-300 dark:border-zinc-600" />
                      </span>
                      <div
                        className="flex min-w-0 flex-1 items-center gap-3"
                        onDoubleClick={() => handleSetCurrent(task.id)}
                        title="Double-click to switch to this task"
                      >
                        <p className="min-w-0 flex-1 truncate text-sm text-zinc-700 dark:text-zinc-300">
                          {task.description}
                        </p>
                        <DeptBadge d={task.department} />
                        {task.total_seconds > 0 && (
                          <span className="shrink-0 text-xs text-zinc-400 tabular-nums">
                            {fmt(task.total_seconds)}
                          </span>
                        )}
                      </div>
                      <DotsMenu
                        menuId={task.id}
                        openMenu={openMenu}
                        setOpenMenu={setOpenMenu}
                        items={[
                          { label: 'Edit', icon: EditIcon, onClick: () => setEditingId(task.id) },
                          { label: 'Mark as done', icon: CheckIcon, onClick: () => handleComplete(task.id) },
                          { label: 'Delete', icon: DeleteIcon, onClick: () => handleDelete(task.id), danger: true },
                        ]}
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* Completed tasks */}
      {completed.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowDone(v => !v)}
            className="flex items-center gap-2 rounded-lg px-1 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <svg
              className={`h-3.5 w-3.5 transition-transform duration-200 ${showDone ? 'rotate-90' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
            Completed ({completed.length})
          </button>

          {showDone && (
            <div className="mt-2 rounded-2xl bg-white ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
              {completed.map((task, i) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 px-4 py-3 ${i !== 0 ? 'border-t border-zinc-100 dark:border-zinc-800' : ''}`}
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20">
                    <svg className="h-3 w-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="min-w-0 flex-1 truncate text-sm text-zinc-500 dark:text-zinc-500">
                    {task.description}
                  </p>
                  <DeptBadge d={task.department} />
                  <span className="shrink-0 text-xs font-medium text-zinc-500 tabular-nums">
                    {fmt(task.total_seconds)}
                  </span>
                  <span className="hidden shrink-0 text-xs text-zinc-400 sm:inline">
                    {timeAgo(task.completed_at)}
                  </span>
                  <DotsMenu
                    menuId={`done-${task.id}`}
                    openMenu={openMenu}
                    setOpenMenu={setOpenMenu}
                    items={[
                      { label: 'Restore', icon: RestoreIcon, onClick: () => handleRestore(task.id) },
                    ]}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </section>

    {confirm && (
      <ConfirmDialog
        title={
          confirm.action === 'delete'   ? 'Delete task?' :
          confirm.action === 'complete' ? 'Mark as done?' :
          'Restore task?'
        }
        description={
          confirm.action === 'delete'   ? 'This will permanently remove the task and its tracked time.' :
          confirm.action === 'complete' ? 'This will move the task to your completed list.' :
          'This will move the task back to your active queue.'
        }
        confirmLabel={
          confirm.action === 'delete'   ? 'Delete' :
          confirm.action === 'complete' ? 'Mark done' :
          'Restore'
        }
        variant={confirm.action === 'delete' ? 'danger' : 'default'}
        onConfirm={() => {
          const id = confirm.id
          setConfirm(null)
          if (confirm.action === 'delete')        confirmDelete(id)
          else if (confirm.action === 'complete') confirmComplete(id)
          else                                    confirmRestore(id)
        }}
        onCancel={() => setConfirm(null)}
      />
    )}
    </>
  )
}
