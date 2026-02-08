<template>
  <CabinetLayout>
    <n-space vertical size="large" class="exam-settings-page">
      <div class="page-header">
        <n-h1 style="margin: 0;">{{ $t('cabinet.examSettings.title') }}</n-h1>
        <n-text depth="3">{{ $t('cabinet.examSettings.subtitle') }}</n-text>
      </div>

      <n-tabs type="line" animated>
        <!-- Exam Types Tab -->
        <n-tab-pane name="exam-types" :tab="$t('cabinet.examSettings.examTypes')">
          <n-space vertical>
            <div class="flex justify-between items-center">
              <n-h2 style="margin: 0;">{{ $t('cabinet.examSettings.examTypesList') }}</n-h2>
              <n-button type="primary" @click="showExamTypeModal = true">
                <template #icon>
                  <n-icon><add-icon /></n-icon>
                </template>
                {{ $t('common.add') }}
              </n-button>
            </div>

            <n-data-table
              :columns="examTypeColumns"
              :data="examTypes"
              :loading="loading"
              bordered
            />
          </n-space>
        </n-tab-pane>

        <!-- Exam Schemes Tab -->
        <n-tab-pane name="exam-schemes" :tab="$t('cabinet.examSettings.examSchemes')">
          <n-space vertical>
            <div class="flex justify-between items-center">
              <n-h2 style="margin: 0;">{{ $t('cabinet.examSettings.examSchemesList') }}</n-h2>
              <n-button type="primary" @click="showExamSchemeModal = true">
                <template #icon>
                  <n-icon><add-icon /></n-icon>
                </template>
                {{ $t('common.add') }}
              </n-button>
            </div>

            <n-data-table
              :columns="examSchemeColumns"
              :data="examSchemes"
              :loading="loading"
              bordered
            />
          </n-space>
        </n-tab-pane>
      </n-tabs>

      <!-- Exam Type Modal -->
      <n-modal
        v-model:show="showExamTypeModal"
        preset="card"
        style="width: 500px"
        :title="editingExamType ? $t('cabinet.examSettings.editExamType') : $t('cabinet.examSettings.addExamType')"
      >
        <n-form
          ref="examTypeFormRef"
          :model="examTypeForm"
          :rules="examTypeRules"
          label-placement="top"
        >
          <n-form-item :label="$t('common.name')" path="name">
            <n-input v-model:value="examTypeForm.name" :placeholder="$t('common.name')" />
          </n-form-item>

          <n-text strong class="block q-mb-md">{{ $t('cabinet.examSettings.componentWeights') }} (Total: 100)</n-text>
          
          <n-grid :cols="2" :x-gap="12">
            <n-gi>
              <n-form-item :label="$t('cabinet.grades.writing')" path="writing_weight">
                <n-input-number v-model:value="examTypeForm.writing_weight" :min="0" :max="100" class="full-width" />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item :label="$t('cabinet.grades.listening')" path="listening_weight">
                <n-input-number v-model:value="examTypeForm.listening_weight" :min="0" :max="100" class="full-width" />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item :label="$t('cabinet.grades.reading')" path="reading_weight">
                <n-input-number v-model:value="examTypeForm.reading_weight" :min="0" :max="100" class="full-width" />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item :label="$t('cabinet.grades.speaking')" path="speaking_weight">
                <n-input-number v-model:value="examTypeForm.speaking_weight" :min="0" :max="100" class="full-width" />
              </n-form-item>
            </n-gi>
          </n-grid>

          <div 
            class="text-center q-mt-md" 
            :style="{ color: totalWeight === 100 ? '#18a058' : '#d03050' }"
          >
            {{ $t('cabinet.examSettings.total') }}: {{ totalWeight }} / 100
          </div>
        </n-form>

        <template #footer>
          <n-space justify="end">
            <n-button @click="showExamTypeModal = false">{{ $t('common.cancel') }}</n-button>
            <n-button 
              type="primary" 
              :disabled="totalWeight !== 100" 
              :loading="saving" 
              @click="saveExamType"
            >
              {{ $t('common.save') }}
            </n-button>
          </n-space>
        </template>
      </n-modal>

      <!-- Exam Scheme Modal -->
      <n-modal
        v-model:show="showExamSchemeModal"
        preset="card"
        style="width: 800px"
        :title="editingExamScheme ? $t('cabinet.examSettings.editExamScheme') : $t('cabinet.examSettings.addExamScheme')"
      >
        <n-form
          ref="examSchemeFormRef"
          :model="examSchemeForm"
          :rules="examSchemeRules"
          label-placement="top"
        >
          <n-form-item :label="$t('cabinet.examSettings.schemeName')" path="name">
            <n-input v-model:value="examSchemeForm.name" :placeholder="$t('cabinet.examSettings.schemeName')" />
          </n-form-item>

          <n-h3>{{ $t('cabinet.examSettings.examsInScheme') }}</n-h3>
          
          <n-space vertical size="medium">
            <div v-for="(item, index) in examSchemeForm.items" :key="index" class="exam-item-card">
              <n-grid :cols="12" :x-gap="12" items-center>
                <n-gi span="5">
                  <n-form-item :label="$t('cabinet.examSettings.examType')" required>
                    <n-select 
                      v-model:value="item.exam_type" 
                      :options="examTypeOptions" 
                      :placeholder="$t('cabinet.examSettings.selectExamType')"
                    />
                  </n-form-item>
                </n-gi>
                <n-gi span="3">
                  <n-form-item :label="$t('cabinet.examSettings.weightInFinalGrade')" required>
                    <n-input-number v-model:value="item.weight_percentage" :min="1" :max="100" class="full-width">
                      <template #suffix>%</template>
                    </n-input-number>
                  </n-form-item>
                </n-gi>
                <n-gi span="2">
                  <n-form-item :label="$t('admin.forms.order')">
                    <n-input-number v-model:value="item.order" :min="1" class="full-width" />
                  </n-form-item>
                </n-gi>
                <n-gi span="2" class="flex justify-center" style="padding-top: 24px">
                  <n-button circle type="error" ghost @click="removeExamFromScheme(index)" :disabled="examSchemeForm.items.length <= 1">
                    <template #icon>
                      <n-icon><delete-icon /></n-icon>
                    </template>
                  </n-button>
                </n-gi>
              </n-grid>
            </div>
          </n-space>

          <n-button dashed block @click="addExamToScheme" class="q-mt-md">
            <template #icon>
              <n-icon><add-icon /></n-icon>
            </template>
            {{ $t('cabinet.examSettings.addExam') }}
          </n-button>

          <div 
            class="text-center q-mt-lg text-h6" 
            :style="{ color: totalSchemeWeight === 100 ? '#18a058' : '#d03050' }"
          >
            {{ $t('cabinet.examSettings.totalWeight') }}: {{ totalSchemeWeight }}% / 100%
          </div>
        </n-form>

        <template #footer>
          <n-space justify="end">
            <n-button @click="showExamSchemeModal = false">{{ $t('common.cancel') }}</n-button>
            <n-button 
              type="primary" 
              :disabled="totalSchemeWeight !== 100 || !examSchemeForm.name" 
              :loading="saving" 
              @click="saveExamScheme"
            >
              {{ $t('common.save') }}
            </n-button>
          </n-space>
        </template>
      </n-modal>
    </n-space>
  </CabinetLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue'
import { 
  NTabs, NTabPane, NDataTable, NButton, NIcon, NModal, NForm, 
  NFormItem, NInput, NInputNumber, NSelect, NSpace, NH1, NH2, NH3, NText, NGrid, NGi, useMessage, useDialog
} from 'naive-ui'
import { 
  AddOutline as AddIcon, 
  TrashOutline as DeleteIcon,
  PencilOutline as EditIcon
} from '@vicons/ionicons5'
import { useI18n } from 'vue-i18n'
import api from '@/services/api'
import CabinetLayout from '../../layouts/CabinetLayout.vue'

const { t } = useI18n()
const message = useMessage()
const dialog = useDialog()

const loading = ref(false)
const saving = ref(false)

const examTypeRules = {
  name: { required: true, message: t('common.name'), trigger: 'blur' }
}

const examSchemeRules = {
  name: { required: true, message: t('cabinet.examSettings.schemeName'), trigger: 'blur' }
}

// Exam Types
const examTypes = ref<any[]>([])
const showExamTypeModal = ref(false)
const editingExamType = ref<any>(null)
const examTypeForm = reactive({
  name: '',
  writing_weight: 25,
  listening_weight: 25,
  reading_weight: 25,
  speaking_weight: 25
})

const totalWeight = computed(() => {
  return (examTypeForm.writing_weight || 0) + 
         (examTypeForm.listening_weight || 0) + 
         (examTypeForm.reading_weight || 0) + 
         (examTypeForm.speaking_weight || 0)
})

const examTypeColumns = [
  { title: t('common.name'), key: 'name' },
  { title: t('cabinet.grades.writing'), key: 'writing_weight' },
  { title: t('cabinet.grades.listening'), key: 'listening_weight' },
  { title: t('cabinet.grades.reading'), key: 'reading_weight' },
  { title: t('cabinet.grades.speaking'), key: 'speaking_weight' },
  {
    title: t('common.actions'),
    key: 'actions',
    render(row: any) {
      return h(NSpace, null, {
        default: () => [
          h(NButton, { 
            size: 'small', 
            type: 'info', 
            ghost: true,
            onClick: () => editExamType(row) 
          }, { icon: () => h(NIcon, null, { default: () => h(EditIcon) }) }),
          h(NButton, { 
            size: 'small', 
            type: 'error', 
            ghost: true,
            onClick: () => deleteExamType(row) 
          }, { icon: () => h(NIcon, null, { default: () => h(DeleteIcon) }) })
        ]
      })
    }
  }
]

// Exam Schemes
const examSchemes = ref<any[]>([])
const showExamSchemeModal = ref(false)
const editingExamScheme = ref<any>(null)
const examSchemeForm = reactive({
  name: '',
  items: [
    { exam_type: null as number | null, weight_percentage: 100, order: 1 }
  ]
})

const totalSchemeWeight = computed(() => {
  return examSchemeForm.items.reduce((sum, item) => sum + (item.weight_percentage || 0), 0)
})

const examSchemeColumns = [
  { title: t('common.name'), key: 'name' },
  { 
    title: t('cabinet.examSettings.exams'), 
    key: 'exams',
    render(row: any) {
      return h('div', null, row.items.map((item: any) => 
        h('div', { style: 'margin-bottom: 4px' }, `${item.exam_type_name} (${item.weight_percentage}%)`)
      ))
    }
  },
  {
    title: t('common.actions'),
    key: 'actions',
    render(row: any) {
      return h(NSpace, null, {
        default: () => [
          h(NButton, { 
            size: 'small', 
            type: 'info', 
            ghost: true,
            onClick: () => editExamScheme(row) 
          }, { icon: () => h(NIcon, null, { default: () => h(EditIcon) }) }),
          h(NButton, { 
            size: 'small', 
            type: 'error', 
            ghost: true,
            onClick: () => deleteExamScheme(row) 
          }, { icon: () => h(NIcon, null, { default: () => h(DeleteIcon) }) })
        ]
      })
    }
  }
]

const examTypeOptions = computed(() => {
  return examTypes.value.map(type => ({
    label: type.name,
    value: type.id
  }))
})

// Methods
const fetchData = async () => {
  loading.value = true
  try {
    const [typesRes, schemesRes] = await Promise.all([
      api.get('/courses/exam-types/'),
      api.get('/courses/exam-schemes/')
    ])
    // Handle paginated or non-paginated responses
    examTypes.value = Array.isArray(typesRes.data) ? typesRes.data : typesRes.data.results || []
    examSchemes.value = Array.isArray(schemesRes.data) ? schemesRes.data : schemesRes.data.results || []
  } catch (error) {
    message.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

// Exam Type Methods
const editExamType = (type: any) => {
  editingExamType.value = type
  examTypeForm.name = type.name
  examTypeForm.writing_weight = type.writing_weight
  examTypeForm.listening_weight = type.listening_weight
  examTypeForm.reading_weight = type.reading_weight
  examTypeForm.speaking_weight = type.speaking_weight
  showExamTypeModal.value = true
}

const saveExamType = async () => {
  saving.value = true
  try {
    if (editingExamType.value) {
      await api.put(`/courses/exam-types/${editingExamType.value.id}/`, examTypeForm)
      message.success(t('admin.actions.saveSuccess'))
    } else {
      await api.post('/courses/exam-types/', examTypeForm)
      message.success(t('admin.actions.saveSuccess'))
    }
    showExamTypeModal.value = false
    editingExamType.value = null
    fetchData()
  } catch (error) {
    message.error(t('common.error'))
  } finally {
    saving.value = false
  }
}

const deleteExamType = (type: any) => {
  dialog.warning({
    title: t('common.delete'),
    content: t('admin.confirmDelete'),
    positiveText: t('common.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await api.delete(`/courses/exam-types/${type.id}/`)
        message.success(t('common.success'))
        fetchData()
      } catch (error) {
        message.error(t('common.error'))
      }
    }
  })
}

// Exam Scheme Methods
const addExamToScheme = () => {
  examSchemeForm.items.push({
    exam_type: null,
    weight_percentage: 0,
    order: examSchemeForm.items.length + 1
  })
}

const removeExamFromScheme = (index: number) => {
  examSchemeForm.items.splice(index, 1)
}

const editExamScheme = (scheme: any) => {
  editingExamScheme.value = scheme
  examSchemeForm.name = scheme.name
  examSchemeForm.items = scheme.items.map((item: any) => ({
    id: item.id,
    exam_type: item.exam_type,
    weight_percentage: item.weight_percentage,
    order: item.order
  }))
  showExamSchemeModal.value = true
}

const saveExamScheme = async () => {
  saving.value = true
  try {
    let schemeId: number
    if (editingExamScheme.value) {
      await api.put(`/courses/exam-schemes/${editingExamScheme.value.id}/`, { name: examSchemeForm.name })
      schemeId = editingExamScheme.value.id
      
      const oldItems = editingExamScheme.value.items
      await Promise.all(oldItems.map((item: any) => api.delete(`/courses/exam-scheme-items/${item.id}/`)))
    } else {
      const res = await api.post('/courses/exam-schemes/', { name: examSchemeForm.name })
      schemeId = res.data.id
    }

    // Create items
    await Promise.all(examSchemeForm.items.map(item => 
      api.post('/courses/exam-scheme-items/', {
        scheme: schemeId,
        exam_type: item.exam_type,
        weight_percentage: item.weight_percentage,
        order: item.order
      })
    ))

    message.success(t('admin.actions.saveSuccess'))
    showExamSchemeModal.value = false
    editingExamScheme.value = null
    fetchData()
  } catch (error) {
    message.error(t('common.error'))
  } finally {
    saving.value = false
  }
}

const deleteExamScheme = (scheme: any) => {
  dialog.warning({
    title: t('common.delete'),
    content: t('admin.confirmDelete'),
    positiveText: t('common.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await api.delete(`/courses/exam-schemes/${scheme.id}/`)
        message.success(t('common.success'))
        fetchData()
      } catch (error) {
        message.error(t('common.error'))
      }
    }
  })
}

onMounted(fetchData)
</script>

<style scoped>
.exam-settings-page {
  max-width: 1200px;
  margin: 0 auto;
}

.exam-item-card {
  background-color: #f9f9f9;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #efeff5;
}

.full-width {
  width: 100%;
}

.q-mb-md { margin-bottom: 16px; }
.q-mb-sm { margin-bottom: 8px; }
.q-mt-md { margin-top: 16px; }
.q-mt-lg { margin-top: 24px; }
.block { display: block; }
.flex { display: flex; }
.justify-between { justify-content: space-between; }
.items-center { align-items: center; }
</style>
