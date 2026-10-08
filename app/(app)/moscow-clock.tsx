'use client'

import { useEffect, useState } from 'react'

function moscowNow(): string {
  return new Date().toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow',
    weekday: 'short', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
  })
}

/** Часы по Москве в меню: видно, по какому времени работает система. */
export default function MoscowClock() {
  const [now, setNow] = useState<string | null>(null)
  useEffect(() => {
    setNow(moscowNow())
    const id = setInterval(() => setNow(moscowNow()), 15_000)
    return () => clearInterval(id)
  }, [])
  if (!now) return null
  return (
    <p className="text-xs text-white/60" title="Все даты и время в системе — московские">
      Москва · {now}
    </p>
  )
}
