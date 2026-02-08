<template>
  <div class="payments-tab">
    <n-card bordered>
      <template #header>
        <n-space align="center" justify="space-between">
          <n-text strong>{{ $t('cabinet.payments.paymentHistory') }}</n-text>
          <n-tag type="success" round bordered :size="'large'">
            {{ $t('cabinet.payments.totalPaid') }}: {{ totalPaid }} TMT
          </n-tag>
        </n-space>
      </template>

      <div v-if="loading" class="loading-state">
        <n-spin size="large" />
      </div>

      <div v-else-if="payments.length === 0" class="empty-state">
        <n-empty :description="$t('cabinet.payments.noPayments')" />
      </div>

      <n-data-table
        v-else
        :columns="columns"
        :data="payments"
        :bordered="false"
        :single-line="false"
      />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { 
  NCard, NDataTable, NTag, NText, NEmpty, NSpin, NSpace, NButton, NIcon, useMessage 
} from 'naive-ui'
import { DownloadOutline as DownloadIcon } from '@vicons/ionicons5'
import axios from 'axios'

const props = defineProps<{
  groupId: string | number
}>()

const { t, locale } = useI18n()
const message = useMessage()
const loading = ref(false)
const payments = ref<any[]>([])

const totalPaid = computed(() => {
  return payments.value.reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2)
})

const formatDate = (dateString: string) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return date.toLocaleDateString(locale.value === 'ru' ? 'ru-RU' : 'tk-TM', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const downloadReceipt = async (paymentId: number, invoiceNumber: string) => {
  try {
    const response = await axios.get(`/api/v1/payments/${paymentId}/download_receipt/`, {
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `receipt_${invoiceNumber}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (err) {
    console.error('Error downloading receipt:', err)
    message.error(t('common.error') || 'Failed to download receipt')
  }
}

const columns = [
  {
    title: t('cabinet.payments.invoiceNumber'),
    key: 'invoice_number',
    width: 180,
    render(row: any) {
      return h(NText, { depth: 3, style: 'font-family: monospace' }, { default: () => row.invoice_number })
    }
  },
  {
    title: t('cabinet.payments.paymentDate'),
    key: 'created_at',
    width: 160,
    render(row: any) {
      return formatDate(row.created_at)
    }
  },
  {
    title: t('cabinet.payments.amount'),
    key: 'amount',
    width: 120,
    render(row: any) {
      return h('div', [
        h(NText, { strong: true, type: 'success' }, { default: () => `${row.amount} ${row.currency}` }),
        row.discount > 0 ? h('div', { style: 'font-size: 12px; color: #d03050' }, { default: () => `-${row.discount} ${t('cabinet.payments.discount')}` }) : null
      ])
    }
  },
  {
    title: t('cabinet.payments.method'),
    key: 'payment_method',
    width: 120,
    render(row: any) {
      const methodLabels: Record<string, string> = {
        'cash': t('cabinet.payments.cash'),
        'bank_transfer': t('cabinet.payments.bank'),
        'card': t('cabinet.payments.card')
      }
      return methodLabels[row.payment_method] || row.payment_method
    }
  },
  {
    title: t('cabinet.payments.receivedBy'),
    key: 'received_by_info',
    render(row: any) {
      return row.received_by_info?.full_name || row.received_by_info?.username || '—'
    }
  },
  {
    title: t('cabinet.payments.comment'),
    key: 'comment',
    ellipsis: { tooltip: true }
  },
  {
    title: '',
    key: 'actions',
    width: 80,
    render(row: any) {
      return h(
        NButton,
        {
          size: 'small',
          quaternary: true,
          type: 'success',
          onClick: () => downloadReceipt(row.id, row.invoice_number)
        },
        {
          icon: () => h(NIcon, null, { default: () => h(DownloadIcon) })
        }
      )
    }
  }
]

const loadPayments = async () => {
  loading.value = true
  try {
    const res = await axios.get(`/api/v1/payments/?group=${props.groupId}`)
    payments.value = res.data.results || res.data || []
  } catch (err) {
    console.error('Error loading payments:', err)
  } finally {
    loading.value = false
  }
}

onMounted(loadPayments)
</script>

<style scoped>
.payments-tab {
  padding: 0;
}

.loading-state, .empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
}
</style>

