import { createClient } from '@/lib/supabase/server'
import CreateClassForm from './create-class-form'
import ClassesTable from './classes-table'

export default async function AdminClassesPage() {
  const supabase = await createClient()

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, homeroom_teacher_id, profiles(full_name)')
    .order('name')

  const { data: teachers } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'teacher')
    .eq('is_active', true)
    .order('full_name')

  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="text-lg font-semibold">Классы</h1>

      <section>
        <h2 className="mb-2 font-medium">Новый класс</h2>
        <CreateClassForm />
      </section>

      <section>
        <h2 className="mb-2 font-medium">Все классы</h2>
        <ClassesTable classes={classes ?? []} teachers={teachers ?? []} />
      </section>
    </div>
  )
}
