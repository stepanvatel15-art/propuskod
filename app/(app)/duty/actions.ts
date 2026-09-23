'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type ActionResult = { ok: true } | { error: string }

async function assertCallerIsSecurity() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' } as const

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['security', 'admin'].includes(profile.role)) {
    return { error: 'Недостаточно прав' } as const
  }
  return { ok: true as const, supabase, userId: user.id }
}

/** Выбор корпуса — через service_role, чтобы не открывать всем
 *  самостоятельное право менять произвольные поля своего профиля. */
export async function setActiveBuildingAction(buildingId: string): Promise<ActionResult> {
  const auth = await assertCallerIsSecurity()
  if ('error' in auth) return auth
  const admin = createAdminClient()

  const { error } = await admin
    .from('profiles')
    .update({ active_building_id: buildingId })
    .eq('id', auth.userId)

  if (error) return { error: error.message }
  revalidatePath('/duty')
  return { ok: true }
}

/** Дежурный отмечает, что ребёнок физически вышел — фиксируется точное время */
export async function markPassUsedAction(passId: string): Promise<ActionResult> {
  const auth = await assertCallerIsSecurity()
  if ('error' in auth) return auth

  const { error } = await auth.supabase
    .from('passes')
    .update({ status: 'used', used_at: new Date().toISOString(), used_by: auth.userId })
    .eq('id', passId)
    .eq('status', 'approved')

  if (error) return { error: error.message }
  revalidatePath('/duty')
  return { ok: true }
}

/** Отмена ошибочного пропуска дежурным — по той же логике, что и у учителя:
 *  статус меняется на cancelled, запись остаётся видна в истории. */
export async function cancelPassAction(passId: string): Promise<ActionResult> {
  const auth = await assertCallerIsSecurity()
  if ('error' in auth) return auth

  const { error } = await auth.supabase
    .from('passes')
    .update({ status: 'cancelled' })
    .eq('id', passId)
    .eq('status', 'approved')

  if (error) return { error: error.message }
  revalidatePath('/duty')
  return { ok: true }
}

/** Дежурный сам выпускает ребёнка, когда классный руководитель недоступен —
 *  например, с устного разрешения родителя. Причина обязательна для фиксации. */
export async function createDutyReleaseAction(input: {
  studentId: string
  reason: string
}): Promise<ActionResult> {
  const auth = await assertCallerIsSecurity()
  if ('error' in auth) return auth

  if (!input.reason.trim()) {
    return { error: 'Укажите, с чьего разрешения выпускается ребёнок' }
  }

  const { data: student, error: studentError } = await auth.supabase
    .from('students')
    .select('id, class_id, classes(building_id)')
    .eq('id', input.studentId)
    .single()

  if (studentError || !student) return { error: 'Ученик не найден или нет доступа' }
  const classes = student.classes as unknown as { building_id: string | null } | null

  const nowIso = new Date().toISOString()

  const { error } = await auth.supabase.from('passes').insert({
    student_id: input.studentId,
    class_id: student.class_id,
    building_id: classes?.building_id ?? null,
    type: 'direct',
    status: 'approved',
    requested_departure_at: nowIso,
    reason: input.reason.trim(),
    created_by: auth.userId,
    approved_by: auth.userId,
    approved_at: nowIso,
  })

  if (error) return { error: error.message }
  revalidatePath('/duty')
  return { ok: true }
}
