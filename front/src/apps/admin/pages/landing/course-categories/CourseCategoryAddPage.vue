<template>
  <AdminLayout>
    <div class="admin-page">
      <!-- Page Header -->
      <div class="row items-center q-mb-lg">
        <div class="col">
          <h1 class="text-h4 q-ma-none">{{ $t('admin.actions.add') }} {{ $t('admin.courses.categories') }}</h1>
        </div>
        <div class="col-auto">
          <q-btn
            outline
            color="grey-7"
            icon="arrow_back"
            :label="$t('common.back')"
            :to="{ name: 'AdminCourseCategories' }"
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
            <!-- Image Section -->
            <div class="q-mb-xl">
              <div class="text-h6 q-mb-md">
                <q-icon name="image" class="q-mr-sm" />
                {{ $t('admin.forms.image') }}
              </div>
              <q-file
                v-model="formData.image"
                :label="$t('admin.forms.image')"
                accept="image/*"
                outlined
                @update:model-value="handleImageChange"
                class="q-mb-md"
              >
                <template v-slot:prepend>
                  <q-icon name="attach_file" />
                </template>
              </q-file>
              <div v-if="previewImage" class="q-mt-md">
                <q-img
                  :src="previewImage"
                  style="max-width: 300px; max-height: 200px;"
                  class="rounded-borders"
                />
              </div>
            </div>

            <q-separator spaced />

            <!-- Basic Info Section -->
            <div class="q-mb-xl">
              <div class="text-h6 q-mb-md">
                <q-icon name="info" class="q-mr-sm" />
                {{ $t('admin.forms.basicInfo') }}
              </div>
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-4">
                  <q-input
                    v-model.number="formData.order"
                    :label="$t('admin.forms.order')"
                    type="number"
                    min="0"
                    outlined
                    class="q-mb-md"
                  />
                </div>
                <div class="col-12">
                  <q-checkbox
                    v-model="formData.is_active"
                    :label="$t('admin.forms.active')"
                  />
                </div>
              </div>
            </div>

            <q-separator spaced />

            <!-- Names Section -->
            <div class="q-mb-xl">
              <div class="text-h6 q-mb-md">
                <q-icon name="title" class="q-mr-sm" />
                {{ $t('admin.forms.names') }}
              </div>
              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <q-input
                    v-model="formData.name_tm"
                    :label="$t('admin.forms.nameTm')"
                    outlined
                    :rules="[val => !!val || $t('admin.forms.required')]"
                    class="q-mb-md"
                  />
                </div>
                <div class="col-12">
                  <q-input
                    v-model="formData.name_ru"
                    :label="$t('admin.forms.nameRu')"
                    outlined
                    :rules="[val => !!val || $t('admin.forms.required')]"
                    class="q-mb-md"
                  />
                </div>
                <div class="col-12">
                  <q-input
                    v-model="formData.name_en"
                    :label="$t('admin.forms.nameEn')"
                    outlined
                    :rules="[val => !!val || $t('admin.forms.required')]"
                    class="q-mb-md"
                  />
                </div>
              </div>
            </div>

            <q-separator spaced />

            <!-- Descriptions Section -->
            <div class="q-mb-xl">
              <div class="text-h6 q-mb-md">
                <q-icon name="description" class="q-mr-sm" />
                {{ $t('admin.forms.descriptions') }}
              </div>
              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <q-input
                    v-model="formData.description_tm"
                    :label="$t('admin.forms.descriptionTm')"
                    type="textarea"
                    outlined
                    rows="4"
                    class="q-mb-md"
                  />
                </div>
                <div class="col-12">
                  <q-input
                    v-model="formData.description_ru"
                    :label="$t('admin.forms.descriptionRu')"
                    type="textarea"
                    outlined
                    rows="4"
                    class="q-mb-md"
                  />
                </div>
                <div class="col-12">
                  <q-input
                    v-model="formData.description_en"
                    :label="$t('admin.forms.descriptionEn')"
                    type="textarea"
                    outlined
                    rows="4"
                    class="q-mb-md"
                  />
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
                :to="{ name: 'AdminCourseCategories' }"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '../../../layouts/AdminLayout.vue'
import { useAdminCourseCategories } from '@/composables/useAdminApi'

const router = useRouter()
const { t } = useI18n()
const { loading, error, createCategory } = useAdminCourseCategories()
const previewImage = ref<string | null>(null)

const formData = ref({
  image: null as File | null,
  name_tm: '',
  name_ru: '',
  name_en: '',
  description_tm: '',
  description_ru: '',
  description_en: '',
  order: 0,
  is_active: true
})

const handleImageChange = (file: File | null) => {
  if (file) {
    formData.value.image = file
    const reader = new FileReader()
    reader.onload = (e) => {
      previewImage.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  } else {
    previewImage.value = null
  }
}

const handleSubmit = async () => {
  try {
    const formDataToSend = new FormData()
    
    if (formData.value.image) {
      formDataToSend.append('image', formData.value.image)
    }
    formDataToSend.append('name_tm', formData.value.name_tm)
    formDataToSend.append('name_ru', formData.value.name_ru)
    formDataToSend.append('name_en', formData.value.name_en)
    formDataToSend.append('description_tm', formData.value.description_tm)
    formDataToSend.append('description_ru', formData.value.description_ru)
    formDataToSend.append('description_en', formData.value.description_en)
    formDataToSend.append('order', formData.value.order.toString())
    formDataToSend.append('is_active', formData.value.is_active.toString())
    
    await createCategory(formDataToSend)
    router.push('/management/course-categories')
  } catch (err) {
    console.error('Create category error:', err)
  }
}
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
