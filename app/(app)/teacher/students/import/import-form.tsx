'use client'

import { useState, useTransition } from 'react'
import { importStudentsAction, type ImportSummary } from './actions'

export default function ImportStudentsForm({ classId }: { classId: string }) {
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-lg font-semibold">Загрузка списка класса</h1>
      <p className="text-sm text-gray-500">
        Файл .xlsx с колонками «ФИО» и «Дата рождения» в первой строке.
      </p>

      <form
        action={(formData) => {
          formData.set('classId', classId)
          setError(null)
          setSummary(null)
          startTransition(async () => {
            try {
              const res = await importStudentsAction(formData)
              setSummary(res)
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Ошибка загрузки')
            }
          })
        }}
        className="space-y-3"
      >
        <input
          type="file"
          name="file"
          accept=".xlsx,.xls"
          required
          className="block w-full text-sm"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {isPending ? 'Загружаем…' : 'Загрузить'}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {summary && (
        <div className="rounded border p-4 text-sm">
          <p>Всего строк: {summary.rowsTotal}</p>
          <p className="text-green-700">Создано: {summary.rowsCreated}</p>
          <p className="text-blue-700">Обновлено/подтверждено: {summary.rowsUpdated}</p>
          <p className="text-amber-700">Пропущено с ошибками: {summary.rowsSkipped}</p>

          {summary.errors.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-amber-700">
                Показать ошибки ({summary.errors.length})
              </summary>
              <ul className="mt-2 space-y-1">
                {summary.errors.map((e, i) => (
                  <li key={i}>
                    Строка {e.rowNumber}: {e.reason}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
