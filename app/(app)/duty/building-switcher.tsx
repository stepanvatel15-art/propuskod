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

  function choose(id: string) {
    if (!id || id === activeBuildingId) return
    setError(null)
    startTransition(async () => {
      const res = await setActiveBuildingAction(id)
      if ('error' in res) {
        setError(res.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="flex max-w-full flex-col gap-1 sm:items-end">
      <div
        role="group"
        aria-label="Корпус"
        className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-[var(--color-border)] bg-white p-1 [scrollbar-width:none]"
      >
        {buildings.map((b) => {
          const isActive = b.id === activeBuildingId
          return (
            <button
              key={b.id}
              type="button"
              disabled={isPending}
              aria-pressed={isActive}
              onClick={() => choose(b.id)}
              className={
                'shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[13px] disabled:opacity-60 ' +
                (isActive
                  ? 'bg-[var(--color-ink)] font-bold text-white'
                  : 'font-semibold text-[#344054] hover:bg-[var(--color-surface)]')
              }
            >
              {b.name}
            </button>
          )
        })}
      </div>
      {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  )
}
