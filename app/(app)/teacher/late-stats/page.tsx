import { AttendanceTeacherStatsPage } from '@/lib/attendance/teacher-stats-page-template'

export default function TeacherLateStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>
}) {
  return <AttendanceTeacherStatsPage kind="late" title="Опоздания класса" searchParams={searchParams} />
}
