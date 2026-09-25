import { createClient } from '@/lib/supabase/server'
import type { AttendanceKind } from './attendance-actions'

export type StudentStat = { studentId: string; fullName: string; count: number }

export async function getAttendanceStats(
  classId: string,
  kind: AttendanceKind,
  sinceISO: string,
  untilISO: string | null
): Promise<{ stats: StudentStat[]; total: number }> {
  const supabase = await createClient()

  let query = supabase
    .from('attendance_marks')
    .select('student_id, students(full_name)')
    .eq('class_id', classId)
    .eq('kind', kind)
    .gte('created_at', sinceISO)

  if (untilISO) query = query.lt('created_at', untilISO)

  const { data } = await query
  const rows = (data ?? []) as unknown as { student_id: string; students: { full_name: string } | null }[]

  const counts = new Map<string, { fullName: string; count: number }>()
  for (const row of rows) {
    const existing = counts.get(row.student_id)
    if (existing) {
      existing.count++
    } else {
      counts.set(row.student_id, { fullName: row.students?.full_name ?? '—', count: 1 })
    }
  }

  const stats = Array.from(counts.entries())
    .map(([studentId, v]) => ({ studentId, fullName: v.fullName, count: v.count }))
    .sort((a, b) => b.count - a.count)

  return { stats, total: rows.length }
}
