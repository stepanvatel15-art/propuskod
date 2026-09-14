'use client'

import { useState, useTransition } from 'react'
import { createPassRequestAction, createDirectPassAction } from './actions'

type Student = { id: string; full_name: string }

export default function PassForm({ students }: { students: Student[] }) {
  const [studentId, setStudentId] = useState('')
  const [time, setTime] = useState('')
  const [reason, setReason] = useState('')
  const [mode, setMode] = useState<'request' | 'direct'>('direct')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit() {
    if (!studentId || !time) {
      setError('Выберите ученика и время')
      return
    }
    setError(null)
    const iso = new Date(time).toISOString()

    startTransition(async () => {
      try {
        if (mode === 'direct') {
          await createDirectPassAction({ studentId, requestedDepartureAt: iso, reason })
        } else {
          await createPassRequestAction({ studentId, requestedDepartureAt: iso, reason })
        }
        setStudentId(''); setTime(''); setReason('')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ошибка')
      }
    })
  }

  return (
    <div className="space-y-3 rounded border p-4">
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-1">
          <input type="radio" checked={mode === 'direct'} onChange={() => setMode('direct')} />
          Выписать сразу (учитель)
        </label>
        <label className="flex items-center gap-1">
          <input type="radio" checked={mode === 'request'} onChange={() => setMode('request')} />
          Заявка от ученика (нужно подтвердить)
        </label>
      </div>

      <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="w-full rounded border px-3 py-2">
        <option value="">— выберите ученика —</option>
        {students.map((s) => (
          <option key={s.id} value={s.id}>{s.full_name}</option>
        ))}
      </select>

      <input type="datetime-local" value={time} onChange={(e) => setTime(e.target.value)} className="w-full rounded border px-3 py-2" />
      <input placeholder="Причина (необязательно)" value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded border px-3 py-2" />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button onClick={submit} disabled={isPending} className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50">
        {isPending ? 'Сохраняем…' : mode === 'direct' ? 'Выдать пропуск' : 'Создать заявку'}
      </button>
    </div>
  )
}
