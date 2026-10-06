'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavItem = { href: string; label: string }

export default function NavLinks({ links }: { links: NavItem[] }) {
  const pathname = usePathname()

  // Активна самая длинная подходящая ссылка: на /duty/history
  // подсвечивается «История выходов», а не «Дежурство».
  const active = links
    .filter((l) => pathname === l.href || pathname.startsWith(l.href + '/'))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href

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
              isActive
                ? 'block rounded-lg bg-white/15 px-3 py-2 text-sm font-medium text-white'
                : 'block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/10 hover:text-white'
            }
          >
            {l.label}
          </Link>
        )
      })}
    </nav>
  )
}
