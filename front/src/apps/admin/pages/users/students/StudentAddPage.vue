<template>
  <AdminLayout>
    <div class="admin-page">
      <div class="row items-center q-mb-md">
        <q-btn
          flat
          round
          dense
          icon="arrow_back"
          @click="router.back()"
          class="q-mr-sm"
        />
        <h1 class="text-h4 q-ma-none">{{ $t('admin.actions.add') }} {{ $t('admin.models.student') }}</h1>
      </div>

      <q-form @submit="handleSubmit" class="admin-form">
        <div class="row q-col-gutter-md">
          <!-- Account Info -->
          <div class="col-12 col-md-6">
            <q-card flat bordered>
              <q-card-section>
                <div class="text-h6 q-mb-md">{{ $t('admin.forms.accountInfo') }}</div>
                <q-input
                  v-model="formData.username"
                  :label="$t('admin.forms.username') + ' *'"
                  outlined
                  dense
                  class="q-mb-md"
                  :rules="[val => !!val || 'Field is required']"
                />
                <q-input
                  v-model="formData.password"
                  type="password"
                  :label="$t('admin.forms.password') + ' *'"
                  outlined
                  dense
                  class="q-mb-md"
                  :rules="[val => !!val || 'Field is required', val => val.length >= 8 || 'Min 8 chars']"
                />
                <q-input
                  v-model="formData.password_confirmation"
                  type="password"
                  :label="$t('admin.forms.passwordConfirmation') + ' *'"
                  outlined
                  dense
                  class="q-mb-md"
                  :rules="[
                    val => !!val || 'Field is required',
                    val => val === formData.password || 'Passwords do not match'
                  ]"
                />
              </q-card-section>
            </q-card>
          </div>

          <!-- Personal Info -->
          <div class="col-12 col-md-6">
            <q-card flat bordered>
              <q-card-section>
                <div class="text-h6 q-mb-md">{{ $t('admin.forms.personalInfo') }}</div>
                <div class="row q-col-gutter-sm">
                  <div class="col-6">
                    <q-input
                      v-model="formData.first_name"
                      :label="$t('admin.forms.firstName') + ' *'"
                      outlined
                      dense
                      class="q-mb-md"
                      :rules="[val => !!val || 'Field is required']"
                    />
                  </div>
                  <div class="col-6">
                    <q-input
                      v-model="formData.last_name"
                      :label="$t('admin.forms.lastName') + ' *'"
                      outlined
                      dense
                      class="q-mb-md"
                      :rules="[val => !!val || 'Field is required']"
                    />
                  </div>
                </div>
                <q-select
                  v-model="formData.gender"
                  :options="[
                    { label: $t('admin.forms.genderBoy'), value: 'boy' },
                    { label: $t('admin.forms.genderGirl'), value: 'girl' }
                  ]"
                  :label="$t('admin.forms.gender')"
                  outlined
                  dense
                  class="q-mb-md"
                  emit-value
                  map-options
                />
                <q-input
                  v-model="formData.email"
                  type="email"
                  :label="$t('admin.forms.email') + ' *'"
                  outlined
                  dense
                  class="q-mb-md"
                  :rules="[val => !!val || 'Field is required']"
                />
                <q-input
                  v-model="formData.phone"
                  :label="$t('admin.forms.phone')"
                  outlined
                  dense
                  class="q-mb-md"
                  mask="+### ## ######"
                  unmasked-value
                />
                <q-file
                  v-model="formData.avatar"
                  :label="$t('admin.forms.photo')"
                  outlined
                  dense
                  accept="image/*"
                  class="q-mb-md"
                  @update:model-value="handleAvatarUpdate"
                >
                  <template v-slot:prepend>
                    <q-icon name="attach_file" />
                  </template>
                </q-file>
                <div v-if="previewAvatar" class="q-mb-md flex flex-center">
                  <q-avatar size="100px" bordered>
                    <img :src="previewAvatar" />
                  </q-avatar>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Parents Info -->
          <div class="col-12 col-md-6">
            <q-card flat bordered>
              <q-card-section>
                <div class="text-h6 q-mb-md">{{ $t('admin.students.parentsInfo') }}</div>
                <q-input
                  v-model="formData.parent1_name"
                  :label="$t('admin.students.parent1Name')"
                  outlined
                  dense
                  class="q-mb-md"
                />
                <q-input
                  v-model="formData.parent1_phone"
                  :label="$t('admin.students.parent1Phone')"
                  outlined
                  dense
                  class="q-mb-md"
                  mask="+### ## ######"
                  unmasked-value
                />
                <q-separator class="q-my-md" />
                <q-input
                  v-model="formData.parent2_name"
                  :label="$t('admin.students.parent2Name')"
                  outlined
                  dense
                  class="q-mb-md"
                />
                <q-input
                  v-model="formData.parent2_phone"
                  :label="$t('admin.students.parent2Phone')"
                  outlined
                  dense
                  class="q-mb-md"
                  mask="+### ## ######"
                  unmasked-value
                />
              </q-card-section>
            </q-card>
          </div>

          <!-- RFID -->
          <div class="col-12 col-md-6">
            <q-card flat bordered class="bg-blue-1">
              <q-card-section>
                <div class="text-h6 q-mb-md text-primary">
                  <q-icon name="credit_card" /> {{ $t('admin.students.rfid') || 'RFID' }}
                </div>
                <q-input
                  v-model="formData.rfid_uid"
                  label="RFID UID"
                  outlined
                  dense
                  class="q-mb-md bg-white"
                  hint="Приложите браслет к считывателю или введите UID вручную"
                >
                  <template v-slot:prepend>
                    <q-icon name="sensors" />
                  </template>
                </q-input>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <div class="row q-mt-lg">
          <q-btn
            type="submit"
            color="primary"
            :label="$t('admin.actions.save')"
            :loading="loading"
            class="q-px-xl"
          />
          <q-btn
            flat
            :label="$t('admin.actions.cancel')"
            class="q-ml-md"
            @click="router.back()"
          />
        </div>
      </q-form>

      <q-inner-loading :showing="loading">
        <q-spinner-gears size="50px" color="primary" />
      </q-inner-loading>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '../../../layouts/AdminLayout.vue'
import { useAdminStudents } from '@/composables/useAdminApi'

const router = useRouter()
const { t } = useI18n()
const { loading, error, createStudent } = useAdminStudents()

const formData = ref({
  username: '',
  password: '',
  password_confirmation: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  gender: null as string | null,
  avatar: null as any,
  parent1_name: '',
  parent1_phone: '',
  parent2_name: '',
  parent2_phone: '',
  rfid_uid: ''
})

const previewAvatar = ref<string | null>(null)

const handleAvatarUpdate = (file: File) => {
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      previewAvatar.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  } else {
    previewAvatar.value = null
  }
}

const handleSubmit = async () => {
  try {
    const dataToSend = new FormData()
    
    // Add all fields to FormData
    Object.keys(formData.value).forEach(key => {
      const value = (formData.value as any)[key]
      if (value !== null && value !== undefined && value !== '') {
        dataToSend.append(key, value)
      }
    })

    await createStudent(dataToSend)
    router.push('/management/students')
  } catch (err: any) {
    console.error('Create student error:', err)
  }
}
</script>

<style scoped>
.admin-form {
  max-width: 1000px;
  margin: 0 auto;
}
</style>
