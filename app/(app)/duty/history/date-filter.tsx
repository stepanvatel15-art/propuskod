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
    <div className="flex gap-1 rounded-lg border border-[var(--color-border)] bg-white p-1 text-sm">
      {RANGES.map((r) => (
        <button
          key={r.value}
          onClick={() => update(r.value)}
          className={
            current === r.value
              ? 'rounded-md bg-[var(--color-primary)] px-3 py-1 text-white'
              : 'rounded-md px-3 py-1 text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)]'
          }
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}
