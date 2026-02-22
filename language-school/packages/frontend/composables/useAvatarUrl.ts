/**
 * Преобразует путь аватара в полный URL для корректной загрузки.
 * Аватары хранятся в бэкенде, относительный путь /uploads/xxx должен загружаться с origin API.
 */
export const useAvatarUrl = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string
  const origin = apiBase ? new URL(apiBase).origin : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000')

  const avatarUrl = (avatar: string | null | undefined): string | undefined => {
    if (!avatar || typeof avatar !== 'string' || !avatar.trim()) return undefined
    const trimmed = avatar.trim()
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
    // Используем new URL для корректного кодирования путей с пробелами/кириллицей
    try {
      return new URL(trimmed.startsWith('/') ? trimmed : '/' + trimmed, origin + '/').href
    } catch {
      return `${origin}${trimmed.startsWith('/') ? trimmed : '/' + trimmed}`
    }
  }

  return { avatarUrl }
}
