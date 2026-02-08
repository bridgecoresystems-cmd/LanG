<template>
  <AdminLayout>
    <div class="admin-dashboard">
      <div class="row q-mb-lg">
        <div class="col-12">
          <h1 class="text-h4 q-mb-sm">{{ $t('admin.dashboard.title') }}</h1>
          <p class="text-body1 text-grey-7">{{ $t('admin.dashboard.description') }}</p>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-sm-6 col-md-3" v-for="stat in statsList" :key="stat.key">
          <q-card class="stat-card" flat bordered>
            <q-card-section>
              <div class="row items-center no-wrap">
                <div class="col-auto">
                  <q-avatar
                    size="60px"
                    :color="stat.color"
                    text-color="white"
                    :icon="stat.icon"
                  />
                </div>
                <div class="col q-ml-md">
                  <div class="text-caption text-grey-7">{{ stat.label }}</div>
                  <div class="text-h5 q-mt-xs">{{ stat.value }}</div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="row">
        <div class="col-12">
          <q-card flat bordered>
            <q-card-section>
              <div class="text-h6 q-mb-md">{{ $t('admin.dashboard.quickActions') }}</div>
              <div class="row q-col-gutter-md">
                <div
                  v-for="action in quickActions"
                  :key="action.path"
                  class="col-12 col-sm-6 col-md-3"
                >
                  <router-link :to="action.path" class="action-card">
                    <q-card flat bordered class="full-height cursor-pointer">
                      <q-card-section class="text-center">
                        <q-icon :name="action.icon" size="48px" :color="action.color" />
                        <div class="text-body1 q-mt-md">{{ action.label }}</div>
                      </q-card-section>
                    </q-card>
                  </router-link>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminLayout from '../layouts/AdminLayout.vue'
import { useAdminDashboard } from '@/composables/useAdminApi'

const { t } = useI18n()
const { loading, error, fetchStats } = useAdminDashboard()

const stats = ref({
  totalUsers: 0,
  totalTeachers: 0,
  totalCourses: 0,
  totalMessages: 0,
  totalNews: 0
})

const statsList = computed(() => [
  {
    key: 'users',
    label: t('admin.dashboard.totalUsers'),
    value: stats.value.totalUsers || 0,
    icon: 'people',
    color: 'primary'
  },
  {
    key: 'teachers',
    label: t('admin.dashboard.totalTeachers'),
    value: stats.value.totalTeachers || 0,
    icon: 'person',
    color: 'pink'
  },
  {
    key: 'courses',
    label: t('admin.dashboard.totalCourses'),
    value: stats.value.totalCourses || 0,
    icon: 'book',
    color: 'info'
  },
  {
    key: 'news',
    label: t('admin.dashboard.totalNews'),
    value: stats.value.totalNews || 0,
    icon: 'newspaper',
    color: 'positive'
  }
])

const quickActions = computed(() => [
  {
    path: '/management/students',
    label: t('admin.menu.students'),
    icon: 'people',
    color: 'primary'
  },
  {
    path: '/management/landing/news',
    label: t('admin.menu.news'),
    icon: 'newspaper',
    color: 'info'
  },
  {
    path: '/management/landing/courses',
    label: t('admin.menu.courses'),
    icon: 'book',
    color: 'positive'
  },
  {
    path: '/management/landing/contact-messages',
    label: t('admin.menu.contactMessages'),
    icon: 'mail',
    color: 'warning'
  }
])

const loadStats = async () => {
  try {
    const data = await fetchStats()
    stats.value = {
      totalUsers: data.totalUsers || 0,
      totalTeachers: data.totalTeachers || 0,
      totalCourses: data.totalCourses || 0,
      totalMessages: data.totalMessages || 0,
      totalNews: data.totalNews || 0
    }
  } catch (err) {
    console.error('Failed to load dashboard stats:', err)
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.admin-dashboard {
  padding: 0;
}

.stat-card {
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-card {
  text-decoration: none;
  color: inherit;
  display: block;
}

.action-card :deep(.q-card) {
  transition: all 0.3s ease;
}

.action-card:hover :deep(.q-card) {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: var(--q-primary);
}
</style>
