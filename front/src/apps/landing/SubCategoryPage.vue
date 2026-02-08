<template>
  <MainLayout>
    <section class="section">
      <div class="container">
        <div v-if="loading" class="loading-state">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
        </div>

        <div v-else-if="error" class="error-state">
          <p>{{ error }}</p>
        </div>

        <div v-else-if="subcategory">
          <div class="subcategory-header">
            <button @click="$router.back()" class="back-button">
              <i class="pi pi-arrow-left"></i>
              {{ $t('common.back') }}
            </button>
            <div class="subcategory-header-content">
              <div class="subcategory-breadcrumb">
                <span>{{ subcategory.category_name }}</span>
                <i class="pi pi-angle-right"></i>
                <span>{{ subcategory.name }}</span>
              </div>
              <h1 class="subcategory-title">{{ subcategory.name }}</h1>
              <p v-if="subcategory.description" class="subcategory-description">
                {{ subcategory.description }}
              </p>
            </div>
          </div>

          <div v-if="coursesLoading" class="loading-state">
            <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
          </div>

          <div v-else-if="courses.length === 0" class="empty-state">
            <p>{{ $t('courses.noCourses') }}</p>
          </div>

          <div v-else class="courses-grid">
            <CourseCard
              v-for="course in courses"
              :key="course.id"
              :course="course"
            />
          </div>
        </div>
      </div>
    </section>
  </MainLayout>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/components/MainLayout.vue'
import CourseCard from '@/components/CourseCard.vue'
import { useCourses } from '@/composables/useCourses'

const route = useRoute()
const { locale } = useI18n()
const { 
  subcategory, 
  courses, 
  loading, 
  error, 
  fetchSubcategory, 
  fetchCourses,
  loading: coursesLoading 
} = useCourses()

onMounted(async () => {
  const subcategoryId = parseInt(route.params.id as string)
  if (subcategoryId) {
    await fetchSubcategory(subcategoryId)
    await fetchCourses(subcategoryId)
  }
})

watch(locale, async () => {
  const subcategoryId = parseInt(route.params.id as string)
  if (subcategoryId) {
    await fetchSubcategory(subcategoryId)
    await fetchCourses(subcategoryId)
  }
})
</script>

<style scoped>
.section {
  padding: 3rem 0;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  background: white;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
  align-self: flex-start;
  height: fit-content;
}

.back-button:hover {
  background: var(--bg-secondary);
  border-color: var(--primary-color);
  color: var(--primary-color);
  transform: translateX(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.subcategory-header {
  margin-bottom: 3rem;
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 102, 204, 0.1);
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.subcategory-header-content {
  flex: 1;
}

.subcategory-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.subcategory-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.3;
}

.subcategory-description {
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
}

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
}

@media (max-width: 768px) {
  .subcategory-header {
    flex-direction: column;
    align-items: flex-start;
    padding: 1.5rem;
  }

  .back-button {
    align-self: flex-start;
    margin-bottom: 0.5rem;
  }

  .subcategory-title {
    font-size: 1.5rem;
  }

  .subcategory-description {
    font-size: 0.95rem;
  }

  .courses-grid {
    grid-template-columns: 1fr;
  }
}
</style>

