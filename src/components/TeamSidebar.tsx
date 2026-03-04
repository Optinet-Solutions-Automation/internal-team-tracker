'use client'

import { useState, useEffect, useTransition } from 'react'
import { createPortal } from 'react-dom'
import Avatar from './Avatar'
import TeamTasksModal from './TeamTasksModal'
import { snapshotSeconds, formatDuration } from '@/lib/utils/time'
import type { ShiftStatus } from '@/lib/actions/presence'
import type { Department } from '@/lib/actions/tasks'

type PresenceStatus = 'online' | 'offline' | 'busy'

type Member = {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  role: 'admin' | 'employee'
  presence_status: PresenceStatus
  shift_status: ShiftStatus
}

type CurrentTask = {
  user_id: string
  description: string
  department: Department
  total_seconds: number
  session_started_at: string | null
}

const deptCfg: Record<Department, { label: string; pill: string }> = {
  automation: { label: 'Automation', pill: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' },
  webdev:     { label: 'Web Dev',    pill: 'bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400' },
}

function presenceDot(p?: PresenceStatus) {
  if (p === 'online') return 'bg-emerald-400'
  if (p === 'busy')   return 'bg-red-400'
  return 'bg-yt-text-secondary'
}

function presenceRing(p?: PresenceStatus) {
  if (p === 'online') return 'ring-emerald-400/30'
  if (p === 'busy')   return 'ring-red-400/30'
  return 'ring-yt-border'
}

export default function TeamSidebar({
  members,
  currentTasks,
}: {
  members: Member[]
  currentTasks: CurrentTask[]
}) {
  const [search, setSearch]         = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdown, setDropdown]     = useState<{ id: string; top: number; right: number } | null>(null)
  const [modalMember, setModalMember] = useState<Member | null>(null)
  const [mounted, setMounted]       = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const currentTaskMap = new Map(currentTasks.map(t => [t.user_id, t]))

  const filtered = members
    .filter(m => {
      if (!search) return true
      const q = search.toLowerCase()
      return (m.full_name ?? '').toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      const ao = a.presence_status === 'online' ? 0 : 1
      const bo = b.presence_status === 'online' ? 0 : 1
      if (ao !== bo) return ao - bo
      return (a.full_name ?? a.email).localeCompare(b.full_name ?? b.email)
    })

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdown) return
    function close() { setDropdown(null) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [dropdown])

  // Close mobile sidebar on Escape
  useEffect(() => {
    if (!mobileOpen) return
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') setMobileOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [mobileOpen])

  function openDropdown(e: React.MouseEvent<HTMLButtonElement>, memberId: string) {
    e.stopPropagation()
    if (dropdown?.id === memberId) { setDropdown(null); return }
    const rect = e.currentTarget.getBoundingClientRect()
    setDropdown({ id: memberId, top: rect.bottom + 4, right: window.innerWidth - rect.right })
  }

  const dropdownMember = dropdown ? members.find(m => m.id === dropdown.id) : null
  const dropdownTask   = dropdown ? currentTaskMap.get(dropdown.id) : undefined

  // ── member list (shared between desktop and mobile) ────────
  const MemberList = (
    <div className="flex-1 overflow-y-auto py-1 [scrollbar-color:theme(colors.zinc.300)_transparent] [scrollbar-width:thin]">
      {filtered.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-yt-text-secondary">No members found</p>
      ) : (
        filtered.map(member => {
          const task = currentTaskMap.get(member.id)
          return (
            <div key={member.id} className="px-2">
              <div className="flex items-center gap-2.5 rounded-xl px-2 py-2.5 transition-colors hover:bg-yt-bg-alt">
                {/* Avatar + status dot */}
                <div className="relative shrink-0">
                  <Avatar avatarUrl={member.avatar_url} name={member.full_name} size="sm" />
                  <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-1 ring-yt-card ${presenceDot(member.presence_status)}`} />
                </div>

                {/* Name */}
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-yt-text">
                  {member.full_name ?? 'No name'}
                </p>

                {/* Active task indicator */}
                {task && (
                  <span className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                )}

                {/* … button */}
                <button
                  onClick={e => openDropdown(e, member.id)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-yt-text-secondary transition-colors hover:bg-yt-bg-alt hover:text-yt-text"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
              </div>
            </div>
          )
        })
      )}
    </div>
  )

  // ── search bar (shared) ─────────────────────────────────────
  const SearchBar = (
    <div className="shrink-0 border-b border-yt-border px-3 py-2.5">
      <div className="flex items-center gap-2 rounded-xl bg-yt-bg-alt px-3 py-2">
        <svg className="h-3.5 w-3.5 shrink-0 text-yt-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search members…"
          className="min-w-0 flex-1 bg-transparent text-xs text-yt-text placeholder-yt-text-secondary focus:outline-none"
        />
        {search && (
          <button onClick={() => setSearch('')} className="shrink-0 text-yt-text-secondary hover:text-yt-text">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )

  const onlineCount = members.filter(m => m.presence_status === 'online').length

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────── */}
      <div
        className="sticky top-20 hidden h-[calc(100vh-5.5rem)] w-full flex-col overflow-hidden rounded-2xl bg-yt-card ring-1 ring-yt-border lg:flex"
      >
        {/* Header */}
        <div className="shrink-0 border-b border-yt-border px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-yt-text">Team</h3>
            <div className="flex items-center gap-1.5">
              {onlineCount > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                  {onlineCount} online
                </span>
              )}
              <span className="text-xs text-yt-text-secondary">{members.length} total</span>
            </div>
          </div>
        </div>
        {SearchBar}
        {MemberList}
      </div>

      {/* ── Mobile floating button ──────────────────────────── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-4 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-yt-red text-white shadow-lg shadow-yt-red/30 transition-transform active:scale-95 lg:hidden"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {onlineCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white ring-2 ring-white">
            {onlineCount}
          </span>
        )}
      </button>

      {/* ── Mobile slide-in panel ───────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setTimeout(() => setMobileOpen(false), 80)}
            onTouchEnd={e => e.stopPropagation()}
          />
          <div className="absolute inset-y-0 right-0 flex w-72 flex-col bg-yt-card shadow-2xl">
            {/* Panel header */}
            <div className="flex shrink-0 items-center justify-between border-b border-yt-border px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-yt-text">Team</h3>
                {onlineCount > 0 && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">{onlineCount} online</p>
                )}
              </div>
              <button
                onClick={() => setTimeout(() => setMobileOpen(false), 80)}
                onTouchEnd={e => e.stopPropagation()}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-yt-text-secondary transition-colors hover:bg-yt-bg-alt"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {SearchBar}
            {MemberList}
          </div>
        </div>
      )}

      {/* ── Dropdown portal ─────────────────────────────────── */}
      {mounted && dropdown && dropdownMember && createPortal(
        <div
          style={{ top: dropdown.top, right: dropdown.right }}
          className="fixed z-50 w-60 overflow-hidden rounded-xl bg-yt-card shadow-xl ring-1 ring-yt-border"
          onClick={e => e.stopPropagation()}
        >
          {/* Current task section */}
          <div className="border-b border-yt-border px-4 py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-yt-text-secondary">Current task</p>
            {dropdownTask ? (
              <>
                <span className={`mb-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${deptCfg[dropdownTask.department].pill}`}>
                  {deptCfg[dropdownTask.department].label}
                </span>
                <p className="text-xs leading-relaxed text-yt-text line-clamp-2">
                  {dropdownTask.description}
                </p>
                <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-yt-text-secondary">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatDuration(snapshotSeconds(dropdownTask.total_seconds, dropdownTask.session_started_at))}
                </p>
              </>
            ) : (
              <p className="text-xs text-yt-text-secondary">No active task</p>
            )}
          </div>

          {/* View all tasks */}
          <button
            onClick={() => { setDropdown(null); setModalMember(dropdownMember) }}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-yt-text transition-colors hover:bg-yt-bg-alt"
          >
            <svg className="h-4 w-4 shrink-0 text-yt-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            View all tasks
          </button>
        </div>,
        document.body
      )}

      {/* ── Tasks modal ─────────────────────────────────────── */}
      {modalMember && (
        <TeamTasksModal member={modalMember} onClose={() => setModalMember(null)} />
      )}
    </>
  )
}
