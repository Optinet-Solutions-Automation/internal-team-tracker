'use client'

import { createContext, useContext, useState } from 'react'
import type { ShiftStatus } from '@/lib/actions/presence'

export type PresenceStatus = 'online' | 'offline' | 'busy'

export const shiftToPresence: Record<ShiftStatus, PresenceStatus> = {
  off_shift:      'offline',
  available:      'online',
  busy:           'busy',
  do_not_disturb: 'busy',
  be_right_back:  'offline',
  appear_away:    'offline',
}

type PresenceContextValue = {
  shiftStatus: ShiftStatus
  presenceStatus: PresenceStatus
  setShiftStatus: (s: ShiftStatus) => void
}

const PresenceContext = createContext<PresenceContextValue | null>(null)

export function PresenceProvider({
  children,
  initialShiftStatus,
}: {
  children: React.ReactNode
  initialShiftStatus: ShiftStatus
}) {
  const [shiftStatus, setShiftStatus] = useState<ShiftStatus>(initialShiftStatus)
  return (
    <PresenceContext.Provider
      value={{
        shiftStatus,
        presenceStatus: shiftToPresence[shiftStatus],
        setShiftStatus,
      }}
    >
      {children}
    </PresenceContext.Provider>
  )
}

export function usePresence() {
  const ctx = useContext(PresenceContext)
  if (!ctx) throw new Error('usePresence must be used inside <PresenceProvider>')
  return ctx
}
