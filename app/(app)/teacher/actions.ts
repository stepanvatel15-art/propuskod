'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type CreatePassInput = {
  studentId: string
  requestedDepartureAt: string // ISO datetime
  reason?: string
}

async function getStudentClassId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string
) {
  const { data, error } = await supabase
    .from('students')
    .select('id, class_id')
    .eq('id', studentId)
    .single()

  if (error || !data) throw new Error('Ученик не найден или нет доступа')
  return data.class_id
}

function assertFutureTime(iso: string) {
  if (new Date(iso).getTime() <= Date.now()) {
    throw new Error('Время выхода должно быть в будущем')
  }
}

/** Сценарий 1: заявка, требует подтверждения учителем */
export async function createPassRequestAction(input: CreatePassInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Не авторизован')

  assertFutureTime(input.requestedDepartureAt)
  const classId = await getStudentClassId(supabase, input.studentId)

  const { error } = await supabase.from('passes').insert({
    student_id: input.studentId,
    class_id: classId,
    type: 'request',
    status: 'pending',
    requested_departure_at: input.requestedDepartureAt,
    reason: input.reason ?? null,
    created_by: user.id,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/teacher')
}

/** Сценарий 2: учитель сразу выписывает пропуск, без стадии заявки */
export async function createDirectPassAction(input: CreatePassInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Не авторизован')

  assertFutureTime(input.requestedDepartureAt)
  const classId = await getStudentClassId(supabase, input.studentId)

  const { error } = await supabase.from('passes').insert({
    student_id: input.studentId,
    class_id: classId,
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

export async function approvePassAction(passId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Не авторизован')

  const { error } = await supabase
    .from('passes')
    .update({ status: 'approved', approved_by: user.id, approved_at: new Date().toISOString() })
    .eq('id', passId)
    .eq('status', 'pending')

  if (error) throw new Error(error.message)
  revalidatePath('/teacher')
}

export async function rejectPassAction(passId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Не авторизован')

  const { error } = await supabase
    .from('passes')
    .update({ status: 'rejected', approved_by: user.id, approved_at: new Date().toISOString() })
    .eq('id', passId)
    .eq('status', 'pending')

  if (error) throw new Error(error.message)
  revalidatePath('/teacher')
}
