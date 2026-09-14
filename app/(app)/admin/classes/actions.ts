'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function assertCallerIsAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Не авторизован')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('Недостаточно прав')
  return supabase
}

export async function createClassAction(name: string) {
  const supabase = await assertCallerIsAdmin()
  if (!name.trim()) throw new Error('Укажите название класса')

  const { error } = await supabase.from('classes').insert({ name: name.trim() })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/classes')
}

export async function assignTeacherAction(classId: string, teacherId: string | null) {
  const supabase = await assertCallerIsAdmin()

  const { error } = await supabase
    .from('classes')
    .update({ homeroom_teacher_id: teacherId })
    .eq('id', classId)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/classes')
}
