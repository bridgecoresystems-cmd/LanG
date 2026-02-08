<template>
  <CabinetLayout>
    <n-space vertical size="large" class="gems-page">
      <div class="header">
        <n-h1 style="margin: 0;">{{ $t('cabinet.menu.gems') }} 💎</n-h1>
        <n-text depth="3">{{ $t('cabinet.gems.directorDescription') }}</n-text>
      </div>

      <!-- Balance Card -->
      <n-grid cols="1 m:3" responsive="screen" :x-gap="16" :y-gap="16">
        <n-gi>
          <n-card class="stat-card balance-card">
            <n-statistic :label="$t('cabinet.dashboard.stats.myBalance') + ' (💎)'" :value="wallet?.balance || '0.00'">
              <template #prefix>
                <n-icon size="24" class="stat-icon-bg"><wallet-icon /></n-icon>
              </template>
              <template #suffix>{{ $t('common.gems') }}</template>
            </n-statistic>
          </n-card>
        </n-gi>
      </n-grid>

      <!-- Receivers List (Head Teachers) -->
      <n-card :title="$t('cabinet.gems.headTeachersList')" bordered>
        <template #header-extra>
          <n-button type="primary" secondary @click="loadData">
            <template #icon>
              <n-icon><refresh-icon /></n-icon>
            </template>
            {{ $t('common.retry') }}
          </n-button>
        </template>

        <n-data-table
          :columns="columns"
          :data="headTeachers"
          :loading="loading"
          :pagination="{ pageSize: 10 }"
        />
      </n-card>

      <!-- Modal for Transfer -->
      <n-modal
        v-model:show="showTransferModal"
        preset="card"
        style="width: 400px"
        :title="$t('cabinet.gems.transferTitle')"
      >
        <n-form ref="formRef" :model="transferForm" :rules="rules">
          <n-form-item :label="$t('cabinet.gems.receiver')" path="receiverName">
            <n-input v-model:value="transferForm.receiverName" disabled />
          </n-form-item>
          <n-form-item :label="$t('cabinet.gems.amount')" path="amount">
            <n-input-number
              v-model:value="transferForm.amount"
              :min="1"
              style="width: 100%"
              placeholder="0"
            >
              <template #suffix>💎</template>
            </n-input-number>
          </n-form-item>
          <n-form-item :label="$t('cabinet.gems.comment')" path="comment">
            <n-input
              v-model:value="transferForm.comment"
              type="textarea"
              :placeholder="$t('cabinet.gems.commentPlaceholder')"
            />
          </n-form-item>
        </n-form>
        <template #footer>
          <n-space justify="end">
            <n-button @click="showTransferModal = false">{{ $t('common.cancel') }}</n-button>
            <n-button type="primary" :loading="transferring" @click="handleTransfer">
              {{ $t('cabinet.gems.send') }}
            </n-button>
          </n-space>
        </template>
      </n-modal>
    </n-space>
  </CabinetLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, h, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import CabinetLayout from '../../layouts/CabinetLayout.vue'
import {
  NSpace, NH1, NText, NGrid, NGi, NCard, NStatistic, NIcon,
  NButton, NDataTable, NModal, NForm, NFormItem, NInput,
  NInputNumber, useMessage
} from 'naive-ui'
import {
  WalletOutline as WalletIcon,
  RefreshOutline as RefreshIcon,
  PaperPlaneOutline as SendIcon
} from '@vicons/ionicons5'
import axios from 'axios'
import { usePointsStore } from '@/stores/pointsStore'

const { t } = useI18n()
const message = useMessage()
const pointsStore = usePointsStore()

const wallet = computed(() => pointsStore.wallet)
const fetchMyWallet = () => pointsStore.fetchMyWallet()

const loading = ref(false)
const headTeachers = ref([])
const showTransferModal = ref(false)
const transferring = ref(false)
const formRef = ref(null)

const transferForm = ref({
  receiverId: null as number | null,
  receiverName: '',
  amount: 10,
  comment: ''
})

const rules = {
  amount: {
    type: 'number',
    required: true,
    message: t('cabinet.gems.amountRequired') || 'Введите сумму',
    trigger: ['blur', 'input']
  }
}

const columns = [
  {
    title: t('cabinet.student.fullName'),
    key: 'full_name',
    render(row: any) {
      return h('div', [
        h(NText, { strong: true }, { default: () => row.full_name }),
        h('br'),
        h(NText, { depth: 3, size: 'small' }, { default: () => `@${row.username}` })
      ])
    }
  },
  {
    title: t('cabinet.dashboard.stats.myBalance'),
    key: 'wallet_balance',
    render(row: any) {
      return h(NText, { type: 'success', strong: true }, { default: () => `${row.wallet_balance || 0} 💎` })
    }
  },
  {
    title: t('common.actions'),
    key: 'actions',
    width: 150,
    render(row: any) {
      return h(
        NButton,
        {
          type: 'primary',
          size: 'small',
          onClick: () => openTransferModal(row)
        },
        {
          default: () => t('cabinet.gems.award'),
          icon: () => h(NIcon, null, { default: () => h(SendIcon) })
        }
      )
    }
  }
]

const openTransferModal = (user: any) => {
  transferForm.value = {
    receiverId: user.id,
    receiverName: user.full_name || user.username,
    amount: 50,
    comment: ''
  }
  showTransferModal.value = true
}

const handleTransfer = async () => {
  formRef.value?.validate(async (errors) => {
    if (errors) return

    transferring.value = true
    try {
      await axios.post('/api/v1/points/transfer/', {
        receiver_id: transferForm.value.receiverId,
        amount: transferForm.value.amount,
        comment: transferForm.value.comment
      })
      
      message.success(t('cabinet.gems.successMessage'))
      showTransferModal.value = false
      await Promise.all([
        loadData(),
        fetchMyWallet()
      ])
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || t('common.error')
      message.error(errorMsg)
    } finally {
      transferring.value = false
    }
  })
}

const loadData = async () => {
  loading.value = true
  try {
    // 1. Get Wallet balance
    await fetchMyWallet()
    
    // 2. Get list of Head Teachers and their wallets
    // We'll use a special endpoint or filter users by role
    const response = await axios.get('/api/v1/users/staff/?role=head_teacher')
    
    // For each staff member, we need their balance. 
    // In a real app, the backend should probably return the balance in the list.
    // Assuming backend returns { id, full_name, username, balance }
    headTeachers.value = response.data.results || response.data
  } catch (err) {
    console.error('Error loading data:', err)
    message.error('Ошибка при загрузке данных')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.gems-page {
  max-width: 1200px;
  margin: 0 auto;
}

.stat-card {
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.balance-card {
  background: linear-gradient(135deg, #18a058 0%, #0c7a43 100%);
  color: white !important;
}

:deep(.balance-card .n-statistic-label),
:deep(.balance-card .n-statistic-value__content),
:deep(.balance-card .n-statistic-value__suffix) {
  color: white !important;
}

.stat-icon-bg {
  padding: 8px;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.2);
  margin-right: 8px;
}
</style>

