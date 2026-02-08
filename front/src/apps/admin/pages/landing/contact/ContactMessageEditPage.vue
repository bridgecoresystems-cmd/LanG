<template>
  <AdminLayout>
    <div class="admin-page">
      <!-- Page Header -->
      <div class="row items-center q-mb-lg">
        <div class="col">
          <h1 class="text-h4 q-ma-none">{{ $t('admin.actions.edit') }} {{ $t('admin.models.contact-message') }}</h1>
        </div>
        <div class="col-auto">
          <q-btn
            outline
            color="grey-7"
            icon="arrow_back"
            :label="$t('common.back')"
            :to="{ name: 'AdminContactMessages' }"
          />
        </div>
      </div>

      <!-- Loading State -->
      <q-inner-loading :showing="loading && !formData.name">
        <q-spinner size="50px" color="primary" />
      </q-inner-loading>

      <!-- Error Banner -->
      <q-banner v-if="error" class="bg-negative text-white q-mb-md">
        {{ error }}
      </q-banner>

      <!-- Form Card -->
      <q-card v-if="!loading || formData.name" flat bordered>
        <q-card-section>
          <q-form @submit.prevent="handleSubmit" class="admin-form">
            <!-- Contact Info Section -->
            <div class="q-mb-xl">
              <div class="text-h6 q-mb-md">
                <q-icon name="contact_mail" class="q-mr-sm" />
                {{ $t('admin.contact.contactInfo') }}
              </div>
              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <q-input
                    v-model="formData.name"
                    :label="$t('admin.contact.name')"
                    outlined
                    :rules="[val => !!val || $t('admin.forms.required')]"
                    class="q-mb-md"
                  >
                    <template v-slot:prepend>
                      <q-icon name="person" />
                    </template>
                  </q-input>
                </div>
                <div class="col-12">
                  <q-input
                    v-model="formData.email"
                    :label="$t('admin.contact.email')"
                    type="email"
                    outlined
                    :rules="[val => !!val || $t('admin.forms.required'), val => /.+@.+\..+/.test(val) || $t('admin.forms.invalidEmail')]"
                    class="q-mb-md"
                  >
                    <template v-slot:prepend>
                      <q-icon name="email" />
                    </template>
                  </q-input>
                </div>
                <div class="col-12">
                  <q-input
                    v-model="formData.phone"
                    :label="$t('admin.contact.phone')"
                    outlined
                    class="q-mb-md"
                  >
                    <template v-slot:prepend>
                      <q-icon name="phone" />
                    </template>
                  </q-input>
                </div>
              </div>
            </div>

            <q-separator spaced />

            <!-- Message Section -->
            <div class="q-mb-xl">
              <div class="text-h6 q-mb-md">
                <q-icon name="message" class="q-mr-sm" />
                {{ $t('admin.contact.message') }}
              </div>
              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <q-input
                    v-model="formData.message"
                    :label="$t('admin.contact.message')"
                    type="textarea"
                    outlined
                    rows="8"
                    :rules="[val => !!val || $t('admin.forms.required')]"
                    class="q-mb-md"
                  />
                </div>
              </div>
            </div>

            <q-separator spaced />

            <!-- Settings Section -->
            <div class="q-mb-xl">
              <div class="text-h6 q-mb-md">
                <q-icon name="settings" class="q-mr-sm" />
                {{ $t('admin.forms.settings') }}
              </div>
              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <q-select
                    v-model="formData.status"
                    :options="statusOptions"
                    :label="$t('admin.table.status')"
                    outlined
                    emit-value
                    map-options
                    class="q-mb-md"
                  >
                    <template v-slot:prepend>
                      <q-icon name="flag" />
                    </template>
                  </q-select>
                </div>
                <div class="col-12">
                  <q-input
                    v-model.number="formData.likes"
                    :label="$t('admin.contact.likes')"
                    type="number"
                    min="0"
                    outlined
                    readonly
                    class="q-mb-md"
                    style="max-width: 150px;"
                  >
                    <template v-slot:prepend>
                      <q-icon name="thumb_up" />
                    </template>
                  </q-input>
                  <div class="text-caption text-grey q-mt-xs">
                    {{ $t('admin.contact.likesReadonly') }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Form Actions -->
            <div class="row q-gutter-sm q-mt-lg">
              <q-btn
                type="submit"
                color="primary"
                :label="$t('admin.actions.save')"
                :loading="loading"
                icon="save"
              />
              <q-btn
                outline
                color="grey-7"
                :label="$t('admin.actions.cancel')"
                :to="{ name: 'AdminContactMessages' }"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '../../../layouts/AdminLayout.vue'
import { useAdminContactMessages } from '@/composables/useAdminApi'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { loading, error, fetchMessage, updateMessage } = useAdminContactMessages()

const formData = ref({
  name: '',
  email: '',
  phone: '',
  message: '',
  status: 'pending' as 'pending' | 'approved' | 'rejected',
  likes: 0
})

const statusOptions = computed(() => [
  { label: t('admin.filters.pending'), value: 'pending' },
  { label: t('admin.filters.approved'), value: 'approved' },
  { label: t('admin.filters.rejected'), value: 'rejected' }
])

const handleSubmit = async () => {
  try {
    const id = parseInt(route.params.id as string)
    await updateMessage(id, {
      name: formData.value.name,
      email: formData.value.email,
      phone: formData.value.phone || '',
      message: formData.value.message,
      status: formData.value.status
    })
    router.push('/management/landing/contact-messages')
  } catch (err: any) {
    console.error('Update error:', err)
  }
}

onMounted(async () => {
  const id = parseInt(route.params.id as string)
  if (id) {
    try {
      const message = await fetchMessage(id)
      formData.value = {
        name: message.name || '',
        email: message.email || '',
        phone: message.phone || '',
        message: message.message || '',
        status: message.status || 'pending',
        likes: message.likes || 0
      }
    } catch (err: any) {
      console.error('Failed to load message:', err)
    }
  }
})
</script>

<style scoped>
.admin-form :deep(.q-input),
.admin-form :deep(.q-file),
.admin-form :deep(.q-select) {
  max-width: 600px;
}

.admin-form :deep(.q-textarea) {
  max-width: 800px;
}
</style>
