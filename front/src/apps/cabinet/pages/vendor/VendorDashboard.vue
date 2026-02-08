<template>
  <CabinetLayout>
    <div class="vendor-dashboard">
      <n-grid :cols="24" :x-gap="12" :y-gap="12">
        <!-- Balance Card -->
        <n-gi :span="24">
          <n-card title="Выручка в кристаллах" segmented>
            <template #header-extra>
              <n-button type="primary" secondary @click="loadData">
                <template #icon>
                  <n-icon><refresh-outline /></n-icon>
                </template>
                Обновить
              </n-button>
            </template>
            <div class="balance-display flex items-center">
              <n-statistic label="Текущий баланс" :value="wallet?.balance || '0.00'">
                <template #suffix> 💎 </template>
              </n-statistic>
            </div>
          </n-card>
        </n-gi>

        <!-- Terminal Settings -->
        <n-gi :span="24" :l="12">
          <n-card title="Настройки терминала ESP32" bordered v-if="vendorProfile">
            <div class="form-container">
              <n-form-item label="Terminal ID (Уникальный ID устройства)">
                <n-input v-model:value="vendorProfile.terminal_id" placeholder="Например: CAFE-TERM-01" />
              </n-form-item>
              <n-form-item label="Auth Token (Секретный ключ для ESP32)">
                <n-input-group>
                  <n-input
                    v-model:value="vendorProfile.auth_token"
                    type="password"
                    show-password-on="mousedown"
                    readonly
                  />
                  <n-button type="warning" @click="handleResetToken"> Сбросить </n-button>
                </n-input-group>
              </n-form-item>
              <n-button 
                type="primary" 
                @click="handleUpdateProfile"
                class="save-btn"
              > 
                Сохранить настройки 
              </n-button>
            </div>
          </n-card>
          <n-card v-else bordered>
            <n-spin show>
              <template #description> Загрузка профиля... </template>
            </n-spin>
          </n-card>
        </n-gi>

        <!-- Recent Transactions -->
        <n-gi :span="24" :l="12">
          <n-card title="Последние продажи" bordered>
            <n-data-table
              :columns="columns"
              :data="transactions"
              :loading="loadingPoints"
              :pagination="{ pageSize: 5 }"
            />
          </n-card>
        </n-gi>
      </n-grid>
    </div>
  </CabinetLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import CabinetLayout from '../../layouts/CabinetLayout.vue'
import { 
  NGrid, NGi, NCard, NStatistic, NButton, NIcon, 
  NDataTable, NFormItem, NInput, NInputGroup, useMessage,
  NSpin
} from 'naive-ui'
import { RefreshOutline } from '@vicons/ionicons5'
import { usePoints } from '@/composables/usePoints'
import { useVendors } from '@/composables/useVendors'
import dayjs from 'dayjs'

const message = useMessage()
const { wallet, transactions, fetchMyWallet, fetchTransactions, loading: loadingPoints } = usePoints()
const { vendorProfile, fetchMyVendorProfile, resetTerminalToken, updateVendorProfile } = useVendors()

const columns = [
  {
    title: 'Студент',
    key: 'sender_info.full_name'
  },
  {
    title: 'Сумма',
    key: 'amount',
    render(row: any) {
      return h('span', { style: 'color: #18a058; font-weight: bold' }, `${row.amount} 💎`)
    }
  },
  {
    title: 'Время',
    key: 'timestamp',
    render(row: any) {
      return dayjs(row.timestamp).format('HH:mm DD.MM')
    }
  }
]

const loadData = async () => {
  try {
    await Promise.all([
      fetchMyWallet(),
      fetchTransactions(),
      fetchMyVendorProfile()
    ])
  } catch (err) {
    message.error('Ошибка загрузки данных')
  }
}

const handleResetToken = async () => {
  if (!vendorProfile.value?.id) return
  try {
    await resetTerminalToken(vendorProfile.value.id)
    message.success('Токен успешно обновлен. Не забудьте перепрошить ESP32!')
  } catch (err) {
    message.error('Ошибка при сбросе токена')
  }
}

const handleUpdateProfile = async () => {
  if (!vendorProfile.value?.id) return
  try {
    await updateVendorProfile(vendorProfile.value.id, {
      terminal_id: vendorProfile.value.terminal_id
    })
    message.success('Настройки сохранены')
  } catch (err) {
    message.error('Ошибка при сохранении настроек')
  }
}

onMounted(loadData)
</script>

<style scoped>
.vendor-dashboard {
  padding: 12px;
}

.form-container {
  max-width: 400px;
}

.save-btn {
  width: 200px;
  margin-top: 8px;
}
</style>
