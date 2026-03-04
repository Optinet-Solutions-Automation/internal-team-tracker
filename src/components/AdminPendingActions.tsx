'use client'

import { useState, useTransition } from 'react'
import { approveUser, rejectUser } from '@/lib/actions/users'
import ConfirmDialog from './ConfirmDialog'

type Pending = { type: 'approve' } | { type: 'reject' } | null

export default function AdminPendingActions({
  userId,
  userName,
}: {
  userId: string
  userName: string
}) {
  const [selectedRole, setSelectedRole] = useState('employee')
  const [pending, setPending] = useState<Pending>(null)
  const [isPending, startTransition] = useTransition()

  function doApprove() {
    setPending(null)
    const fd = new FormData()
    fd.set('userId', userId)
    fd.set('role', selectedRole)
    startTransition(async () => { await approveUser(fd) })
  }

  function doReject() {
    setPending(null)
    const fd = new FormData()
    fd.set('userId', userId)
    startTransition(async () => { await rejectUser(fd) })
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selectedRole}
          onChange={e => setSelectedRole(e.target.value)}
          disabled={isPending}
          className="rounded-xl border border-yt-border bg-yt-card px-3 py-2 text-xs font-medium text-yt-text focus:outline-none disabled:opacity-60"
        >
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
        </select>
        <button
          onClick={() => setPending({ type: 'approve' })}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-60 active:scale-95"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Approve
        </button>
        <button
          onClick={() => setPending({ type: 'reject' })}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3.5 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Reject
        </button>
      </div>

      {pending?.type === 'approve' && (
        <ConfirmDialog
          title="Approve user?"
          description={`Grant ${userName} access as ${selectedRole}.`}
          confirmLabel="Approve"
          onConfirm={doApprove}
          onCancel={() => setPending(null)}
        />
      )}
      {pending?.type === 'reject' && (
        <ConfirmDialog
          title="Reject user?"
          description={`${userName} will be denied access to the workspace.`}
          confirmLabel="Reject"
          variant="danger"
          onConfirm={doReject}
          onCancel={() => setPending(null)}
        />
      )}
    </>
  )
}
