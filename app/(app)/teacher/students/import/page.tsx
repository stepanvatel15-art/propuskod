import { getSession } from '@/lib/auth/session'
import ImportStudentsForm from './import-form'

export default async function ImportStudentsPage() {
  const { supabase, user } = await getSession()

  const { data: klass } = await supabase
    .from('classes')
    .select('id, name')
    .eq('homeroom_teacher_id', user!.id)
    .single()

  if (!klass) return <p>Класс не назначен</p>

  return <ImportStudentsForm classId={klass.id} />
}
