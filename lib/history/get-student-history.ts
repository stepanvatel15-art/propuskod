import { createClient } from '@/lib/supabase/server'

export type DateRange = 'today' | '7d' | '30d' | 'all'
export type StatusFilter = 'all' | 'active' | 'used' | 'expired' | 'rejected' | 'cancelled'

export type PassEventRow = {
  id: number
  event_type: string
  actor_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export type PassWithEvents = {
  id: string
  type: 'request' | 'direct'
  status: string
  reason: string | null
  requested_departure_at: string
  qr_expires_at: string | null
  used_at: string | null
  created_at: string
  events: PassEventRow[]
}

export type StudentHistory = {
  student: { id: string; full_name: string; birth_date: string; class_id: string } | null
  passes: PassWithEvents[]
}

function dateRangeStart(range: DateRange): string | null {
  const now = new Date()
  if (range === 'today') {
    now.setHours(0, 0, 0, 0)
    return now.toISOString()
  }
  if (range === '7d') return new Date(Date.now() - 7 * 24 * 3600_000).toISOString()
  if (range === '30d') return new Date(Date.now() - 30 * 24 * 3600_000).toISOString()
  return null
}

const ACTIVE_STATUSES = ['pending', 'approved', 'qr_issued']

export async function getStudentHistory(
  studentId: string,
  filters: { range: DateRange; status: StatusFilter }
): Promise<StudentHistory> {
  const supabase = await createClient()

  const { data: student } = await supabase
    .from('students')
    .select('id, full_name, birth_date, class_id')
    .eq('id', studentId)
    .maybeSingle()

  if (!student) return { student: null, passes: [] }

  let query = supabase
    .from('passes')
    .select(
      `id, type, status, reason, requested_departure_at, qr_expires_at, used_at, created_at,
       pass_events ( id, event_type, actor_id, metadata, created_at )`
    )
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  const since = dateRangeStart(filters.range)
  if (since) query = query.gte('created_at', since)

  if (filters.status === 'active') query = query.in('status', ACTIVE_STATUSES)
  else if (filters.status !== 'all') query = query.eq('status', filters.status)

  const { data: passes, error } = await query
  if (error) throw new Error(error.message)

  const normalized: PassWithEvents[] = (passes ?? []).map((p) => ({
    ...p,
    events: [...(p.pass_events ?? [])].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ),
  }))

  return { student, passes: normalized }
}
