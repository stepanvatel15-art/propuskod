'use client'

import { useState, useTransition } from 'react'
import { createUserAction } from './actions'

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
      try {
        await createUserAction({ login, password, fullName, role })
        setLogin(''); setPassword(''); setFullName('')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ошибка')
      }
    })
  }

  return (
    <div className="grid grid-cols-2 gap-2 rounded border p-4">
      <input placeholder="Логин" value={login} onChange={(e) => setLogin(e.target.value)} className="rounded border px-3 py-2" />
      <input placeholder="Пароль" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded border px-3 py-2" />
      <input placeholder="ФИО" value={fullName} onChange={(e) => setFullName(e.target.value)} className="col-span-2 rounded border px-3 py-2" />
      <select value={role} onChange={(e) => setRole(e.target.value as typeof role)} className="rounded border px-3 py-2">
        <option value="teacher">Классный руководитель</option>
        <option value="security">Дежурный администратор</option>
        <option value="admin">Администратор</option>
      </select>
      <button onClick={submit} disabled={isPending} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">
        {isPending ? 'Создаём…' : 'Создать'}
      </button>
      {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
