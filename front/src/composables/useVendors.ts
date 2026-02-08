import { ref } from 'vue'
import axios from 'axios'

export interface VendorProfile {
  id: number
  username: string
  email: string
  name_tm: string
  name_ru: string
  name_en: string
  description_tm: string
  description_ru: string
  description_en: string
  terminal_id: string
  auth_token: string
  is_active: boolean
  created_at: string
}

export function useVendors() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const vendorProfile = ref<VendorProfile | null>(null)
  const vendors = ref<VendorProfile[]>([])

  const fetchVendors = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await axios.get('/api/v1/vendors/profiles/')
      vendors.value = Array.isArray(response.data) ? response.data : response.data.results || []
      return vendors.value
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error fetching vendors'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchMyVendorProfile = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await axios.get('/api/v1/vendors/profiles/me/')
      vendorProfile.value = response.data
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error fetching vendor profile'
      throw err
    } finally {
      loading.value = false
    }
  }

  const resetTerminalToken = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await axios.post(`/api/v1/vendors/profiles/${id}/reset_token/`)
      if (vendorProfile.value && vendorProfile.value.id === id) {
        vendorProfile.value.auth_token = response.data.auth_token
      }
      return response.data.auth_token
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error resetting token'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateVendorProfile = async (id: number, data: any) => {
    loading.value = true
    error.value = null
    try {
      const response = await axios.patch(`/api/v1/vendors/profiles/${id}/`, data)
      if (vendorProfile.value && vendorProfile.value.id === id) {
        vendorProfile.value = response.data
      }
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error updating vendor profile'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    vendorProfile,
    vendors,
    fetchVendors,
    fetchMyVendorProfile,
    resetTerminalToken,
    updateVendorProfile
  }
}

