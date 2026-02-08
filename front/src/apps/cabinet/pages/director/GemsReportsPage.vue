<template>
  <CabinetLayout>
    <n-space vertical size="large" class="reports-page">
      <div class="page-header">
        <n-h1 style="margin: 0;">{{ $t('cabinet.gemsReports.title') }}</n-h1>
        <n-text depth="3">{{ $t('cabinet.gemsReports.description') }}</n-text>
      </div>

      <!-- Filters Card -->
      <n-card bordered>
        <n-form :model="filters" inline :label-width="120">
          <n-form-item :label="$t('cabinet.gemsReports.selectUser')">
            <n-select
              v-model:value="filters.userId"
              :options="userOptions"
              :placeholder="$t('cabinet.gemsReports.selectUserPlaceholder')"
              filterable
              clearable
              style="width: 300px"
              :loading="usersLoading"
            />
          </n-form-item>
          <n-form-item :label="$t('cabinet.gemsReports.dateFrom')">
            <n-date-picker
              v-model:value="filters.dateFrom"
              type="date"
              clearable
              style="width: 200px"
            />
          </n-form-item>
          <n-form-item :label="$t('cabinet.gemsReports.dateTo')">
            <n-date-picker
              v-model:value="filters.dateTo"
              type="date"
              clearable
              style="width: 200px"
            />
          </n-form-item>
          <n-form-item>
            <n-button type="primary" @click="loadReport" :loading="loading">
              <template #icon><n-icon><search-icon /></n-icon></template>
              {{ $t('cabinet.gemsReports.search') }}
            </n-button>
            <n-button @click="resetFilters" style="margin-left: 8px;">
              {{ $t('cabinet.gemsReports.reset') }}
            </n-button>
          </n-form-item>
        </n-form>
      </n-card>

      <!-- Transactions Table -->
      <n-card v-if="reportData" bordered>
        <template #header>
          <n-space vertical size="small">
            <div class="table-header-line">
              <n-text strong style="font-size: 1.1rem;">
                {{ $t('cabinet.gemsReports.transactions') }}: {{ reportData.user.full_name }}
              </n-text>
              <n-space :size="16" style="margin-left: auto;">
                <n-text>
                  <span style="font-weight: 500;">{{ $t('cabinet.gemsReports.currentBalance') }}:</span>
                  <span style="margin-left: 4px;">{{ reportData.balance }}💎</span>
                </n-text>
                <n-text>
                  <span style="font-weight: 500;">{{ $t('cabinet.gemsReports.income') }}:</span>
                  <span style="margin-left: 4px; color: #18a058;">{{ reportData.income }}💎</span>
                </n-text>
                <n-text>
                  <span style="font-weight: 500;">{{ $t('cabinet.gemsReports.expenses') }}:</span>
                  <span style="margin-left: 4px; color: #d03050;">{{ reportData.expenses }}💎</span>
                </n-text>
              </n-space>
            </div>
            <n-text depth="3" style="font-size: 0.9rem;">
              {{ $t('cabinet.gemsReports.period') }}: 
              {{ formatDate(reportData.period.from) }} - {{ formatDate(reportData.period.to) }}
            </n-text>
          </n-space>
        </template>

        <n-data-table
          :columns="transactionColumns"
          :data="reportData.transactions"
          :pagination="{ pageSize: 20, showSizePicker: true }"
          :loading="loading"
          :bordered="false"
          :single-line="false"
        />
      </n-card>

      <!-- Empty State -->
      <n-card v-if="!reportData && !loading" bordered>
        <n-empty :description="$t('cabinet.gemsReports.selectUserToView')" />
      </n-card>
    </n-space>
  </CabinetLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, h, computed } from 'vue'
import CabinetLayout from '../../layouts/CabinetLayout.vue'
import {
  NSpace, NH1, NText, NCard, NForm, NFormItem, NSelect, NDatePicker,
  NButton, NIcon, NDataTable, NTag, NEmpty, useMessage
} from 'naive-ui'
import {
  SearchOutline as SearchIcon
} from '@vicons/ionicons5'
import axios from 'axios'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const message = useMessage()

const loading = ref(false)
const usersLoading = ref(false)
const users = ref<any[]>([])
const reportData = ref<any>(null)

const filters = ref({
  userId: null as number | null,
  dateFrom: null as number | null,
  dateTo: null as number | null
})

const userOptions = computed(() => {
  return users.value.map(u => ({
    label: `${u.full_name || u.username} (${getRoleLabel(u.role)})`,
    value: u.id,
    role: u.role
  }))
})

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    'director': t('cabinet.gemsReports.roleDirector'),
    'head_teacher': t('cabinet.gemsReports.roleHeadTeacher'),
    'teacher': t('cabinet.gemsReports.roleTeacher'),
    'student': t('cabinet.gemsReports.roleStudent'),
    'merchant': t('cabinet.gemsReports.roleMerchant')
  }
  return labels[role] || role
}

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

const transactionColumns = computed(() => [
  {
    title: 'N',
    key: 'number',
    width: 60,
    align: 'center',
    render(row: any, index: number) {
      return index + 1
    }
  },
  {
    title: t('cabinet.gemsReports.date'),
    key: 'timestamp',
    width: 160,
    render(row: any) {
      return formatDateTime(row.timestamp)
    }
  },
  {
    title: t('cabinet.gemsReports.type'),
    key: 'transaction_type',
    width: 120,
    render(row: any) {
      const types: Record<string, { label: string, color: string }> = {
        'transfer': { label: t('cabinet.gemsReports.typeTransfer'), color: 'info' },
        'award': { label: t('cabinet.gemsReports.typeAward'), color: 'success' },
        'purchase': { label: t('cabinet.gemsReports.typePurchase'), color: 'warning' },
        'refund': { label: t('cabinet.gemsReports.typeRefund'), color: 'default' },
        'settlement': { label: t('cabinet.gemsReports.typeSettlement'), color: 'default' },
        'system': { label: t('cabinet.gemsReports.typeSystem'), color: 'default' }
      }
      const typeInfo = types[row.transaction_type] || { label: row.transaction_type, color: 'default' }
      return h(NTag, { type: typeInfo.color as any, size: 'small' }, { default: () => typeInfo.label })
    }
  },
  {
    title: t('cabinet.gemsReports.from'),
    key: 'sender_info',
    width: 150,
    render(row: any) {
      if (!row.sender_info) return h('span', { style: { color: '#999' } }, '—')
      return row.sender_info.full_name || row.sender_info.username
    }
  },
  {
    title: t('cabinet.gemsReports.to'),
    key: 'receiver_info',
    width: 150,
    render(row: any) {
      if (!row.receiver_info) return h('span', { style: { color: '#999' } }, '—')
      return row.receiver_info.full_name || row.receiver_info.username
    }
  },
  {
    title: t('cabinet.gemsReports.amount'),
    key: 'amount',
    width: 120,
    align: 'right',
    render(row: any) {
      if (!reportData.value) return h('span', {}, `${row.amount} 💎`)
      const userId = reportData.value.user.id
      // Check if this user was the sender (expense) or receiver (income)
      const isExpense = (row.sender === userId) || (row.sender_info?.id === userId)
      const color = isExpense ? '#d03050' : '#18a058'
      const prefix = isExpense ? '-' : '+'
      return h('span', { style: { color, fontWeight: 'bold' } }, `${prefix}${row.amount} 💎`)
    }
  },
  {
    title: t('cabinet.gemsReports.comment'),
    key: 'comment',
    ellipsis: { tooltip: true }
  }
])

const loadUsers = async () => {
  usersLoading.value = true
  try {
    // Load all users from report endpoint (includes all roles)
    const response = await axios.get('/api/v1/points/report/users/')
    users.value = Array.isArray(response.data) ? response.data : []
  } catch (err) {
    console.error('Error loading users:', err)
    message.error(t('cabinet.gemsReports.errorLoadingUsers'))
  } finally {
    usersLoading.value = false
  }
}

const loadReport = async () => {
  if (!filters.value.userId) {
    message.warning(t('cabinet.gemsReports.selectUserFirst'))
    return
  }

  loading.value = true
  try {
    const params: any = {
      user_id: filters.value.userId
    }

    if (filters.value.dateFrom) {
      params.date_from = new Date(filters.value.dateFrom).toISOString().split('T')[0]
    }

    if (filters.value.dateTo) {
      params.date_to = new Date(filters.value.dateTo).toISOString().split('T')[0]
    }

    const response = await axios.get('/api/v1/points/report/', { params })
    reportData.value = response.data
  } catch (err: any) {
    console.error('Error loading report:', err)
    message.error(err.response?.data?.error || t('cabinet.gemsReports.errorLoadingReport'))
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.value = {
    userId: null,
    dateFrom: null,
    dateTo: null
  }
  reportData.value = null
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.reports-page {
  padding: 12px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 8px;
}

.table-header-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

@media (max-width: 1200px) {
  .table-header-line {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .table-header-line .n-space {
    margin-left: 0 !important;
    width: 100%;
  }
}
</style>

