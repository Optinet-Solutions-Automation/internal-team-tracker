'use client'

import { useState } from 'react'

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v1.2h19.2v-1.2c0-3.2-6.4-4.8-9.6-4.8z" />
    </svg>
  )
}

type AvatarProps = {
  avatarUrl: string | null | undefined
  name: string | null | undefined
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

const sizeMap = {
  xs: { wrap: 'h-6 w-6',   icon: 'h-3.5 w-3.5' },
  sm: { wrap: 'h-8 w-8',   icon: 'h-4 w-4'      },
  md: { wrap: 'h-10 w-10', icon: 'h-5 w-5'       },
  lg: { wrap: 'h-14 w-14', icon: 'h-7 w-7'       },
  xl: { wrap: 'h-20 w-20', icon: 'h-10 w-10'     },
}

export default function Avatar({ avatarUrl, name, size = 'md' }: AvatarProps) {
  const [imgError, setImgError] = useState(false)
  const { wrap, icon } = sizeMap[size]

  const showImage = avatarUrl && !imgError

  if (showImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name ?? 'Avatar'}
        className={`${wrap} rounded-full object-cover`}
        onError={() => setImgError(true)}
      />
    )
  }

  return (
    <div
      className={`${wrap} flex items-center justify-center rounded-full bg-violet-100 text-violet-500 dark:bg-violet-900/30 dark:text-violet-400`}
    >
      <UserIcon className={icon} />
    </div>
  )
}
