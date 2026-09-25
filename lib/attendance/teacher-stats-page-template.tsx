import { createClient } from '@/lib/supabase/server'
import { getAttendanceStats } from './get-attendance-stats'
import DateRangeFilter from './date-range-filter'
import StatsTable from './stats-table'
import {
  moscowMonthStartISO,
  moscowMonthsAgoISO,
  moscowSchoolYearStartISO,
  moscowDateStringStartISO,
  moscowDateStringEndISO,
} from '@/lib/format/datetime'
import type { AttendanceKind } from './attendance-actions'

function rangeBounds(range: string, from?: string, to?: string): { since: string; until: string | null } {
  if (range === '6m') return { since: moscowMonthsAgoISO(6), until: null }
  if (range === 'year') return { since: moscowSchoolYearStartISO(), until: null }
  if (range === 'custom' && from && to) {
    return { since: moscowDateStringStartISO(from), until: moscowDateStringEndISO(to) }
  }
  return { since: moscowMonthStartISO(), until: null } // 'month' и дефолт
}

export async function AttendanceTeacherStatsPage({
  kind,
  title,
  searchParams,
}: {
  kind: AttendanceKind
  title: string
  searchParams: Promise<{ range?: string; from?: string; to?: string }>
}) {
  const sp = await searchParams
  const range = sp.range ?? 'month'
  const { since, until } = rangeBounds(range, sp.from, sp.to)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: klass } = await supabase
    .from('classes')
    .select('id, name')
    .eq('homeroom_teacher_id', user!.id)
    .single()

  if (!klass) {
    return (
      <p className="rounded-xl border border-[var(--color-border)] bg-white p-6 text-sm text-[var(--color-ink-muted)]">
        Класс ещё не назначен.
      </p>
    )
  }

  const { stats } = await getAttendanceStats(klass.id, kind, since, until)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-sm text-[var(--color-ink-muted)]">{klass.name}</p>
        <h1 className="text-2xl font-semibold text-[var(--color-ink)]">{title}</h1>
      </div>

      <DateRangeFilter current={range} from={sp.from ?? ''} to={sp.to ?? ''} />

      <StatsTable stats={stats} classId={klass.id} />
    </div>
  )
}
