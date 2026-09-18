'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

const RANGES: { value: string; label: string }[] = [
  { value: 'today', label: 'Сегодня' },
  { value: '7d', label: '7 дней' },
  { value: '30d', label: '30 дней' },
  { value: 'all', label: 'Всё время' },
]

const STATUSES: { value: string; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'used', label: 'Ребёнок вышел' },
  { value: 'rejected', label: 'Отклонены' },
  { value: 'cancelled', label: 'Отменены' },
]

export default function HistoryFilters({
  currentRange,
  currentStatus,
}: {
  currentRange: string
  currentStatus: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <div className="flex gap-1 rounded-lg border border-[var(--color-border)] bg-white p-1">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => updateParam('range', r.value)}
            className={
              currentRange === r.value
                ? 'rounded-md bg-[var(--color-primary)] px-3 py-1 text-white'
                : 'rounded-md px-3 py-1 text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)]'
            }
          >
            {r.label}
          </button>
        ))}
      </div>

      <select
        value={currentStatus}
        onChange={(e) => updateParam('status', e.target.value)}
        className="h-9 rounded-lg border border-[var(--color-border)] bg-white px-2 text-[var(--color-ink)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
    </div>
  )
}
