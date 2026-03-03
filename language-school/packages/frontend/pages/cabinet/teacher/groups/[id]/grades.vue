<template>
  <div class="grades-page">

    <!-- No scheme assigned -->
    <div v-if="!loading && !scheme" class="empty-state">
      <NIcon size="64" color="#d1d5db"><component :is="DocumentIcon" /></NIcon>
      <h3>Схема экзаменов не назначена</h3>
      <p>Завуч должен назначить схему оценивания для этой группы</p>
    </div>

    <template v-else>
      <!-- Exam tabs -->
      <NTabs v-if="scheme" v-model:value="activeItemId" type="card" animated>
        <NTabPane
          v-for="item in scheme.items"
          :key="item.id"
          :name="item.id"
          :tab="`${item.examTypeName} (${item.weightPercentage}%)`"
        />
      </NTabs>

      <!-- Active exam info bar -->
      <div v-if="activeItem" class="exam-info-bar">
        <div class="exam-info-bar__item">
          <span class="exam-info-bar__label">Writing</span>
          <span class="exam-info-bar__value">макс. {{ activeItem.writingMax }} б.</span>
        </div>
        <div class="exam-info-bar__item">
          <span class="exam-info-bar__label">Listening</span>
          <span class="exam-info-bar__value">макс. {{ activeItem.listeningMax }} б.</span>
        </div>
        <div class="exam-info-bar__item">
          <span class="exam-info-bar__label">Reading</span>
          <span class="exam-info-bar__value">макс. {{ activeItem.readingMax }} б.</span>
        </div>
        <div class="exam-info-bar__item">
          <span class="exam-info-bar__label">Speaking</span>
          <span class="exam-info-bar__value">макс. {{ activeItem.speakingMax }} б.</span>
        </div>
        <div class="exam-info-bar__item exam-info-bar__item--total">
          <span class="exam-info-bar__label">Итого макс.</span>
          <span class="exam-info-bar__value">{{ activeItem.writingMax + activeItem.listeningMax + activeItem.readingMax + activeItem.speakingMax }} б.</span>
        </div>
        <div class="exam-info-bar__item exam-info-bar__item--weight">
          <span class="exam-info-bar__label">Вес в сертификате</span>
          <span class="exam-info-bar__value">{{ activeItem.weightPercentage }}%</span>
        </div>
      </div>

      <!-- Grades table -->
      <NCard style="border-radius: 12px; margin-top: 16px;">
        <NDataTable
          :columns="columns"
          :data="tableData"
          :loading="loading"
          :bordered="false"
          :row-key="(r) => r.id"
        />
      </NCard>
    </template>

    <!-- Grade edit modal -->
    <NModal v-model:show="showModal" preset="card" style="width: 460px" :title="`Оценка: ${editingStudent?.full_name}`">
      <div v-if="activeItem" class="grade-form">
        <div class="grade-form__row" v-for="skill in skillFields" :key="skill.key">
          <div class="grade-form__label">
            {{ skill.label }}
            <span class="grade-form__max">(макс. {{ activeItem[skill.maxKey] }} б.)</span>
          </div>
          <NInputNumber
            v-model:value="editForm[skill.key]"
            :min="0"
            :max="activeItem[skill.maxKey]"
            style="width: 140px;"
          />
        </div>
        <NDivider style="margin: 12px 0;" />
        <div class="grade-form__total">
          <span>Итого:</span>
          <strong>{{ editTotal }} / {{ activeItem.writingMax + activeItem.listeningMax + activeItem.readingMax + activeItem.speakingMax }}</strong>
        </div>
        <div v-if="activeItem" class="grade-form__contribution">
          Вклад в сертификат: <strong>{{ (editTotal * activeItem.weightPercentage / 100).toFixed(2) }} б.</strong>
        </div>
      </div>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showModal = false">Отмена</NButton>
          <NButton type="primary" :loading="saving" @click="saveGrade">Сохранить</NButton>
        </NSpace>
      </template>
    </NModal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, h } from 'vue'
import {
  NTabs, NTabPane, NCard, NDataTable, NButton, NIcon, NModal,
  NInputNumber, NSpace, NDivider, useMessage, NTag,
} from 'naive-ui'
import {
  DocumentTextOutline as DocumentIcon,
  CreateOutline as EditIcon,
} from '@vicons/ionicons5'
import { useAuthStore } from '~/stores/authStore'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const route = useRoute()
const groupId = computed(() => parseInt(route.params.id as string))
const config = useRuntimeConfig()
const API = config.public.apiBase as string
const message = useMessage()
const authStore = useAuthStore()

// State
const loading = ref(true)
const saving = ref(false)
const scheme = ref<any>(null)
const grades = ref<any[]>([])
const students = ref<any[]>([])
const activeItemId = ref<number | null>(null)
const showModal = ref(false)
const editingStudent = ref<any>(null)
const editForm = ref({ writing: 0, listening: 0, reading: 0, speaking: 0 })

const skillFields = [
  { key: 'writing' as const, label: 'Writing', maxKey: 'writingMax' as const },
  { key: 'listening' as const, label: 'Listening', maxKey: 'listeningMax' as const },
  { key: 'reading' as const, label: 'Reading', maxKey: 'readingMax' as const },
  { key: 'speaking' as const, label: 'Speaking', maxKey: 'speakingMax' as const },
]

const activeItem = computed(() =>
  scheme.value?.items?.find((i: any) => i.id === activeItemId.value) ?? null
)

const editTotal = computed(() =>
  (editForm.value.writing || 0) + (editForm.value.listening || 0) +
  (editForm.value.reading || 0) + (editForm.value.speaking || 0)
)

// Table data: students with grades for current exam
const tableData = computed(() => {
  if (!activeItemId.value) return []
  return students.value.map((s) => {
    const grade = grades.value.find(
      (g) => g.userId === s.id && g.schemeItemId === activeItemId.value
    ) ?? null
    return { ...s, grade }
  })
})

// Columns
const columns = computed(() => [
  {
    title: 'Ученик',
    key: 'full_name',
    width: 200,
  },
  {
    title: 'Writing',
    key: 'writing',
    width: 100,
    render: (row: any) => row.grade ? `${row.grade.writing}` : h('span', { style: 'color:#9ca3af' }, '—'),
  },
  {
    title: 'Listening',
    key: 'listening',
    width: 110,
    render: (row: any) => row.grade ? `${row.grade.listening}` : h('span', { style: 'color:#9ca3af' }, '—'),
  },
  {
    title: 'Reading',
    key: 'reading',
    width: 100,
    render: (row: any) => row.grade ? `${row.grade.reading}` : h('span', { style: 'color:#9ca3af' }, '—'),
  },
  {
    title: 'Speaking',
    key: 'speaking',
    width: 110,
    render: (row: any) => row.grade ? `${row.grade.speaking}` : h('span', { style: 'color:#9ca3af' }, '—'),
  },
  {
    title: 'Итого',
    key: 'total',
    width: 90,
    render: (row: any) => {
      if (!row.grade) return h('span', { style: 'color:#9ca3af' }, '—')
      const total = Number(row.grade.totalScore)
      const max = activeItem.value
        ? activeItem.value.writingMax + activeItem.value.listeningMax +
          activeItem.value.readingMax + activeItem.value.speakingMax
        : 100
      const pct = max > 0 ? Math.round(total / max * 100) : 0
      const color = pct >= 60 ? 'success' : pct >= 40 ? 'warning' : 'error'
      return h(NTag, { type: color, size: 'small' }, { default: () => `${total}` })
    },
  },
  {
    title: '',
    key: 'actions',
    width: 80,
    render: (row: any) => h(NButton, {
      size: 'small',
      type: row.grade ? 'default' : 'primary',
      ghost: !!row.grade,
      onClick: () => openEdit(row),
    }, {
      default: () => row.grade ? 'Изменить' : 'Ввести',
      icon: row.grade ? () => h(NIcon, null, { default: () => h(EditIcon) }) : undefined,
    }),
  },
])

function openEdit(student: any) {
  editingStudent.value = student
  const g = student.grade
  editForm.value = {
    writing: g ? Number(g.writing) : 0,
    listening: g ? Number(g.listening) : 0,
    reading: g ? Number(g.reading) : 0,
    speaking: g ? Number(g.speaking) : 0,
  }
  showModal.value = true
}

async function saveGrade() {
  if (!editingStudent.value || !activeItemId.value) return
  saving.value = true
  try {
    await $fetch(`${API}/cabinet/teacher/groups/${groupId.value}/exam-grades`, {
      method: 'PUT',
      credentials: 'include',
      body: {
        userId: editingStudent.value.id,
        schemeItemId: activeItemId.value,
        writing: editForm.value.writing,
        listening: editForm.value.listening,
        reading: editForm.value.reading,
        speaking: editForm.value.speaking,
      },
    })
    message.success('Оценка сохранена')
    showModal.value = false
    await loadGrades()
  } catch (e) {
    message.error('Ошибка при сохранении')
  } finally {
    saving.value = false
  }
}

async function loadAll() {
  loading.value = true
  try {
    const [schemeData, studentsData, gradesData] = await Promise.all([
      $fetch<any>(`${API}/cabinet/teacher/groups/${groupId.value}/exam-schema`, { credentials: 'include' }),
      $fetch<any[]>(`${API}/cabinet/teacher/groups/${groupId.value}/students-list`, { credentials: 'include' }),
      $fetch<any[]>(`${API}/cabinet/teacher/groups/${groupId.value}/exam-grades`, { credentials: 'include' }),
    ])
    scheme.value = schemeData
    students.value = Array.isArray(studentsData) ? studentsData : []
    grades.value = Array.isArray(gradesData) ? gradesData : []
    if (schemeData?.items?.length) {
      activeItemId.value = schemeData.items[0].id
    }
  } catch (e) {
    console.error('Exam grades load failed', e)
  } finally {
    loading.value = false
  }
}

async function loadGrades() {
  try {
    const data = await $fetch<any[]>(`${API}/cabinet/teacher/groups/${groupId.value}/exam-grades`, { credentials: 'include' })
    grades.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error(e)
  }
}

// Reload when group changes via sidebar
watch(groupId, loadAll)
loadAll()
</script>

<style scoped>
.grades-page {
  padding-bottom: 60px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 40px;
  background: #f9fafb;
  border: 2px dashed #e5e7eb;
  border-radius: 16px;
  text-align: center;
  color: #6b7280;
}
.empty-state h3 { margin: 0; font-size: 18px; color: #374151; }
.empty-state p { margin: 0; font-size: 14px; }

.exam-info-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  padding: 12px 16px;
  margin-top: 12px;
}
.exam-info-bar__item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 80px;
}
.exam-info-bar__item--total,
.exam-info-bar__item--weight {
  border-left: 1px solid #bbf7d0;
  padding-left: 12px;
}
.exam-info-bar__label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6b7280;
  font-weight: 600;
}
.exam-info-bar__value {
  font-size: 14px;
  font-weight: 700;
  color: #15803d;
}

.grade-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.grade-form__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.grade-form__label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}
.grade-form__max {
  font-size: 12px;
  color: #9ca3af;
  margin-left: 4px;
}
.grade-form__total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 16px;
}
.grade-form__contribution {
  font-size: 13px;
  color: #6b7280;
  text-align: right;
}
</style>
