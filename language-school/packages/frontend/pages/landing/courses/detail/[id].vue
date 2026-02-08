<template>
  <div>
    <section class="section">
      <div class="container">
        <div v-if="loading" class="loading-state"><i class="pi pi-spin pi-spinner" /></div>
        <div v-else-if="error"><p>{{ error }}</p></div>
        <div v-else-if="course" class="course-detail">
          <button class="back-btn" @click="navigateTo(-1)">
            <i class="pi pi-arrow-left" /> {{ $t('common.back') }}
          </button>
          <div class="course-header">
            <img v-if="course.image" :src="course.image" :alt="course.title" class="course-image" />
            <div class="course-meta">
              <h1>{{ course.title }}</h1>
              <p v-if="course.category_name">{{ course.category_name }} / {{ course.subcategory_name }}</p>
              <div class="details">
                <span><i class="pi pi-calendar" /> {{ course.duration_weeks }} {{ $t('courses.weeks') }}</span>
                <span><i class="pi pi-clock" /> {{ course.hours_per_week }} {{ $t('courses.hours') }}/{{ $t('courses.week') }}</span>
              </div>
              <div class="price">
                <span v-if="course.discount_price" class="original">{{ course.price }} 💎</span>
                <span :class="{ discount: course.discount_price }">{{ course.discount_price || course.price }} 💎</span>
              </div>
            </div>
          </div>
          <div v-if="course.description" class="course-description" v-html="course.description" />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { locale } = useI18n()
const { course, loading, error, fetchCourse } = useCourses()
const id = computed(() => Number(route.params.id))

onMounted(() => fetchCourse(id.value))
watch([locale, id], () => fetchCourse(id.value))
</script>

<style scoped>
.section { padding: 3rem 0; }
.back-btn { margin-bottom: 1.5rem; display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; border: 2px solid var(--border-color); border-radius: 12px; background: white; cursor: pointer; }
.course-header { display: flex; gap: 2rem; margin-bottom: 2rem; }
.course-image { width: 300px; height: 200px; object-fit: cover; border-radius: 12px; }
.course-meta h1 { margin: 0 0 0.5rem; font-size: 2rem; }
.details { display: flex; gap: 1.5rem; margin: 1rem 0; font-size: 0.95rem; color: var(--text-secondary); }
.price { font-weight: 600; font-size: 1.25rem; color: var(--primary-color); }
.price .original { text-decoration: line-through; color: var(--text-secondary); margin-right: 0.5rem; }
.course-description { line-height: 1.7; color: var(--text-primary); }
.loading-state { text-align: center; padding: 3rem; }
</style>
