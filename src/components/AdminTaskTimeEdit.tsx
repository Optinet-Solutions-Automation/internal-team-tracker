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
          className="w-12 rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          placeholder="h"
        />
        <span className="text-xs text-zinc-400">h</span>
        <input
          type="number"
          min="0"
          max="59"
          value={m}
          onChange={e => setM(e.target.value)}
          className="w-12 rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          placeholder="m"
        />
        <span className="text-xs text-zinc-400">m</span>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded bg-violet-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50"
        >
          Save
        </button>
        <button
          onClick={() => setEditing(false)}
          className="rounded px-1.5 py-0.5 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs font-medium tabular-nums text-zinc-600 dark:text-zinc-400">
        {totalSeconds > 0 ? formatDuration(totalSeconds) : '—'}
      </span>
      <button
        onClick={handleOpen}
        title="Edit time"
        className="rounded p-0.5 text-zinc-300 hover:text-zinc-500 dark:text-zinc-600 dark:hover:text-zinc-400"
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
    </div>
  )
}
