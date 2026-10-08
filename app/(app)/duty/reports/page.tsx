import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import ReportForm from './report-form'

export default async function DutyReportsPage() {
  // Права роли уже проверил layout (сюда пускают только дежурных и админов).
  // Списки для фильтров — по всем корпусам, поэтому читаем без ограничений RLS.
  const { profile } = await getSession()
  const supabase = createAdminClient()

  const [{ data: buildings }, { data: classes }, { data: students }] = await Promise.all([
    supabase.from('buildings').select('id, name').order('name'),
    supabase.from('classes').select('id, name, building_id').order('name'),
    supabase.from('students').select('id, full_name, class_id').eq('is_active', true).order('full_name'),
  ])

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-ink)]">Выгрузка в Excel</h1>
        <p className="text-sm text-[var(--color-ink-muted)]">
          Опоздания и приход без карты за выбранный период — с фильтром по корпусу, классу или ученику.
        </p>
      </div>
      <ReportForm
        buildings={buildings ?? []}
        classes={classes ?? []}
        students={students ?? []}
        defaultBuildingId={profile?.active_building_id ?? ''}
      />
    </div>
  )
}
