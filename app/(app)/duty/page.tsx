import { getSession } from '@/lib/auth/session'
import BuildingSwitcher from './building-switcher'
import DutyQueue from './duty-queue'
import ReleaseChildForm from './release-child-form'
import { moscowTodayStartISO } from '@/lib/format/datetime'

type DutyPassRow = {
  id: string
  requested_departure_at: string
  reason: string | null
  students: { full_name: string } | null
  classes: { name: string } | null
  creator: { role: string } | null
}

export default async function DutyPage() {
  const { supabase, profile } = await getSession()

  const { data: buildings } = await supabase
    .from('buildings')
    .select('id, name')
    .order('name')

  const activeBuildingId = profile?.active_building_id ?? null
  const activeBuilding = buildings?.find((b) => b.id === activeBuildingId) ?? null

  if (!activeBuildingId || !activeBuilding) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--color-ink)] md:text-[32px]">Выберите корпус</h1>
        <p className="text-sm text-[var(--color-ink-muted)]">
          Заявки покажутся после выбора корпуса, в котором вы сейчас работаете.
        </p>
        <BuildingSwitcher buildings={buildings ?? []} activeBuildingId={null} />
      </div>
    )
  }

  // Заявки и классы корпуса не зависят друг от друга — грузим параллельно
  const todayStart = moscowTodayStartISO()
  const countMarks = (kind: 'late' | 'no_card') =>
    supabase
      .from('attendance_marks')
      .select('id', { count: 'exact', head: true })
      .eq('building_id', activeBuildingId)
      .eq('kind', kind)
      .gte('created_at', todayStart)

  const [
    { data: passes },
    { data: classesInBuilding },
    { count: exitedCount },
    { count: lateCount },
    { count: noCardCount },
  ] = await Promise.all([
    supabase
      .from('passes')
      .select(
        `id, requested_departure_at, reason,
         students(full_name), classes(name),
         creator:profiles!passes_created_by_fkey(role)`
      )
      .eq('building_id', activeBuildingId)
      .eq('status', 'approved')
      .order('requested_departure_at'),
    supabase
      .from('classes')
      .select('id, name')
      .eq('building_id', activeBuildingId)
      .order('name'),
    supabase
      .from('passes')
      .select('id', { count: 'exact', head: true })
      .eq('building_id', activeBuildingId)
      .eq('status', 'used')
      .gte('used_at', todayStart),
    countMarks('late'),
    countMarks('no_card'),
  ])

  const classIds = (classesInBuilding ?? []).map((c) => c.id)

  const { data: students } = classIds.length
    ? await supabase
        .from('students')
        .select('id, full_name, class_id')
        .in('class_id', classIds)
        .eq('is_active', true)
        .order('full_name')
    : { data: [] }

  const stats = [
    { label: 'Ожидают выхода', value: passes?.length ?? 0, color: 'text-[var(--color-primary)]' },
    { label: 'Вышли сегодня', value: exitedCount ?? 0, color: 'text-[var(--color-success)]' },
    { label: 'Опоздали', value: lateCount ?? 0, color: 'text-[#b5560d]' },
    { label: 'Без карты', value: noCardCount ?? 0, color: 'text-[var(--color-violet)]' },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-semibold text-[var(--color-ink-muted)]">Корпус {activeBuilding.name}</p>
          <h1 className="text-[28px] font-extrabold tracking-tight md:text-[32px]">Дежурство</h1>
        </div>
        <BuildingSwitcher buildings={buildings ?? []} activeBuildingId={activeBuildingId} />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white px-4 py-3.5 shadow-card sm:px-5 sm:py-4">
            <p className="text-xs font-semibold text-[var(--color-ink-muted)] sm:text-[13px]">{s.label}</p>
            <p className={`tabular text-[26px] font-extrabold leading-tight sm:text-3xl ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-extrabold">Заявки на выход</h2>
        <DutyQueue passes={(passes ?? []) as unknown as DutyPassRow[]} buildingId={activeBuildingId} />
      </section>

      <ReleaseChildForm classes={classesInBuilding ?? []} students={students ?? []} />
    </div>
  )
}
