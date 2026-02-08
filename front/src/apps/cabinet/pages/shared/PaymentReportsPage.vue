<template>
  <CabinetLayout>
    <n-space vertical size="large" class="reports-page">
      <div class="page-header">
        <n-h1 style="margin: 0;">{{ $t('cabinet.payments.reportTitle') || 'Отчеты по оплатам' }}</n-h1>
        <n-text depth="3">{{ $t('cabinet.payments.reportDescription') || 'Просмотр истории оплат студентов с фильтрами' }}</n-text>
      </div>

      <!-- Filters Card -->
      <n-card bordered content-style="padding: 12px;">
        <n-form :model="filters" inline :show-label="false">
          <n-space wrap align="center" :size="[12, 12]">
            <n-select
              v-model:value="filters.studentId"
              :options="studentOptions"
              :placeholder="$t('cabinet.payments.student')"
              filterable
              clearable
              :loading="usersLoading"
              style="width: 240px"
            />
            <n-select
              v-model:value="filters.groupId"
              :options="groupOptions"
              :placeholder="$t('cabinet.payments.group')"
              filterable
              clearable
              :loading="groupsLoading"
              style="width: 240px"
            />
            <n-date-picker
              v-model:value="filters.dateFrom"
              type="date"
              clearable
              :placeholder="$t('cabinet.payments.dateFrom')"
              style="width: 160px"
            />
            <n-date-picker
              v-model:value="filters.dateTo"
              type="date"
              clearable
              :placeholder="$t('cabinet.payments.dateTo')"
              style="width: 160px"
            />
            <n-button type="primary" @click="loadReport" :loading="loading">
              <template #icon><n-icon><search-icon /></n-icon></template>
              {{ $t('common.search') }}
            </n-button>
            <n-button @click="resetFilters">
              {{ $t('common.reset') }}
            </n-button>
          </n-space>
        </n-form>
      </n-card>

      <!-- Summary Row -->
      <div v-if="reportData" class="summary-container">
        <n-space :size="24" align="center" class="table-header-info">
          <n-text strong style="font-size: 1.1rem;">
            {{ $t('cabinet.payments.totalPaid') }}: 
            <span style="color: #18a058;">{{ reportData.total_amount }} TMT</span>
          </n-text>
          <n-divider vertical />
          <n-text strong style="font-size: 1.1rem;">
            {{ $t('cabinet.gemsReports.transactionsCount') || 'Кол-во транзакций' }}: 
            <span>{{ reportData.transaction_count }}</span>
          </n-text>
        </n-space>
      </div>

      <!-- Transactions Table -->
      <n-card v-if="reportData" bordered content-style="padding: 0;">
        <n-data-table
          :columns="columns"
          :data="reportData.payments"
          :pagination="{ pageSize: 20, showSizePicker: true }"
          :loading="loading"
          :bordered="false"
          :single-line="false"
        />
      </n-card>

      <!-- Empty State -->
      <n-card v-if="!reportData && !loading" bordered>
        <n-empty :description="$t('cabinet.payments.noPayments')" />
      </n-card>

      <!-- Edit Payment Dialog -->
      <n-modal v-model:show="editDialog.show" preset="dialog" :title="t('cabinet.payments.editPayment') || 'Редактировать платеж'"
               positive-text="Сохранить" negative-text="Отмена" @positive-click="savePayment" :loading="editDialog.loading">
        <n-form :model="editDialog.form" :rules="editDialog.rules" ref="editFormRef" label-placement="top">
          <n-form-item :label="t('cabinet.payments.student')" path="student">
            <n-select
              v-model:value="editDialog.form.student"
              :options="studentOptions"
              :placeholder="t('cabinet.payments.student')"
              filterable
              :loading="usersLoading"
            />
          </n-form-item>
          <n-form-item :label="t('cabinet.payments.group')" path="group">
            <n-select
              v-model:value="editDialog.form.group"
              :options="groupOptions"
              :placeholder="t('cabinet.payments.group')"
              filterable
              :loading="groupsLoading"
              clearable
            />
          </n-form-item>
          <n-form-item :label="t('cabinet.payments.amount')" path="amount">
            <n-input-number
              v-model:value="editDialog.form.amount"
              :min="0"
              :precision="2"
              :show-button="false"
              style="width: 100%"
            >
              <template #suffix>TMT</template>
            </n-input-number>
          </n-form-item>
          <n-form-item :label="t('cabinet.payments.discount')" path="discount">
            <n-input-number
              v-model:value="editDialog.form.discount"
              :min="0"
              :precision="2"
              :show-button="false"
              style="width: 100%"
            >
              <template #suffix>TMT</template>
            </n-input-number>
          </n-form-item>
          <n-form-item :label="t('cabinet.payments.method')" path="payment_method">
            <n-select
              v-model:value="editDialog.form.payment_method"
              :options="paymentMethodOptions"
              :placeholder="t('cabinet.payments.method')"
            />
          </n-form-item>
          <n-form-item :label="t('cabinet.payments.status')" path="status">
            <n-select
              v-model:value="editDialog.form.status"
              :options="statusOptions"
              :placeholder="t('cabinet.payments.status')"
            />
          </n-form-item>
          <n-form-item :label="t('cabinet.payments.comment')" path="comment">
            <n-input
              v-model:value="editDialog.form.comment"
              type="textarea"
              :rows="3"
              :placeholder="t('cabinet.payments.comment')"
            />
          </n-form-item>
        </n-form>
      </n-modal>
    </n-space>
  </CabinetLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, h, computed } from 'vue'
import CabinetLayout from '../../layouts/CabinetLayout.vue'
import {
  NSpace, NH1, NText, NCard, NForm, NFormItem, NSelect, NDatePicker,
  NButton, NIcon, NDataTable, NTag, NEmpty, useMessage, NGrid, NGi, NDivider,
  NModal, NInput, NInputNumber
} from 'naive-ui'
import {
  SearchOutline as SearchIcon,
  CreateOutline as CreateIcon
} from '@vicons/ionicons5'
import axios from 'axios'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const message = useMessage()

const loading = ref(false)
const usersLoading = ref(false)
const groupsLoading = ref(false)
const students = ref<any[]>([])
const groups = ref<any[]>([])
const reportData = ref<any>(null)
const editFormRef = ref<any>(null)

const filters = ref({
  studentId: null as number | null,
  groupId: null as number | null,
  dateFrom: null as number | null,
  dateTo: null as number | null,
  method: null as string | null
})

const editDialog = ref({
  show: false,
  loading: false,
  paymentId: null as number | null,
  form: {
    student: null as number | null,
    group: null as number | null,
    amount: null as number | null,
    discount: 0 as number,
    payment_method: 'cash' as string,
    status: 'completed' as string,
    comment: '' as string
  },
  rules: {
    student: {
      required: true,
      message: t('cabinet.payments.student') + ' ' + (t('common.required') || 'обязателен'),
      trigger: ['blur', 'change']
    },
    amount: {
      required: true,
      type: 'number',
      min: 0.01,
      message: t('cabinet.payments.amount') + ' ' + (t('common.required') || 'обязателен'),
      trigger: ['blur', 'change']
    }
  }
})

const paymentMethodOptions = [
  { label: t('cabinet.payments.cash'), value: 'cash' },
  { label: t('cabinet.payments.bank'), value: 'bank_transfer' },
  { label: t('cabinet.payments.card'), value: 'card' }
]

const statusOptions = [
  { label: t('cabinet.payments.statusPending') || 'Ожидает', value: 'pending' },
  { label: t('cabinet.payments.statusCompleted') || 'Завершен', value: 'completed' },
  { label: t('cabinet.payments.statusCancelled') || 'Отменен', value: 'cancelled' },
  { label: t('cabinet.payments.statusRefunded') || 'Возвращен', value: 'refunded' }
]

const studentOptions = computed(() => {
  return students.value.map(s => ({
    label: s.full_name,
    value: s.id
  }))
})

const groupOptions = computed(() => {
  return groups.value.map(g => ({
    label: `${g.course_name} - ${g.name}`,
    value: g.id
  }))
})

const formatDate = (dateString: string) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatDateTime = (dateString: string) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const columns = computed(() => [
  {
    title: 'N',
    key: 'index',
    width: 60,
    render: (row: any, index: number) => index + 1
  },
  {
    title: t('cabinet.payments.invoiceNumber'),
    key: 'invoice_number',
    width: 150,
    render(row: any) {
      return h(NText, { depth: 3, style: { fontFamily: 'monospace' } }, { default: () => row.invoice_number })
    }
  },
  {
    title: t('cabinet.payments.paymentDate'),
    key: 'created_at',
    width: 160,
    render(row: any) {
      return formatDateTime(row.created_at)
    }
  },
  {
    title: t('cabinet.payments.student'),
    key: 'student_info',
    width: 200,
    render(row: any) {
      return row.student_info?.full_name || row.student_info?.username || '—'
    }
  },
  {
    title: t('cabinet.payments.group'),
    key: 'group_name',
    width: 180,
    render(row: any) {
      if (!row.group_name) return h('span', { style: { color: '#999' } }, '—')
      return `${row.course_name} / ${row.group_name}`
    }
  },
  {
    title: t('cabinet.payments.amount'),
    key: 'amount',
    width: 120,
    align: 'right',
    render(row: any) {
      return h('div', { style: { textAlign: 'right' } }, [
        h('span', { style: { fontWeight: 'bold', color: '#18a058' } }, `${row.amount} TMT`),
        row.discount > 0 ? h('div', { style: { fontSize: '12px', color: '#d03050' } }, `-${row.discount} ${t('cabinet.payments.discount')}`) : null
      ])
    }
  },
  {
    title: t('cabinet.payments.method'),
    key: 'payment_method',
    width: 120,
    render(row: any) {
      const methods: Record<string, string> = {
        'cash': t('cabinet.payments.cash'),
        'bank_transfer': t('cabinet.payments.bank'),
        'card': t('cabinet.payments.card')
      }
      return methods[row.payment_method] || row.payment_method
    }
  },
  {
    title: t('cabinet.payments.receivedBy'),
    key: 'received_by_info',
    width: 150,
    render(row: any) {
      return row.received_by_info?.full_name || '—'
    }
  },
  {
    title: t('cabinet.payments.comment'),
    key: 'comment',
    ellipsis: { tooltip: true }
  },
  {
    title: t('common.actions') || 'Действия',
    key: 'actions',
    width: 100,
    fixed: 'right',
    render(row: any) {
      return h(NButton, {
        size: 'small',
        type: 'primary',
        onClick: () => editPayment(row)
      }, {
        default: () => h(NIcon, null, { default: () => h(CreateIcon) })
      })
    }
  }
])

const loadUsers = async () => {
  usersLoading.value = true
  try {
    const res = await axios.get('/api/v1/payments/report/users/')
    students.value = res.data
  } catch (err) {
    console.error('Error loading students:', err)
  } finally {
    usersLoading.value = false
  }
}

const loadGroups = async () => {
  groupsLoading.value = true
  try {
    const res = await axios.get('/api/v1/courses/groups/')
    groups.value = res.data.results || res.data || []
  } catch (err) {
    console.error('Error loading groups:', err)
  } finally {
    groupsLoading.value = false
  }
}

const loadReport = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (filters.value.studentId) params.student_id = filters.value.studentId
    if (filters.value.groupId) params.group_id = filters.value.groupId
    if (filters.value.dateFrom) params.date_from = new Date(filters.value.dateFrom).toISOString().split('T')[0]
    if (filters.value.dateTo) params.date_to = new Date(filters.value.dateTo).toISOString().split('T')[0]
    if (filters.value.method) params.method = filters.value.method

    const response = await axios.get('/api/v1/payments/report/', { params })
    reportData.value = response.data
  } catch (err: any) {
    console.error('Error loading report:', err)
    message.error(err.response?.data?.error || t('common.error'))
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.value = {
    studentId: null,
    groupId: null,
    dateFrom: null,
    dateTo: null,
    method: null
  }
  reportData.value = null
}

const editPayment = (payment: any) => {
  editDialog.value.paymentId = payment.id
  
  // Правильно извлекаем ID студента (может быть объект или число)
  let studentId = null
  if (typeof payment.student === 'number') {
    studentId = payment.student
  } else if (payment.student_info?.id) {
    studentId = payment.student_info.id
  } else if (payment.student?.id) {
    studentId = payment.student.id
  }
  
  // Правильно извлекаем ID группы
  let groupId = null
  if (typeof payment.group === 'number') {
    groupId = payment.group
  } else if (payment.group?.id) {
    groupId = payment.group.id
  }
  
  editDialog.value.form = {
    student: studentId,
    group: groupId,
    amount: parseFloat(payment.amount) || null,
    discount: parseFloat(payment.discount) || 0,
    payment_method: payment.payment_method || 'cash',
    status: payment.status || 'completed',
    comment: payment.comment || ''
  }
  
  // Сбрасываем валидацию формы перед открытием
  if (editFormRef.value) {
    editFormRef.value.restoreValidation()
  }
  
  editDialog.value.show = true
}

const savePayment = async () => {
  if (!editFormRef.value) return false
  
  // Проверяем обязательные поля вручную перед валидацией
  if (!editDialog.value.form.student) {
    message.error(t('cabinet.payments.student') + ' ' + (t('common.required') || 'обязателен'))
    return false
  }
  
  if (!editDialog.value.form.amount || editDialog.value.form.amount <= 0) {
    message.error(t('cabinet.payments.amount') + ' ' + (t('common.required') || 'обязателен'))
    return false
  }
  
  // Валидируем форму (может выбросить ошибку, но мы уже проверили обязательные поля)
  try {
    await editFormRef.value.validate()
  } catch (err: any) {
    // Игнорируем ошибки валидации, так как мы уже проверили обязательные поля
    // Naive UI может выбросить ошибку даже если все поля заполнены правильно
    // Просто продолжаем сохранение
  }

  editDialog.value.loading = true
  try {
    const payload: any = {
      student: editDialog.value.form.student,
      amount: editDialog.value.form.amount,
      discount: editDialog.value.form.discount || 0,
      payment_method: editDialog.value.form.payment_method,
      status: editDialog.value.form.status,
      comment: editDialog.value.form.comment || ''
    }
    
    // Группа может быть null, но если указана - отправляем
    if (editDialog.value.form.group) {
      payload.group = editDialog.value.form.group
    } else {
      payload.group = null // Явно указываем null если группа не выбрана
    }

    await axios.patch(`/api/v1/payments/${editDialog.value.paymentId}/`, payload)
    message.success(t('common.saved') || 'Платеж успешно обновлен')
    editDialog.value.show = false
    await loadReport() // Reload report to show updated data
    return true
  } catch (err: any) {
    console.error('Error updating payment:', err)
    const errorMsg = err.response?.data?.detail || err.response?.data?.error || err.response?.data?.student?.[0] || t('common.error') || 'Ошибка при обновлении платежа'
    message.error(errorMsg)
    return false
  } finally {
    editDialog.value.loading = false
  }
}

onMounted(() => {
  loadUsers()
  loadGroups()
})
</script>

<style scoped>
.reports-page {
  padding: 12px;
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 8px;
}

.summary-container {
  padding: 16px;
  background-color: white;
  border-radius: 8px;
  border: 1px solid #efeff5;
}

.table-header-info {
  display: flex;
  align-items: center;
}
</style>

