<template>
  <AdminLayout>
    <div class="admin-page">
      <!-- Loading State -->
      <q-inner-loading :showing="loading">
        <q-spinner size="50px" color="primary" />
      </q-inner-loading>

      <!-- Error State -->
      <q-banner v-if="error" class="bg-negative text-white q-mb-md">
        {{ error }}
      </q-banner>

      <!-- Content -->
      <div v-if="!loading && !error && teacherData" class="detail-page">
        <!-- Header with Actions -->
        <div class="row items-center q-mb-lg">
          <div class="col">
            <q-btn
              flat
              icon="arrow_back"
              :label="$t('common.back')"
              @click="router.push('/management/teachers')"
              class="q-mb-sm"
            />
            <h1 class="text-h4 q-ma-none">{{ $t('admin.models.teachers') }}</h1>
          </div>
          <div class="col-auto q-gutter-sm">
            <q-btn
              color="primary"
              icon="edit"
              :label="$t('admin.actions.edit')"
              @click="router.push(`/management/teachers/${teacherData.id}/change`)"
            />
            <q-btn
              color="negative"
              icon="delete"
              :label="$t('admin.actions.delete')"
              @click="handleDelete"
            />
          </div>
        </div>

        <!-- Main Content Card -->
        <q-card flat bordered>
          <q-card-section>
            <div class="row q-col-gutter-lg">
              <!-- Left Column: Personal Information -->
              <div class="col-12 col-md-8">
                <!-- Personal Information Section -->
                <div class="section q-mb-lg">
                  <h2 class="section-title q-mb-md">
                    <q-icon name="person" class="q-mr-sm" />
                    {{ $t('admin.forms.personalInfo') }}
                  </h2>
                  <div class="info-grid">
                    <div class="info-item">
                      <label class="info-label">{{ $t('admin.forms.firstName') }}</label>
                      <div class="info-value">{{ teacherData.first_name || '-' }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ $t('admin.forms.lastName') }}</label>
                      <div class="info-value">{{ teacherData.last_name || '-' }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ $t('admin.forms.phone') }}</label>
                      <div class="info-value">{{ teacherData.phone || '-' }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ $t('admin.forms.email') }}</label>
                      <div class="info-value">{{ teacherData.email || '-' }}</div>
                    </div>
                  </div>
                </div>

                <!-- Basic Information Section -->
                <div class="section q-mb-lg">
                  <h2 class="section-title q-mb-md">
                    <q-icon name="info" class="q-mr-sm" />
                    {{ $t('admin.forms.basicInfo') }}
                  </h2>
                  <div class="info-grid">
                    <div class="info-item">
                      <label class="info-label">{{ $t('admin.table.username') }}</label>
                      <div class="info-value">{{ teacherData.username || '-' }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ $t('admin.table.isActive') }}</label>
                      <div class="info-value">
                        <q-badge :color="teacherData.is_active !== false ? 'positive' : 'negative'">
                          {{ teacherData.is_active !== false ? $t('admin.filters.active') : $t('admin.filters.inactive') }}
                        </q-badge>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Professional Information -->
                <div class="section">
                  <h2 class="section-title q-mb-md">
                    <q-icon name="work" class="q-mr-sm" />
                    {{ $t('admin.teachers.professionalInfo') }}
                  </h2>
                  <div class="info-grid">
                    <div class="info-item">
                      <label class="info-label">{{ $t('admin.teachers.specialization') }}</label>
                      <div class="info-value">{{ teacherData.specialization || '-' }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ $t('admin.teachers.experience') }}</label>
                      <div class="info-value">{{ teacherData.experience_years || 0 }} {{ $t('admin.teachers.years') }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ $t('admin.teachers.hireDate') }}</label>
                      <div class="info-value">{{ formatDate(teacherData.hire_date) || '-' }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ $t('admin.teachers.views') }}</label>
                      <div class="info-value">{{ teacherData.views || 0 }}</div>
                    </div>
                    <div class="info-item">
                      <label class="info-label">{{ $t('admin.teachers.likes') }}</label>
                      <div class="info-value">{{ teacherData.likes || 0 }}</div>
                    </div>
                    <div class="info-item full-width">
                      <label class="info-label">{{ $t('admin.teachers.biography') }}</label>
                      <div class="info-value">{{ teacherData.bio || '-' }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right Column: Avatar -->
              <div class="col-12 col-md-4">
                <div class="avatar-section">
                  <q-avatar size="200px" class="avatar-large">
                    <img v-if="teacherData.avatar_url" :src="teacherData.avatar_url" :alt="teacherData.full_name || teacherData.username || ''" />
                    <q-icon v-else name="person" size="100px" />
                  </q-avatar>
                  <div class="avatar-name q-mt-md text-center">
                    <div class="text-h6">{{ teacherData.full_name || ((teacherData.first_name || '') + ' ' + (teacherData.last_name || '')).trim() || teacherData.username || '-' }}</div>
                    <div class="text-caption text-grey">{{ teacherData.username || '-' }}</div>
                    <div v-if="teacherData.specialization" class="text-body2 q-mt-sm text-primary">
                      {{ teacherData.specialization }}
                    </div>
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
import { useAdminTeachers } from '@/composables/useAdminApi'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const { loading, error, fetchTeacher, deleteTeacher } = useAdminTeachers()

const teacherData = ref<any>(null)

const formatDate = (date: string | null) => {
  if (!date) return null
  try {
    return new Date(date).toLocaleDateString()
  } catch {
    return date
  }
}

const handleDelete = async () => {
  if (!teacherData.value) return
  
  const confirmed = await new Promise<boolean>((resolve) => {
    resolve(window.confirm(t('admin.confirmDelete')))
  })

  if (confirmed) {
    try {
      await deleteTeacher(teacherData.value.id)
      router.push('/management/teachers')
    } catch (err) {
      console.error('Delete error:', err)
    }
  }
}

onMounted(async () => {
  try {
    const id = parseInt(route.params.id as string)
    teacherData.value = await fetchTeacher(id)
  } catch (err) {
    console.error('Load teacher error:', err)
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

.info-item.full-width {
  grid-column: 1 / -1;
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

