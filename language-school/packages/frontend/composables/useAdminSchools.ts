/** Admin schools API — $fetch with apiBase (как users, categories). */
export const useAdminSchools = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string

  const fetchSchools = async () => {
    const data = await $fetch<any[]>(`${apiBase}/admin/schools`, { credentials: 'include' })
    return data ?? []
  }

  const fetchSchool = async (id: number) => {
    const data = await $fetch<any>(`${apiBase}/admin/schools/${id}`, { credentials: 'include' })
    return data
  }

  const createSchool = async (body: { name: string; address?: string; phone?: string; is_active?: boolean }) => {
    const data = await $fetch<any>(`${apiBase}/admin/schools`, {
      method: 'POST',
      credentials: 'include',
      body,
    })
    return data
  }

  const updateSchool = async (id: number, body: Partial<{ name: string; address: string; phone: string; is_active: boolean }>) => {
    const data = await $fetch<any>(`${apiBase}/admin/schools/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      body,
    })
    return data
  }

  const deleteSchool = async (id: number) => {
    await $fetch(`${apiBase}/admin/schools/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
  }

  return { fetchSchools, fetchSchool, createSchool, updateSchool, deleteSchool }
}
