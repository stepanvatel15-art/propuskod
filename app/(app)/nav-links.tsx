'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavItem = { href: string; label: string; short?: string }

export default function NavLinks({ links, variant = 'side' }: { links: NavItem[]; variant?: 'side' | 'pills' }) {
  const pathname = usePathname()

  // Активна самая длинная подходящая ссылка: на /duty/history
  // подсвечивается «История выходов», а не «Дежурство».
  const active = links
    .filter((l) => pathname === l.href || pathname.startsWith(l.href + '/'))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href

  if (variant === 'pills') {
    return (
      <nav className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-3 [scrollbar-width:none]">
        {links.map((l) => {
          const isActive = l.href === active
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive ? 'page' : undefined}
              className={
                'shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] ' +
                (isActive
                  ? 'bg-[var(--color-primary)] font-bold text-white'
                  : 'bg-[#eef1f6] font-semibold text-[#344054]')
              }
            >
              {l.short ?? l.label}
            </Link>
          )
        })}
      </nav>
    )
  }

  return (
    <nav className="space-y-1">
      {links.map((l) => {
        const isActive = l.href === active
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={isActive ? 'page' : undefined}
            className={
              'flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm ' +
              (isActive
                ? 'bg-[var(--color-primary-light)] font-bold text-[var(--color-primary)]'
                : 'font-medium text-[#344054] hover:bg-[var(--color-surface)]')
            }
          >
            <span
              aria-hidden="true"
              className={'h-2 w-2 shrink-0 rounded-full ' + (isActive ? 'bg-[var(--color-primary)]' : 'bg-[#d0d7e5]')}
            />
            {l.label}
          </Link>
        )
      })}
    </nav>
  )
}
