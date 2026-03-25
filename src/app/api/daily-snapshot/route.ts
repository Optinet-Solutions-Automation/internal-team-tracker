import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Daily snapshot endpoint — called by Vercel Cron at 23:55 PHT (15:55 UTC).
 *
 * For every user with an active current task, upserts a daily_logs row for
 * today's PHT date. This ensures the daily report captures tasks even when
 * the user never switches tasks across days.
 *
 * Required env vars:
 *   CRON_SECRET              — shared secret between Vercel Cron and this route
 *   SUPABASE_SERVICE_ROLE_KEY — bypasses RLS so we can write logs for all users
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth   = req.headers.get('authorization')

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // PHT date string (UTC+8)
  const phtDateStr = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10)

  // Fetch all currently active tasks
  const { data: activeTasks, error } = await supabase
    .from('tasks')
    .select('id, user_id, description, department')
    .eq('is_current', true)
    .is('completed_at', null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!activeTasks || activeTasks.length === 0) {
    return NextResponse.json({ message: 'No active tasks to log', date: phtDateStr })
  }

  // Upsert one log entry per active task for today's PHT date
  const rows = activeTasks.map(t => ({
    user_id:     t.user_id,
    task_id:     t.id,
    description: t.description,
    department:  t.department,
    log_date:    phtDateStr,
  }))

  const { error: upsertError } = await supabase
    .from('daily_logs')
    .upsert(rows, { onConflict: 'user_id,task_id,log_date' })

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  return NextResponse.json({
    message: `Logged ${rows.length} active task(s) for ${phtDateStr}`,
    count: rows.length,
  })
}
