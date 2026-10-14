import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { redirectForRole } from '@/lib/auth/roles'
import { getSession } from '@/lib/auth/session'
import AppShell from './app-shell'

const NAV: Record<string, { href: string; label: string; short?: string }[]> = {
  teacher: [
    { href: '/teacher', label: 'Мой класс' },
    { href: '/teacher/late-stats', label: 'Опоздания класса', short: 'Опоздания' },
    { href: '/teacher/no-card-stats', label: 'Без карты — класс', short: 'Без карты' },
    { href: '/teacher/students/import', label: 'Загрузить список класса', short: 'Список класса' },
  ],
  security: [
    { href: '/duty', label: 'Дежурство' },
    { href: '/duty/history', label: 'История выходов', short: 'История' },
    { href: '/duty/late', label: 'Опоздания' },
    { href: '/duty/no-card', label: 'Без карты' },
    { href: '/duty/reports', label: 'Выгрузка в Excel', short: 'Excel' },
  ],
  admin: [
    { href: '/admin/users', label: 'Пользователи' },
    { href: '/admin/classes', label: 'Классы' },
    { href: '/admin/classes/import', label: 'Загрузить список класса', short: 'Загрузить список' },
    { href: '/admin/buildings', label: 'Корпуса' },
    { href: '/duty/reports', label: 'Выгрузка в Excel', short: 'Excel' },
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
  const { user, profile } = await getSession()

  if (!user || !profile) redirect('/login')

  // Проверка прав роли на текущий адрес (раньше это делал middleware отдельным запросом)
  const path = (await headers()).get('x-pathname') ?? ''
  const target = redirectForRole(path, profile.role)
  if (target && target !== path) redirect(target)

  const links = NAV[profile.role] ?? []

  return (
    <AppShell links={links} fullName={profile.full_name} roleLabel={ROLE_LABELS[profile.role] ?? profile.role}>
      {children}
    </AppShell>
  )
}
