'use client'

import { useTransition } from 'react'
import { assignTeacherAction } from './actions'

type Klass = {
  id: string
  name: string
  homeroom_teacher_id: string | null
  profiles: { full_name: string } | null
}
type Teacher = { id: string; full_name: string }

export default function ClassesTable({ classes, teachers }: { classes: Klass[]; teachers: Teacher[] }) {
  const [isPending, startTransition] = useTransition()

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-gray-500">
          <th className="py-2">Класс</th>
          <th>Классный руководитель</th>
        </tr>
      </thead>
      <tbody>
        {classes.map((c) => (
          <tr key={c.id} className="border-b">
            <td className="py-2">{c.name}</td>
            <td>
              <select
                defaultValue={c.homeroom_teacher_id ?? ''}
                disabled={isPending}
                onChange={(e) =>
                  startTransition(() =>
                    assignTeacherAction(c.id, e.target.value || null)
                  )
                }
                className="rounded border px-2 py-1"
              >
                <option value="">— не назначен —</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.full_name}</option>
                ))}
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
