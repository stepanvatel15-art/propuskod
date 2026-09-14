'use client'

import { useState, useTransition } from 'react'
import { loginAction } from './actions'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form
        className="w-full max-w-sm space-y-4 rounded-lg border p-6"
        action={(formData) =>
          startTransition(async () => {
            const res = await loginAction(formData)
            if (res?.error) setError(res.error)
          })
        }
      >
        <h1 className="text-lg font-semibold">Вход в систему пропусков</h1>

        <input
          name="login"
          placeholder="Логин"
          required
          className="w-full rounded border px-3 py-2"
        />
        <input
          name="password"
          type="password"
          placeholder="Пароль"
          required
          className="w-full rounded border px-3 py-2"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded bg-black py-2 text-white disabled:opacity-50"
        >
          {isPending ? 'Входим…' : 'Войти'}
        </button>
      </form>
    </div>
  )
}
