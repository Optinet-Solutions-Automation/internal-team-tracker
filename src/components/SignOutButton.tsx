'use client'

import { useState, useTransition } from 'react'
import ConfirmDialog from './ConfirmDialog'

export default function SignOutButton({ action }: { action: () => Promise<void> }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isPending}
        className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        <span className="hidden sm:inline">Sign out</span>
        <svg className="h-4 w-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>

      {showConfirm && (
        <ConfirmDialog
          title="Sign out?"
          description="You'll need to sign back in to access the workspace."
          confirmLabel="Sign out"
          onConfirm={() => {
            setShowConfirm(false)
            startTransition(async () => { await action() })
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  )
}
