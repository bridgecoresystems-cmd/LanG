<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 dark:text-white">Журнал оценок</h1>
        <p class="text-gray-500">Успеваемость учеников группы</p>
      </div>
      <UButton
        label="Выставить оценку"
        icon="i-heroicons-plus"
        color="primary"
        @click="openAddGradeModal"
      />
    </div>

    <UCard :ui="{ body: { padding: 'p-0' } }" class="overflow-hidden">
      <UTable :rows="students" :columns="columns">
        <template #student-data="{ row }">
          <div class="flex items-center gap-3 px-4 py-2">
            <UAvatar :src="row.avatar" :alt="row.firstName" size="sm" />
            <div>
              <div class="font-medium text-gray-900 dark:text-white">
                {{ row.firstName }} {{ row.lastName }}
              </div>
            </div>
          </div>
        </template>

        <template #grades-data="{ row }">
          <div class="flex flex-wrap gap-2 px-4 py-2">
            <UTooltip 
              v-for="grade in getStudentGrades(row.id)" 
              :key="grade.id"
              :text="`${grade.title}: ${grade.grade}${grade.maxGrade ? '/' + grade.maxGrade : ''}`"
            >
              <UBadge 
                :color="getGradeColor(grade.type)" 
                variant="soft"
                class="cursor-help"
              >
                {{ grade.grade }}
              </UBadge>
            </UTooltip>
            <span v-if="getStudentGrades(row.id).length === 0" class="text-gray-400 text-sm italic">Нет оценок</span>
          </div>
        </template>

        <template #average-data="{ row }">
          <div class="font-bold text-gray-900 dark:text-white px-4 py-2">
            {{ calculateAverage(row.id) }}
          </div>
        </template>
      </UTable>
    </UCard>

    <!-- Модалка добавления оценки -->
    <UModal v-model="isModalOpen">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              Выставить оценку
            </h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="isModalOpen = false" />
          </div>
        </template>

        <UForm :state="form" class="space-y-4 p-4" @submit="saveGrade">
          <UFormGroup label="Ученик" name="user_id">
            <USelect
              v-model="form.user_id"
              :options="students.map(s => ({ label: `${s.firstName} ${s.lastName}`, value: s.id }))"
              placeholder="Выберите ученика"
            />
          </UFormGroup>

          <UFormGroup label="Тип" name="type">
            <USelect
              v-model="form.type"
              :options="gradeTypes"
              placeholder="Выберите тип"
            />
          </UFormGroup>

          <UFormGroup label="Заголовок (напр. Тест 1)" name="title">
            <UInput v-model="form.title" placeholder="Введите название" />
          </UFormGroup>

          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Оценка" name="grade">
              <UInput v-model="form.grade" placeholder="Напр. 5 или A" />
            </UFormGroup>
            <UFormGroup label="Макс. балл (опц.)" name="max_grade">
              <UInput v-model="form.max_grade" placeholder="Напр. 100" />
            </UFormGroup>
          </div>

          <UFormGroup label="Комментарий" name="comment">
            <UTextarea v-model="form.comment" placeholder="Дополнительная информация..." />
          </UFormGroup>

          <div class="flex justify-end gap-3 pt-4">
            <UButton color="gray" variant="ghost" label="Отмена" @click="isModalOpen = false" />
            <UButton type="submit" color="primary" label="Сохранить" :loading="saving" />
          </div>
        </UForm>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCabinetGroups } from '~/composables/useCabinetGroups'

definePageMeta({ 
  layout: 'cabinet', 
  middleware: 'cabinet-auth' 
})

const route = useRoute()
const groupId = computed(() => parseInt(route.params.id as string))
const groupsApi = useCabinetGroups()

const students = ref<any[]>([])
const grades = ref<any[]>([])
const isModalOpen = ref(false)
const saving = ref(false)

const columns = [
  { key: 'student', label: 'Ученик' },
  { key: 'grades', label: 'Оценки' },
  { key: 'average', label: 'Средний балл' }
]

const gradeTypes = [
  { label: 'Экзамен', value: 'exam' },
  { label: 'Тест', value: 'test' },
  { label: 'ДЗ', value: 'homework' },
  { label: 'Активность', value: 'participation' }
]

const form = ref({
  user_id: '',
  type: 'test',
  title: '',
  grade: '',
  max_grade: '',
  comment: '',
  group_id: groupId.value
})

const loadData = async () => {
  try {
    const [studentsData, gradesData] = await Promise.all([
      groupsApi.getGroupStudents(groupId.value),
      groupsApi.getGrades(groupId.value)
    ])
    students.value = studentsData
    grades.value = gradesData
  } catch (e) {
    console.error(e)
  }
}

const getStudentGrades = (userId: string) => {
  return grades.value.filter(g => g.userId === userId)
}

const getGradeColor = (type: string) => {
  switch (type) {
    case 'exam': return 'red'
    case 'test': return 'orange'
    case 'homework': return 'blue'
    case 'participation': return 'emerald'
    default: return 'gray'
  }
}

const calculateAverage = (userId: string) => {
  const studentGrades = getStudentGrades(userId)
    .map(g => parseFloat(g.grade))
    .filter(g => !isNaN(g))
  
  if (studentGrades.length === 0) return '-'
  const sum = studentGrades.reduce((a, b) => a + b, 0)
  return (sum / studentGrades.length).toFixed(1)
}

const openAddGradeModal = () => {
  form.value = {
    user_id: '',
    type: 'test',
    title: '',
    grade: '',
    max_grade: '',
    comment: '',
    group_id: groupId.value
  }
  isModalOpen.value = true
}

const saveGrade = async () => {
  saving.value = true
  try {
    await groupsApi.saveGrade(form.value)
    await loadData()
    isModalOpen.value = false
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

loadData()
</script>
