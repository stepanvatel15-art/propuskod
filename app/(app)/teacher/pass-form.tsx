'use client'

import { useState, useTransition } from 'react'
import { createPassAction } from './actions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Student = { id: string; full_name: string }

export default function PassForm({ students }: { students: Student[] }) {
  const [studentId, setStudentId] = useState('')
  const [time, setTime] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit() {
    if (!studentId || !time) {
      setError('Выберите ученика и время выхода')
      return
    }
    setError(null)
    const iso = new Date(time).toISOString()

    startTransition(async () => {
      const res = await createPassAction({ studentId, requestedDepartureAt: iso, reason })
      if ('error' in res) {
        setError(res.error)
      } else {
        setStudentId(''); setTime(''); setReason('')
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

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--color-ink-muted)]">
            Время выхода (с запасом, если скоро)
          </label>
          <Input type="datetime-local" value={time} onChange={(e) => setTime(e.target.value)} />
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
