'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type AttendanceKind = 'late' | 'no_card'
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

const PATH_BY_KIND: Record<AttendanceKind, string> = {
  late: '/duty/late',
  no_card: '/duty/no-card',
}

/** Дежурный отмечает ученика — опоздание или отсутствие карты.
 *  Корпус берётся из карточки ученика (класс уже привязан к корпусу),
 *  а не из активного корпуса дежурного напрямую — на случай если он
 *  ищет ученика через общий поиск. RLS всё равно не пропустит запись
 *  в чужой корпус, если он не совпадает с выбранным дежурным. */
export async function createAttendanceMarkAction(input: {
  studentId: string
  kind: AttendanceKind
}): Promise<ActionResult> {
  const auth = await assertCallerIsSecurity()
  if ('error' in auth) return auth

  const { data: student, error: studentError } = await auth.supabase
    .from('students')
    .select('id, class_id, classes(building_id)')
    .eq('id', input.studentId)
    .single()

  if (studentError || !student) return { error: 'Ученик не найден или нет доступа' }
  const classes = student.classes as unknown as { building_id: string | null } | null

  const { error } = await auth.supabase.from('attendance_marks').insert({
    student_id: input.studentId,
    class_id: student.class_id,
    building_id: classes?.building_id ?? null,
    kind: input.kind,
    created_by: auth.userId,
  })

  if (error) return { error: error.message }
  revalidatePath(PATH_BY_KIND[input.kind])
  return { ok: true }
}

/** Удаление отметки — только в день создания (проверяется в RLS по
 *  московской календарной дате), любым дежурным этого же корпуса. */
export async function deleteAttendanceMarkAction(
  markId: string,
  kind: AttendanceKind
): Promise<ActionResult> {
  const auth = await assertCallerIsSecurity()
  if ('error' in auth) return auth

  const { data, error } = await auth.supabase
    .from('attendance_marks')
    .delete()
    .eq('id', markId)
    .select('id')

  if (error) return { error: error.message }
  if (!data || data.length === 0) {
    return { error: 'Не удалось удалить: либо день уже закончился, либо запись не найдена' }
  }
  revalidatePath(PATH_BY_KIND[kind])
  return { ok: true }
}
