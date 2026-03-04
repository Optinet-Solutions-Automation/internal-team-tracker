'use client'

import { useState, useTransition } from 'react'
import { approveUser } from '@/lib/actions/users'
import ConfirmDialog from './ConfirmDialog'

export default function AdminReapprove({
  userId,
  userName,
}: {
  userId: string
  userName: string
}) {
  const [selectedRole, setSelectedRole] = useState('employee')
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  function doApprove() {
    setShowConfirm(false)
    const fd = new FormData()
    fd.set('userId', userId)
    fd.set('role', selectedRole)
    startTransition(async () => { await approveUser(fd) })
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <select
          value={selectedRole}
          onChange={e => setSelectedRole(e.target.value)}
          disabled={isPending}
          className="rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        >
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
        </select>
        <button
          onClick={() => setShowConfirm(true)}
          disabled={isPending}
          className="rounded-xl border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Re-approve
        </button>
      </div>

      {showConfirm && (
        <ConfirmDialog
          title="Re-approve user?"
          description={`Restore ${userName}'s access as ${selectedRole}.`}
          confirmLabel="Re-approve"
          onConfirm={doApprove}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  )
}
