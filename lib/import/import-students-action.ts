'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { parseStudentsExcel, studentDedupeKey } from '@/lib/import/parse-students-excel'

export type ImportSummary = {
  rowsTotal: number
  rowsCreated: number
  rowsUpdated: number
  rowsSkipped: number
  errors: { rowNumber: number; reason: string }[]
}

/** Общая логика загрузки списка класса — используется и учителем (для своего
 *  класса), и главным администратором (для любого класса школы). Доступ
 *  к конкретному classId в обоих случаях проверяет RLS на students/classes. */
export async function importStudentsAction(
  formData: FormData
): Promise<ImportSummary | { error: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const classId = String(formData.get('classId') ?? '')
  const file = formData.get('file') as File | null

  if (!classId) return { error: 'Не указан класс' }
  if (!file || file.size === 0) return { error: 'Файл не выбран' }
  if (file.size > 2 * 1024 * 1024) return { error: 'Файл слишком большой (макс. 2 МБ)' }

  const { data: klass, error: classError } = await supabase
    .from('classes')
    .select('id')
    .eq('id', classId)
    .single()

  if (classError || !klass) return { error: 'Класс не найден или нет доступа' }

  const buffer = await file.arrayBuffer()
  const { rows, errors: parseErrors } = parseStudentsExcel(buffer)

  let rowsCreated = 0
  let rowsUpdated = 0
  const dbErrors: { rowNumber: number; reason: string }[] = []

  const { data: existing } = await supabase
    .from('students')
    .select('id, full_name, birth_date')
    .eq('class_id', classId)

  const existingMap = new Map(
    (existing ?? []).map((s) => [studentDedupeKey(s.full_name, s.birth_date), s.id])
  )

  for (const row of rows) {
    const key = studentDedupeKey(row.fullName, row.birthDate)
    const existingId = existingMap.get(key)

    if (existingId) {
      const { error } = await supabase
        .from('students')
        .update({ is_active: true })
        .eq('id', existingId)

      if (error) {
        dbErrors.push({ rowNumber: row.rowNumber, reason: 'Ошибка обновления: ' + error.message })
      } else {
        rowsUpdated++
      }
      continue
    }

    const { error } = await supabase.from('students').insert({
      full_name: row.fullName,
      birth_date: row.birthDate,
      class_id: classId,
    })

    if (error) {
      dbErrors.push({ rowNumber: row.rowNumber, reason: 'Ошибка создания: ' + error.message })
    } else {
      rowsCreated++
    }
  }

  const allErrors = [
    ...parseErrors.map((e) => ({ rowNumber: e.rowNumber, reason: e.reason })),
    ...dbErrors,
  ]

  await supabase.from('import_logs').insert({
    class_id: classId,
    performed_by: user.id,
    file_name: file.name,
    rows_total: rows.length + parseErrors.length,
    rows_created: rowsCreated,
    rows_skipped: allErrors.length,
    errors: allErrors.length > 0 ? allErrors : null,
  })

  revalidatePath('/teacher/students/import')
  revalidatePath('/admin/classes/import')

  return {
    rowsTotal: rows.length + parseErrors.length,
    rowsCreated,
    rowsUpdated,
    rowsSkipped: allErrors.length,
    errors: allErrors,
  }
}
