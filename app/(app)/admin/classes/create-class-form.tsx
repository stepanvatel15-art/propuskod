'use client'

import { useState, useTransition } from 'react'
import { createClassAction } from './actions'

export default function CreateClassForm() {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex gap-2 rounded border p-4">
      <input
        placeholder="Например, 9А"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 rounded border px-3 py-2"
      />
      <button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            try {
              await createClassAction(name)
              setName('')
              setError(null)
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Ошибка')
            }
          })
        }
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        Создать
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
