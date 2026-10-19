'use client'

import { useLiveRefresh } from '@/lib/realtime/use-live-refresh'
import { Card } from '@/components/ui/card'
import type { StudentStat } from './get-attendance-stats'

export default function StatsTable({
  stats,
  classId,
}: {
  stats: StudentStat[]
  classId: string
}) {

  useLiveRefresh({ channel: `attendance-stats-${classId}`, table: 'attendance_marks', filter: `class_id=eq.${classId}`, pollMs: 60_000 })

  if (stats.length === 0) {
    return (
      <p className="rounded-2xl border-2 border-dashed border-[var(--color-border)] px-4 py-8 text-center text-sm text-[var(--color-ink-muted)]">
        За выбранный период отметок нет
      </p>
    )
  }

  const max = Math.max(...stats.map((s) => s.count));

  return (
    <div className="space-y-6">
      {/* Диаграмма: горизонтальные столбики, длина пропорциональна числу отметок */}
      <Card className="space-y-3 p-5">
        {stats.map((s) => (
          <div key={s.studentId} className="flex items-center gap-3">
            <span className="w-40 shrink-0 truncate text-sm text-[var(--color-ink)]">{s.fullName}</span>
            <div className="h-5 flex-1 rounded bg-[var(--color-surface)]">
              <div
                className="h-5 rounded bg-[var(--color-primary)]"
                style={{ width: `${(s.count / max) * 100}%` }}
              />
            </div>
            <span className="w-6 shrink-0 text-right text-sm font-medium text-[var(--color-ink)]">
              {s.count}
            </span>
          </div>
        ))}
      </Card>

      {/* Таблица тех же данных */}
      <Card className="divide-y divide-[var(--color-border)] overflow-x-auto">
        <div className="grid grid-cols-[1fr_auto] gap-3 bg-[var(--color-surface)] px-4 py-2 text-[13px] font-semibold text-[#475467]">
          <span>Ученик</span>
          <span>Количество</span>
        </div>
        {stats.map((s) => (
          <div key={s.studentId} className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-2 text-sm">
            <span className="text-[var(--color-ink)]">{s.fullName}</span>
            <span className="text-right font-medium text-[var(--color-ink)]">{s.count}</span>
          </div>
        ))}
      </Card>
    </div>
  )
}
