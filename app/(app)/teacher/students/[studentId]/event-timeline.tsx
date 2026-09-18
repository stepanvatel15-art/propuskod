import type { PassWithEvents } from '@/lib/history/get-student-history'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает подтверждения',
  approved: 'Подтверждён, ждёт дежурного',
  rejected: 'Отклонён',
  used: 'Ребёнок вышел',
  cancelled: 'Отменён',
}

const STATUS_TONE: Record<string, 'neutral' | 'accent' | 'success' | 'danger' | 'primary'> = {
  pending: 'accent',
  approved: 'primary',
  rejected: 'neutral',
  used: 'success',
  cancelled: 'neutral',
}

const EVENT_LABELS: Record<string, string> = {
  created: 'Создан пропуск',
  approved: 'Подтверждён учителем',
  rejected: 'Отклонён учителем',
  released: 'Ребёнок вышел (отметил дежурный)',
  cancelled: 'Отменён',
}

function fmt(dt: string) {
  return new Date(dt).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function EventTimeline({ pass }: { pass: PassWithEvents }) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-[var(--color-ink)]">
            {pass.type === 'request' ? 'Заявка' : 'Прямой пропуск'}
          </span>
          <span className="ml-2 text-sm text-[var(--color-ink-muted)]">
            выход в {fmt(pass.requested_departure_at)}
          </span>
          {pass.reason && (
            <span className="ml-2 text-sm text-[var(--color-ink-muted)]">· {pass.reason}</span>
          )}
        </div>
        <Badge tone={STATUS_TONE[pass.status] ?? 'neutral'}>
          {STATUS_LABELS[pass.status] ?? pass.status}
        </Badge>
      </div>

      <ol className="space-y-2 border-l border-[var(--color-border)] pl-4">
        {pass.events.map((e) => (
          <li key={e.id} className="relative text-sm">
            <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-[var(--color-primary)]" />
            <span className="text-[var(--color-ink)]">{EVENT_LABELS[e.event_type] ?? e.event_type}</span>
            <span className="ml-2 text-[var(--color-ink-muted)]">{fmt(e.created_at)}</span>
          </li>
        ))}
      </ol>
    </Card>
  )
}
