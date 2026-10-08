'use client'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Building = { id: string; name: string }
type Klass = { id: string; name: string; building_id: string | null }
type Student = { id: string; full_name: string; class_id: string }
type Preset = 'today' | 'yesterday' | 'week' | 'month' | 'custom'

const SELECT =
  'h-10 w-full rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)] disabled:bg-[var(--color-surface)] disabled:text-[var(--color-ink-muted)]'

/** Дата по Москве со сдвигом в днях → YYYY-MM-DD */
function moscowDate(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86400_000)
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d)
}

function presetRange(p: Preset): { from: string; to: string } | null {
  const today = moscowDate()
  if (p === 'today') return { from: today, to: today }
  if (p === 'yesterday') { const y = moscowDate(-1); return { from: y, to: y } }
  if (p === 'week') return { from: moscowDate(-6), to: today }
  if (p === 'month') return { from: today.slice(0, 8) + '01', to: today }
  return null
}

const PRESETS: { id: Preset; label: string }[] = [
  { id: 'today', label: 'Сегодня' },
  { id: 'yesterday', label: 'Вчера' },
  { id: 'week', label: '7 дней' },
  { id: 'month', label: 'С начала месяца' },
  { id: 'custom', label: 'Свой период' },
]

export default function ReportForm({
  buildings, classes, students, defaultBuildingId,
}: {
  buildings: Building[]; classes: Klass[]; students: Student[]; defaultBuildingId: string
}) {
  const [preset, setPreset] = useState<Preset>('yesterday')
  const [from, setFrom] = useState(moscowDate(-1))
  const [to, setTo] = useState(moscowDate(-1))
  const [kind, setKind] = useState<'all' | 'late' | 'no_card'>('all')
  const [buildingId, setBuildingId] = useState(defaultBuildingId)
  const [classId, setClassId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const classOptions = useMemo(
    () => classes.filter((c) => !buildingId || c.building_id === buildingId),
    [classes, buildingId]
  )
  const studentOptions = useMemo(
    () => students.filter((s) => s.class_id === classId),
    [students, classId]
  )

  function choosePreset(p: Preset) {
    setPreset(p)
    const r = presetRange(p)
    if (r) { setFrom(r.from); setTo(r.to) }
  }

  function download() {
    if (!from || !to) return setError('Укажите период')
    if (from > to) return setError('Дата «с» позже даты «по»')
    setError(null)
    const params = new URLSearchParams({ from, to, kind })
    if (buildingId) params.set('building', buildingId)
    if (classId) params.set('class', classId)
    if (studentId) params.set('student', studentId)
    // это скачивание файла, а не переход по страницам — обычная ссылка здесь правильнее router.push
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/duty/export?${params}`
  }

  return (
    <Card className="space-y-5 p-5">
      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--color-ink-muted)]">Период</label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => choosePreset(p.id)}
              aria-pressed={preset === p.id}
              className={
                preset === p.id
                  ? 'rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-sm text-white'
                  : 'rounded-lg border border-[var(--color-border)] bg-white px-3 py-1.5 text-sm hover:border-[var(--color-primary)]'
              }
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-xs text-[var(--color-ink-muted)]">с</span>
            <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPreset('custom') }} />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-[var(--color-ink-muted)]">по</span>
            <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPreset('custom') }} />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--color-ink-muted)]">Что выгрузить</label>
        <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className={SELECT}>
          <option value="all">Опоздания и без карты</option>
          <option value="late">Только опоздания</option>
          <option value="no_card">Только без карты</option>
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--color-ink-muted)]">Корпус</label>
          <select
            value={buildingId}
            onChange={(e) => { setBuildingId(e.target.value); setClassId(''); setStudentId('') }}
            className={SELECT}
          >
            <option value="">Все корпуса</option>
            {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--color-ink-muted)]">Класс</label>
          <select
            value={classId}
            onChange={(e) => { setClassId(e.target.value); setStudentId('') }}
            className={SELECT}
          >
            <option value="">Все классы</option>
            {classOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--color-ink-muted)]">Ученик</label>
          <select
            value={studentId}
            disabled={!classId}
            onChange={(e) => setStudentId(e.target.value)}
            className={SELECT}
          >
            <option value="">{classId ? 'Все ученики класса' : 'сначала класс'}</option>
            {studentOptions.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-[var(--color-danger-light)] px-3 py-2 text-sm text-[var(--color-danger)]">{error}</p>
      )}

      <Button onClick={download}>Скачать Excel</Button>
      <p className="text-xs text-[var(--color-ink-muted)]">
        В файле два листа: все отметки по порядку и итог по каждому ученику.
      </p>
    </Card>
  )
}
