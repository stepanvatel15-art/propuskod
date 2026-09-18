'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type CreatePassInput = {
  studentId: string
  requestedDepartureAt: string // ISO datetime
  reason?: string
}

async function getStudentClassInfo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string
) {
  const { data, error } = await supabase
    .from('students')
    .select('id, class_id, classes(building_id)')
    .eq('id', studentId)
    .single()

  if (error || !data) throw new Error('Ученик не найден или нет доступа')
  const classes = data.classes as unknown as { building_id: string | null } | null
  return { classId: data.class_id, buildingId: classes?.building_id ?? null }
}

/** Учитель сам решает и сам фиксирует время выхода — отдельного этапа
 *  подтверждения больше нет: у детей может не быть телефона, чтобы
 *  подавать заявку самим, поэтому учитель всегда действует за них. */
export async function createPassAction(input: CreatePassInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Не авторизован')

  if (!input.requestedDepartureAt) {
    throw new Error('Укажите время выхода')
  }

  const { classId, buildingId } = await getStudentClassInfo(supabase, input.studentId)

  const { error } = await supabase.from('passes').insert({
    student_id: input.studentId,
    class_id: classId,
    building_id: buildingId,
    type: 'direct',
    status: 'approved',
    requested_departure_at: input.requestedDepartureAt,
    reason: input.reason ?? null,
    created_by: user.id,
    approved_by: user.id,
    approved_at: new Date().toISOString(),
  })

  if (error) throw new Error(error.message)
  revalidatePath('/teacher')
}

/** Отмена ошибочного пропуска — учитель может исправить свою же опечатку
 *  (не тот ученик, не то время) до того, как дежурный его обработает.
 *  Это "мягкое" удаление: статус меняется на cancelled, запись остаётся
 *  в истории, а не пропадает бесследно. */
export async function cancelPassAction(passId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Не авторизован')

  const { error } = await supabase
    .from('passes')
    .update({ status: 'cancelled' })
    .eq('id', passId)
    .eq('status', 'approved')

  if (error) throw new Error(error.message)
  revalidatePath('/teacher')
}
