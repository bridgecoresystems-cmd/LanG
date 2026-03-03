<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__text">
        <NH2 class="page-header__title">Настройки экзаменов</NH2>
        <p class="page-header__subtitle">Управление типами экзаменов и схемами оценивания</p>
      </div>
    </header>

    <NTabs type="line" animated>
      <NTabPane name="exam-types" tab="Типы экзаменов">
        <NCard class="cabinet-card">
          <div class="flex justify-between items-center mb-4">
            <NH3 style="margin: 0;">Список типов экзаменов</NH3>
            <NButton type="primary" @click="showExamTypeModal = true">
              <template #icon><NIcon><component :is="AddIcon" /></NIcon></template>
              Добавить тип
            </NButton>
          </div>
          <NDataTable :columns="examTypeColumns" :data="examTypes" :loading="loading" :bordered="false" />
        </NCard>
      </NTabPane>

      <NTabPane name="exam-schemes" tab="Схемы оценивания">
        <NCard class="cabinet-card">
          <div class="flex justify-between items-center mb-4">
            <NH3 style="margin: 0;">Список схем</NH3>
            <NButton type="primary" @click="showExamSchemeModal = true">
              <template #icon><NIcon><component :is="AddIcon" /></NIcon></template>
              Добавить схему
            </NButton>
          </div>
          <NDataTable :columns="examSchemeColumns" :data="examSchemes" :loading="loading" :bordered="false" />
        </NCard>
      </NTabPane>
    </NTabs>

    <!-- Exam Type Modal -->
    <NModal v-model:show="showExamTypeModal" preset="card" style="width: 500px" title="Добавить тип экзамена">
      <NForm :model="examTypeForm" label-placement="top">
        <NFormItem label="Название" required>
          <NInput v-model:value="examTypeForm.name" placeholder="Напр. Midterm, Final" />
        </NFormItem>
        <p class="font-bold mb-2">Максимальные баллы по навыкам</p>
        <NGrid :cols="2" :x-gap="12">
          <NGi>
            <NFormItem label="Writing (макс. баллов)">
              <NInputNumber v-model:value="examTypeForm.writingMax" :min="0" :max="9999" style="width: 100%" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="Listening (макс. баллов)">
              <NInputNumber v-model:value="examTypeForm.listeningMax" :min="0" :max="9999" style="width: 100%" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="Reading (макс. баллов)">
              <NInputNumber v-model:value="examTypeForm.readingMax" :min="0" :max="9999" style="width: 100%" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="Speaking (макс. баллов)">
              <NInputNumber v-model:value="examTypeForm.speakingMax" :min="0" :max="9999" style="width: 100%" />
            </NFormItem>
          </NGi>
        </NGrid>
        <div class="text-center mt-4 text-gray-600">
          Итого макс.: <strong>{{ totalMax }}</strong> баллов
        </div>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showExamTypeModal = false">Отмена</NButton>
          <NButton type="primary" :disabled="!examTypeForm.name" :loading="saving" @click="handleSaveExamType">Сохранить</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- Exam Scheme Modal -->
    <NModal v-model:show="showExamSchemeModal" preset="card" style="width: 600px" title="Добавить схему оценивания">
      <NForm :model="examSchemeForm" label-placement="top">
        <NFormItem label="Название схемы" required>
          <NInput v-model:value="examSchemeForm.name" placeholder="Напр. Основная схема 20/20/20/40" />
        </NFormItem>
        <NH3>Экзамены в схеме</NH3>
        <NSpace vertical size="medium">
          <div v-for="(item, index) in examSchemeForm.items" :key="index" class="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <NGrid :cols="12" :x-gap="12" items-center>
              <NGi span="6">
                <NFormItem label="Тип экзамена" required>
                  <NSelect v-model:value="item.examTypeId" :options="examTypeOptions" placeholder="Выберите тип" />
                </NFormItem>
              </NGi>
              <NGi span="4">
                <NFormItem label="Вес в итоге (%)" required>
                  <NInputNumber v-model:value="item.weightPercentage" :min="1" :max="100" style="width: 100%" />
                </NFormItem>
              </NGi>
              <NGi span="2" class="flex justify-center pt-6">
                <NButton circle type="error" ghost @click="examSchemeForm.items.splice(index, 1)" :disabled="examSchemeForm.items.length <= 1">
                  <template #icon><NIcon><component :is="DeleteIcon" /></NIcon></template>
                </NButton>
              </NGi>
            </NGrid>
          </div>
        </NSpace>
        <NButton dashed block @click="examSchemeForm.items.push({ examTypeId: null as any, weightPercentage: 0, order: examSchemeForm.items.length + 1 })" class="mt-4">
          <template #icon><NIcon><component :is="AddIcon" /></NIcon></template>
          Добавить экзамен
        </NButton>
        <div class="text-center mt-6 text-lg font-bold" :class="totalSchemeWeight === 100 ? 'text-green-600' : 'text-red-600'">
          Общий вес: {{ totalSchemeWeight }}% / 100%
        </div>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showExamSchemeModal = false">Отмена</NButton>
          <NButton type="primary" :disabled="totalSchemeWeight !== 100 || !examSchemeForm.name" :loading="saving" @click="handleSaveExamScheme">Сохранить</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue'
import { useCabinetGroups } from '~/composables/useCabinetGroups'
import {
  NTabs, NTabPane, NCard, NH2, NH3, NButton, NIcon, NDataTable,
  NModal, NForm, NFormItem, NInput, NInputNumber, NGrid, NGi, NSpace, NSelect, useMessage
} from 'naive-ui'
import { AddOutline as AddIcon, TrashOutline as DeleteIcon } from '@vicons/ionicons5'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const groupsApi = useCabinetGroups()
const message = useMessage()

const loading = ref(false)
const saving = ref(false)
const examTypes = ref<any[]>([])
const examSchemes = ref<any[]>([])

const showExamTypeModal = ref(false)
const examTypeForm = reactive({ name: '', writingMax: 25, listeningMax: 25, readingMax: 25, speakingMax: 25 })

const showExamSchemeModal = ref(false)
const examSchemeForm = reactive({
  name: '',
  items: [{ examTypeId: null as any, weightPercentage: 100, order: 1 }]
})

const totalMax = computed(() =>
  (examTypeForm.writingMax || 0) + (examTypeForm.listeningMax || 0) +
  (examTypeForm.readingMax || 0) + (examTypeForm.speakingMax || 0)
)
const totalSchemeWeight = computed(() =>
  examSchemeForm.items.reduce((sum, item) => sum + (item.weightPercentage || 0), 0)
)
const examTypeOptions = computed(() => examTypes.value.map(t => ({ label: t.name, value: t.id })))

const examTypeColumns = [
  { title: 'Название', key: 'name' },
  { title: 'Writing', key: 'writingMax', render: (r: any) => `${r.writingMax} б.` },
  { title: 'Listening', key: 'listeningMax', render: (r: any) => `${r.listeningMax} б.` },
  { title: 'Reading', key: 'readingMax', render: (r: any) => `${r.readingMax} б.` },
  { title: 'Speaking', key: 'speakingMax', render: (r: any) => `${r.speakingMax} б.` },
  {
    title: 'Макс. итого',
    key: 'totalMax',
    render: (r: any) => `${(r.writingMax||0)+(r.listeningMax||0)+(r.readingMax||0)+(r.speakingMax||0)} б.`
  },
  {
    title: '',
    key: 'actions',
    width: 80,
    render: (row: any) => h(NButton, { size: 'small', quaternary: true, type: 'error', onClick: () => handleDeleteExamType(row.id) },
      { icon: () => h(NIcon, null, { default: () => h(DeleteIcon) }) })
  }
]

const examSchemeColumns = [
  { title: 'Название', key: 'name' },
  {
    title: 'Экзамены',
    key: 'items',
    render(row: any) {
      return h('div', null, row.items.map((item: any) =>
        h('div', { class: 'text-xs mb-1' }, `${item.examTypeName}: ${item.weightPercentage}%`)
      ))
    }
  },
  {
    title: '',
    key: 'actions',
    width: 80,
    render: (row: any) => h(NButton, { size: 'small', quaternary: true, type: 'error', onClick: () => handleDeleteExamScheme(row.id) },
      { icon: () => h(NIcon, null, { default: () => h(DeleteIcon) }) })
  }
]

const loadData = async () => {
  loading.value = true
  try {
    const [types, schemes] = await Promise.all([groupsApi.getExamTypes(), groupsApi.getExamSchemes()])
    examTypes.value = types
    examSchemes.value = schemes
  } catch (e) {
    message.error('Ошибка загрузки данных')
  } finally {
    loading.value = false
  }
}

const handleSaveExamType = async () => {
  saving.value = true
  try {
    await groupsApi.saveExamType(examTypeForm)
    message.success('Тип экзамена сохранен')
    showExamTypeModal.value = false
    Object.assign(examTypeForm, { name: '', writingMax: 25, listeningMax: 25, readingMax: 25, speakingMax: 25 })
    await loadData()
  } catch (e) {
    message.error('Ошибка при сохранении')
  } finally {
    saving.value = false
  }
}

const handleSaveExamScheme = async () => {
  saving.value = true
  try {
    await groupsApi.saveExamScheme(examSchemeForm)
    message.success('Схема сохранена')
    showExamSchemeModal.value = false
    await loadData()
  } catch (e) {
    message.error('Ошибка при сохранении')
  } finally {
    saving.value = false
  }
}

const handleDeleteExamType = async (id: number) => {
  if (!confirm('Удалить тип экзамена?')) return
  try { await groupsApi.deleteExamType(id); message.success('Удалено'); await loadData() }
  catch (e) { message.error('Ошибка при удалении') }
}

const handleDeleteExamScheme = async (id: number) => {
  if (!confirm('Удалить схему?')) return
  try { await groupsApi.deleteExamScheme(id); message.success('Удалено'); await loadData() }
  catch (e) { message.error('Ошибка при удалении') }
}

onMounted(loadData)
</script>

<style scoped>
.cabinet-page { padding-bottom: 40px; }
.page-header { margin-bottom: 32px; }
.page-header__title { margin: 0 0 8px; font-weight: 700; }
.page-header__subtitle { margin: 0; color: var(--n-text-color-3); }
.cabinet-card { border-radius: 16px; }
</style>
