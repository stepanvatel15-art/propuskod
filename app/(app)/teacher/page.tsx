import { createClient } from '@/lib/supabase/server'
import PassForm from './pass-form'
import PendingList from './pending-list'
import ActiveList from './active-list'

export default async function TeacherPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: klass } = await supabase
    .from('classes')
    .select('id, name')
    .eq('homeroom_teacher_id', user!.id)
    .single()

  if (!klass) return <p>Класс не назначен</p>

  const { data: students } = await supabase
    .from('students')
    .select('id, full_name')
    .eq('class_id', klass.id)
    .eq('is_active', true)
    .order('full_name')

  const { data: pending } = await supabase
    .from('passes')
    .select('id, requested_departure_at, reason, students(full_name)')
    .eq('class_id', klass.id)
    .eq('status', 'pending')
    .order('requested_departure_at')

  const { data: active } = await supabase
    .from('passes')
    .select('id, requested_departure_at, status, qr_token, qr_expires_at, students(full_name)')
    .eq('class_id', klass.id)
    .in('status', ['approved', 'qr_issued'])
    .order('requested_departure_at')

  return (
    <div className="space-y-8">
      <h1 className="text-lg font-semibold">{klass.name}</h1>

      <section>
        <h2 className="mb-2 font-medium">Новый пропуск</h2>
        <PassForm students={students ?? []} />
      </section>

      <section>
        <h2 className="mb-2 font-medium">Заявки на подтверждение</h2>
        <PendingList passes={pending ?? []} />
      </section>

      <section>
        <h2 className="mb-2 font-medium">Активные пропуска сегодня</h2>
        <ActiveList passes={active ?? []} />
      </section>
    </div>
  )
}
