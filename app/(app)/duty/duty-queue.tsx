'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { markPassUsedAction, cancelPassAction } from './actions'
import { formatTime } from '@/lib/format/datetime'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type DutyPass = {
  id: string
  requested_departure_at: string
  reason: string | null
  students: { full_name: string } | null
  classes: { name: string } | null
  creator: { role: string } | null
}

export default function DutyQueue({ passes, buildingId }: { passes: DutyPass[]; buildingId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`duty-passes-${buildingId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'passes', filter: `building_id=eq.${buildingId}` },
        () => {
          // события могут добавлять новые связанные ФИО/классы, которых нет в payload —
          // проще и надёжнее перезапросить страницу целиком, чем склеивать данные на клиенте
          router.refresh()
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [buildingId, router])

  function handleMarkUsed(passId: string) {
    setError(null)
    startTransition(async () => {
      const res = await markPassUsedAction(passId)
      if ('error' in res) setError(res.error)
    })
  }

  function handleCancel(passId: string) {
    setError(null)
    startTransition(async () => {
      const res = await cancelPassAction(passId)
      if ('error' in res) setError(res.error)
    })
  }

  if (passes.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-6 text-center text-sm text-[var(--color-ink-muted)]">
        Нет заявок на выход
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="rounded-lg bg-[var(--color-danger-light)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}
      {passes.map((p) => {
        const isDutyIssued = p.creator?.role === 'security' || p.creator?.role === 'admin'
        return (
          <Card key={p.id} className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-[var(--color-ink)]">{p.students?.full_name}</p>
              <p className="text-xs text-[var(--color-ink-muted)]">
                {p.classes?.name} · заявлено на{' '}
                {formatTime(p.requested_departure_at)}
                {p.reason ? ` · ${p.reason}` : ''}
              </p>
              <Badge tone={isDutyIssued ? 'accent' : 'primary'} className="mt-1.5">
                {isDutyIssued ? 'Выпущено дежурным' : 'От классного руководителя'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={isPending}
                onClick={() => handleCancel(p.id)}
              >
                Отменить
              </Button>
              <Button
                disabled={isPending}
                onClick={() => handleMarkUsed(p.id)}
              >
                Ребёнок вышел
              </Button>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
