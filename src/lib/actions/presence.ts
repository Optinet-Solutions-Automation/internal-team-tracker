'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ShiftStatus = 'off_shift' | 'available' | 'busy' | 'do_not_disturb' | 'be_right_back' | 'appear_away'

const shiftToPresence: Record<ShiftStatus, 'online' | 'offline' | 'busy'> = {
  off_shift:      'offline',
  available:      'online',
  busy:           'busy',
  do_not_disturb: 'busy',
  be_right_back:  'offline',
  appear_away:    'offline',
}

const PAUSE_STATUSES: ShiftStatus[] = ['off_shift', 'be_right_back', 'appear_away']
const RESUME_STATUSES: ShiftStatus[] = ['available', 'busy', 'do_not_disturb']

export async function updatePresence(shiftStatus: ShiftStatus) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const now = new Date()

  if (PAUSE_STATUSES.includes(shiftStatus)) {
    // Find the actively running task and pause its timer
    const { data: active } = await supabase
      .from('tasks')
      .select('id, total_seconds, session_started_at')
      .eq('user_id', user.id)
      .eq('is_current', true)
      .is('completed_at', null)
      .not('session_started_at', 'is', null)
      .maybeSingle()

    if (active) {
      const elapsed = Math.floor(
        (now.getTime() - new Date(active.session_started_at).getTime()) / 1000
      )
      await supabase
        .from('tasks')
        .update({ session_started_at: null, total_seconds: active.total_seconds + elapsed })
        .eq('id', active.id)
    }
  } else if (RESUME_STATUSES.includes(shiftStatus)) {
    // Find the paused current task and resume its timer
    const { data: paused } = await supabase
      .from('tasks')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_current', true)
      .is('completed_at', null)
      .is('session_started_at', null)
      .maybeSingle()

    if (paused) {
      await supabase
        .from('tasks')
        .update({ session_started_at: now.toISOString() })
        .eq('id', paused.id)
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      shift_status: shiftStatus,
      presence_status: shiftToPresence[shiftStatus],
      status_updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/')
}
