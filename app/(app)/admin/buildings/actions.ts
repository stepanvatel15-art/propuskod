'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type ActionResult = { ok: true } | { error: string }

async function assertCallerIsAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' } as const

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { error: 'Недостаточно прав' } as const
  return { ok: true as const, supabase }
}

export async function createBuildingAction(name: string): Promise<ActionResult> {
  const auth = await assertCallerIsAdmin()
  if ('error' in auth) return auth
  if (!name.trim()) return { error: 'Укажите название корпуса' }

  const { error } = await auth.supabase.from('buildings').insert({ name: name.trim() })
  if (error) return { error: error.message }
  revalidatePath('/admin/buildings')
  revalidatePath('/admin/classes')
  return { ok: true }
}
