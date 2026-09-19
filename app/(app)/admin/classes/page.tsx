import { createClient } from '@/lib/supabase/server'
import CreateClassForm from './create-class-form'
import ClassesTable from './classes-table'

type KlassRow = {
  id: string
  name: string
  homeroom_teacher_id: string | null
  building_id: string | null
  profiles: { full_name: string } | null
}

export default async function AdminClassesPage() {
  const supabase = await createClient()

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, homeroom_teacher_id, building_id, profiles(full_name)')
    .order('name')

  const { data: teachers } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'teacher')
    .eq('is_active', true)
    .order('full_name')

  const { data: buildings } = await supabase
    .from('buildings')
    .select('id, name')
    .order('name')

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <h1 className="text-2xl font-semibold text-[var(--color-ink)]">Классы</h1>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--color-ink)]">Новый класс</h2>
        <CreateClassForm />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--color-ink)]">Все классы</h2>
        <ClassesTable
          classes={(classes ?? []) as unknown as KlassRow[]}
          teachers={teachers ?? []}
          buildings={buildings ?? []}
        />
      </section>
    </div>
  )
}
