'use client'

import { useState, useTransition } from 'react'
import { adminSetTaskTime } from '@/lib/actions/tasks'
import { formatDuration } from '@/lib/utils/time'

export default function AdminTaskTimeEdit({
  taskId,
  totalSeconds,
}: {
  taskId: string
  totalSeconds: number
}) {
  const [editing, setEditing] = useState(false)
  const [h, setH] = useState(String(Math.floor(totalSeconds / 3600)))
  const [m, setM] = useState(String(Math.floor((totalSeconds % 3600) / 60)))
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    const secs = (parseInt(h || '0') * 3600) + (parseInt(m || '0') * 60)
    startTransition(async () => {
      await adminSetTaskTime(taskId, secs)
      setEditing(false)
    })
  }

  function handleOpen() {
    setH(String(Math.floor(totalSeconds / 3600)))
    setM(String(Math.floor((totalSeconds % 3600) / 60)))
    setEditing(true)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number"
          min="0"
          value={h}
          onChange={e => setH(e.target.value)}
          className="w-12 rounded border border-yt-border bg-yt-card px-1.5 py-0.5 text-xs text-yt-text focus:outline-none"
          placeholder="h"
        />
        <span className="text-xs text-yt-text-secondary">h</span>
        <input
          type="number"
          min="0"
          max="59"
          value={m}
          onChange={e => setM(e.target.value)}
          className="w-12 rounded border border-yt-border bg-yt-card px-1.5 py-0.5 text-xs text-yt-text focus:outline-none"
          placeholder="m"
        />
        <span className="text-xs text-yt-text-secondary">m</span>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded bg-yt-red px-2 py-0.5 text-xs font-medium text-white hover:bg-yt-red-hover disabled:opacity-50"
        >
          Save
        </button>
        <button
          onClick={() => setEditing(false)}
          className="rounded px-1.5 py-0.5 text-xs text-yt-text-secondary hover:text-yt-text"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs font-medium tabular-nums text-yt-text-secondary">
        {totalSeconds > 0 ? formatDuration(totalSeconds) : '—'}
      </span>
      <button
        onClick={handleOpen}
        title="Edit time"
        className="rounded p-0.5 text-yt-text-secondary hover:text-yt-text"
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
    </div>
  )
}
