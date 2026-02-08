<template>
  <div class="teacher-card" @click="handleClick">
    <div class="teacher-avatar-wrapper">
      <img
        :src="teacher.avatar_url || '/placeholder-teacher.png'"
        :alt="teacher.full_name"
        class="teacher-avatar"
        @error="handleImageError"
      />
    </div>

    <div class="teacher-info">
      <h3 class="teacher-name">{{ teacher.full_name }}</h3>

      <div v-if="teacher.specialization" class="teacher-specialization-card">
        <i class="pi pi-book"></i>
        <span>{{ teacher.specialization }}</span>
      </div>

      <div class="teacher-stats">
        <div class="stat-item">
          <i class="pi pi-eye"></i>
          <span class="stat-value">{{ formatViews(teacher.views) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Teacher } from '~/types/teacher'

const props = defineProps<{ teacher: Teacher }>()
const router = useRouter()

const formatViews = (views: number) =>
  views >= 1000 ? `${(views / 1000).toFixed(1)}k` : String(views)

const handleClick = () => {
  const teacherId = props.teacher.user_id || props.teacher.id
  router.push(`/landing/teacher/${teacherId}`)
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.src = '/placeholder-teacher.png'
}
</script>

<style scoped>
.teacher-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1.5rem;
  border-radius: 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.4s ease;
  max-width: 300px;
  margin: 0 auto;
  border: 1px solid rgba(0, 102, 204, 0.1);
}

.teacher-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(0, 102, 204, 0.2);
}

.teacher-avatar-wrapper {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 1.5rem;
  border: 5px solid var(--primary-color);
}

.teacher-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.teacher-name {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.teacher-specialization-card {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  margin-bottom: 1rem;
  background: rgba(0, 102, 204, 0.1);
  border-radius: 20px;
  color: var(--primary-color);
  font-size: 0.9rem;
}

.teacher-stats {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
}
</style>
