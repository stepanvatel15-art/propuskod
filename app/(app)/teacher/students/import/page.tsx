import { createClient } from '@/lib/supabase/server'
import ImportStudentsForm from './import-form'

export default async function ImportStudentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: klass } = await supabase
    .from('classes')
    .select('id, name')
    .eq('homeroom_teacher_id', user!.id)
    .single()

  if (!klass) return <p>Класс не назначен</p>

  return <ImportStudentsForm classId={klass.id} />
}
