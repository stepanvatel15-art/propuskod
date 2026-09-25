'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

const PRESETS: { value: string; label: string }[] = [
  { value: 'month', label: 'Текущий месяц' },
  { value: '6m', label: '6 месяцев' },
  { value: 'year', label: 'Учебный год' },
  { value: 'custom', label: 'Свой период' },
]

export default function DateRangeFilter({
  current,
  from,
  to,
}: {
  current: string
  from: string
  to: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [customFrom, setCustomFrom] = useState(from)
  const [customTo, setCustomTo] = useState(to)

  function setPreset(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('range', value)
    if (value !== 'custom') {
      params.delete('from')
      params.delete('to')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  function applyCustom() {
    if (!customFrom || !customTo) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('range', 'custom')
    params.set('from', customFrom)
    params.set('to', customTo)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <div className="flex gap-1 rounded-lg border border-[var(--color-border)] bg-white p-1">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPreset(p.value)}
            className={
              current === p.value
                ? 'rounded-md bg-[var(--color-primary)] px-3 py-1 text-white'
                : 'rounded-md px-3 py-1 text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)]'
            }
          >
            {p.label}
          </button>
        ))}
      </div>

      {current === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="h-9 rounded-lg border border-[var(--color-border)] px-2 text-sm"
          />
          <span className="text-[var(--color-ink-muted)]">—</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="h-9 rounded-lg border border-[var(--color-border)] px-2 text-sm"
          />
          <button
            onClick={applyCustom}
            className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-sm text-white"
          >
            Применить
          </button>
        </div>
      )}
    </div>
  )
}
