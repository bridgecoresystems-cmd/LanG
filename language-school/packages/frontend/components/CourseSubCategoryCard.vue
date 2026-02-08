<template>
  <div class="subcategory-card" @click="handleClick">
    <div class="subcategory-image">
      <img v-if="subcategory.image" :src="subcategory.image" :alt="subcategory.name" />
      <i v-else class="pi pi-book placeholder-icon" />
    </div>
    <div class="subcategory-info">
      <h3>{{ subcategory.name }}</h3>
      <p v-if="subcategory.description" class="description">{{ subcategory.description }}</p>
      <span class="arrow"><i class="pi pi-arrow-right" /></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CourseSubCategory } from '~/types/course'

const props = defineProps<{ subcategory: CourseSubCategory }>()

const handleClick = () => {
  navigateTo(`/landing/courses/subcategory/${props.subcategory.id}`)
}
</script>

<style scoped>
.subcategory-card { display: flex; flex-direction: column; cursor: pointer; border-radius: 12px; overflow: hidden; background: white; box-shadow: 0 2px 12px rgba(0,0,0,0.08); transition: transform 0.2s; }
.subcategory-card:hover { transform: translateY(-4px); }
.subcategory-image { aspect-ratio: 4/3; background: var(--bg-secondary); display: flex; align-items: center; justify-content: center; }
.subcategory-image img { width: 100%; height: 100%; object-fit: cover; }
.placeholder-icon { font-size: 2rem; color: var(--text-secondary); }
.subcategory-info { padding: 1rem; flex: 1; }
.subcategory-info h3 { margin: 0 0 0.5rem; font-size: 1.1rem; }
.description { font-size: 0.9rem; color: var(--text-secondary); margin: 0; line-height: 1.4; }
.arrow { display: inline-block; margin-top: 0.5rem; color: var(--primary-color); }
</style>
