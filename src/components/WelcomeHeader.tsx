'use client'

import AvatarUpload from './AvatarUpload'
import { usePresence } from './PresenceContext'

function presenceDotClass(p: string) {
  if (p === 'online') return 'bg-emerald-400'
  if (p === 'busy')   return 'bg-red-400'
  return 'bg-zinc-300 dark:bg-zinc-600'
}

function presencePulse(p: string) {
  return p === 'online'
}

export default function WelcomeHeader({
  userId,
  avatarUrl,
  name,
  email,
  role,
}: {
  userId: string
  avatarUrl: string | null
  name: string | null
  email: string
  role: 'admin' | 'employee'
}) {
  const { presenceStatus } = usePresence()
  const firstName = name?.split(' ')[0] ?? 'there'

  return (
    <div className="mb-8 overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">

      {/* Top accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />

      <div className="flex items-center gap-4 p-5">
        {/* Avatar with presence ring */}
        <div className="relative shrink-0">
          <AvatarUpload userId={userId} avatarUrl={avatarUrl} name={name} size="lg" />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center">
            {presencePulse(presenceStatus) && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
            )}
            <span className={`relative inline-flex h-3.5 w-3.5 rounded-full ring-2 ring-white dark:ring-zinc-900 ${presenceDotClass(presenceStatus)}`} />
          </span>
        </div>

        {/* Name + details */}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Welcome back, <span className="text-violet-600 dark:text-violet-400">{firstName}</span>
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">{email}</p>
            {role === 'admin' ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                Admin
              </span>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                Employee
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
