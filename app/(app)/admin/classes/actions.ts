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

export async function createClassAction(name: string): Promise<ActionResult> {
  const auth = await assertCallerIsAdmin()
  if ('error' in auth) return auth
  if (!name.trim()) return { error: 'Укажите название класса' }

  const { error } = await auth.supabase.from('classes').insert({ name: name.trim() })
  if (error) return { error: error.message }
  revalidatePath('/admin/classes')
  return { ok: true }
}

export async function assignTeacherAction(classId: string, teacherId: string | null): Promise<ActionResult> {
  const auth = await assertCallerIsAdmin()
  if ('error' in auth) return auth

  const { error } = await auth.supabase
    .from('classes')
    .update({ homeroom_teacher_id: teacherId })
    .eq('id', classId)

  if (error) return { error: error.message }
  revalidatePath('/admin/classes')
  return { ok: true }
}

export async function assignBuildingAction(classId: string, buildingId: string | null): Promise<ActionResult> {
  const auth = await assertCallerIsAdmin()
  if ('error' in auth) return auth

  const { error } = await auth.supabase
    .from('classes')
    .update({ building_id: buildingId })
    .eq('id', classId)

  if (error) return { error: error.message }
  revalidatePath('/admin/classes')
  return { ok: true }
}

/** Удаление класса. Каскадно удалит его учеников (и их пропуска — история
 *  тоже уйдёт вместе с ними). Если у класса уже есть история пропусков,
 *  прямое удаление заблокировано на уровне базы — даём понятную причину
 *  вместо сырой ошибки Postgres. */
export async function deleteClassAction(classId: string): Promise<ActionResult> {
  const auth = await assertCallerIsAdmin()
  if ('error' in auth) return auth

  const { error } = await auth.supabase.from('classes').delete().eq('id', classId)

  if (error) {
    if (error.code === '23503') {
      return {
        error:
          'Нельзя удалить класс: у него есть история пропусков. Сначала уберите пропуска этого класса, либо оставьте класс архивным.',
      }
    }
    return { error: error.message }
  }
  revalidatePath('/admin/classes')
  return { ok: true }
}
