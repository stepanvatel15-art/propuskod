'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createAttendanceMarkAction, type AttendanceKind } from './attendance-actions'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type StudentRow = { id: string; full_name: string; class_name: string }

export default function SearchAndMark({
  students,
  kind,
  actionLabel,
}: {
  students: StudentRow[]
  kind: AttendanceKind
  actionLabel: string
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [justMarkedId, setJustMarkedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return students
      .filter((s) =>
        s.full_name
          .toLowerCase()
          .split(/\s+/)
          .some((word) => word.startsWith(q))
      )
      .slice(0, 20)
  }, [students, query])

  function handleMark(studentId: string) {
    setError(null)
    startTransition(async () => {
      const res = await createAttendanceMarkAction({ studentId, kind })
      if ('error' in res) {
        setError(res.error)
      } else {
        setJustMarkedId(studentId)
        setQuery('')
        router.refresh()
        setTimeout(() => setJustMarkedId(null), 2000)
      }
    })
  }

  return (
    <Card className="space-y-3 p-5">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--color-ink-muted)]">
          Поиск по фамилии
        </label>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Начните вводить фамилию…"
          autoFocus
        />
      </div>

      {error && (
        <p className="rounded-lg bg-[var(--color-danger-light)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}

      {query.trim() && (
        matches.length === 0 ? (
          <p className="px-1 text-sm text-[var(--color-ink-muted)]">Никого не нашлось</p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)] overflow-hidden rounded-lg border border-[var(--color-border)]">
            {matches.map((s) => (
              <li key={s.id}>
                <button
                  disabled={isPending}
                  onClick={() => handleMark(s.id)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-[var(--color-surface)] disabled:opacity-50"
                >
                  <span className="text-[var(--color-ink)]">
                    {s.full_name} — <span className="text-[var(--color-ink-muted)]">{s.class_name}</span>
                  </span>
                  {justMarkedId === s.id ? (
                    <span className="text-xs font-medium text-[var(--color-success)]">Отмечено ✓</span>
                  ) : (
                    <span className="text-xs font-medium text-[var(--color-primary)]">{actionLabel}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )
      )}
    </Card>
  )
}
