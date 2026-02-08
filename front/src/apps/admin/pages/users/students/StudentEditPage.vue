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
        <h1 class="text-h4 q-ma-none">{{ $t('admin.actions.edit') }} {{ $t('admin.models.students') }}</h1>
      </div>

      <q-form v-if="!initialLoading" @submit="handleSubmit" class="admin-form">
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
                  v-model="formData.email"
                  type="email"
                  :label="$t('admin.forms.email') + ' *'"
                  outlined
                  dense
                  class="q-mb-md"
                  :rules="[val => !!val || 'Field is required']"
                />
                <q-input
                  v-model="formData.password"
                  type="password"
                  :label="$t('admin.forms.password')"
                  outlined
                  dense
                  class="q-mb-md"
                  :placeholder="$t('admin.forms.passwordPlaceholder')"
                  hint="Leave empty to keep current password"
                  @input="passwordChanged = true"
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
                      :label="$t('admin.forms.firstName')"
                      outlined
                      dense
                      class="q-mb-md"
                    />
                  </div>
                  <div class="col-6">
                    <q-input
                      v-model="formData.last_name"
                      :label="$t('admin.forms.lastName')"
                      outlined
                      dense
                      class="q-mb-md"
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
                <div v-if="previewAvatar || currentImage" class="q-mb-md flex flex-center">
                  <q-avatar size="100px" bordered>
                    <img :src="previewAvatar || currentImage" />
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

      <q-inner-loading :showing="loading || initialLoading">
        <q-spinner-gears size="50px" color="primary" />
      </q-inner-loading>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '../../../layouts/AdminLayout.vue'
import { useAdminUsers, useAdminStudents } from '@/composables/useAdminApi'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { updateUser } = useAdminUsers()
const { loading, error, fetchStudent, updateStudent } = useAdminStudents()

const initialLoading = ref(true)
const passwordChanged = ref(false)
const previewAvatar = ref<string | null>(null)
const currentImage = ref<string | null>(null)

const formData = ref({
  username: '',
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  phone: '',
  gender: null as string | null,
  avatar: null as any,
  parent1_name: '',
  parent1_phone: '',
  parent2_name: '',
  parent2_phone: '',
  rfid_uid: ''
})

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
    const id = parseInt(route.params.id as string)
    const student = await fetchStudent(id)
    const userId = student.user_id || student.id

    // Update User
    const userFormData = new FormData()
    userFormData.append('username', formData.value.username)
    userFormData.append('email', formData.value.email)
    if (formData.value.first_name) userFormData.append('first_name', formData.value.first_name)
    if (formData.value.last_name) userFormData.append('last_name', formData.value.last_name)
    if (formData.value.phone) userFormData.append('phone', formData.value.phone)
    if (formData.value.gender) userFormData.append('gender', formData.value.gender)
    if (formData.value.password) userFormData.append('password', formData.value.password)
    if (formData.value.avatar instanceof File) userFormData.append('avatar', formData.value.avatar)

    await updateUser(userId, userFormData)

    // Update Student Profile
    const studentFormData = new FormData()
    studentFormData.append('parent1_name', formData.value.parent1_name || '')
    studentFormData.append('parent1_phone', formData.value.parent1_phone || '')
    studentFormData.append('parent2_name', formData.value.parent2_name || '')
    studentFormData.append('parent2_phone', formData.value.parent2_phone || '')
    studentFormData.append('rfid_uid', formData.value.rfid_uid || '')

    await updateStudent(id, studentFormData)
    router.push('/management/students')
  } catch (err: any) {
    console.error('Update student error:', err)
  }
}

onMounted(async () => {
  const id = parseInt(route.params.id as string)
  if (id) {
    try {
      const student = await fetchStudent(id)
      formData.value.username = student.username || ''
      formData.value.email = student.email || ''
      formData.value.first_name = student.first_name || ''
      formData.value.last_name = student.last_name || ''
      formData.value.phone = student.phone || ''
      formData.value.parent1_name = student.parent1_name || ''
      formData.value.parent1_phone = student.parent1_phone || ''
      formData.value.parent2_name = student.parent2_name || ''
      formData.value.parent2_phone = student.parent2_phone || ''
      formData.value.gender = student.gender || null
      formData.value.rfid_uid = student.rfid_uid || ''
      if (student.avatar_url) {
        currentImage.value = student.avatar_url
      }
    } catch (err: any) {
      console.error('Fetch student error:', err)
    } finally {
      initialLoading.value = false
    }
  }
})
</script>

<style scoped>
.admin-form {
  max-width: 1000px;
  margin: 0 auto;
}
</style>
