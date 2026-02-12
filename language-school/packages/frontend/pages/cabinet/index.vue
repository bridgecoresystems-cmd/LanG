<template>
  <div class="space-y-8">
    <!-- Welcome Header -->
    <header class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 to-primary-700 p-8 lg:p-12 text-white">
      <div class="relative z-10 max-w-2xl">
        <UBadge color="white" variant="soft" class="mb-4 text-primary-700 font-bold uppercase tracking-wider px-3 py-1">
          {{ authStore.user?.role || 'Пользователь' }}
        </UBadge>
        <h1 class="text-3xl lg:text-5xl font-bold mb-4">
          C возвращением, {{ authStore.user?.first_name || 'друг' }}! 👋
        </h1>
        <p class="text-lg lg:text-xl text-primary-50/90 leading-relaxed font-medium">
          Это твой персональный кабинет Language School. Здесь собрано всё необходимое для управления обучением и контентом.
        </p>
      </div>

      <!-- Decorative abstract shapes -->
      <div class="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      <div class="absolute bottom-0 right-0 translate-y-12 -translate-x-12 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl" />
      
      <!-- Icon illustration vibe -->
      <div class="absolute right-12 bottom-0 hidden lg:block opacity-20">
        <UIcon name="i-heroicons-academic-cap" class="w-64 h-64" />
      </div>
    </header>

    <!-- Content Sections -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Editor Management Stats/Links -->
      <div v-if="isEditor" class="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <UCard
          v-for="card in editorShortcuts"
          :key="card.path"
          class="group hover:shadow-xl transition-all duration-300 ring-1 ring-gray-200 dark:ring-gray-700"
          :ui="{ body: { padding: 'p-6' } }"
        >
          <div class="flex items-start justify-between">
            <div :class="['p-3 rounded-2xl transition-colors duration-300', card.colorClass]">
              <UIcon :name="card.icon" class="w-8 h-8" />
            </div>
            <UButton
              :to="card.path"
              variant="ghost"
              color="gray"
              icon="i-heroicons-arrow-right-20-solid"
              class="opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
          <div class="mt-6">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white">{{ card.label }}</h3>
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {{ card.description }}
            </p>
          </div>
          <template #footer>
            <UButton :to="card.path" variant="soft" color="primary" block label="Перейти" />
          </template>
        </UCard>
      </div>

      <!-- Student Info Widget -->
      <div v-if="isStudent" class="space-y-6">
        <UCard class="bg-indigo-50/50 dark:bg-indigo-900/10 ring-indigo-100 dark:ring-indigo-900/30">
          <div class="flex items-center gap-4 mb-6">
            <div class="p-3 bg-indigo-500 rounded-2xl text-white">
              <UIcon name="i-heroicons-book-open" class="w-7 h-7" />
            </div>
            <h3 class="text-lg font-bold text-gray-800 dark:text-white">Моё обучение</h3>
          </div>
          <div class="space-y-4">
            <UButton to="/cabinet/student/courses" color="indigo" variant="soft" block label="Мои курсы" icon="i-heroicons-academic-cap" />
            <UButton to="/cabinet/student/schedule" color="indigo" variant="soft" block label="Расписание" icon="i-heroicons-calendar" />
          </div>
        </UCard>

        <!-- Stats Mockup (Cool look) -->
        <UCard class="bg-emerald-50/50 dark:bg-emerald-900/10 ring-emerald-100 dark:ring-emerald-900/30">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-emerald-600 dark:text-emerald-400">Прогресс обучения</p>
              <h4 class="text-2xl font-bold text-gray-800 dark:text-white mt-1">75%</h4>
            </div>
            <div class="p-2 bg-emerald-500/20 rounded-full">
              <UIcon name="i-heroicons-chart-bar" class="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <UMeter :value="75" color="emerald" class="mt-4" />
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '~/stores/authStore'

definePageMeta({ 
  layout: 'cabinet', 
  middleware: 'cabinet-auth' 
})

const authStore = useAuthStore()

const userRole = computed(() => (authStore.user?.role || '').toUpperCase())
const isEditor = computed(() => ['EDITOR', 'SUPERUSER', 'HEAD_TEACHER'].includes(userRole.value))
const isStudent = computed(() => ['STUDENT', 'SUPERUSER'].includes(userRole.value))

const editorShortcuts = [
  {
    label: 'Курсы',
    path: '/cabinet/editor/courses',
    icon: 'i-heroicons-academic-cap',
    description: 'Управление каталогом курсов: добавление, редактирование цен и описаний.',
    colorClass: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
  },
  {
    label: 'Новости',
    path: '/cabinet/editor/news',
    icon: 'i-heroicons-newspaper',
    description: 'Публикация свежих событий школы, акций и важных объявлений для студентов.',
    colorClass: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
  },
  {
    label: 'Сообщения',
    path: '/cabinet/editor/contact',
    icon: 'i-heroicons-envelope',
    description: 'Работа с входящими заявками с сайта и общение с потенциальными клиентами.',
    colorClass: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
  }
]
</script>

<style scoped>
/* Individual page animations */
.space-y-8 {
  animation: slideUp 0.4s ease-out;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
