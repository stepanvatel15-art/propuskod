/**
 * Расписание окончания уроков — по нему учитель выбирает «после N-го урока».
 * Чтобы поменять расписание, достаточно поправить время здесь.
 */
export const LESSON_ENDS: { n: number; time: string }[] = [
  { n: 1, time: '09:15' },
  { n: 2, time: '10:20' },
  { n: 3, time: '11:25' },
  { n: 4, time: '12:30' },
  { n: 5, time: '13:35' },
  { n: 6, time: '14:30' },
  { n: 7, time: '15:25' },
]

const TIME_ZONE = 'Europe/Moscow'

/** Сегодняшняя дата по Москве в виде YYYY-MM-DD. */
export function moscowTodayDateString(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/** "HH:MM" сегодня по Москве → ISO (Москва круглый год UTC+3). */
export function moscowTodayAtISO(hhmm: string): string {
  return new Date(`${moscowTodayDateString()}T${hhmm}:00+03:00`).toISOString()
}

/** "HH:MM" для момента времени — по Москве. */
function moscowHHMM(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIME_ZONE,
  })
}

/** «после 2-го урока», если время выхода совпадает с концом урока; иначе null. */
export function lessonLabel(iso: string): string | null {
  const t = moscowHHMM(iso)
  const lesson = LESSON_ENDS.find((l) => l.time === t)
  return lesson ? `после ${lesson.n}-го урока` : null
}
