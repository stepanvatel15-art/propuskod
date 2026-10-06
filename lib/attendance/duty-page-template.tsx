import { getSession } from '@/lib/auth/session'
import SearchAndMark from './search-and-mark'
import TodayList from './today-list'
import { moscowTodayStartISO } from '@/lib/format/datetime'
import type { AttendanceKind } from './attendance-actions'

export async function AttendanceDutyPage({ kind, title }: { kind: AttendanceKind; title: string }) {
  const { supabase, profile } = await getSession()

  const activeBuildingId = profile?.active_building_id ?? null

  if (!activeBuildingId) {
    return (
      <p className="text-sm text-[var(--color-ink-muted)]">
        Сначала выберите корпус на странице «Дежурство».
      </p>
    )
  }

  // Классы корпуса и сегодняшние отметки не зависят друг от друга — грузим параллельно
  const [{ data: classesInBuilding }, { data: todayMarks }] = await Promise.all([
    supabase
      .from('classes')
      .select('id, name')
      .eq('building_id', activeBuildingId),
    supabase
      .from('attendance_marks')
      .select('id, created_at, students(full_name), classes(name)')
      .eq('building_id', activeBuildingId)
      .eq('kind', kind)
      .gte('created_at', moscowTodayStartISO())
      .order('created_at', { ascending: false }),
  ])

  const classIds = (classesInBuilding ?? []).map((c) => c.id)
  const classNameById = new Map((classesInBuilding ?? []).map((c) => [c.id, c.name]))

  const { data: students } = classIds.length
    ? await supabase
        .from('students')
        .select('id, full_name, class_id')
        .in('class_id', classIds)
        .eq('is_active', true)
        .order('full_name')
    : { data: [] }

  const studentRows = (students ?? []).map((s) => ({
    id: s.id,
    full_name: s.full_name,
    class_name: classNameById.get(s.class_id) ?? '',
  }))

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-2xl font-semibold text-[var(--color-ink)]">{title}</h1>

      <SearchAndMark students={studentRows} kind={kind} actionLabel="Отметить" />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--color-ink)]">Сегодня</h2>
        <TodayList
          marks={(todayMarks ?? []) as unknown as {
            id: string
            created_at: string
            students: { full_name: string } | null
            classes: { name: string } | null
          }[]}
          kind={kind}
          buildingId={activeBuildingId}
        />
      </section>
    </div>
  )
}
