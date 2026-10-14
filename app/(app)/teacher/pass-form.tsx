'use client'

import { useState, useTransition } from 'react'
import { createPassAction } from './actions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LESSON_ENDS, moscowTodayAtISO } from '@/lib/school/lessons'

type Student = { id: string; full_name: string }

export default function PassForm({ students }: { students: Student[] }) {
  const [studentId, setStudentId] = useState('')
  const [mode, setMode] = useState<'lesson' | 'exact'>('lesson')
  const [lesson, setLesson] = useState<number | null>(null)
  const [time, setTime] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit() {
    const lessonTime = LESSON_ENDS.find((l) => l.n === lesson)?.time
    if (!studentId || (mode === 'lesson' ? !lessonTime : !time)) {
      setError(mode === 'lesson' ? 'Выберите ученика и урок' : 'Выберите ученика и время выхода')
      return
    }
    setError(null)
    const iso = mode === 'lesson' ? moscowTodayAtISO(lessonTime!) : new Date(time).toISOString()

    startTransition(async () => {
      const res = await createPassAction({ studentId, requestedDepartureAt: iso, reason })
      if ('error' in res) {
        setError(res.error)
      } else {
        setStudentId(''); setTime(''); setLesson(null); setReason('')
      }
    })
  }

  return (
    <Card className="space-y-4 p-4 sm:p-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-[13px] font-semibold text-[#475467]">Ученик</label>
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-3.5 text-[15px] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]"
          >
            <option value="">— выберите ученика —</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-semibold text-[#475467]">Когда отпустить</label>
            <button
              type="button"
              onClick={() => setMode(mode === 'lesson' ? 'exact' : 'lesson')}
              className="text-[13px] font-bold text-[var(--color-primary)] underline-offset-2 hover:underline"
            >
              {mode === 'lesson' ? 'Указать точное время' : 'Выбрать урок'}
            </button>
          </div>

          {mode === 'lesson' ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {LESSON_ENDS.map((l) => (
                <button
                  key={l.n}
                  type="button"
                  onClick={() => setLesson(l.n)}
                  aria-pressed={lesson === l.n}
                  className={
                    'flex h-16 flex-col justify-center rounded-2xl border px-3.5 text-left ' +
                    (lesson === l.n
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                      : 'border-[var(--color-border)] bg-white text-[var(--color-ink)] hover:border-[var(--color-primary)]')
                  }
                >
                  <span className="tabular text-xl font-extrabold leading-tight">{l.time}</span>
                  <span className={'text-xs font-semibold ' + (lesson === l.n ? 'text-white/85' : 'text-[var(--color-ink-muted)]')}>
                    после {l.n}-го урока
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <Input type="datetime-local" value={time} onChange={(e) => setTime(e.target.value)} />
          )}
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-[13px] font-semibold text-[#475467]">Причина (необязательно)</label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Например, к врачу" />
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-[var(--color-danger-light)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}

      <Button size="lg" onClick={submit} disabled={isPending} className="w-full sm:w-auto">
        {isPending ? 'Сохраняем…' : 'Выдать пропуск'}
      </Button>
    </Card>
  )
}
