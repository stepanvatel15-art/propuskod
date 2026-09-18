'use client'

import { useTransition } from 'react'
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

  return (
    <select
      value={activeBuildingId ?? ''}
      disabled={isPending}
      onChange={(e) => {
        const id = e.target.value
        if (!id) return
        startTransition(async () => {
          await setActiveBuildingAction(id)
          router.refresh()
        })
      }}
      className="h-10 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]"
    >
      <option value="">— выберите корпус —</option>
      {buildings.map((b) => (
        <option key={b.id} value={b.id}>{b.name}</option>
      ))}
    </select>
  )
}
