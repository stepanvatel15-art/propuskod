import { createClient } from '@/lib/supabase/server'
import CreateBuildingForm from './create-building-form'
import { Card } from '@/components/ui/card'

export default async function AdminBuildingsPage() {
  const supabase = await createClient()

  const { data: buildings } = await supabase
    .from('buildings')
    .select('id, name')
    .order('name')

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <h1 className="text-2xl font-semibold text-[var(--color-ink)]">Корпуса</h1>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--color-ink)]">Новый корпус</h2>
        <CreateBuildingForm />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--color-ink)]">Все корпуса</h2>
        <Card className="divide-y divide-[var(--color-border)] overflow-hidden">
          {(buildings ?? []).map((b) => (
            <div key={b.id} className="px-4 py-3 text-sm text-[var(--color-ink)]">{b.name}</div>
          ))}
          {(buildings ?? []).length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-[var(--color-ink-muted)]">Корпуса ещё не добавлены</p>
          )}
        </Card>
      </section>
    </div>
  )
}
