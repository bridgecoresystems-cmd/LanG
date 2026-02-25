import { useEden } from './useEden'

export interface ScheduleLesson {
  id: number
  title: string
  description?: string | null
  lesson_date: string
  duration_minutes: number
  homework?: string | null
  group: number
  group_name: string
  course_name: string
  teacher_name: string | null
}

export const useCabinetSchedule = () => {
  const api = useEden()

  const fetchSchedule = async (days: number = 7, groupId?: number) => {
    const opts: { query?: { days?: number; group_id?: number } } = {}
    opts.query = { days }
    if (groupId != null) opts.query.group_id = groupId

    const { data, error } = await api.api.v1.cabinet.schedule.get(opts)
    if (error) throw error
    return (data ?? []) as ScheduleLesson[]
  }

  return { fetchSchedule }
}
