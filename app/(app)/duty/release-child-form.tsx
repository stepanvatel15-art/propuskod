'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createDutyReleaseAction } from './actions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type ClassOption = { id: string; name: string }
type StudentRow = { id: string; full_name: string; class_id: string }

export default function ReleaseChildForm({
  classes,
  students,
}: {
  classes: ClassOption[]
  students: StudentRow[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [classId, setClassId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const studentsInClass = useMemo(
    () => students.filter((s) => s.class_id === classId),
    [students, classId]
  )

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Выпустить ребёнка самостоятельно
      </Button>
    )
  }

  function submit() {
    if (!studentId) {
      setError('Выберите ученика')
      return
    }
    if (!reason.trim()) {
      setError('Укажите, с чьего разрешения выпускается ребёнок')
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await createDutyReleaseAction({ studentId, reason })
      if ('error' in res) {
        setError(res.error)
      } else {
        setClassId(''); setStudentId(''); setReason(''); setOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <Card className="space-y-3 p-5">
      <div>
        <h2 className="text-sm font-semibold text-[var(--color-ink)]">Выпустить ребёнка самостоятельно</h2>
        <p className="text-xs text-[var(--color-ink-muted)]">
          Используйте, если классный руководитель недоступен. Причина обязательна — например,
          «устное разрешение матери по телефону».
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--color-ink-muted)]">Класс</label>
          <select
            value={classId}
            onChange={(e) => { setClassId(e.target.value); setStudentId('') }}
            className="h-10 w-full rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]"
          >
            <option value="">— выберите класс —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--color-ink-muted)]">Ученик</label>
          <select
            value={studentId}
            disabled={!classId}
            onChange={(e) => setStudentId(e.target.value)}
            className="h-10 w-full rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)] disabled:bg-[var(--color-surface)] disabled:text-[var(--color-ink-muted)]"
          >
            <option value="">{classId ? '— выберите ученика —' : 'сначала выберите класс'}</option>
            {studentsInClass.map((s) => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--color-ink-muted)]">
          С чьего разрешения / причина
        </label>
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Например: устное разрешение отца по телефону"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-[var(--color-danger-light)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button onClick={submit} disabled={isPending}>
          {isPending ? 'Оформляем…' : 'Выпустить'}
        </Button>
        <Button variant="secondary" onClick={() => setOpen(false)} disabled={isPending}>
          Отмена
        </Button>
      </div>
    </Card>
  )
}
