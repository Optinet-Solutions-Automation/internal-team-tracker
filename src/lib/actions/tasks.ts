'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type Department = 'automation' | 'webdev'

/** Returns today's date string in PHT (UTC+8) as YYYY-MM-DD */
function getPHTDateStr(): string {
  const pht = new Date(Date.now() + 8 * 60 * 60 * 1000)
  return pht.toISOString().slice(0, 10)
}

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

/**
 * Creates a new task and immediately sets it as the current task,
 * stopping any previously running task. Used by the "switch task" modal.
 */
export async function addAndSwitchTask(description: string, department: Department) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const now = new Date()

  // Stop the current task's timer if one is running
  const { data: active } = await supabase
    .from('tasks')
    .select('id, total_seconds, session_started_at')
    .eq('user_id', user.id)
    .eq('is_current', true)
    .is('completed_at', null)
    .maybeSingle()

  if (active) {
    const elapsed = active.session_started_at
      ? Math.floor((now.getTime() - new Date(active.session_started_at).getTime()) / 1000)
      : 0
    await supabase.from('tasks').update({
      is_current: false,
      session_started_at: null,
      total_seconds: active.total_seconds + elapsed,
    }).eq('id', active.id)
  }

  // Create and immediately activate the new task
  const { data: newTask, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      description: description.trim(),
      department,
      is_current: true,
      session_started_at: now.toISOString(),
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  // Log to daily_logs for today's PHT date
  await supabase.from('daily_logs').upsert({
    user_id: user.id,
    task_id: newTask.id,
    description: description.trim(),
    department,
    log_date: getPHTDateStr(),
  }, { onConflict: 'user_id,task_id,log_date' })

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

  // Log to daily_logs — fetch task details for the record
  const { data: taskData } = await supabase
    .from('tasks')
    .select('description, department')
    .eq('id', taskId)
    .single()

  if (taskData) {
    await supabase.from('daily_logs').upsert({
      user_id: user.id,
      task_id: taskId,
      description: taskData.description,
      department: taskData.department,
      log_date: getPHTDateStr(),
    }, { onConflict: 'user_id,task_id,log_date' })
  }

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

export type UserTask = {
  id: string
  description: string
  department: Department
  is_current: boolean
  total_seconds: number
  session_started_at: string | null
  created_at: string
  completed_at: string | null
}

export async function getUserTasks(userId: string): Promise<UserTask[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tasks')
    .select('id, description, department, is_current, total_seconds, session_started_at, created_at, completed_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)
  return (data ?? []) as UserTask[]
}
