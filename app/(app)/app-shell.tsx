import NavLinks from './nav-links'
import MoscowClock from './moscow-clock'
import { logoutAction } from '@/app/login/actions'
import { Logo } from '@/components/ui/logo'

/**
 * Каркас всех страниц после входа.
 * Компьютер/планшет: боковое меню закреплено во всю высоту экрана.
 * Телефон: шапка сверху с часами и меню-кнопками, контент на всю ширину.
 */
export default function AppShell({
  links,
  fullName,
  roleLabel,
  children,
}: {
  links: { href: string; label: string; short?: string }[]
  fullName: string
  roleLabel: string
  children: React.ReactNode
}) {
  const initials = fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()

  return (
    <div className="min-h-screen overflow-x-clip md:flex">
      {/* Компьютер и планшет: боковое меню закреплено и не уезжает при прокрутке */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 border-r border-[var(--color-border)] bg-white px-4 py-6 md:flex">
        <div className="flex items-center gap-3 px-2">
          <Logo height={60} />
          <div>
            <p className="text-[17px] font-extrabold leading-tight tracking-tight">ПропусКод</p>
            <p className="text-xs text-[var(--color-ink-muted)]">Школа 1353</p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <NavLinks links={links} />
        </div>

        <div className="space-y-3">
          <MoscowClock />
          <div className="flex items-center gap-3 px-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold">{fullName}</p>
              <p className="truncate text-xs text-[var(--color-ink-muted)]">{roleLabel}</p>
            </div>
          </div>
          <form action={logoutAction} className="px-1">
            <button className="text-xs font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
              Выйти
            </button>
          </form>
        </div>
      </aside>

      {/* Телефон: шапка сверху, всегда на экране */}
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-white/95 px-4 pt-2.5 backdrop-blur md:hidden">
        <div className="mb-2.5 flex items-center gap-2.5">
          <Logo height={40} />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-extrabold leading-tight">ПропусКод</p>
            <p className="truncate text-[11px] text-[var(--color-ink-muted)]">{fullName}</p>
          </div>
          <form action={logoutAction}>
            <button className="px-1 text-xs font-semibold text-[var(--color-ink-muted)]">Выйти</button>
          </form>
          <MoscowClock variant="compact" />
        </div>
        <NavLinks links={links} variant="pills" />
      </header>

      <main className="min-w-0 flex-1 px-4 py-5 md:px-10 md:py-8">{children}</main>
    </div>
  )
}
