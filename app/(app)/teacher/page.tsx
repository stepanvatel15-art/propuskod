import { createClient } from '@/lib/supabase/server'
import PassForm from './pass-form'
import ActiveList from './active-list'
import ExitedToday from './exited-today'
import { moscowTodayStartISO } from '@/lib/format/datetime'

type PassRow = { id: string; requested_departure_at: string; students: { full_name: string } | null }
type ExitedRow = { id: string; used_at: string | null; students: { full_name: string } | null }

export default async function TeacherPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: klass } = await supabase
    .from('classes')
    .select('id, name')
    .eq('homeroom_teacher_id', user!.id)
    .single()

  if (!klass) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-white p-6 text-sm text-[var(--color-ink-muted)]">
        Класс ещё не назначен. Обратитесь к администратору.
      </div>
    )
  }

  const { data: students } = await supabase
    .from('students')
    .select('id, full_name')
    .eq('class_id', klass.id)
    .eq('is_active', true)
    .order('full_name')

  const { data: active } = await supabase
    .from('passes')
    .select('id, requested_departure_at, students(full_name)')
    .eq('class_id', klass.id)
    .eq('status', 'approved')
    .order('requested_departure_at')

  const { data: exitedToday } = await supabase
    .from('passes')
    .select('id, used_at, students(full_name)')
    .eq('class_id', klass.id)
    .eq('status', 'used')
    .gte('used_at', moscowTodayStartISO())
    .order('used_at', { ascending: false })

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <p className="text-sm text-[var(--color-ink-muted)]">Классный руководитель</p>
        <h1 className="text-2xl font-semibold text-[var(--color-ink)]">{klass.name}</h1>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--color-ink)]">Новый пропуск</h2>
        <PassForm students={students ?? []} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--color-ink)]">Активные пропуска</h2>
        <ActiveList passes={(active ?? []) as unknown as PassRow[]} classId={klass.id} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--color-ink)]">Вышли сегодня</h2>
        <ExitedToday passes={(exitedToday ?? []) as unknown as ExitedRow[]} />
      </section>
    </div>
  )
}
