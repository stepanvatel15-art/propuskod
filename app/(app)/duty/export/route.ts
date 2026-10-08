import * as XLSX from 'xlsx'
import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { moscowDateStringStartISO, moscowDateStringEndISO } from '@/lib/format/datetime'

/**
 * Выгрузка опозданий / «без карты» в Excel.
 * GET /duty/export?from=YYYY-MM-DD&to=YYYY-MM-DD&kind=all|late|no_card
 *                 &building=<id>&class=<id>&student=<id>
 * Доступ: дежурные и администраторы (по всем корпусам — для отчётов).
 */
/**
 * Дата и время отметки по МОСКОВСКИМ часам — в виде настоящих ячеек Excel
 * (дата и время, а не текст). Так Excel / Numbers / Google Таблицы не будут
 * сами «угадывать» формат и сдвигать время, а по столбцам можно сортировать.
 */
function moscowExcelDateTime(iso: string): { date: number; time: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Moscow',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(iso))
  const n = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  const wallClockUTC = Date.UTC(n('year'), n('month') - 1, n('day'), n('hour'), n('minute'))
  const serial = (wallClockUTC - Date.UTC(1899, 11, 30)) / 86_400_000
  const date = Math.floor(serial)
  return { date, time: serial - date }
}

const KIND_LABEL: Record<string, string> = { late: 'Опоздание', no_card: 'Без карты' }
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

type MarkRow = {
  created_at: string
  kind: string
  students: { full_name: string } | null
  classes: { name: string } | null
  buildings: { name: string } | null
  creator: { full_name: string } | null
}

export async function GET(request: Request) {
  const { profile } = await getSession()
  if (!profile || !['security', 'admin'].includes(profile.role)) {
    return new Response('Недостаточно прав', { status: 403 })
  }

  const sp = new URL(request.url).searchParams
  const from = sp.get('from') ?? ''
  const to = sp.get('to') ?? ''
  if (!DATE_RE.test(from) || !DATE_RE.test(to) || from > to) {
    return new Response('Неверный период', { status: 400 })
  }
  const kind = sp.get('kind') ?? 'all'
  const building = sp.get('building') || null
  const klass = sp.get('class') || null
  const student = sp.get('student') || null

  const admin = createAdminClient()
  const rows: MarkRow[] = []
  // Supabase отдаёт не больше 1000 строк за раз — забираем порциями
  for (let offset = 0; ; offset += 1000) {
    let q = admin
      .from('attendance_marks')
      .select(
        `created_at, kind, students(full_name), classes(name), buildings(name),
         creator:profiles!attendance_marks_created_by_fkey(full_name)`
      )
      .gte('created_at', moscowDateStringStartISO(from))
      .lt('created_at', moscowDateStringEndISO(to))
      .order('created_at')
      .range(offset, offset + 999)
    if (kind === 'late' || kind === 'no_card') q = q.eq('kind', kind)
    if (building) q = q.eq('building_id', building)
    if (klass) q = q.eq('class_id', klass)
    if (student) q = q.eq('student_id', student)

    const { data, error } = await q
    if (error) return new Response(`Ошибка базы: ${error.message}`, { status: 500 })
    rows.push(...((data ?? []) as unknown as MarkRow[]))
    if (!data || data.length < 1000) break
  }

  // Лист 1 — все отметки по порядку
  const list = [
    ['Дата', 'Время', 'Отметка', 'Ученик', 'Класс', 'Корпус', 'Отметил(а)'],
    ...rows.map((r) => {
      const { date, time } = moscowExcelDateTime(r.created_at)
      return [
      { t: 'n', v: date, z: 'dd.mm.yyyy' },
      { t: 'n', v: time, z: 'hh:mm' },
      KIND_LABEL[r.kind] ?? r.kind,
      r.students?.full_name ?? '',
      r.classes?.name ?? '',
      r.buildings?.name ?? '',
      r.creator?.full_name ?? '',
      ]
    }),
  ]

  // Лист 2 — итог по ученикам (кто чаще всего опаздывает / без карты)
  const totals = new Map<string, { name: string; cls: string; late: number; noCard: number }>()
  for (const r of rows) {
    const key = `${r.students?.full_name}|${r.classes?.name}`
    const t = totals.get(key) ?? { name: r.students?.full_name ?? '', cls: r.classes?.name ?? '', late: 0, noCard: 0 }
    if (r.kind === 'late') t.late++
    else if (r.kind === 'no_card') t.noCard++
    totals.set(key, t)
  }
  const summary = [
    ['Ученик', 'Класс', 'Опозданий', 'Без карты', 'Всего'],
    ...[...totals.values()]
      .sort((a, b) => b.late + b.noCard - (a.late + a.noCard) || a.cls.localeCompare(b.cls, 'ru'))
      .map((t) => [t.name, t.cls, t.late, t.noCard, t.late + t.noCard]),
  ]

  const wb = XLSX.utils.book_new()
  const sheet1 = XLSX.utils.aoa_to_sheet(list)
  sheet1['!cols'] = [{ wch: 11 }, { wch: 7 }, { wch: 11 }, { wch: 34 }, { wch: 7 }, { wch: 9 }, { wch: 30 }]
  const sheet2 = XLSX.utils.aoa_to_sheet(summary)
  sheet2['!cols'] = [{ wch: 34 }, { wch: 7 }, { wch: 11 }, { wch: 10 }, { wch: 7 }]
  XLSX.utils.book_append_sheet(wb, sheet1, 'Все отметки')
  XLSX.utils.book_append_sheet(wb, sheet2, 'Итого по ученикам')
  const buf: Buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  const kindPart = kind === 'late' ? 'опоздания' : kind === 'no_card' ? 'без-карты' : 'опоздания-и-без-карты'
  const period = from === to ? from : `${from}_${to}`
  const filename = `${kindPart}_${period}.xlsx`

  return new Response(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="report.xlsx"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'Cache-Control': 'no-store',
    },
  })
}
