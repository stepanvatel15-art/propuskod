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
      <div className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-[var(--color-border)] bg-white p-1 [scrollbar-width:none]">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => updateParam('range', r.value)}
            className={
              currentRange === r.value
                ? 'shrink-0 whitespace-nowrap rounded-full bg-[var(--color-ink)] px-3.5 py-1.5 font-bold text-white'
                : 'shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 font-semibold text-[#344054] hover:bg-[var(--color-surface)]'
            }
          >
            {r.label}
          </button>
        ))}
      </div>

      <select
        value={currentStatus}
        onChange={(e) => updateParam('status', e.target.value)}
        className="h-10 rounded-xl border border-[var(--color-border)] bg-white px-2 text-[var(--color-ink)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
    </div>
  )
}
