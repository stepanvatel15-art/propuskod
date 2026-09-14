'use client'

import { useTransition } from 'react'
import { updateUserRoleAction, setUserActiveAction } from './actions'

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
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-gray-500">
          <th className="py-2">Логин</th>
          <th>ФИО</th>
          <th>Роль</th>
          <th>Статус</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u.id} className="border-b">
            <td className="py-2">{u.login}</td>
            <td>{u.full_name}</td>
            <td>
              <select
                defaultValue={u.role}
                disabled={isPending}
                onChange={(e) =>
                  startTransition(() => updateUserRoleAction(u.id, e.target.value as User['role']))
                }
                className="rounded border px-2 py-1"
              >
                {(Object.keys(ROLE_LABELS) as User['role'][]).map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </td>
            <td>
              <span className={u.is_active ? 'text-green-700' : 'text-red-700'}>
                {u.is_active ? 'Активен' : 'Деактивирован'}
              </span>
            </td>
            <td>
              <button
                disabled={isPending}
                onClick={() => startTransition(() => setUserActiveAction(u.id, !u.is_active))}
                className="text-xs underline"
              >
                {u.is_active ? 'Деактивировать' : 'Активировать'}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
