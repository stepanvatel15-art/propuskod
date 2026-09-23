import { createClient } from '@/lib/supabase/server'
import AdminImportForm from './admin-import-form'

export default async function AdminClassesImportPage() {
  const supabase = await createClient()

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .order('name')

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-[var(--color-ink)]">Загрузить список класса</h1>
        <p className="text-sm text-[var(--color-ink-muted)]">
          Выберите класс и загрузите список — доступно для любого класса школы, не только своего.
        </p>
      </div>
      <AdminImportForm classes={classes ?? []} />
    </div>
  )
}
