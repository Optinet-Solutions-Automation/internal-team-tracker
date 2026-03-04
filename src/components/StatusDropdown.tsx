'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { updatePresence, type ShiftStatus } from '@/lib/actions/presence'
import { usePresence, shiftToPresence } from './PresenceContext'
import type { PresenceStatus } from './PresenceContext'

const statusLabel: Record<ShiftStatus, string> = {
  off_shift:      'Off Shift',
  available:      'Available',
  busy:           'Busy',
  do_not_disturb: 'Do Not Disturb',
  be_right_back:  'Be Right Back',
  appear_away:    'Appear Away',
}

const WORK_STATUSES: { value: ShiftStatus; label: string; description: string }[] = [
  { value: 'available',      label: 'Available',       description: 'Ready to collaborate' },
  { value: 'busy',           label: 'Busy',            description: 'Occupied but reachable' },
  { value: 'do_not_disturb', label: 'Do Not Disturb',  description: 'Focused — hold messages' },
  { value: 'be_right_back',  label: 'Be Right Back',   description: 'Stepping away briefly' },
  { value: 'appear_away',    label: 'Appear Away',     description: 'Show as away' },
]

function presenceDotClass(p: PresenceStatus) {
  if (p === 'online') return 'bg-emerald-400'
  if (p === 'busy')   return 'bg-red-400'
  return 'bg-yt-text-secondary'
}

export default function StatusDropdown() {
  const { shiftStatus, presenceStatus, setShiftStatus } = usePresence()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)
  const isOnShift = shiftStatus !== 'off_shift'

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function select(status: ShiftStatus) {
    const prev = shiftStatus
    setShiftStatus(status)
    setOpen(false)
    startTransition(async () => {
      try {
        await updatePresence(status)
      } catch {
        setShiftStatus(prev)
      }
    })
  }

  const dotClass = presenceDotClass(presenceStatus)

  return (
    <div ref={ref} className="flex items-center gap-2">

      {/* Status pill — always visible, left side */}
      <div className="relative">
        <button
          onClick={() => { if (isOnShift) setOpen(v => !v) }}
          disabled={isPending}
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all
            ${isOnShift
              ? `border-yt-border bg-yt-card text-yt-text hover:border-yt-text-secondary hover:bg-yt-bg-alt
                 ${open ? 'ring-2 ring-yt-red/30' : ''}`
              : 'cursor-default border-yt-border bg-yt-bg-alt text-yt-text-secondary'
            }
            ${isPending ? 'opacity-60' : ''}`}
        >
          <span className="relative flex h-2 w-2 shrink-0">
            {presenceStatus === 'online' && isOnShift && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            )}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${isOnShift ? dotClass : 'bg-yt-text-secondary'}`} />
          </span>
          <span>{statusLabel[shiftStatus]}</span>
          {isOnShift && (
            <svg
              className={`h-3 w-3 text-yt-text-secondary transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>

        {open && isOnShift && (
          <div className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-2xl border border-yt-border bg-yt-card shadow-xl">
            <div className="px-2 py-2">
              {WORK_STATUSES.map((item) => {
                const isActive = shiftStatus === item.value
                const itemPresence = shiftToPresence[item.value]
                return (
                  <button
                    key={item.value}
                    onClick={() => select(item.value)}
                    className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors
                      ${isActive
                        ? 'bg-yt-red/10'
                        : 'hover:bg-yt-bg-alt'
                      }`}
                  >
                    <span className={`h-2 w-2 shrink-0 rounded-full ${presenceDotClass(itemPresence)}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-medium ${isActive ? 'text-yt-red' : 'text-yt-text'}`}>
                        {item.label}
                      </p>
                      <p className="text-xs text-yt-text-secondary">{item.description}</p>
                    </div>
                    {isActive && (
                      <svg className="h-3.5 w-3.5 shrink-0 text-yt-red" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Shift toggle — right side, stays fixed */}
      <button
        onClick={() => select(isOnShift ? 'off_shift' : 'available')}
        disabled={isPending}
        title={isOnShift ? 'End Shift' : 'Start Shift'}
        className="flex shrink-0 items-center disabled:opacity-60"
      >
        <div className={`relative h-4 w-7 overflow-hidden rounded-full transition-colors duration-200 ${isOnShift ? 'bg-emerald-500' : 'bg-yt-text-secondary'}`}>
          <span className={`absolute left-0 top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-200 ${isOnShift ? 'translate-x-[14px]' : 'translate-x-[2px]'}`} />
        </div>
      </button>

    </div>
  )
}
