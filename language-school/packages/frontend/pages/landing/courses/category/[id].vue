<template>
  <div>
    <section class="section">
      <div class="container">
        <div v-if="loading" class="loading-state"><i class="pi pi-spin pi-spinner" /></div>
        <div v-else-if="error"><p>{{ error }}</p></div>
        <div v-else-if="category">
          <h1>{{ category.name }}</h1>
          <p v-if="category.description">{{ category.description }}</p>
          <div class="subcategories-grid">
            <NuxtLink
              v-for="sub in subcategories"
              :key="sub.id"
              :to="`/landing/courses/subcategory/${sub.id}`"
              class="subcategory-link"
            >
              {{ sub.name }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { locale } = useI18n()
const { category, subcategories, loading, error, fetchCategory, fetchSubcategories } = useCourses()

const categoryId = computed(() => Number(route.params.id))

onMounted(async () => {
  await fetchCategory(categoryId.value)
  await fetchSubcategories(categoryId.value)
})

watch([locale, categoryId], async () => {
  await fetchCategory(categoryId.value)
  await fetchSubcategories(categoryId.value)
})
</script>

<style scoped>
.subcategories-grid { display: grid; gap: 1rem; margin-top: 2rem; }
.subcategory-link { padding: 1rem; background: var(--bg-secondary); border-radius: 8px; text-decoration: none; color: var(--text-primary); }
.loading-state { text-align: center; padding: 3rem; }
</style>
