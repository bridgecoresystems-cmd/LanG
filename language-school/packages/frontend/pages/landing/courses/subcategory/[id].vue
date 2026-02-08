<template>
  <div>
    <section class="section">
      <div class="container">
        <div v-if="loading" class="loading-state"><i class="pi pi-spin pi-spinner" /></div>
        <div v-else-if="error"><p>{{ error }}</p></div>
        <div v-else-if="subcategory">
          <div class="header">
            <button class="back-btn" @click="navigateTo('/landing/courses')">
              <i class="pi pi-arrow-left" /> {{ $t('common.back') }}
            </button>
            <div class="info">
              <div v-if="subcategory.category_name" class="breadcrumb">
                {{ subcategory.category_name }} <i class="pi pi-angle-right" /> {{ subcategory.name }}
              </div>
              <h1>{{ subcategory.name }}</h1>
              <p v-if="subcategory.description">{{ subcategory.description }}</p>
            </div>
          </div>
          <div v-if="isLoading" class="loading-state"><i class="pi pi-spin pi-spinner" /></div>
          <div v-else-if="courses.length === 0" class="empty-state">{{ $t('courses.noCourses') }}</div>
          <div v-else class="courses-grid">
            <CourseCard v-for="course in courses" :key="course.id" :course="course" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { locale } = useI18n()
const { subcategory, courses, loading, error, fetchSubcategory, fetchCourses } = useCourses()
const id = computed(() => Number(route.params.id))
const isLoading = ref(false)

const load = async () => {
  isLoading.value = true
  await fetchSubcategory(id.value)
  await fetchCourses(id.value)
  isLoading.value = false
}

onMounted(load)
watch([locale, id], load)
</script>

<style scoped>
.section { padding: 3rem 0; }
.header { display: flex; align-items: flex-start; gap: 1.5rem; margin-bottom: 2rem; padding: 1.5rem; background: linear-gradient(135deg,#fff,#f8f9fa); border-radius: 16px; }
.back-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; border: 2px solid var(--border-color); border-radius: 12px; background: white; cursor: pointer; font-size: 0.95rem; }
.breadcrumb { font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.5rem; }
.header h1 { margin: 0 0 0.5rem; font-size: 1.75rem; }
.header p { margin: 0; color: var(--text-secondary); }
.courses-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
.loading-state, .empty-state { text-align: center; padding: 3rem; color: var(--text-secondary); }
</style>
