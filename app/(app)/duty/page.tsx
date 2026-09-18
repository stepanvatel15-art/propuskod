import { createClient } from '@/lib/supabase/server'
import BuildingSwitcher from './building-switcher'
import DutyQueue from './duty-queue'
import ReleaseChildForm from './release-child-form'

export default async function DutyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('active_building_id')
    .eq('id', user!.id)
    .single()

  const { data: buildings } = await supabase
    .from('buildings')
    .select('id, name')
    .order('name')

  const activeBuildingId = profile?.active_building_id ?? null
  const activeBuilding = buildings?.find((b) => b.id === activeBuildingId) ?? null

  if (!activeBuildingId || !activeBuilding) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="text-lg font-semibold text-[var(--color-ink)]">Выберите корпус</h1>
        <p className="text-sm text-[var(--color-ink-muted)]">
          Заявки покажутся после выбора корпуса, в котором вы сейчас работаете.
        </p>
        <BuildingSwitcher buildings={buildings ?? []} activeBuildingId={null} />
      </div>
    )
  }

  const { data: passes } = await supabase
    .from('passes')
    .select(
      `id, requested_departure_at, reason,
       students(full_name), classes(name),
       creator:profiles!passes_created_by_fkey(role)`
    )
    .eq('building_id', activeBuildingId)
    .eq('status', 'approved')
    .order('requested_departure_at')

  const { data: classesInBuilding } = await supabase
    .from('classes')
    .select('id, name')
    .eq('building_id', activeBuildingId)
    .order('name')

  const classIds = (classesInBuilding ?? []).map((c) => c.id)

  const { data: students } = classIds.length
    ? await supabase
        .from('students')
        .select('id, full_name, class_id')
        .in('class_id', classIds)
        .eq('is_active', true)
        .order('full_name')
    : { data: [] }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--color-ink-muted)]">Дежурный администратор</p>
          <h1 className="text-2xl font-semibold text-[var(--color-ink)]">{activeBuilding.name}</h1>
        </div>
        <BuildingSwitcher buildings={buildings ?? []} activeBuildingId={activeBuildingId} />
      </div>

      <ReleaseChildForm classes={classesInBuilding ?? []} students={students ?? []} />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--color-ink)]">Заявки на выход</h2>
        <DutyQueue passes={passes ?? []} buildingId={activeBuildingId} />
      </section>
    </div>
  )
}
