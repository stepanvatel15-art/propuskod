'use client'

import { useTransition } from 'react'
import { updateUserRoleAction, setUserActiveAction } from './actions'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type User = {
  id: string
  login: string
  full_name: string
  role: 'teacher' | 'security' | 'admin'
  is_active: boolean
}

const ROLE_LABELS: Record<User['role'], string> = {
  teacher: 'Классный руководитель',
  security: 'Дежурный администратор',
  admin: 'Администратор',
}

export default function UsersTable({ users }: { users: User[] }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Card className="divide-y divide-[var(--color-border)] overflow-hidden">
      <div className="grid grid-cols-[1fr_1.4fr_1.4fr_auto_auto] gap-3 bg-[var(--color-surface)] px-4 py-2 text-xs font-medium text-[var(--color-ink-muted)]">
        <span>Логин</span>
        <span>ФИО</span>
        <span>Роль</span>
        <span>Статус</span>
        <span></span>
      </div>
      {users.map((u) => (
        <div key={u.id} className="grid grid-cols-[1fr_1.4fr_1.4fr_auto_auto] items-center gap-3 px-4 py-3 text-sm">
          <span className="text-[var(--color-ink)]">{u.login}</span>
          <span className="text-[var(--color-ink)]">{u.full_name}</span>
          <select
            defaultValue={u.role}
            disabled={isPending}
            onChange={(e) =>
              startTransition(() => updateUserRoleAction(u.id, e.target.value as User['role']))
            }
            className="h-8 rounded-lg border border-[var(--color-border)] bg-white px-2 text-xs"
          >
            {(Object.keys(ROLE_LABELS) as User['role'][]).map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
          <Badge tone={u.is_active ? 'success' : 'danger'}>
            {u.is_active ? 'Активен' : 'Деактивирован'}
          </Badge>
          <button
            disabled={isPending}
            onClick={() => startTransition(() => setUserActiveAction(u.id, !u.is_active))}
            className="text-xs text-[var(--color-primary)] underline decoration-dotted"
          >
            {u.is_active ? 'Деактивировать' : 'Активировать'}
          </button>
        </div>
      ))}
    </Card>
  )
}
