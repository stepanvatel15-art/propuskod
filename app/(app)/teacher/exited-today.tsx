import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatTime } from '@/lib/format/datetime'

type ExitedPass = {
  id: string
  used_at: string | null
  students: { full_name: string } | null
}

export default function ExitedToday({ passes }: { passes: ExitedPass[] }) {
  if (passes.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-6 text-center text-sm text-[var(--color-ink-muted)]">
        Сегодня ещё никто не вышел
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {passes.map((p) => (
        <Card key={p.id} className="flex items-center justify-between p-4">
          <p className="text-sm font-medium text-[var(--color-ink)]">{p.students?.full_name}</p>
          <Badge tone="success">
            Вышел в {p.used_at ? formatTime(p.used_at) : '—'}
          </Badge>
        </Card>
      ))}
    </div>
  )
}
