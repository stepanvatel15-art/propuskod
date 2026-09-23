'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setActiveBuildingAction } from './actions'

type Building = { id: string; name: string }

export default function BuildingSwitcher({
  buildings,
  activeBuildingId,
}: {
  buildings: Building[]
  activeBuildingId: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex flex-col items-end gap-1">
      <select
        value={activeBuildingId ?? ''}
        disabled={isPending}
        onChange={(e) => {
          const id = e.target.value
          if (!id) return
          setError(null)
          startTransition(async () => {
            const res = await setActiveBuildingAction(id)
            if ('error' in res) {
              setError(res.error)
            } else {
              router.refresh()
            }
          })
        }}
        className="h-10 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]"
      >
        <option value="">— выберите корпус —</option>
        {buildings.map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
      {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  )
}
