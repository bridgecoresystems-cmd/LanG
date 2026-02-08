import type { CourseCategory, CourseSubCategory, Course } from '~/types/course'

export const useCourses = () => {
  const { locale } = useI18n()
  const api = useEden()

  const categories = ref<CourseCategory[]>([])
  const subcategories = ref<CourseSubCategory[]>([])
  const courses = ref<Course[]>([])
  const category = ref<CourseCategory | null>(null)
  const subcategory = ref<CourseSubCategory | null>(null)
  const course = ref<Course | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchCategories = async () => {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await api.api.v1.landing['course-categories'].get({
        query: { lang: locale.value },
      })
      if (err) throw err
      categories.value = Array.isArray(data) ? data : []
    } catch (e: any) {
      error.value = e?.message || 'Failed to fetch categories'
    } finally {
      loading.value = false
    }
  }

  const fetchCategory = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await api.api.v1.landing['course-categories']({ id: String(id) }).get({
        query: { lang: locale.value },
      })
      if (err) throw err
      category.value = data && !('error' in data) ? (data as CourseCategory) : null
    } catch (e: any) {
      error.value = e?.message || 'Failed to fetch category'
      category.value = null
    } finally {
      loading.value = false
    }
  }

  const fetchSubcategories = async (categoryId?: number) => {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await api.api.v1.landing['course-subcategories'].get({
        query: { lang: locale.value, ...(categoryId && { category: String(categoryId) }) },
      })
      if (err) throw err
      subcategories.value = Array.isArray(data) ? data : []
    } catch (e: any) {
      error.value = e?.message || 'Failed to fetch subcategories'
    } finally {
      loading.value = false
    }
  }

  const fetchSubcategory = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await api.api.v1.landing['course-subcategories']({ id: String(id) }).get({
        query: { lang: locale.value },
      })
      if (err) throw err
      subcategory.value = data && !('error' in data) ? (data as CourseSubCategory) : null
    } catch (e: any) {
      error.value = e?.message || 'Failed to fetch subcategory'
      subcategory.value = null
    } finally {
      loading.value = false
    }
  }

  const fetchCourses = async (subcategoryId?: number) => {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await api.api.v1.landing.courses.get({
        query: { lang: locale.value, ...(subcategoryId && { subcategory: String(subcategoryId) }) },
      })
      if (err) throw err
      courses.value = Array.isArray(data) ? data : []
    } catch (e: any) {
      error.value = e?.message || 'Failed to fetch courses'
    } finally {
      loading.value = false
    }
  }

  const fetchCourse = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await api.api.v1.landing.courses({ id: String(id) }).get({
        query: { lang: locale.value },
      })
      if (err) throw err
      course.value = data && !('error' in data) ? (data as Course) : null
    } catch (e: any) {
      error.value = e?.message || 'Failed to fetch course'
      course.value = null
    } finally {
      loading.value = false
    }
  }

  return {
    categories,
    subcategories,
    courses,
    category,
    subcategory,
    course,
    loading,
    error,
    fetchCategories,
    fetchCategory,
    fetchSubcategories,
    fetchSubcategory,
    fetchCourses,
    fetchCourse,
  }
}
