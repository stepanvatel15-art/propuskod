import type { PassWithEvents } from '@/lib/history/get-student-history'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает подтверждения',
  approved: 'Подтверждён',
  rejected: 'Отклонён',
  qr_issued: 'QR выдан',
  used: 'Использован',
  expired: 'Истёк',
  cancelled: 'Отменён',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-blue-100 text-blue-800',
  rejected: 'bg-gray-200 text-gray-700',
  qr_issued: 'bg-purple-100 text-purple-800',
  used: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-200 text-gray-700',
}

const EVENT_LABELS: Record<string, string> = {
  created: 'Создан пропуск',
  approved: 'Подтверждён учителем',
  rejected: 'Отклонён учителем',
  qr_generated: 'Сгенерирован QR',
  scanned_ok: 'Отсканирован на посту',
  scanned_denied: 'Попытка скана отклонена',
  expired: 'Срок действия истёк',
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
    <div className="rounded border p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <span className="text-sm font-medium">
            {pass.type === 'request' ? 'Заявка' : 'Прямой пропуск'}
          </span>
          <span className="ml-2 text-sm text-gray-500">
            выход в {fmt(pass.requested_departure_at)}
          </span>
          {pass.reason && <span className="ml-2 text-sm text-gray-400">· {pass.reason}</span>}
        </div>
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[pass.status] ?? ''}`}>
          {STATUS_LABELS[pass.status] ?? pass.status}
        </span>
      </div>

      <ol className="space-y-2 border-l pl-4">
        {pass.events.map((e) => (
          <li key={e.id} className="relative text-sm">
            <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-gray-400" />
            <span className="text-gray-700">{EVENT_LABELS[e.event_type] ?? e.event_type}</span>
            <span className="ml-2 text-gray-400">{fmt(e.created_at)}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
