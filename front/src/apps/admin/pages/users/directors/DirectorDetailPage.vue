<template>
  <AdminLayout>
    <div class="admin-page">
      <q-inner-loading :showing="loading">
        <q-spinner size="50px" color="primary" />
      </q-inner-loading>

      <q-banner v-if="error" class="bg-negative text-white q-mb-md">
        {{ error }}
      </q-banner>

      <div v-if="!loading && !error && directorData" class="detail-page">
        <div class="row items-center q-mb-lg">
          <div class="col">
            <q-btn
              flat
              icon="arrow_back"
              :label="$t('common.back')"
              @click="router.push('/management/directors')"
              class="q-mb-sm"
            />
            <h1 class="text-h4 q-ma-none">{{ $t('admin.models.directors') }}</h1>
          </div>
          <div class="col-auto q-gutter-sm">
            <q-btn
              color="primary"
              icon="edit"
              :label="$t('admin.actions.edit')"
              @click="router.push(`/management/directors/${directorData.id}/change`)"
            />
            <q-btn
              color="negative"
              icon="delete"
              :label="$t('admin.actions.delete')"
              @click="handleDelete"
            />
          </div>
        </div>

        <q-card flat bordered>
          <q-card-section>
            <div class="row q-col-gutter-lg">
              <div class="col-12 col-md-8">
                <div class="section q-mb-lg">
                  <h2 class="section-title q-mb-md">
                    <q-icon name="person" class="q-mr-sm" />
                    {{ $t('admin.forms.personalInfo') }}
                  </h2>
                  <div class="info-grid">
                    <div class="info-item">
                      <label class="info-label">{{ $t('admin.forms.firstName') }}</label>
                      <div class="info-value">{{ directorData.first_name || '-' }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ $t('admin.forms.lastName') }}</label>
                      <div class="info-value">{{ directorData.last_name || '-' }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ $t('admin.forms.phone') }}</label>
                      <div class="info-value">{{ directorData.phone || '-' }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ $t('admin.forms.email') }}</label>
                      <div class="info-value">{{ directorData.email || '-' }}</div>
                    </div>
                  </div>
                </div>

                <div class="section">
                  <h2 class="section-title q-mb-md">
                    <q-icon name="info" class="q-mr-sm" />
                    {{ $t('admin.forms.basicInfo') }}
                  </h2>
                  <div class="info-grid">
                    <div class="info-item">
                      <label class="info-label">{{ $t('admin.table.username') }}</label>
                      <div class="info-value">{{ directorData.username || '-' }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ $t('admin.table.isActive') }}</label>
                      <div class="info-value">
                        <q-badge :color="directorData.is_active !== false ? 'positive' : 'negative'">
                          {{ directorData.is_active !== false ? $t('admin.filters.active') : $t('admin.filters.inactive') }}
                        </q-badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-12 col-md-4">
                <div class="avatar-section">
                  <q-avatar size="200px" class="avatar-large">
                    <img v-if="directorData.avatar_url" :src="directorData.avatar_url" :alt="directorData.full_name || directorData.username || ''" />
                    <q-icon v-else name="person" size="100px" />
                  </q-avatar>
                  <div class="avatar-name q-mt-md text-center">
                    <div class="text-h6">{{ directorData.full_name || ((directorData.first_name || '') + ' ' + (directorData.last_name || '')).trim() || directorData.username || '-' }}</div>
                    <div class="text-caption text-grey">{{ directorData.username || '-' }}</div>
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '../../../layouts/AdminLayout.vue'
import { useAdminDirectors } from '@/composables/useAdminApi'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const { loading, error, fetchDirector, deleteDirector } = useAdminDirectors()

const directorData = ref<any>(null)

const handleDelete = async () => {
  if (!directorData.value) return
  
  const confirmed = await new Promise<boolean>((resolve) => {
    resolve(window.confirm(t('admin.confirmDelete')))
  })

  if (confirmed) {
    try {
      await deleteDirector(directorData.value.id)
      router.push('/management/directors')
    } catch (err) {
      console.error('Delete error:', err)
    }
  }
}

onMounted(async () => {
  try {
    const id = parseInt(route.params.id as string)
    directorData.value = await fetchDirector(id)
  } catch (err) {
    console.error('Load director error:', err)
  }
})
</script>

<style scoped>
.detail-page {
  padding: 0;
}

.section {
  padding: 0;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1976d2;
  display: flex;
  align-items: center;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e0e0e0;
  margin-bottom: 1rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #666;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 1rem;
  color: #333;
  word-break: break-word;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background: #f5f5f5;
  border-radius: 8px;
  position: sticky;
  top: 20px;
}

.avatar-large {
  border: 4px solid #1976d2;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.avatar-name {
  margin-top: 1rem;
}
</style>

