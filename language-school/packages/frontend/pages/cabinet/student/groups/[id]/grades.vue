<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 dark:text-white">Моя успеваемость</h1>
        <p class="text-gray-500">Оценки и результаты тестов</p>
      </div>
      <div v-if="averageGrade !== '-'" class="text-right">
        <div class="text-sm text-gray-500 uppercase font-bold tracking-wider">Средний балл</div>
        <div class="text-3xl font-black text-primary-600 dark:text-primary-400">{{ averageGrade }}</div>
      </div>
    </div>

    <div v-if="pending" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <USkeleton v-for="i in 4" :key="i" class="h-32 rounded-2xl" />
    </div>

    <div v-else-if="grades.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <UCard
        v-for="grade in grades"
        :key="grade.id"
        class="hover:shadow-lg transition-all duration-300 overflow-hidden group"
      >
        <div class="flex justify-between items-start">
          <div class="space-y-2">
            <UBadge :color="getGradeColor(grade.type)" variant="subtle" class="uppercase text-[10px] font-bold">
              {{ translateType(grade.type) }}
            </UBadge>
            <h3 class="text-lg font-bold text-gray-800 dark:text-white">{{ grade.title }}</h3>
            <p class="text-sm text-gray-500">{{ formatDate(grade.date) }}</p>
          </div>
          <div class="text-center">
            <div class="text-3xl font-black text-gray-900 dark:text-white">
              {{ grade.grade }}
            </div>
            <div v-if="grade.maxGrade" class="text-xs text-gray-400 border-t border-gray-100 dark:border-gray-800 mt-1 pt-1">
              из {{ grade.maxGrade }}
            </div>
          </div>
        </div>
        <div v-if="grade.comment" class="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-sm text-gray-600 dark:text-gray-400 italic">
          "{{ grade.comment }}"
        </div>
      </UCard>
    </div>

    <div v-else class="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl ring-1 ring-gray-200 dark:ring-gray-800">
      <UIcon name="i-heroicons-academic-cap" class="w-16 h-16 text-gray-300 mb-4 mx-auto" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">Оценок пока нет</h3>
      <p class="text-gray-500">Как только учитель выставит оценку, она появится здесь.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCabinetGroups } from '~/composables/useCabinetGroups'
import { useAuthStore } from '~/stores/authStore'

definePageMeta({ 
  layout: 'cabinet', 
  middleware: 'cabinet-auth' 
})

const route = useRoute()
const groupId = computed(() => parseInt(route.params.id as string))
const groupsApi = useCabinetGroups()
const authStore = useAuthStore()

const grades = ref<any[]>([])
const pending = ref(true)

const loadData = async () => {
  pending.value = true
  try {
    const allGrades = await groupsApi.getGrades(groupId.value)
    // Фильтруем только для текущего ученика
    grades.value = allGrades.filter((g: any) => g.userId === authStore.user?.id)
  } catch (e) {
    console.error(e)
  } finally {
    pending.value = false
  }
}

const averageGrade = computed(() => {
  const numericGrades = grades.value
    .map(g => parseFloat(g.grade))
    .filter(g => !isNaN(g))
  
  if (numericGrades.length === 0) return '-'
  const sum = numericGrades.reduce((a, b) => a + b, 0)
  return (sum / numericGrades.length).toFixed(1)
})

const getGradeColor = (type: string) => {
  switch (type) {
    case 'exam': return 'red'
    case 'test': return 'orange'
    case 'homework': return 'blue'
    case 'participation': return 'emerald'
    default: return 'gray'
  }
}

const translateType = (type: string) => {
  const types: any = {
    exam: 'Экзамен',
    test: 'Тест',
    homework: 'ДЗ',
    participation: 'Активность'
  }
  return types[type] || type
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' })
}

loadData()
</script>
