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
    <div className="mx-auto max-w-3xl space-y-10">
      <h1 className="text-2xl font-semibold text-[var(--color-ink)]">Пользователи</h1>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--color-ink)]">Новый пользователь</h2>
        <CreateUserForm />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--color-ink)]">Все пользователи</h2>
        <UsersTable users={users ?? []} />
      </section>
    </div>
  )
}
