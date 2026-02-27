import { useEden } from './useEden'

export interface HtGroup {
  id: number
  name: string
  course_id: number
  course_name?: string
  teacher_id?: string | null
  teacher_name?: string
  exam_scheme_id?: number | null
  max_students: number
  time_slot?: string | null
  week_days?: string | null
  start_date?: string | null
  end_date?: string | null
  is_active: boolean
  student_ids?: string[]
}

export const useCabinetGroups = () => {
  const api = useEden()
  const ht = api.api.v1.cabinet['head-teacher']

  const getList = async (params?: { course?: number; teacher?: string; is_active?: string }) => {
    const opts = params && Object.values(params).some((v) => v != null && v !== '')
      ? { query: params }
      : undefined
    const { data, error } = await ht.groups.get(opts)
    if (error) throw error
    return (data ?? []) as HtGroup[]
  }

  const getById = async (id: number) => {
    const { data, error } = await ht.groups({ id: String(id) }).get()
    if (error) throw error
    return data as HtGroup
  }

  const create = async (body: Partial<HtGroup> & { name: string; course_id: number }) => {
    const { data, error } = await ht.groups.post(body)
    if (error) throw error
    return data
  }

  const update = async (id: number, body: Partial<HtGroup>) => {
    const { data, error } = await ht.groups({ id: String(id) }).patch(body)
    if (error) throw error
    return data
  }

  const remove = async (id: number) => {
    const { error } = await ht.groups({ id: String(id) }).delete()
    if (error) throw error
  }

  const addStudents = async (id: number, studentIds: string[]) => {
    const { data, error } = await ht.groups({ id: String(id) })['add-students'].post({ student_ids: studentIds })
    if (error) throw error
    return data
  }

  const removeStudents = async (id: number, studentIds: string[]) => {
    const { data, error } = await ht.groups({ id: String(id) })['remove-students'].post({ student_ids: studentIds })
    if (error) throw error
    return data
  }

  const getAvailableStudents = async (id: number) => {
    const { data, error } = await ht.groups({ id: String(id) })['available-students'].get()
    if (error) throw error
    return (data ?? []) as { id: string; full_name: string; username: string; current_group_name: string | null }[]
  }

  const getGroupStudents = async (id: number) => {
    const { data, error } = await ht.groups({ id: String(id) }).students.get()
    if (error) throw error
    return (data ?? []) as { id: string; firstName: string; lastName: string; username: string; avatar?: string }[]
  }

  const getAttendance = async (groupId: number) => {
    const { data, error } = await ht.groups({ id: String(groupId) }).attendance.get()
    if (error) throw error
    return data ?? []
  }

  const saveAttendance = async (body: { lesson_id: number; user_id: string; status: string; notes?: string }) => {
    const { data, error } = await api.api.v1.cabinet['head-teacher'].attendance.post(body)
    if (error) throw error
    return data
  }

  const getGrades = async (groupId: number) => {
    const { data, error } = await ht.groups({ id: String(groupId) }).grades.get()
    if (error) throw error
    return data ?? []
  }

  const saveGrade = async (body: { group_id: number; user_id: string; type: string; grade: string; comment?: string }) => {
    const { data, error } = await api.api.v1.cabinet['head-teacher'].grades.post(body)
    if (error) throw error
    return data
  }

  const getExamGrades = async (groupId: number) => {
    const { data, error } = await ht.groups({ id: String(groupId) })['exam-grades'].get()
    if (error) throw error
    return data ?? []
  }

  const saveExamGrade = async (body: { group_id: number; user_id: string; scheme_item_id: number; writing?: number | null; listening?: number | null; reading?: number | null; speaking?: number | null }) => {
    const { data, error } = await api.api.v1.cabinet['head-teacher']['exam-grades'].post(body)
    if (error) throw error
    return data
  }

  const getExamSchemes = async () => {
    const { data, error } = await ht['exam-schemes'].get()
    if (error) throw error
    return data ?? []
  }

  const getExamTypes = async () => {
    const { data, error } = await ht['exam-types'].get()
    if (error) throw error
    return data ?? []
  }

  const saveExamType = async (body: { name: string; writingWeight?: number; listeningWeight?: number; readingWeight?: number; speakingWeight?: number }) => {
    const { data, error } = await ht['exam-types'].post(body)
    if (error) throw error
    return data
  }

  const saveExamScheme = async (body: { name: string; items?: { examTypeId: number; weightPercentage: number; order?: number }[] }) => {
    const { data, error } = await ht['exam-schemes'].post(body)
    if (error) throw error
    return data
  }

  const deleteExamType = async (id: number) => {
    const { error } = await ht['exam-types']({ id: String(id) }).delete()
    if (error) throw error
  }

  const deleteExamScheme = async (id: number) => {
    const { error } = await ht['exam-schemes']({ id: String(id) }).delete()
    if (error) throw error
  }

  const generateSchedule = async (id: number) => {
    const { data, error } = await ht.groups({ id: String(id) })['generate-schedule'].post()
    if (error) throw error
    return data
  }

  const getCourseStats = async (courseId: string) => {
    const { data, error } = await ht.courses({ id: courseId }).statistics.get()
    return { data, error }
  }

  const getGames = async (groupId: number) => {
    const { data, error } = await ht.groups({ id: String(groupId) }).games.get()
    if (error) throw error
    return data ?? []
  }

  const getGameById = async (id: number) => {
    const { data, error } = await ht.games({ id: String(id) }).get()
    if (error) throw error
    return data
  }

  const saveGame = async (body: { group_id: number; lesson_id?: number | null; title: string; type: string; data?: any }) => {
    const { data, error } = await ht.games.post(body)
    if (error) throw error
    return data
  }

  const patchGame = async (id: number, body: { is_active: boolean }) => {
    const { data, error } = await ht.games({ id: String(id) }).patch(body)
    if (error) throw error
    return data
  }

  const updateGame = async (id: number, body: { title: string; lesson_id?: number | null; type: string; data?: any }) => {
    const { data, error } = await ht.games({ id: String(id) }).put(body)
    if (error) throw error
    return data
  }

  const deleteGame = async (id: number) => {
    const { error } = await ht.games({ id: String(id) }).delete()
    if (error) throw error
  }

  return { 
    getList, getById, create, update, remove, 
    addStudents, removeStudents, getAvailableStudents, getGroupStudents, 
    getAttendance, saveAttendance, 
    getGrades, saveGrade, 
    getExamGrades, saveExamGrade, getExamSchemes, getExamTypes, saveExamType, saveExamScheme, deleteExamType, deleteExamScheme,
    generateSchedule, getCourseStats,
    getGames, getGameById, saveGame, patchGame, updateGame, deleteGame 
  }
}

export const useCabinetTeachers = () => {
  const api = useEden()
  const ht = api.api.v1.cabinet['head-teacher']
  const getList = async () => {
    const { data, error } = await ht.teachers.get()
    if (error) throw error
    return (data ?? []) as { id: string; full_name: string; username: string }[]
  }
  return { getList }
}
