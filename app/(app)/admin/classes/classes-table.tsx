'use client'

import { useTransition } from 'react'
import { assignTeacherAction, assignBuildingAction } from './actions'
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

  return (
    <Card className="divide-y divide-[var(--color-border)] overflow-hidden">
      <div className="grid grid-cols-[1fr_1.6fr_1fr] gap-3 bg-[var(--color-surface)] px-4 py-2 text-xs font-medium text-[var(--color-ink-muted)]">
        <span>Класс</span>
        <span>Классный руководитель</span>
        <span>Корпус</span>
      </div>
      {classes.map((c) => (
        <div key={c.id} className="grid grid-cols-[1fr_1.6fr_1fr] items-center gap-3 px-4 py-3 text-sm">
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
        </div>
      ))}
    </Card>
  )
}
