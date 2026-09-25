import { AttendanceTeacherStatsPage } from '@/lib/attendance/teacher-stats-page-template'

export default function TeacherNoCardStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>
}) {
  return <AttendanceTeacherStatsPage kind="no_card" title="Без карты — класс" searchParams={searchParams} />
}
