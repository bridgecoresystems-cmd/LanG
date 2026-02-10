import { ref } from 'vue'
import { useEden } from './useEden'

/** Admin schools API — useEden treaty. */
export const useAdminSchools = () => {
  const api = useEden()

  const fetchSchools = async () => {
    const { data, error } = await api.api.v1.admin.schools.get()
    if (error) throw error
    return data ?? []
  }

  const fetchSchool = async (id: number) => {
    const { data, error } = await api.api.v1.admin.schools({ id: String(id) }).get()
    if (error) throw error
    return data
  }

  const createSchool = async (body: { name: string; address?: string; phone?: string; is_active?: boolean }) => {
    const { data, error } = await api.api.v1.admin.schools.post(body)
    if (error) throw error
    return data
  }

  const updateSchool = async (id: number, body: Partial<{ name: string; address: string; phone: string; is_active: boolean }>) => {
    // Note: If backend uses patch, use .patch(), if it uses put, use .put()
    // Based on the old code using PATCH:
    const { data, error } = await api.api.v1.admin.schools({ id: String(id) }).patch(body)
    if (error) throw error
    return data
  }

  const deleteSchool = async (id: number) => {
    const { error } = await api.api.v1.admin.schools({ id: String(id) }).delete()
    if (error) throw error
  }

  return { fetchSchools, fetchSchool, createSchool, updateSchool, deleteSchool }
}
