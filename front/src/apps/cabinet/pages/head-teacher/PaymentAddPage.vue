<template>
  <CabinetLayout>
    <n-space vertical size="large" class="payment-add-page">
      <div class="page-header">
        <n-h1 style="margin: 0;">{{ $t('cabinet.payments.addPayment') }}</n-h1>
        <n-text depth="3">{{ $t('cabinet.payments.description') }}</n-text>
      </div>

      <n-card bordered>
        <n-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-placement="top"
          size="large"
        >
          <n-grid cols="1 m:2" :x-gap="24">
            <n-gi>
              <n-form-item :label="$t('cabinet.payments.student')" path="student">
                <n-space vertical :size="8" style="width: 100%">
                <n-select
                  v-model:value="formData.student"
                  :options="studentOptions"
                  :placeholder="$t('cabinet.payments.selectStudent')"
                  filterable
                    :filter="filterStudent"
                  @update:value="handleStudentChange"
                    @focus="loadStudents(true)"
                  :loading="studentsLoading"
                    clearable
                />
                  <n-button 
                    text 
                    type="primary" 
                    size="small" 
                    @click="loadStudents(true)"
                    :loading="studentsLoading"
                    style="padding: 0; height: auto;"
                  >
                    <template #icon>
                      <n-icon><RefreshIcon /></n-icon>
                    </template>
                    {{ $t('common.refresh') || 'Обновить список' }}
                  </n-button>
                </n-space>
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item :label="$t('cabinet.payments.group')" path="group">
                <n-select
                  v-model:value="formData.group"
                  :options="groupOptions"
                  :placeholder="$t('cabinet.payments.selectGroup')"
                  clearable
                  :disabled="!formData.student"
                />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item :label="$t('cabinet.payments.amount')" path="amount">
                <n-input-number
                  v-model:value="formData.amount"
                  :min="0.01"
                  :precision="2"
                  style="width: 100%"
                  placeholder="0.00"
                >
                  <template #suffix>TMT</template>
                </n-input-number>
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item :label="$t('cabinet.payments.discount')" path="discount">
                <n-input-number
                  v-model:value="formData.discount"
                  :min="0"
                  :precision="2"
                  style="width: 100%"
                  placeholder="0.00"
                >
                  <template #suffix>TMT</template>
                </n-input-number>
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item :label="$t('cabinet.payments.method')" path="payment_method">
                <n-select
                  v-model:value="formData.payment_method"
                  :options="methodOptions"
                />
              </n-form-item>
            </n-gi>
            <n-gi span="2">
              <n-form-item :label="$t('cabinet.payments.comment')" path="comment">
                <n-input
                  v-model:value="formData.comment"
                  type="textarea"
                  :placeholder="$t('cabinet.payments.comment')"
                  :autosize="{ minRows: 2, maxRows: 4 }"
                />
              </n-form-item>
            </n-gi>
          </n-grid>

          <n-space justify="end">
            <n-button @click="$router.back()">{{ $t('common.cancel') }}</n-button>
            <n-button 
              v-if="lastCreatedPaymentId" 
              type="success" 
              ghost 
              @click="downloadReceipt(lastCreatedPaymentId)"
            >
              {{ $t('cabinet.payments.downloadReceipt') }}
            </n-button>
            <n-button type="primary" :loading="submitting" @click="handleSubmit">
              {{ $t('cabinet.payments.addPayment') }}
            </n-button>
          </n-space>
        </n-form>
      </n-card>
    </n-space>
  </CabinetLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import CabinetLayout from '../../layouts/CabinetLayout.vue'
import { 
  NSpace, NH1, NText, NCard, NForm, NFormItem, NGrid, NGi, 
  NSelect, NInputNumber, NInput, NButton, useMessage 
} from 'naive-ui'
import axios from 'axios'
import { RefreshOutline as RefreshIcon } from '@vicons/ionicons5'
import { useAdminStudents } from '@/composables/useAdminApi'

const router = useRouter()
const { t } = useI18n()
const message = useMessage()
const { fetchStudents: fetchAdminStudents } = useAdminStudents()

const formRef = ref<any>(null)
const submitting = ref(false)
const studentsLoading = ref(false)
const students = ref<any[]>([])
const selectedStudentGroups = ref<any[]>([])

const formData = ref({
  student: null as number | null,
  group: null as number | null,
  amount: 0,
  discount: 0,
  payment_method: 'cash',
  comment: ''
})

const lastCreatedPaymentId = ref<number | null>(null)

const rules = {
  student: { required: true, type: 'number', message: t('cabinet.payments.studentRequired'), trigger: 'change' },
  amount: { required: true, type: 'number', min: 0.01, message: t('cabinet.payments.amountRequired'), trigger: 'blur' }
}

const studentOptions = computed(() => {
  return students.value.map(s => ({
    label: `${s.full_name || s.username} (@${s.username})`,
    value: s.id,
    // Добавляем поисковые поля для лучшей фильтрации
    searchText: `${s.full_name || ''} ${s.username || ''} ${s.first_name || ''} ${s.last_name || ''}`.toLowerCase()
  }))
})

// Улучшенная функция фильтрации для поиска по имени, фамилии и username
const filterStudent = (pattern: string, option: any) => {
  if (!pattern) return true
  const searchPattern = pattern.toLowerCase()
  const searchText = option.searchText || ''
  
  // Ищем в полном имени, username, имени и фамилии
  return searchText.includes(searchPattern) ||
         option.label.toLowerCase().includes(searchPattern)
}

const groupOptions = computed(() => {
  return selectedStudentGroups.value.map(g => ({
    label: `${g.course_name} - ${g.name}`,
    value: g.id
  }))
})

const methodOptions = [
  { label: t('cabinet.payments.cash'), value: 'cash' },
  { label: t('cabinet.payments.bank'), value: 'bank_transfer' },
  { label: t('cabinet.payments.card'), value: 'card' }
]

const loadStudents = async (forceRefresh = false) => {
  // Если не принудительное обновление и студенты уже загружены, не загружаем снова
  if (!forceRefresh && students.value.length > 0) {
    return
  }
  
  studentsLoading.value = true
  try {
    // Используем тот же endpoint что и в StudentsListPage - админский endpoint
    // Он загружает всех студентов с page_size=1000
    const response = await fetchAdminStudents({ page_size: 1000 })
    
    // Handle both paginated and non-paginated responses
    let allStudents = response.results || (Array.isArray(response) ? response : [])
    
    // Если есть пагинация и есть еще страницы, загружаем их все
    if (response.count && response.count > allStudents.length) {
      const pageSize = 1000
      const totalPages = Math.ceil(response.count / pageSize)
      const additionalRequests = []
      
      for (let page = 2; page <= totalPages; page++) {
        additionalRequests.push(
          fetchAdminStudents({ page_size: pageSize, page })
        )
      }
      
      if (additionalRequests.length > 0) {
        const additionalResponses = await Promise.all(additionalRequests)
        additionalResponses.forEach(response => {
          const additionalStudents = response.results || (Array.isArray(response) ? response : [])
          allStudents = [...allStudents, ...additionalStudents]
        })
      }
    }
    
    // Обновляем список студентов
    students.value = allStudents
    
    console.log(`Loaded ${students.value.length} students`)
  } catch (err) {
    console.error('Error loading students:', err)
    message.error(t('cabinet.gemsReports.errorLoadingUsers') || 'Ошибка загрузки студентов')
  } finally {
    studentsLoading.value = false
  }
}

const handleStudentChange = async (studentId: number) => {
  formData.value.group = null
  selectedStudentGroups.value = []
  
  if (!studentId) return
  
  try {
    // We can get student's groups from their profile if available, 
    // or through a separate API call. For now, let's assume we can fetch 
    // groups for a student via an admin endpoint.
    const res = await axios.get(`/api/v1/courses/groups/?student_id=${studentId}`)
    selectedStudentGroups.value = res.data.results || res.data || []
  } catch (err) {
    console.error('Error loading student groups:', err)
  }
}

const downloadReceipt = async (paymentId: number) => {
  try {
    const response = await axios.get(`/api/v1/payments/${paymentId}/download_receipt/`, {
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `receipt_${paymentId}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (err) {
    console.error('Error downloading receipt:', err)
    message.error('Failed to download receipt')
  }
}

const handleSubmit = async () => {
  formRef.value?.validate(async (errors: any) => {
    if (errors) return

    submitting.value = true
    try {
      const res = await axios.post('/api/v1/payments/', {
        student: formData.value.student,
        group: formData.value.group,
        amount: formData.value.amount,
        discount: formData.value.discount,
        payment_method: formData.value.payment_method,
        comment: formData.value.comment,
        status: 'completed'
      })
      
      lastCreatedPaymentId.value = res.data.id
      message.success(t('cabinet.payments.successCreate'))
      // Instead of back(), we might want to stay here to download receipt
      // but let's follow the user's preference if specified. 
      // User said "add button to download receipt".
    } catch (err: any) {
      console.error('Error recording payment:', err)
      message.error(err.response?.data?.error || t('common.error'))
    } finally {
      submitting.value = false
    }
  })
}

onMounted(loadStudents)
</script>

<style scoped>
.payment-add-page {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 12px;
}
</style>

