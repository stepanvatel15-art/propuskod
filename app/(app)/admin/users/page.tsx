import { createClient } from '@/lib/supabase/server'
import CreateUserForm from './create-user-form'
import UsersTable from './users-table'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('profiles')
    .select('id, login, full_name, role, is_active')
    .order('full_name')

  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="text-lg font-semibold">Пользователи</h1>

      <section>
        <h2 className="mb-2 font-medium">Новый пользователь</h2>
        <CreateUserForm />
      </section>

      <section>
        <h2 className="mb-2 font-medium">Все пользователи</h2>
        <UsersTable users={users ?? []} />
      </section>
    </div>
  )
}
