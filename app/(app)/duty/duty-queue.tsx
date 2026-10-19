'use client'

import { useState, useTransition } from 'react'
import { useLiveRefresh } from '@/lib/realtime/use-live-refresh'
import { markPassUsedAction, cancelPassAction } from './actions'
import { formatTime } from '@/lib/format/datetime'
import { lessonLabel } from '@/lib/school/lessons'
import { PassTicket } from '@/components/ui/pass-ticket'
import { CheckIcon } from '@/components/ui/icons'
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
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useLiveRefresh({ channel: `duty-passes-${buildingId}`, table: 'passes', filter: `building_id=eq.${buildingId}`, pollMs: 10_000 })

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
      <p className="rounded-2xl border-2 border-dashed border-[var(--color-border)] px-4 py-8 text-center text-sm text-[var(--color-ink-muted)]">
        Нет заявок на выход
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-xl bg-[var(--color-danger-light)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}
      {passes.map((p) => {
        const isDutyIssued = p.creator?.role === 'security' || p.creator?.role === 'admin'
        return (
          <PassTicket
            key={p.id}
            time={formatTime(p.requested_departure_at)}
            caption={lessonLabel(p.requested_departure_at) ?? 'точное время'}
            tone={isDutyIssued ? 'accent' : 'primary'}
            actions={
              <>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleCancel(p.id)}
                  className="h-9 rounded-full px-4 text-[13px] font-bold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] disabled:opacity-50 sm:h-11 sm:border sm:border-[var(--color-border)] sm:bg-white sm:px-5 sm:text-sm sm:text-[var(--color-ink)] sm:hover:bg-[var(--color-surface)]"
                >
                  Отменить
                </button>
                <Button size="lg" disabled={isPending} onClick={() => handleMarkUsed(p.id)} className="w-full sm:w-auto">
                  <CheckIcon />
                  Ребёнок вышел
                </Button>
              </>
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-bold sm:text-[17px]">{p.students?.full_name}</span>
              {p.classes?.name && <Badge tone="neutral" className="text-[13px] font-extrabold">{p.classes.name}</Badge>}
            </div>
            {p.reason && <p className="text-sm text-[#475467]">{p.reason}</p>}
            <Badge tone={isDutyIssued ? 'accent' : 'neutral'} className="self-start">
              {isDutyIssued ? 'Выпущено дежурным' : 'От классного руководителя'}
            </Badge>
          </PassTicket>
        )
      })}
    </div>
  )
}
