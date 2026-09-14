import { notFound } from 'next/navigation'
import {
  getStudentHistory,
  type DateRange,
  type StatusFilter,
} from '@/lib/history/get-student-history'
import HistoryFilters from './history-filters'
import EventTimeline from './event-timeline'

const VALID_RANGES: DateRange[] = ['today', '7d', '30d', 'all']
const VALID_STATUSES: StatusFilter[] = ['all', 'active', 'used', 'expired', 'rejected', 'cancelled']

export default async function StudentHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>
  searchParams: Promise<{ range?: string; status?: string }>
}) {
  const { studentId } = await params
  const sp = await searchParams

  const range: DateRange = VALID_RANGES.includes(sp.range as DateRange)
    ? (sp.range as DateRange)
    : '7d'
  const status: StatusFilter = VALID_STATUSES.includes(sp.status as StatusFilter)
    ? (sp.status as StatusFilter)
    : 'all'

  const { student, passes } = await getStudentHistory(studentId, { range, status })

  if (!student) notFound()

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold">{student.full_name}</h1>
        <p className="text-sm text-gray-500">
          Дата рождения: {new Date(student.birth_date).toLocaleDateString('ru-RU')}
        </p>
      </div>

      <HistoryFilters currentRange={range} currentStatus={status} />

      {passes.length === 0 ? (
        <p className="text-sm text-gray-500">Нет пропусков за выбранный период</p>
      ) : (
        <div className="space-y-4">
          {passes.map((p) => (
            <EventTimeline key={p.id} pass={p} />
          ))}
        </div>
      )}
    </div>
  )
}
