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

/** "YYYY-MM-DD" (значение из <input type="date">) → начало этого дня по Москве. */
export function moscowDateStringStartISO(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return moscowMidnightISO(y, m, d)
}

/** "YYYY-MM-DD" → конец этого дня по Москве (начало следующего дня). */
export function moscowDateStringEndISO(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return moscowMidnightISO(y, m, d + 1)
}

function getMoscowDateParts(): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  return { y: get('year'), m: get('month'), d: get('day') }
}

/** Полночь по Москве для заданных года/месяца/дня (месяц 1-12). */
function moscowMidnightISO(y: number, m: number, d: number): string {
  return new Date(Date.UTC(y, m - 1, d) - 3 * 3600 * 1000).toISOString()
}

/**
 * Начало "сегодня" по московскому времени — не по локальному времени сервера
 * (на Vercel сервер работает в UTC, поэтому обычный new Date().setHours(0,0,0,0)
 * даёт полночь UTC, а не полночь в Москве — сдвиг на 3 часа).
 */
export function moscowTodayStartISO(): string {
  const { y, m, d } = getMoscowDateParts()
  return moscowMidnightISO(y, m, d)
}

/** Начало текущего календарного месяца по Москве. */
export function moscowMonthStartISO(): string {
  const { y, m } = getMoscowDateParts()
  return moscowMidnightISO(y, m, 1)
}

/** N месяцев назад от сегодняшнего числа по Москве (для фильтра "6 месяцев"). */
export function moscowMonthsAgoISO(months: number): string {
  const { y, m, d } = getMoscowDateParts()
  const total = (y * 12 + (m - 1)) - months
  const yy = Math.floor(total / 12)
  const mm = (total % 12) + 1
  return moscowMidnightISO(yy, mm, d)
}

/** Начало текущего учебного года (1 сентября ближайшее прошедшее) по Москве. */
export function moscowSchoolYearStartISO(): string {
  const { y, m } = getMoscowDateParts()
  const startYear = m >= 9 ? y : y - 1
  return moscowMidnightISO(startYear, 9, 1)
}
