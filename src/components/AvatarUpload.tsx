'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v1.2h19.2v-1.2c0-3.2-6.4-4.8-9.6-4.8z" />
    </svg>
  )
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

type Props = {
  userId: string
  avatarUrl: string | null
  name: string | null
  size?: 'lg' | 'xl'
}

const sizeMap = {
  lg: { wrap: 'h-14 w-14', icon: 'h-7 w-7', camera: 'h-5 w-5' },
  xl: { wrap: 'h-20 w-20', icon: 'h-10 w-10', camera: 'h-6 w-6' },
}

export default function AvatarUpload({ userId, avatarUrl, name, size = 'lg' }: Props) {
  const [preview, setPreview] = useState(avatarUrl)
  const [imgFailed, setImgFailed] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { wrap, icon, camera } = sizeMap[size]

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate: image only, max 2MB
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB.')
      return
    }

    setError(null)
    setUploading(true)

    // Local preview immediately
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${userId}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      // Add cache-busting timestamp so the browser fetches the new image
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) throw updateError

      setPreview(publicUrl)
      setImgFailed(false)
      router.refresh()
    } catch {
      setError('Upload failed. Please try again.')
      setPreview(avatarUrl) // revert
    } finally {
      setUploading(false)
      // Reset file input so the same file can be re-selected
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !uploading && fileRef.current?.click()}
        className="group relative cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
        title="Update profile photo"
        disabled={uploading}
      >
        {/* Avatar image or fallback icon */}
        {preview && !imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt={name ?? 'Avatar'}
            className={`${wrap} rounded-full object-cover ring-2 ring-white dark:ring-zinc-900`}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className={`${wrap} flex items-center justify-center rounded-full bg-violet-100 text-violet-500 ring-2 ring-white dark:bg-violet-900/30 dark:text-violet-400 dark:ring-zinc-900`}>
            <UserIcon className={icon} />
          </div>
        )}

        {/* Camera overlay on hover / spinner while uploading */}
        <div className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/40 transition-opacity ${uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {uploading ? (
            <svg className={`${camera} animate-spin text-white`} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <CameraIcon className={`${camera} text-white`} />
          )}
        </div>
      </button>

      {error && (
        <p className="absolute left-1/2 top-full mt-1 w-max -translate-x-1/2 text-xs text-red-500 dark:text-red-400">{error}</p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
