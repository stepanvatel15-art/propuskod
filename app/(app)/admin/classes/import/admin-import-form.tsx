'use client'

import { useState, useTransition } from 'react'
import { importStudentsAction, type ImportSummary } from '@/lib/import/import-students-action'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type ClassOption = { id: string; name: string }

export default function AdminImportForm({ classes }: { classes: ClassOption[] }) {
  const [classId, setClassId] = useState('')
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-5">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--color-ink-muted)]">Класс</label>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="h-10 w-full rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]"
          >
            <option value="">— выберите класс —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <form
          action={(formData) => {
            if (!classId) {
              setError('Сначала выберите класс')
              return
            }
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
            disabled={!classId}
            className="block w-full text-sm text-[var(--color-ink-muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--color-primary-light)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[var(--color-primary)] disabled:opacity-50"
          />
          <Button type="submit" disabled={isPending || !classId}>
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
