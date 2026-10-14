'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

const RANGES: { value: string; label: string }[] = [
  { value: 'today', label: 'Сегодня' },
  { value: '7d', label: '7 дней' },
  { value: '30d', label: '30 дней' },
  { value: 'all', label: 'Всё время' },
]

export default function DateFilter({ current }: { current: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function update(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('range', value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-[var(--color-border)] bg-white p-1 [scrollbar-width:none] text-sm">
      {RANGES.map((r) => (
        <button
          key={r.value}
          onClick={() => update(r.value)}
          className={
            current === r.value
              ? 'shrink-0 whitespace-nowrap rounded-full bg-[var(--color-ink)] px-3.5 py-1.5 font-bold text-white'
              : 'shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 font-semibold text-[#344054] hover:bg-[var(--color-surface)]'
          }
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}
