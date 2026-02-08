<template>
  <AdminLayout>
    <div class="admin-page">
      <!-- Page Header -->
      <div class="row items-center q-mb-lg">
        <div class="col">
          <h1 class="text-h4 q-ma-none">{{ $t('admin.actions.add') }} {{ $t('admin.models.news') }}</h1>
        </div>
        <div class="col-auto">
          <q-btn
            outline
            color="grey-7"
            icon="arrow_back"
            :label="$t('common.back')"
            :to="{ name: 'AdminNews' }"
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

            <!-- Titles Section -->
            <div class="q-mb-xl">
              <div class="text-h6 q-mb-md">
                <q-icon name="title" class="q-mr-sm" />
                {{ $t('admin.forms.titles') }}
              </div>
              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <q-input
                    v-model="formData.title_tm"
                    :label="$t('admin.forms.titleTm')"
                    outlined
                    :rules="[val => !!val || $t('admin.forms.required')]"
                    class="q-mb-md"
                  />
                </div>
                <div class="col-12">
                  <q-input
                    v-model="formData.title_ru"
                    :label="$t('admin.forms.titleRu')"
                    outlined
                    :rules="[val => !!val || $t('admin.forms.required')]"
                    class="q-mb-md"
                  />
                </div>
                <div class="col-12">
                  <q-input
                    v-model="formData.title_en"
                    :label="$t('admin.forms.titleEn')"
                    outlined
                    :rules="[val => !!val || $t('admin.forms.required')]"
                    class="q-mb-md"
                  />
                </div>
              </div>
            </div>

            <q-separator spaced />

            <!-- Content Section -->
            <div class="q-mb-xl">
              <div class="text-h6 q-mb-md">
                <q-icon name="description" class="q-mr-sm" />
                {{ $t('admin.forms.content') }}
              </div>
              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <q-input
                    v-model="formData.content_tm"
                    :label="$t('admin.forms.contentTm')"
                    type="textarea"
                    outlined
                    rows="6"
                    :rules="[val => !!val || $t('admin.forms.required')]"
                    class="q-mb-md"
                  />
                </div>
                <div class="col-12">
                  <q-input
                    v-model="formData.content_ru"
                    :label="$t('admin.forms.contentRu')"
                    type="textarea"
                    outlined
                    rows="6"
                    :rules="[val => !!val || $t('admin.forms.required')]"
                    class="q-mb-md"
                  />
                </div>
                <div class="col-12">
                  <q-input
                    v-model="formData.content_en"
                    :label="$t('admin.forms.contentEn')"
                    type="textarea"
                    outlined
                    rows="6"
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
                  <q-checkbox
                    v-model="formData.is_published"
                    :label="$t('admin.forms.published')"
                  />
                </div>
                <div class="col-12">
                  <q-checkbox
                    v-model="formData.is_featured"
                    :label="$t('admin.forms.featured')"
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
                :to="{ name: 'AdminNews' }"
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
import AdminLayout from '../../../layouts/AdminLayout.vue'
import { useAdminNews } from '@/composables/useAdminApi'

const router = useRouter()
const { loading, error, createNews } = useAdminNews()
const previewImage = ref<string | null>(null)

const formData = ref({
  image: null as File | null,
  title_tm: '',
  title_ru: '',
  title_en: '',
  content_tm: '',
  content_ru: '',
  content_en: '',
  is_published: false,
  is_featured: false
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
  loading.value = true
  error.value = null

  try {
    const formDataToSend = new FormData()
    
    if (formData.value.image) {
      formDataToSend.append('image', formData.value.image)
    }
    formDataToSend.append('title_tm', formData.value.title_tm)
    formDataToSend.append('title_ru', formData.value.title_ru)
    formDataToSend.append('title_en', formData.value.title_en)
    formDataToSend.append('content_tm', formData.value.content_tm)
    formDataToSend.append('content_ru', formData.value.content_ru)
    formDataToSend.append('content_en', formData.value.content_en)
    formDataToSend.append('is_published', formData.value.is_published.toString())
    formDataToSend.append('is_featured', formData.value.is_featured.toString())
    
    await createNews(formDataToSend)
    
    router.push('/management/landing/news')
  } catch (err: any) {
    error.value = err.response?.data?.detail || err.message || 'Failed to create news'
  } finally {
    loading.value = false
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
