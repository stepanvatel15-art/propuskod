'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function assertCallerIsSecurity() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Не авторизован')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['security', 'admin'].includes(profile.role)) {
    throw new Error('Недостаточно прав')
  }
  return { supabase, userId: user.id }
}

/** Выбор корпуса — через service_role, чтобы не открывать всем
 *  самостоятельное право менять произвольные поля своего профиля. */
export async function setActiveBuildingAction(buildingId: string) {
  const { userId } = await assertCallerIsSecurity()
  const admin = createAdminClient()

  const { error } = await admin
    .from('profiles')
    .update({ active_building_id: buildingId })
    .eq('id', userId)

  if (error) throw new Error(error.message)
  revalidatePath('/duty')
}

/** Дежурный отмечает, что ребёнок физически вышел — фиксируется точное время */
export async function markPassUsedAction(passId: string) {
  const { supabase, userId } = await assertCallerIsSecurity()

  const { error } = await supabase
    .from('passes')
    .update({ status: 'used', used_at: new Date().toISOString(), used_by: userId })
    .eq('id', passId)
    .eq('status', 'approved')

  if (error) throw new Error(error.message)
  revalidatePath('/duty')
}

/** Отмена ошибочного пропуска дежурным — по той же логике, что и у учителя:
 *  статус меняется на cancelled, запись остаётся видна в истории. */
export async function cancelPassAction(passId: string) {
  const { supabase } = await assertCallerIsSecurity()

  const { error } = await supabase
    .from('passes')
    .update({ status: 'cancelled' })
    .eq('id', passId)
    .eq('status', 'approved')

  if (error) throw new Error(error.message)
  revalidatePath('/duty')
}
/** Дежурный сам выпускает ребёнка, когда классный руководитель недоступен —
 *  например, с устного разрешения родителя. Причина обязательна для фиксации. */
export async function createDutyReleaseAction(input: { studentId: string; reason: string }) {
  const { supabase, userId } = await assertCallerIsSecurity()

  if (!input.reason.trim()) {
    throw new Error('Укажите, с чьего разрешения выпускается ребёнок')
  }

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id, class_id, classes(building_id)')
    .eq('id', input.studentId)
    .single()

  if (studentError || !student) throw new Error('Ученик не найден или нет доступа')
  const classes = student.classes as unknown as { building_id: string | null } | null

  const nowIso = new Date().toISOString()

  const { error } = await supabase.from('passes').insert({
    student_id: input.studentId,
    class_id: student.class_id,
    building_id: classes?.building_id ?? null,
    type: 'direct',
    status: 'approved',
    requested_departure_at: nowIso,
    reason: input.reason.trim(),
    created_by: userId,
    approved_by: userId,
    approved_at: nowIso,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/duty')
}
