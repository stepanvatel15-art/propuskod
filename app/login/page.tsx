'use client'

import { useState, useTransition } from 'react'
import { loginAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Logo } from '@/components/ui/logo'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo height={110} />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--color-ink)]">
              ПропусКод
            </h1>
            <p className="text-sm text-[var(--color-ink-muted)]">
              Пропуска на выход · школа 1353
            </p>
          </div>
        </div>

        <form
          className="space-y-4 rounded-3xl bg-[var(--color-surface-card)] p-6 shadow-card"
          action={(formData) =>
            startTransition(async () => {
              const res = await loginAction(formData)
              if (res?.error) setError(res.error)
            })
          }
        >
          <div className="space-y-1.5">
            <label htmlFor="login" className="text-lg font-extrabold text-[var(--color-ink)]">
              Логин
            </label>
            <Input id="login" name="login" autoComplete="username" required />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-lg font-extrabold text-[var(--color-ink)]">
              Пароль
            </label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="rounded-xl bg-[var(--color-danger-light)] px-3 py-2 text-sm text-[var(--color-danger)]">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" disabled={isPending} className="w-full">
            {isPending ? 'Входим…' : 'Войти'}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-[var(--color-ink-muted)]">
          Логин и пароль выдаёт администратор школы
        </p>
      </div>
    </div>
  )
}
