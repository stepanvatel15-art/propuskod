import { createClient } from '@/lib/supabase/server'
import DateFilter from './date-filter'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type DateRange = 'today' | '7d' | '30d' | 'all'

type HistoryRow = {
  id: string
  requested_departure_at: string
  used_at: string | null
  reason: string | null
  students: { full_name: string } | null
  classes: { name: string } | null
  creator: { role: string } | null
}

function rangeStart(range: DateRange): string | null {
  const now = new Date()
  if (range === 'today') { now.setHours(0, 0, 0, 0); return now.toISOString() }
  if (range === '7d') return new Date(Date.now() - 7 * 24 * 3600_000).toISOString()
  if (range === '30d') return new Date(Date.now() - 30 * 24 * 3600_000).toISOString()
  return null
}

export default async function DutyHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const sp = await searchParams
  const range: DateRange = (['today', '7d', '30d', 'all'] as const).includes(sp.range as DateRange)
    ? (sp.range as DateRange)
    : 'today'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('active_building_id')
    .eq('id', user!.id)
    .single()

  const activeBuildingId = profile?.active_building_id ?? null

  if (!activeBuildingId) {
    return (
      <p className="text-sm text-[var(--color-ink-muted)]">
        Сначала выберите корпус на странице «Дежурство».
      </p>
    )
  }

  let query = supabase
    .from('passes')
    .select(
      `id, requested_departure_at, used_at, reason,
       students(full_name), classes(name),
       creator:profiles!passes_created_by_fkey(role)`
    )
    .eq('building_id', activeBuildingId)
    .eq('status', 'used')
    .order('used_at', { ascending: false })

  const since = rangeStart(range)
  if (since) query = query.gte('used_at', since)

  const { data } = await query
  const passes = (data ?? []) as unknown as HistoryRow[]

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-lg font-semibold text-[var(--color-ink)]">История выходов</h1>

      <DateFilter current={range} />

      {passes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-6 text-center text-sm text-[var(--color-ink-muted)]">
          Нет записей за выбранный период
        </p>
      ) : (
        <div className="space-y-2">
          {passes.map((p) => {
            const isDutyIssued = p.creator?.role === 'security' || p.creator?.role === 'admin'
            return (
              <Card key={p.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-[var(--color-ink)]">{p.students?.full_name}</p>
                  <p className="text-xs text-[var(--color-ink-muted)]">
                    {p.classes?.name}
                    {p.reason ? ` · ${p.reason}` : ''}
                  </p>
                  <Badge tone={isDutyIssued ? 'accent' : 'primary'} className="mt-1.5">
                    {isDutyIssued ? 'Выпущено дежурным' : 'От классного руководителя'}
                  </Badge>
                </div>
                <Badge tone="success">
                  Вышел в {p.used_at ? new Date(p.used_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                </Badge>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
