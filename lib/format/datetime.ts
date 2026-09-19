/**
 * Единая точка форматирования дат/времени — всегда московский часовой пояс,
 * независимо от системных настроек устройства, с которого смотрят
 * (важно, потому что VPN на макбуках сбивает автоопределение зоны).
 */
const TIME_ZONE = 'Europe/Moscow'

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIME_ZONE,
  })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIME_ZONE,
  })
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { timeZone: TIME_ZONE })
}

/**
 * Начало "сегодня" по московскому времени — не по локальному времени сервера
 * (на Vercel сервер работает в UTC, поэтому обычный new Date().setHours(0,0,0,0)
 * даёт полночь UTC, а не полночь в Москве — сдвиг на 3 часа).
 */
export function moscowTodayStartISO(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  const y = get('year')
  const m = get('month')
  const d = get('day')

  // Москва — UTC+3 круглый год, без перехода на летнее/зимнее время
  return new Date(Date.UTC(y, m - 1, d) - 3 * 3600 * 1000).toISOString()
}
