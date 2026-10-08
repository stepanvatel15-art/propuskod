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
    <Card className="space-y-4 p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-medium text-[var(--color-ink-muted)]">Ученик</label>
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="h-10 w-full rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]"
          >
            <option value="">— выберите ученика —</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[var(--color-ink-muted)]">Когда отпустить</label>
            <button
              type="button"
              onClick={() => setMode(mode === 'lesson' ? 'exact' : 'lesson')}
              className="text-xs text-[var(--color-primary)] underline-offset-2 hover:underline"
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
                    lesson === l.n
                      ? 'rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary)] px-3 py-2 text-left text-sm text-white'
                      : 'rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-left text-sm hover:border-[var(--color-primary)]'
                  }
                >
                  <span className="block font-medium">После {l.n}-го урока</span>
                  <span className={lesson === l.n ? 'text-xs text-white/80' : 'text-xs text-[var(--color-ink-muted)]'}>
                    в {l.time}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <Input type="datetime-local" value={time} onChange={(e) => setTime(e.target.value)} />
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--color-ink-muted)]">Причина (необязательно)</label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Например, к врачу" />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-[var(--color-danger-light)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}

      <Button onClick={submit} disabled={isPending}>
        {isPending ? 'Сохраняем…' : 'Выдать пропуск'}
      </Button>
    </Card>
  )
}
