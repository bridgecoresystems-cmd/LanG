<template>
  <div>
    <section class="section">
      <div class="container">
        <div v-if="loading" class="loading-state"><i class="pi pi-spin pi-spinner" /></div>
        <div v-else-if="error"><p>{{ error }}</p></div>
        <div v-else-if="teacher" class="teacher-detail">
          <img :src="teacher.avatar_url || '/placeholder-teacher.png'" :alt="teacher.full_name" class="teacher-avatar" />
          <h1>{{ teacher.full_name }}</h1>
          <p v-if="teacher.specialization">{{ teacher.specialization }}</p>
          <p v-if="teacher.bio">{{ teacher.bio }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { locale } = useI18n()
const { teacher, loading, error, fetchTeacher } = useTeachers()

const teacherId = computed(() => Number(route.params.id))

onMounted(() => fetchTeacher(teacherId.value))
watch([locale, teacherId], () => fetchTeacher(teacherId.value))
</script>

<style scoped>
.teacher-detail { text-align: center; }
.teacher-avatar { width: 200px; height: 200px; border-radius: 50%; object-fit: cover; margin-bottom: 1rem; }
.loading-state { text-align: center; padding: 3rem; }
</style>
