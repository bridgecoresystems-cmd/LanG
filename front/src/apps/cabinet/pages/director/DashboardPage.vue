<template>
  <CabinetLayout>
    <n-space vertical size="large" class="dashboard-page">
      <div class="dashboard-header">
        <n-h1 style="margin-bottom: 4px;">{{ $t('cabinet.dashboard.title') }}</n-h1>
        <n-text depth="3">{{ $t('cabinet.dashboard.directorDescription') }}</n-text>
      </div>

      <n-grid cols="1 m:3" responsive="screen" :x-gap="16" :y-gap="16">
        <n-gi>
          <n-card class="stat-card balance-card">
            <n-statistic :label="$t('cabinet.dashboard.stats.myBalance') + ' (' + $t('common.currencySymbol') + ')'" :value="wallet?.balance || '0.00'">
              <template #prefix>
                <n-icon size="24" class="stat-icon-bg"><wallet-icon /></n-icon>
              </template>
              <template #suffix>{{ $t('common.gems') }}</template>
            </n-statistic>
          </n-card>
        </n-gi>
      </n-grid>

      <div style="margin-top: 40px; text-align: center;">
        <n-empty :description="$t('cabinet.teachers.comingSoon')" />
      </div>
    </n-space>
  </CabinetLayout>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import CabinetLayout from '../../layouts/CabinetLayout.vue'
import { 
  NSpace, NH1, NText, NGrid, NGi, NCard, NStatistic, NIcon, NEmpty
} from 'naive-ui'
import { WalletOutline as WalletIcon } from '@vicons/ionicons5'
import { usePointsStore } from '@/stores/pointsStore'

const pointsStore = usePointsStore()
const wallet = computed(() => pointsStore.wallet)
const fetchMyWallet = () => pointsStore.fetchMyWallet()

onMounted(fetchMyWallet)
</script>

<style scoped>
.dashboard-page {
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
