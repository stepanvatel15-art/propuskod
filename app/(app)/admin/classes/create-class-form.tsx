'use client'

import { useState, useTransition } from 'react'
import { createClassAction } from './actions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function CreateClassForm() {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-1.5">
        <label className="text-xs font-medium text-[var(--color-ink-muted)]">Название класса</label>
        <Input placeholder="Например, 9А" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <Button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const res = await createClassAction(name)
            if ('error' in res) {
              setError(res.error)
            } else {
              setName('')
              setError(null)
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
