<template>
  <MainLayout>
    <section class="section">
      <div class="container">
        <h1 class="section-title">{{ $t('homepage.about.title') }}</h1>
        <p class="about-text">{{ $t('homepage.about.description') }}</p>
      </div>
    </section>

    <section class="section teachers-section">
      <div class="container">
        <h2 class="section-title">{{ $t('about.teachers.title') }}</h2>
        <p class="section-subtitle">{{ $t('about.teachers.subtitle') }}</p>
        
        <div v-if="loading" class="loading-state">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
        </div>
        
        <div v-else-if="error" class="error-state">
          <p>{{ error }}</p>
        </div>
        
        <div v-else-if="teachers.length === 0" class="empty-state">
          <p>{{ $t('about.teachers.noTeachers') }}</p>
        </div>
        
        <div v-else class="teachers-grid">
          <TeacherCard
            v-for="teacher in teachers"
            :key="teacher.id"
            :teacher="teacher"
          />
        </div>
      </div>
    </section>
  </MainLayout>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/components/MainLayout.vue'
import TeacherCard from '@/components/TeacherCard.vue'
import { useTeachers } from '@/composables/useTeachers'

const { locale } = useI18n()
const { teachers, loading, error, fetchTeachers } = useTeachers()

onMounted(() => {
  fetchTeachers()
})

// Reload teachers when language changes
watch(locale, () => {
  fetchTeachers()
})
</script>

<style scoped>
.about-text {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
  font-size: 1.1rem;
  line-height: 1.8;
  color: var(--text-secondary);
}

.teachers-section {
  background-color: var(--bg-secondary);
}

.teachers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .teachers-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
</style>

