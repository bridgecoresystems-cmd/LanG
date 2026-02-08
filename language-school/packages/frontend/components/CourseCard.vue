<template>
  <div class="course-card" @click="handleClick">
    <div class="course-image">
      <img v-if="course.image" :src="course.image" :alt="course.title" />
      <i v-else class="pi pi-graduation-cap placeholder-icon" />
    </div>
    <div class="course-info">
      <h3>{{ course.title }}</h3>
      <div class="details">
        <span><i class="pi pi-calendar" /> {{ course.duration_weeks }} {{ $t('courses.weeks') || 'нед' }}</span>
        <span><i class="pi pi-clock" /> {{ course.hours_per_week }} ч/нед</span>
      </div>
      <div class="price">
        <span v-if="course.discount_price" class="original">{{ course.price }} 💎</span>
        <span :class="{ discount: course.discount_price }">{{ course.discount_price || course.price }} 💎</span>
      </div>
      <span class="arrow"><i class="pi pi-arrow-right" /></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Course } from '~/types/course'

const props = defineProps<{ course: Course }>()

const handleClick = () => {
  navigateTo(`/landing/courses/detail/${props.course.id}`)
}
</script>

<style scoped>
.course-card { display: flex; flex-direction: column; cursor: pointer; border-radius: 12px; overflow: hidden; background: white; box-shadow: 0 2px 12px rgba(0,0,0,0.08); transition: transform 0.2s; }
.course-card:hover { transform: translateY(-4px); }
.course-image { aspect-ratio: 4/3; background: var(--bg-secondary); display: flex; align-items: center; justify-content: center; }
.course-image img { width: 100%; height: 100%; object-fit: cover; }
.placeholder-icon { font-size: 2rem; color: var(--text-secondary); }
.course-info { padding: 1rem; flex: 1; }
.course-info h3 { margin: 0 0 0.5rem; font-size: 1.1rem; }
.details { display: flex; gap: 1rem; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem; }
.price { font-weight: 600; color: var(--primary-color); }
.price .original { text-decoration: line-through; color: var(--text-secondary); margin-right: 0.5rem; }
.arrow { display: inline-block; margin-top: 0.5rem; color: var(--primary-color); }
</style>
