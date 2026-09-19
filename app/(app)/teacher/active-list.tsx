'use client'

import { useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cancelPassAction } from './actions'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatTime } from '@/lib/format/datetime'

type ActivePass = {
  id: string
  requested_departure_at: string
  students: { full_name: string } | null
}

export default function ActiveList({ passes, classId }: { passes: ActivePass[]; classId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

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

  if (passes.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-6 text-center text-sm text-[var(--color-ink-muted)]">
        Нет активных пропусков
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
              Выход в {formatTime(p.requested_departure_at)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="accent">Ожидает дежурного на посту</Badge>
            <Button
              size="sm"
              variant="ghost"
              disabled={isPending}
              onClick={() => startTransition(() => cancelPassAction(p.id))}
            >
              Отменить
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
