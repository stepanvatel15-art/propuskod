'use server'

import { createClient } from '@/lib/supabase/server'
import { parseStudentsExcel } from '@/lib/import/parse-students-excel'

export type ImportSummary = {
  rowsTotal: number
  rowsCreated: number
  rowsUpdated: number
  rowsSkipped: number
  errors: { rowNumber: number; reason: string }[]
}

export async function importStudentsAction(formData: FormData): Promise<ImportSummary> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Не авторизован')

  const classId = String(formData.get('classId') ?? '')
  const file = formData.get('file') as File | null

  if (!classId) throw new Error('Не указан класс')
  if (!file || file.size === 0) throw new Error('Файл не выбран')
  if (file.size > 2 * 1024 * 1024) throw new Error('Файл слишком большой (макс. 2 МБ)')

  const { data: klass, error: classError } = await supabase
    .from('classes')
    .select('id, homeroom_teacher_id')
    .eq('id', classId)
    .single()

  if (classError || !klass) throw new Error('Класс не найден или нет доступа')

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
    (existing ?? []).map((s) => [`${s.full_name.toLowerCase()}|${s.birth_date}`, s.id])
  )

  for (const row of rows) {
    const key = `${row.fullName.toLowerCase()}|${row.birthDate}`
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

  return {
    rowsTotal: rows.length + parseErrors.length,
    rowsCreated,
    rowsUpdated,
    rowsSkipped: allErrors.length,
    errors: allErrors,
  }
}
