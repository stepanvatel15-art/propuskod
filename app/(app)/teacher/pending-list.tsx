'use client'

import { useTransition } from 'react'
import { approvePassAction, rejectPassAction } from './actions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type PendingPass = {
  id: string
  requested_departure_at: string
  reason: string | null
  students: { full_name: string } | null
}

export default function PendingList({ passes }: { passes: PendingPass[] }) {
  const [isPending, startTransition] = useTransition()

  if (passes.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-6 text-center text-sm text-[var(--color-ink-muted)]">
        Нет заявок на подтверждение
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {passes.map((p) => (
        <Card key={p.id} className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium text-[var(--color-ink)]">{p.students?.full_name}</p>
            <p className="text-xs text-[var(--color-ink-muted)]">
              Выход в {new Date(p.requested_departure_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              {p.reason ? ` · ${p.reason}` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => startTransition(() => approvePassAction(p.id))}
            >
              Подтвердить
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={isPending}
              onClick={() => startTransition(() => rejectPassAction(p.id))}
            >
              Отклонить
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
