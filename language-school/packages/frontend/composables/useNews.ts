import type { News } from '~/types/news'

export const useNews = () => {
  const { locale } = useI18n()
  const api = useEden()

  const news = ref<News[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchNews = async (featured = false) => {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await api.api.v1.landing.news.get({
        query: { lang: locale.value },
      })
      if (err) throw err
      news.value = Array.isArray(data) ? data : []
      if (featured) news.value = news.value.filter(n => n.is_featured)
    } catch (e: any) {
      error.value = e?.message || 'Failed to fetch news'
    } finally {
      loading.value = false
    }
  }

  return { news, loading, error, fetchNews }
}
