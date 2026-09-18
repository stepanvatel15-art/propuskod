'use client'

import { useState, useTransition } from 'react'
import { createBuildingAction } from './actions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function CreateBuildingForm() {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-1.5">
        <label className="text-xs font-medium text-[var(--color-ink-muted)]">Название корпуса</label>
        <Input placeholder="Например, 1214" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <Button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            try {
              await createBuildingAction(name)
              setName('')
              setError(null)
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Ошибка')
            }
          })
        }
      >
        Создать
      </Button>
      {error && (
        <p className="w-full rounded-lg bg-[var(--color-danger-light)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}
    </Card>
  )
}
