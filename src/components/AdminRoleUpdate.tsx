'use client'

import { useState, useTransition } from 'react'
import { updateUserRole } from '@/lib/actions/users'
import ConfirmDialog from './ConfirmDialog'

export default function AdminRoleUpdate({
  userId,
  currentRole,
  userName,
}: {
  userId: string
  currentRole: 'admin' | 'employee'
  userName: string
}) {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'employee'>(currentRole)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  function doUpdate() {
    setShowConfirm(false)
    const fd = new FormData()
    fd.set('userId', userId)
    fd.set('role', selectedRole)
    startTransition(async () => { await updateUserRole(fd) })
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <select
          value={selectedRole}
          onChange={e => setSelectedRole(e.target.value as 'admin' | 'employee')}
          disabled={isPending}
          className="rounded-xl border border-yt-border bg-yt-card px-2.5 py-1.5 text-xs text-yt-text focus:outline-none disabled:opacity-60"
        >
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
        </select>
        <button
          onClick={() => setShowConfirm(true)}
          disabled={isPending}
          className="rounded-xl border border-yt-border px-2.5 py-1.5 text-xs font-medium text-yt-text-secondary transition-colors hover:bg-yt-bg-alt disabled:opacity-60"
        >
          Update
        </button>
      </div>

      {showConfirm && (
        <ConfirmDialog
          title="Update role?"
          description={`Change ${userName}'s role to ${selectedRole}.`}
          confirmLabel="Update"
          onConfirm={doUpdate}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  )
}
