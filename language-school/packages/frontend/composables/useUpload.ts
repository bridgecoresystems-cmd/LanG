/**
 * Composable for file uploads. Uses FormData + $fetch for reliable file upload.
 */
export const useUpload = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string
  const baseUrl = apiBase?.replace(/\/api\/v1$/, '') || 'http://localhost:8000'
  const uploadUrl = `${baseUrl}/api/v1/upload`

  const uploadFile = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const res = await $fetch<{ url?: string; error?: string }>(uploadUrl, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })
    if ((res as any).error) {
      throw new Error((res as any).error)
    }
    const url = (res as any).url
    if (!url) {
      throw new Error('Upload failed: no URL in response')
    }
    return res
  }

  return {
    uploadFile
  }
}
