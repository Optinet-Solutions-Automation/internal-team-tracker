'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function getAdminOrThrow() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' || profile?.status !== 'approved') {
    throw new Error('Unauthorized')
  }

  return { supabase, adminId: user.id }
}

export async function approveUser(formData: FormData) {
  const { supabase, adminId } = await getAdminOrThrow()
  const userId = formData.get('userId') as string
  const role = (formData.get('role') as string) || 'employee'

  await supabase
    .from('profiles')
    .update({
      status: 'approved',
      role,
      approved_by: adminId,
      approved_at: new Date().toISOString(),
    })
    .eq('id', userId)

  revalidatePath('/admin')
}

export async function rejectUser(formData: FormData) {
  const { supabase } = await getAdminOrThrow()
  const userId = formData.get('userId') as string

  await supabase
    .from('profiles')
    .update({ status: 'rejected' })
    .eq('id', userId)

  revalidatePath('/admin')
}

export async function updateUserRole(formData: FormData) {
  const { supabase } = await getAdminOrThrow()
  const userId = formData.get('userId') as string
  const role = formData.get('role') as string

  await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  revalidatePath('/admin')
}
