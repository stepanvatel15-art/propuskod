import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logoutAction } from '@/app/login/actions'

const NAV: Record<string, { href: string; label: string }[]> = {
  teacher: [
    { href: '/teacher', label: 'Мой класс' },
    { href: '/teacher/students/import', label: 'Загрузить список класса' },
  ],
  security: [{ href: '/scan', label: 'Сканер' }],
  admin: [
    { href: '/admin/users', label: 'Пользователи' },
    { href: '/admin/classes', label: 'Классы' },
  ],
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const links = NAV[profile.role] ?? []

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r p-4">
        <p className="mb-4 text-sm text-gray-500">{profile.full_name}</p>
        <nav className="space-y-2">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="block rounded px-2 py-1 hover:bg-gray-100">
              {l.label}
            </a>
          ))}
        </nav>
        <form action={logoutAction} className="mt-8">
          <button className="text-sm text-red-600">Выйти</button>
        </form>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
