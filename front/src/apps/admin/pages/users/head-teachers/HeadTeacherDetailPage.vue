<template>
  <AdminLayout>
    <div class="admin-page">
      <q-inner-loading :showing="loading">
        <q-spinner size="50px" color="primary" />
      </q-inner-loading>

      <q-banner v-if="error" class="bg-negative text-white q-mb-md">
        {{ error }}
      </q-banner>

      <div v-if="!loading && !error && headTeacherData" class="detail-page">
        <div class="row items-center q-mb-lg">
          <div class="col">
            <q-btn
              flat
              icon="arrow_back"
              :label="$t('common.back')"
              @click="router.push('/management/head-teachers')"
              class="q-mb-sm"
            />
            <h1 class="text-h4 q-ma-none">{{ $t('admin.models.headTeachers') }}</h1>
          </div>
          <div class="col-auto q-gutter-sm">
            <q-btn
              color="primary"
              icon="edit"
              :label="$t('admin.actions.edit')"
              @click="router.push(`/management/head-teachers/${headTeacherData.id}/change`)"
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
                      <div class="info-value">{{ headTeacherData.first_name || '-' }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ $t('admin.forms.lastName') }}</label>
                      <div class="info-value">{{ headTeacherData.last_name || '-' }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ $t('admin.forms.phone') }}</label>
                      <div class="info-value">{{ headTeacherData.phone || '-' }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ $t('admin.forms.email') }}</label>
                      <div class="info-value">{{ headTeacherData.email || '-' }}</div>
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
                      <div class="info-value">{{ headTeacherData.username || '-' }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ $t('admin.table.isActive') }}</label>
                      <div class="info-value">
                        <q-badge :color="headTeacherData.is_active !== false ? 'positive' : 'negative'">
                          {{ headTeacherData.is_active !== false ? $t('admin.filters.active') : $t('admin.filters.inactive') }}
                        </q-badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-12 col-md-4">
                <div class="avatar-section">
                  <q-avatar size="200px" class="avatar-large">
                    <img v-if="headTeacherData.avatar_url" :src="headTeacherData.avatar_url" :alt="headTeacherData.full_name || headTeacherData.username || ''" />
                    <q-icon v-else name="person" size="100px" />
                  </q-avatar>
                  <div class="avatar-name q-mt-md text-center">
                    <div class="text-h6">{{ headTeacherData.full_name || ((headTeacherData.first_name || '') + ' ' + (headTeacherData.last_name || '')).trim() || headTeacherData.username || '-' }}</div>
                    <div class="text-caption text-grey">{{ headTeacherData.username || '-' }}</div>
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
import { useAdminHeadTeachers } from '@/composables/useAdminApi'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const { loading, error, fetchHeadTeacher, deleteHeadTeacher } = useAdminHeadTeachers()

const headTeacherData = ref<any>(null)

const handleDelete = async () => {
  if (!headTeacherData.value) return
  
  const confirmed = await new Promise<boolean>((resolve) => {
    resolve(window.confirm(t('admin.confirmDelete')))
  })

  if (confirmed) {
    try {
      await deleteHeadTeacher(headTeacherData.value.id)
      router.push('/management/head-teachers')
    } catch (err) {
      console.error('Delete error:', err)
    }
  }
}

onMounted(async () => {
  try {
    const id = parseInt(route.params.id as string)
    headTeacherData.value = await fetchHeadTeacher(id)
  } catch (err) {
    console.error('Load head teacher error:', err)
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

