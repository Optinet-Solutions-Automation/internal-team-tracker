'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type Department = 'automation' | 'webdev'

export async function addTask(description: string, department: Department) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('tasks')
    .insert({ user_id: user.id, description: description.trim(), department })

  if (error) throw new Error(error.message)
  revalidatePath('/')
}

export async function setCurrentTask(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const now = new Date()

  // Find the currently active task (if any) to stop its timer
  const { data: active } = await supabase
    .from('tasks')
    .select('id, total_seconds, session_started_at')
    .eq('user_id', user.id)
    .eq('is_current', true)
    .is('completed_at', null)
    .maybeSingle()

  if (active) {
    // Same task — nothing to do
    if (active.id === taskId) return

    // Stop the timer for the previously active task
    const elapsed = active.session_started_at
      ? Math.floor((now.getTime() - new Date(active.session_started_at).getTime()) / 1000)
      : 0

    await supabase
      .from('tasks')
      .update({
        is_current: false,
        session_started_at: null,
        total_seconds: active.total_seconds + elapsed,
      })
      .eq('id', active.id)
  }

  // Start timer on the new task
  const { error } = await supabase
    .from('tasks')
    .update({ is_current: true, session_started_at: now.toISOString() })
    .eq('id', taskId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/')
}

export async function completeTask(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const now = new Date()

  const { data: task } = await supabase
    .from('tasks')
    .select('total_seconds, session_started_at')
    .eq('id', taskId)
    .eq('user_id', user.id)
    .single()

  if (!task) throw new Error('Task not found')

  const elapsed = task.session_started_at
    ? Math.floor((now.getTime() - new Date(task.session_started_at).getTime()) / 1000)
    : 0

  const { error } = await supabase
    .from('tasks')
    .update({
      completed_at: now.toISOString(),
      is_current: false,
      session_started_at: null,
      total_seconds: task.total_seconds + elapsed,
    })
    .eq('id', taskId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/')
}

export async function updateTask(taskId: string, description: string, department: Department) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('tasks')
    .update({ description: description.trim(), department })
    .eq('id', taskId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/')
}

export async function restoreTask(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('tasks')
    .update({ completed_at: null, is_current: false, session_started_at: null })
    .eq('id', taskId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/')
}

export async function adminSetTaskTime(taskId: string, totalSeconds: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('Forbidden')

  // If the task is currently running, reset session_started_at to now
  // so the new total_seconds becomes the correct base going forward
  const { data: task } = await supabase
    .from('tasks')
    .select('session_started_at')
    .eq('id', taskId)
    .single()

  const update: Record<string, unknown> = { total_seconds: totalSeconds }
  if (task?.session_started_at) {
    update.session_started_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('tasks')
    .update(update)
    .eq('id', taskId)

  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/admin')
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/')
}
