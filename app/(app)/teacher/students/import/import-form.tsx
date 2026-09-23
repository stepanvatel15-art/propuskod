'use client'

import { useState, useTransition } from 'react'
import { importStudentsAction, type ImportSummary } from '@/lib/import/import-students-action'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ImportStudentsForm({ classId }: { classId: string }) {
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-[var(--color-ink)]">Загрузка списка класса</h1>
        <p className="text-sm text-[var(--color-ink-muted)]">
          Файл .xlsx с колонкой «ФИО» в первой строке. Колонка «Дата рождения»
          необязательна — можно оставить пустой или не добавлять вовсе.
        </p>
      </div>

      <Card className="space-y-4 p-5">
        <form
          action={(formData) => {
            formData.set('classId', classId)
            setError(null)
            setSummary(null)
            startTransition(async () => {
              const res = await importStudentsAction(formData)
              if ('error' in res) {
                setError(res.error)
              } else {
                setSummary(res)
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
            className="block w-full text-sm text-[var(--color-ink-muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--color-primary-light)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[var(--color-primary)]"
          />
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Загружаем…' : 'Загрузить'}
          </Button>
        </form>

        {error && (
          <p className="rounded-lg bg-[var(--color-danger-light)] px-3 py-2 text-sm text-[var(--color-danger)]">
            {error}
          </p>
        )}
      </Card>

      {summary && (
        <Card className="space-y-2 p-5 text-sm">
          <p className="text-[var(--color-ink)]">Всего строк: {summary.rowsTotal}</p>
          <p className="text-[var(--color-success)]">Создано: {summary.rowsCreated}</p>
          <p className="text-[var(--color-primary)]">Обновлено/подтверждено: {summary.rowsUpdated}</p>
          <p className="text-[var(--color-accent)]">Пропущено с ошибками: {summary.rowsSkipped}</p>

          {summary.errors.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-[var(--color-accent)]">
                Показать ошибки ({summary.errors.length})
              </summary>
              <ul className="mt-2 space-y-1 text-[var(--color-ink-muted)]">
                {summary.errors.map((e, i) => (
                  <li key={i}>Строка {e.rowNumber}: {e.reason}</li>
                ))}
              </ul>
            </details>
          )}
        </Card>
      )}
    </div>
  )
}
