'use client'

import { useState, useTransition } from 'react'
import { createUserAction } from './actions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function CreateUserForm() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'teacher' | 'security' | 'admin'>('teacher')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit() {
    if (!login || !password || !fullName) {
      setError('Заполните все поля')
      return
    }
    if (password.length < 8) {
      setError('Пароль минимум 8 символов')
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await createUserAction({ login, password, fullName, role })
      if ('error' in res) {
        setError(res.error)
      } else {
        setLogin(''); setPassword(''); setFullName('')
      }
    })
  }

  return (
    <Card className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--color-ink-muted)]">Логин</label>
        <Input value={login} onChange={(e) => setLogin(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--color-ink-muted)]">Пароль</label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <label className="text-xs font-medium text-[var(--color-ink-muted)]">ФИО</label>
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--color-ink-muted)]">Роль</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as typeof role)}
          className="h-10 w-full rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]"
        >
          <option value="teacher">Классный руководитель</option>
          <option value="security">Дежурный администратор</option>
          <option value="admin">Администратор</option>
        </select>
      </div>
      <div className="flex items-end">
        <Button onClick={submit} disabled={isPending} className="w-full">
          {isPending ? 'Создаём…' : 'Создать'}
        </Button>
      </div>
      {error && (
        <p className="rounded-lg bg-[var(--color-danger-light)] px-3 py-2 text-sm text-[var(--color-danger)] sm:col-span-2">
          {error}
        </p>
      )}
    </Card>
  )
}
