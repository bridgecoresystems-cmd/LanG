<template>
  <MainLayout>
    <section class="courses-section">
      <div class="container">
        <div class="courses-header">
          <h1 class="section-title">{{ $t('homepage.courses.title') }}</h1>
          <p class="section-subtitle">{{ $t('homepage.courses.subtitle') }}</p>
          <SearchBar
            v-model="searchQuery"
            @search="handleSearch"
            class="courses-search"
          />
        </div>
        
        <div v-if="loading" class="loading-state">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
        </div>
        
        <div v-else-if="error" class="error-state">
          <p>{{ error }}</p>
        </div>
        
        <div v-else-if="filteredCategories.length === 0" class="empty-state">
          <p>{{ $t('courses.noCategories') }}</p>
        </div>
        
        <div v-else class="courses-grid">
          <CourseCategoryCard
            v-for="category in filteredCategories"
            :key="category.id"
            :category="category"
          />
        </div>
      </div>
    </section>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/components/MainLayout.vue'
import CourseCategoryCard from '@/components/CourseCategoryCard.vue'
import SearchBar from '@/components/SearchBar.vue'
import { useCourses } from '@/composables/useCourses'
import type { CourseCategory } from '@/types/course'

const { locale } = useI18n()
const { categories, loading, error, fetchCategories } = useCourses()
const searchQuery = ref('')

const filteredCategories = computed(() => {
  if (!searchQuery.value.trim()) {
    return categories.value
  }
  
  const query = searchQuery.value.toLowerCase().trim()
  return categories.value.filter((category: CourseCategory) => {
    const name = category.name?.toLowerCase() || ''
    const description = category.description?.toLowerCase() || ''
    return name.includes(query) || description.includes(query)
  })
})

const handleSearch = (query: string) => {
  // Поиск уже работает через computed filteredCategories
  // Это событие можно использовать для дополнительной логики (например, аналитики)
  // searchQuery обновляется автоматически через v-model
}

onMounted(() => {
  fetchCategories()
})

watch(locale, () => {
  fetchCategories()
})
</script>

<style scoped>
.courses-section {
  padding: 1rem 0 2rem;
  min-height: calc(100vh - 80px);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.courses-header {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
}

.section-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0 0 1.5rem 0;
}

.courses-search {
  margin-top: 1rem;
}

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1.5rem;
  max-width: 100%;
}

@media (min-width: 768px) {
  .courses-section {
    padding: 1.5rem 0 2.5rem;
  }

  .section-title {
    font-size: 2.5rem;
  }

  .section-subtitle {
    font-size: 1.1rem;
  }

  .courses-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 2rem;
  }
}

@media (min-width: 1024px) {
  .courses-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}
</style>

