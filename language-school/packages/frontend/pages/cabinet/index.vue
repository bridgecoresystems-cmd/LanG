<template>
  <div class="space-y-8">
    <!-- Welcome Header -->
    <header class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 p-6 text-white">
      <div class="relative z-10">
        <h1 class="text-2xl font-bold">
          C возвращением, {{ authStore.user?.first_name || 'друг' }}! 👋 Личный кабинет Academy
        </h1>
      </div>

      <!-- Decorative abstract shapes -->
      <div class="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      <div class="absolute bottom-0 right-0 translate-y-12 -translate-x-12 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl" />
      
      <!-- Icon illustration vibe -->
      <div class="absolute right-12 bottom-0 hidden lg:block opacity-20">
        <UIcon name="i-heroicons-academic-cap" class="w-64 h-64" />
      </div>
    </header>

    <!-- Группы для Учителя и Ученика -->
    <div v-if="isTeacher || isStudent" class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <UIcon name="i-heroicons-user-group" class="text-primary-500" />
          {{ isTeacher ? 'Мои группы' : 'Мои курсы' }}
        </h2>
      </div>

      <div v-if="contextStore.isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <USkeleton v-for="i in 3" :key="i" class="h-48 rounded-2xl" />
      </div>

      <div v-else-if="contextStore.availableGroups.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <CabinetGroupCard
          v-for="group in contextStore.availableGroups"
          :key="group.id"
          :group="group"
          @click="selectGroup(group.id)"
        />
      </div>

      <div v-else class="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
        <UIcon name="i-heroicons-information-circle" class="w-12 h-12 text-gray-400 mb-4 mx-auto" />
        <p class="text-gray-500 dark:text-gray-400 text-lg">У вас пока нет активных групп.</p>
      </div>
    </div>

    <!-- Content Sections for Editors/Admins -->
    <div v-if="isEditor" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '~/stores/authStore'
import { useContextStore } from '~/stores/contextStore'

definePageMeta({ 
  layout: 'cabinet', 
  middleware: 'cabinet-auth' 
})

const authStore = useAuthStore()
const contextStore = useContextStore()

const userRole = computed(() => (authStore.user?.role || '').toUpperCase())
const isEditor = computed(() => ['EDITOR', 'SUPERUSER', 'HEAD_TEACHER'].includes(userRole.value))
const isStudent = computed(() => ['STUDENT'].includes(userRole.value))
const isTeacher = computed(() => ['TEACHER'].includes(userRole.value))

const selectGroup = (id: number) => {
  contextStore.setSelectedGroup(id)
  // Можно добавить уведомление или сразу перенаправить на первую страницу контекста
  const targetPath = isTeacher.value 
    ? `/cabinet/teacher/groups/${id}/lessons` 
    : `/cabinet/student/groups/${id}/lessons`
  navigateTo(targetPath)
}

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
.space-y-8 {
  animation: slideUp 0.4s ease-out;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
