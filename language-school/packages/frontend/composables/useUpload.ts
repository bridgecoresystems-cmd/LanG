import { useEden } from './useEden'

/**
 * Composable for file uploads via Eden Treaty
 */
export const useUpload = () => {
  const api = useEden()

  const uploadFile = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    
    const { data, error } = await api.api.v1.upload.post(formData)
    if (error) throw error
    return data
  }

  return {
    uploadFile
  }
}
