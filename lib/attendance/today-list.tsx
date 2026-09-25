'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { deleteAttendanceMarkAction, type AttendanceKind } from './attendance-actions'
import { formatTime } from '@/lib/format/datetime'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type MarkRow = {
  id: string
  created_at: string
  students: { full_name: string } | null
  classes: { name: string } | null
}

export default function TodayList({
  marks,
  kind,
  buildingId,
}: {
  marks: MarkRow[]
  kind: AttendanceKind
  buildingId: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`attendance-${kind}-${buildingId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance_marks', filter: `building_id=eq.${buildingId}` },
        () => router.refresh()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [kind, buildingId, router])

  function handleDelete(markId: string) {
    setError(null)
    startTransition(async () => {
      const res = await deleteAttendanceMarkAction(markId, kind)
      if ('error' in res) setError(res.error)
    })
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="rounded-lg bg-[var(--color-danger-light)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}
      {marks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-6 text-center text-sm text-[var(--color-ink-muted)]">
          Сегодня отметок ещё нет
        </p>
      ) : (
        marks.map((m) => (
          <Card key={m.id} className="flex items-center justify-between p-3">
            <div>
              <p className="text-sm font-medium text-[var(--color-ink)]">{m.students?.full_name}</p>
              <p className="text-xs text-[var(--color-ink-muted)]">
                {m.classes?.name} · {formatTime(m.created_at)}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              disabled={isPending}
              onClick={() => handleDelete(m.id)}
            >
              Удалить
            </Button>
          </Card>
        ))
      )}
    </div>
  )
}
