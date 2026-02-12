import { useEden } from './useEden'

/**
 * Composable for file uploads via Eden Treaty
 */
export const useUpload = () => {
  const api = useEden()

  const uploadFile = async (file: File) => {
    const { data, error } = await api.api.v1.upload.post({
      file
    })
    if (error) throw error
    return data
  }

  return {
    uploadFile
  }
}
