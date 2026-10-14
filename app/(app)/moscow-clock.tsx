'use client'

import { useEffect, useState } from 'react'

type Now = { time: string; date: string }

function moscowNow(): Now {
  const d = new Date()
  return {
    time: d.toLocaleTimeString('ru-RU', { timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit' }),
    date: d.toLocaleDateString('ru-RU', { timeZone: 'Europe/Moscow', weekday: 'short', day: 'numeric', month: 'long' }),
  }
}

/**
 * Часы по Москве: видно, по какому времени работает система.
 * big — тёмная плашка внизу бокового меню; compact — в шапке на телефоне.
 */
export default function MoscowClock({ variant = 'big' }: { variant?: 'big' | 'compact' }) {
  const [now, setNow] = useState<Now | null>(null)
  useEffect(() => {
    setNow(moscowNow())
    const id = setInterval(() => setNow(moscowNow()), 5_000)
    return () => clearInterval(id)
  }, [])

  if (variant === 'compact') {
    return (
      <div
        className="tabular shrink-0 rounded-xl bg-[var(--color-ink)] px-3 py-1.5 text-lg font-extrabold leading-tight text-white"
        title="Время по Москве"
      >
        {now?.time ?? '--:--'}
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-[var(--color-ink)] p-4 text-white" title="Все даты и время в системе — московские">
      <div className="tabular text-[40px] font-extrabold leading-none tracking-tight">{now?.time ?? '--:--'}</div>
      <div className="mt-1.5 text-xs text-white/70">Москва · {now?.date ?? ''}</div>
    </div>
  )
}
