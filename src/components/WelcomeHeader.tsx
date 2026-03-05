'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AvatarUpload from './AvatarUpload'
import { usePresence } from './PresenceContext'

function presenceDotClass(p: string) {
  if (p === 'online') return 'bg-emerald-400'
  if (p === 'busy')   return 'bg-red-400'
  return 'bg-yt-text-secondary'
}

function presencePulse(p: string) {
  return p === 'online'
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
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
  const router = useRouter()

  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(name ?? '')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const firstName = (editing ? fullName : name)?.split(' ')[0] ?? 'there'

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  async function handleSave() {
    const trimmed = fullName.trim()
    if (!trimmed || trimmed === name) {
      setEditing(false)
      setFullName(name ?? '')
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: trimmed })
      .eq('id', userId)
    setSaving(false)
    if (!error) {
      setEditing(false)
      router.refresh()
    }
  }

  function handleCancel() {
    setFullName(name ?? '')
    setEditing(false)
  }

  return (
    <div className="mb-8 overflow-hidden rounded-2xl bg-yt-card ring-1 ring-yt-border">

      {/* Top accent bar */}
      <div className="h-1 w-full bg-yt-red" />

      <div className="flex items-center gap-4 p-5">
        {/* Avatar with presence ring */}
        <div className="relative shrink-0">
          <AvatarUpload userId={userId} avatarUrl={avatarUrl} name={name} size="lg" />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center">
            {presencePulse(presenceStatus) && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
            )}
            <span className={`relative inline-flex h-3.5 w-3.5 rounded-full ring-2 ring-yt-card ${presenceDotClass(presenceStatus)}`} />
          </span>
        </div>

        {/* Name + details */}
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave()
                  if (e.key === 'Escape') handleCancel()
                }}
                disabled={saving}
                className="min-w-0 flex-1 rounded-lg border border-yt-border bg-yt-surface px-3 py-1.5 text-sm font-semibold text-yt-text outline-none focus:border-yt-red focus:ring-1 focus:ring-yt-red"
                placeholder="Full name"
                maxLength={100}
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className="shrink-0 rounded-lg p-1.5 text-emerald-500 hover:bg-emerald-500/10 disabled:opacity-50"
                title="Save"
              >
                <CheckIcon className="h-4 w-4" />
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="shrink-0 rounded-lg p-1.5 text-yt-text-secondary hover:bg-yt-hover"
                title="Cancel"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="group flex items-center gap-2">
              <h1 className="truncate text-lg font-semibold text-yt-text">
                Welcome back, <span className="text-yt-red">{firstName}</span>
              </h1>
              <button
                onClick={() => setEditing(true)}
                className="shrink-0 rounded-lg p-1 text-yt-text-secondary opacity-0 transition-opacity hover:bg-yt-hover hover:text-yt-text group-hover:opacity-100"
                title="Edit name"
              >
                <PencilIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="truncate text-sm text-yt-text-secondary">{email}</p>
            {role === 'admin' ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-yt-red/10 px-2 py-0.5 text-xs font-medium text-yt-red">
                <span className="h-1.5 w-1.5 rounded-full bg-yt-red" />
                Admin
              </span>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-yt-link/10 px-2 py-0.5 text-xs font-medium text-yt-link">
                <span className="h-1.5 w-1.5 rounded-full bg-yt-link" />
                Employee
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
