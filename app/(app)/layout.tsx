import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logoutAction } from '@/app/login/actions'
import { Logo } from '@/components/ui/logo'

const NAV: Record<string, { href: string; label: string }[]> = {
  teacher: [
    { href: '/teacher', label: 'Мой класс' },
    { href: '/teacher/students/import', label: 'Загрузить список класса' },
    { href: '/teacher/late-stats', label: 'Опоздания класса' },
    { href: '/teacher/no-card-stats', label: 'Без карты — класс' },
  ],
  security: [
    { href: '/duty', label: 'Дежурство' },
    { href: '/duty/history', label: 'История выходов' },
    { href: '/duty/late', label: 'Опоздания' },
    { href: '/duty/no-card', label: 'Без карты' },
  ],
  admin: [
    { href: '/admin/users', label: 'Пользователи' },
    { href: '/admin/classes', label: 'Классы' },
    { href: '/admin/classes/import', label: 'Загрузить список класса' },
    { href: '/admin/buildings', label: 'Корпуса' },
  ],
}

const ROLE_LABELS: Record<string, string> = {
  teacher: 'Классный руководитель',
  security: 'Дежурный администратор',
  admin: 'Администратор',
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
      <aside className="flex w-64 flex-col justify-between bg-[var(--color-primary-dark)] px-4 py-6 text-white">
        <div>
          <div className="mb-8 flex items-center gap-2 px-2">
            <Logo size={26} />
            <span className="text-sm font-semibold leading-tight">
              Пропуска на выход
            </span>
          </div>

          <nav className="space-y-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/10 hover:text-white"
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="space-y-3 border-t border-white/10 pt-4 px-2">
          <div>
            <p className="text-sm font-medium">{profile.full_name}</p>
            <p className="text-xs text-white/60">{ROLE_LABELS[profile.role] ?? profile.role}</p>
          </div>
          <form action={logoutAction}>
            <button className="text-xs text-white/70 hover:text-white">Выйти</button>
          </form>
        </div>
      </aside>

      <main className="flex-1 bg-[var(--color-surface)] p-8">{children}</main>
    </div>
  )
}
