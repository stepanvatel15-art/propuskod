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
      <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--color-ink)] md:text-[32px]">Пользователи</h1>

      <section className="space-y-3">
        <h2 className="text-lg font-extrabold text-[var(--color-ink)]">Новый пользователь</h2>
        <CreateUserForm />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-extrabold text-[var(--color-ink)]">Все пользователи</h2>
        <UsersTable users={users ?? []} />
      </section>
    </div>
  )
}
