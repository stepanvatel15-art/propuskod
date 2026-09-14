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
  { value: 'used', label: 'Использованы' },
  { value: 'expired', label: 'Истекли' },
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
    <div className="flex flex-wrap gap-4 text-sm">
      <div className="flex gap-1">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => updateParam('range', r.value)}
            className={`rounded px-3 py-1 ${
              currentRange === r.value ? 'bg-black text-white' : 'bg-gray-100'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <select
        value={currentStatus}
        onChange={(e) => updateParam('status', e.target.value)}
        className="rounded border px-2 py-1"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
    </div>
  )
}
