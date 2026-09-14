'use client'

import { useTransition } from 'react'
import { approvePassAction, rejectPassAction } from './actions'

type PendingPass = {
  id: string
  requested_departure_at: string
  reason: string | null
  students: { full_name: string } | null
}

export default function PendingList({ passes }: { passes: PendingPass[] }) {
  const [isPending, startTransition] = useTransition()

  if (passes.length === 0) return <p className="text-sm text-gray-500">Нет заявок</p>

  return (
    <ul className="space-y-2">
      {passes.map((p) => (
        <li key={p.id} className="flex items-center justify-between rounded border p-3 text-sm">
          <div>
            <p className="font-medium">{p.students?.full_name}</p>
            <p className="text-gray-500">
              Выход: {new Date(p.requested_departure_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              {p.reason ? ` · ${p.reason}` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <button disabled={isPending} onClick={() => startTransition(() => approvePassAction(p.id))} className="rounded bg-green-600 px-3 py-1 text-white">
              Подтвердить
            </button>
            <button disabled={isPending} onClick={() => startTransition(() => rejectPassAction(p.id))} className="rounded bg-gray-200 px-3 py-1">
              Отклонить
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
