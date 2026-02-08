<template>
  <CabinetLayout>
    <div class="transactions-page">
      <n-space vertical size="large">
        <div class="header">
          <n-h1 style="margin: 0;">История транзакций</n-h1>
          <n-text depth="3">Список всех продаж и перемещений кристаллов</n-text>
        </div>

        <!-- Filters and Summary -->
        <n-grid :cols="24" :x-gap="12" :y-gap="12">
          <n-gi :span="24" :l="18">
            <n-card bordered>
              <n-space align="center" wrap>
                <n-date-picker
                  v-model:value="dateRange"
                  type="daterange"
                  clearable
                  placeholder="Выберите период"
                  @update:value="handleDateChange"
                />
                <n-select
                  v-model:value="transactionType"
                  :options="typeOptions"
                  placeholder="Тип транзакции"
                  style="width: 200px"
                  clearable
                  @update:value="fetchData"
                />
                <n-button type="primary" secondary @click="fetchData">
                  <template #icon>
                    <n-icon><refresh-outline /></n-icon>
                  </template>
                  Обновить
                </n-button>
              </n-space>
            </n-card>
          </n-gi>
          <n-gi :span="24" :l="6">
            <n-card bordered class="summary-card">
              <n-statistic label="Итого за период" :value="totalAmount">
                <template #suffix> 💎 </template>
              </n-statistic>
            </n-card>
          </n-gi>
        </n-grid>

        <!-- Transactions Table -->
        <n-card bordered>
          <n-data-table
            :columns="columns"
            :data="transactions"
            :loading="loading"
            :pagination="pagination"
            remote
            @update:page="handlePageChange"
          />
        </n-card>
      </n-space>
    </div>
  </CabinetLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, h, computed } from 'vue'
import CabinetLayout from '../../layouts/CabinetLayout.vue'
import { 
  NSpace, NH1, NText, NGrid, NGi, NCard, NStatistic, 
  NButton, NIcon, NDataTable, NDatePicker, NSelect, NTag
} from 'naive-ui'
import { RefreshOutline } from '@vicons/ionicons5'
import axios from 'axios'
import dayjs from 'dayjs'

const loading = ref(false)
const transactions = ref([])
const totalAmount = ref('0.00')
const dateRange = ref<[number, number] | null>(null)
const transactionType = ref(null)

const typeOptions = [
  { label: 'Все типы', value: null },
  { label: 'Продажа', value: 'purchase' },
  { label: 'Возврат', value: 'refund' },
  { label: 'Выплата (Cash)', value: 'settlement' }
]

const pagination = ref({
  page: 1,
  pageSize: 15,
  itemCount: 0
})

const columns = [
  {
    title: 'ID',
    key: 'id',
    width: 80
  },
  {
    title: 'Студент / Получатель',
    key: 'user',
    render(row: any) {
      // If it's a purchase, sender is the student
      const user = row.transaction_type === 'purchase' ? row.sender_info : row.receiver_info
      return h('div', { class: 'flex items-center gap-2' }, [
        h(NText, { strong: true }, { default: () => user?.full_name || '—' }),
        h(NText, { depth: 3, size: 'small' }, { default: () => `@${user?.username || ''}` })
      ])
    }
  },
  {
    title: 'Тип',
    key: 'transaction_type',
    render(row: any) {
      const types: any = {
        purchase: { label: 'Продажа', type: 'success' },
        refund: { label: 'Возврат', type: 'error' },
        settlement: { label: 'Выплата', type: 'warning' },
        transfer: { label: 'Перевод', type: 'info' }
      }
      const config = types[row.transaction_type] || { label: row.transaction_type, type: 'default' }
      return h(NTag, { type: config.type, size: 'small', round: true }, { default: () => config.label })
    }
  },
  {
    title: 'Сумма',
    key: 'amount',
    render(row: any) {
      const isNegative = ['refund', 'settlement'].includes(row.transaction_type)
      const color = isNegative ? '#d03050' : '#18a058'
      const prefix = isNegative ? '-' : '+'
      return h('span', { style: { color, fontWeight: 'bold' } }, `${prefix}${row.amount} 💎`)
    }
  },
  {
    title: 'Комментарий',
    key: 'comment',
    ellipsis: { tooltip: true }
  },
  {
    title: 'Дата и время',
    key: 'timestamp',
    render(row: any) {
      return dayjs(row.timestamp).format('DD.MM.YYYY HH:mm')
    }
  }
]

const fetchData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.value.page,
      page_size: pagination.value.pageSize,
      ordering: '-timestamp'
    }

    if (dateRange.value) {
      params.timestamp__gte = dayjs(dateRange.value[0]).startOf('day').toISOString()
      params.timestamp__lte = dayjs(dateRange.value[1]).endOf('day').toISOString()
    }

    if (transactionType.value) {
      params.transaction_type = transactionType.value
    }

    const response = await axios.get('/api/v1/points/transactions/', { params })
    
    // Handle both DRF paginated and non-paginated responses
    if (response.data.results) {
      transactions.value = response.data.results
      pagination.value.itemCount = response.data.count
    } else {
      transactions.value = response.data
      pagination.value.itemCount = response.data.length
    }

    // Calculate total for current view
    const total = transactions.value.reduce((sum: number, row: any) => {
      const amount = parseFloat(row.amount)
      return ['refund', 'settlement'].includes(row.transaction_type) ? sum - amount : sum + amount
    }, 0)
    totalAmount.value = total.toFixed(2)

  } catch (err) {
    console.error('Error fetching transactions:', err)
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
  fetchData()
}

const handleDateChange = () => {
  pagination.value.page = 1
  fetchData()
}

onMounted(fetchData)
</script>

<style scoped>
.transactions-page {
  max-width: 1200px;
  margin: 0 auto;
}

.summary-card {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f9f9f9;
}
</style>

