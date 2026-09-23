'use client'

import { useState, useTransition } from 'react'
import { assignTeacherAction, assignBuildingAction, deleteClassAction } from './actions'
import { Card } from '@/components/ui/card'

type Klass = {
  id: string
  name: string
  homeroom_teacher_id: string | null
  building_id: string | null
  profiles: { full_name: string } | null
}
type Teacher = { id: string; full_name: string }
type Building = { id: string; name: string }

export default function ClassesTable({
  classes,
  teachers,
  buildings,
}: {
  classes: Klass[]
  teachers: Teacher[]
  buildings: Building[]
}) {
  const [isPending, startTransition] = useTransition()
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function handleDelete(classId: string, className: string) {
    setDeleteError(null)
    const confirmed = window.confirm(
      `Удалить класс «${className}»? Это удалит и всех его учеников. Действие необратимо.`
    )
    if (!confirmed) return

    startTransition(async () => {
      try {
        await deleteClassAction(classId)
      } catch (e) {
        setDeleteError(e instanceof Error ? e.message : 'Не удалось удалить класс')
      }
    })
  }

  return (
    <div className="space-y-3">
      {deleteError && (
        <p className="rounded-lg bg-[var(--color-danger-light)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {deleteError}
        </p>
      )}
      <Card className="divide-y divide-[var(--color-border)] overflow-hidden">
        <div className="grid grid-cols-[1fr_1.6fr_1fr_auto] gap-3 bg-[var(--color-surface)] px-4 py-2 text-xs font-medium text-[var(--color-ink-muted)]">
          <span>Класс</span>
          <span>Классный руководитель</span>
          <span>Корпус</span>
          <span></span>
        </div>
        {classes.map((c) => (
          <div key={c.id} className="grid grid-cols-[1fr_1.6fr_1fr_auto] items-center gap-3 px-4 py-3 text-sm">
            <span className="font-medium text-[var(--color-ink)]">{c.name}</span>
            <select
              defaultValue={c.homeroom_teacher_id ?? ''}
              disabled={isPending}
              onChange={(e) =>
                startTransition(() => assignTeacherAction(c.id, e.target.value || null))
              }
              className="h-9 rounded-lg border border-[var(--color-border)] bg-white px-2 text-sm"
            >
              <option value="">— не назначен —</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.full_name}</option>
              ))}
            </select>
            <select
              defaultValue={c.building_id ?? ''}
              disabled={isPending}
              onChange={(e) =>
                startTransition(() => assignBuildingAction(c.id, e.target.value || null))
              }
              className="h-9 rounded-lg border border-[var(--color-border)] bg-white px-2 text-sm"
            >
              <option value="">— не назначен —</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <button
              disabled={isPending}
              onClick={() => handleDelete(c.id, c.name)}
              className="text-xs text-[var(--color-danger)] underline decoration-dotted disabled:opacity-50"
            >
              Удалить
            </button>
          </div>
        ))}
      </Card>
    </div>
  )
}
