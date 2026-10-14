'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cancelPassAction } from './actions'
import { PassTicket } from '@/components/ui/pass-ticket'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatTime } from '@/lib/format/datetime'
import { lessonLabel } from '@/lib/school/lessons'

type ActivePass = {
  id: string
  requested_departure_at: string
  students: { full_name: string } | null
}

export default function ActiveList({ passes, classId }: { passes: ActivePass[]; classId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`teacher-passes-${classId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'passes', filter: `class_id=eq.${classId}` },
        () => router.refresh()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [classId, router])

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
        Нет активных пропусков
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
      {passes.map((p) => (
        <PassTicket
          key={p.id}
          time={formatTime(p.requested_departure_at)}
          caption={lessonLabel(p.requested_departure_at) ?? 'точное время'}
          actions={
            <Button variant="secondary" size="sm" disabled={isPending} onClick={() => handleCancel(p.id)}>
              Отменить
            </Button>
          }
        >
          <span className="text-base font-bold">{p.students?.full_name}</span>
          <Badge tone="accent" className="self-start">Ожидает дежурного на посту</Badge>
        </PassTicket>
      ))}
    </div>
  )
}
