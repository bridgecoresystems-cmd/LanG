<template>
  <AdminLayout>
    <div class="admin-page">
      <!-- Page Header -->
      <div class="row items-center q-mb-lg">
        <div class="col">
          <h1 class="text-h4 q-ma-none">{{ $t('admin.mailing.create') }}</h1>
        </div>
        <div class="col-auto">
          <q-btn
            outline
            color="grey-7"
            icon="arrow_back"
            :label="$t('common.back')"
            :to="{ name: 'AdminMailing' }"
          />
        </div>
      </div>

      <!-- Error Banner -->
      <q-banner v-if="error" class="bg-negative text-white q-mb-md">
        {{ error }}
      </q-banner>

      <!-- Form Card -->
      <q-card flat bordered>
        <q-card-section>
          <q-form @submit.prevent="handleSubmit" class="admin-form">
            <!-- Title -->
            <div class="q-mb-lg">
              <q-input
                v-model="formData.title"
                :label="$t('admin.mailing.title')"
                outlined
                :rules="[val => !!val || $t('admin.forms.required')]"
                class="q-mb-md"
              />
            </div>

            <!-- Content -->
            <div class="q-mb-lg">
              <q-input
                v-model="formData.content"
                :label="$t('admin.mailing.content')"
                type="textarea"
                outlined
                rows="8"
                :rules="[val => !!val || $t('admin.forms.required')]"
                class="q-mb-md"
              />
            </div>

            <!-- Recipient Type and Schedule -->
            <div class="row q-col-gutter-md q-mb-lg">
              <div class="col-12 col-md-6">
                <q-select
                  v-model="formData.recipient_type"
                  :options="recipientTypeOptions"
                  :label="$t('admin.mailing.recipientType')"
                  outlined
                  emit-value
                  map-options
                  :rules="[val => !!val || $t('admin.forms.required')]"
                  @update:model-value="handleRecipientTypeChange"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model="scheduledAt"
                  type="datetime-local"
                  :label="$t('admin.mailing.scheduledAt')"
                  outlined
                  clearable
                  :min="minDateTime"
                />
              </div>
            </div>

            <!-- Groups MultiSelect -->
            <div v-if="formData.recipient_type === 'groups' || formData.recipient_type === 'group_teachers'" class="q-mb-lg">
              <q-select
                v-model="formData.group_ids"
                :options="groupOptions"
                :label="$t('admin.mailing.selectGroups')"
                outlined
                multiple
                emit-value
                map-options
                :loading="loadingGroups"
                :rules="[
                  val => !(formData.recipient_type === 'groups' || formData.recipient_type === 'group_teachers') || (val && val.length > 0) || $t('admin.forms.required')
                ]"
                use-chips
              />
            </div>

            <!-- Actions -->
            <div class="row justify-end q-mt-lg">
              <q-btn
                outline
                color="grey-7"
                :label="$t('common.cancel')"
                @click="$router.push('/management/mailing')"
                class="q-mr-md"
              />
              <q-btn
                type="submit"
                color="primary"
                :label="$t('admin.mailing.send')"
                icon="send"
                :loading="submitting"
                :disable="!isFormValid"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '../../layouts/AdminLayout.vue'
import { useMailingApi, type CreateMessageData } from '@/composables/useMailingApi'
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()
const mailingApi = useMailingApi()

const formData = ref<CreateMessageData & { group_ids?: number[] }>({
  title: '',
  content: '',
  recipient_type: 'all',
  scheduled_at: null,
  group_ids: [],
})

const scheduledAt = ref<string>('')
const loadingGroups = ref(false)
const submitting = ref(false)
const error = ref<string | null>(null)
const groups = ref<Array<{ id: number; name: string; course_name: string }>>([])

const recipientTypeOptions = [
  { label: t('admin.mailing.recipientTypes.all'), value: 'all' },
  { label: t('admin.mailing.recipientTypes.students'), value: 'students' },
  { label: t('admin.mailing.recipientTypes.teachers'), value: 'teachers' },
  { label: t('admin.mailing.recipientTypes.directors'), value: 'directors' },
  { label: t('admin.mailing.recipientTypes.headTeachers'), value: 'head_teachers' },
  { label: t('admin.mailing.recipientTypes.groups'), value: 'groups' },
  { label: t('admin.mailing.recipientTypes.groupTeachers'), value: 'group_teachers' },
]

const groupOptions = computed(() => groups.value.map(g => ({
  label: `${g.name} (${g.course_name})`,
  value: g.id
})))

const minDateTime = computed(() => {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 16)
})

const isFormValid = computed(() => {
  return (
    formData.value.title.trim() !== '' &&
    formData.value.content.trim() !== '' &&
    formData.value.recipient_type !== '' &&
    (formData.value.recipient_type !== 'groups' && formData.value.recipient_type !== 'group_teachers'
      ? true
      : (formData.value.group_ids?.length || 0) > 0)
  )
})

watch(scheduledAt, (newVal) => {
  if (newVal) {
    formData.value.scheduled_at = new Date(newVal).toISOString()
  } else {
    formData.value.scheduled_at = null
  }
})

const loadGroups = async () => {
  try {
    loadingGroups.value = true
    const token = authStore.accessToken
    const response = await axios.get(
      'http://localhost:8000/api/v1/courses/groups/',
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    const data = Array.isArray(response.data) ? response.data : (response.data.results || [])
    groups.value = data.map((group: any) => ({
      id: group.id,
      name: group.name,
      course_name: group.course?.name || '',
    }))
  } catch (err: any) {
    console.error('Failed to load groups:', err)
  } finally {
    loadingGroups.value = false
  }
}

const handleRecipientTypeChange = () => {
  if (formData.value.recipient_type !== 'groups' && formData.value.recipient_type !== 'group_teachers') {
    formData.value.group_ids = []
  } else if (!formData.value.group_ids) {
    formData.value.group_ids = []
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  submitting.value = true
  error.value = null

  try {
    const data: CreateMessageData = {
      title: formData.value.title,
      content: formData.value.content,
      recipient_type: formData.value.recipient_type,
      scheduled_at: formData.value.scheduled_at,
    }

    if (formData.value.group_ids && formData.value.group_ids.length > 0) {
      data.group_ids = formData.value.group_ids
    }

    await mailingApi.createMessage(data)
    router.push('/management/mailing')
  } catch (err: any) {
    error.value = err.response?.data?.detail || err.response?.data || err.message || 'Failed to create message'
    console.error('Failed to create message:', err)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadGroups()
})
</script>

<style scoped>
.admin-form {
  max-width: 800px;
}
</style>

