<template>
  <AdminLayout>
    <div class="admin-page">
      <!-- Page Header -->
      <div class="row items-center q-mb-lg">
        <div class="col">
          <h1 class="text-h4 q-ma-none">{{ $t('admin.actions.edit') }} {{ $t('admin.models.news') }}</h1>
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

      <!-- Loading State -->
      <q-inner-loading :showing="loading && !formData.title_tm">
        <q-spinner size="50px" color="primary" />
      </q-inner-loading>

      <!-- Error Banner -->
      <q-banner v-if="error" class="bg-negative text-white q-mb-md">
        {{ error }}
      </q-banner>

      <!-- Form Card -->
      <q-card v-if="!loading || formData.title_tm" flat bordered>
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
              <div v-if="previewImage || currentImage" class="q-mt-md">
                <q-img
                  :src="(previewImage || currentImage) as string"
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
                <div class="col-12">
                  <q-input
                    :model-value="formData.views || 0"
                    :label="$t('admin.table.views')"
                    type="number"
                    outlined
                    readonly
                    class="q-mb-md"
                    style="max-width: 150px;"
                  >
                    <template v-slot:append>
                      <q-icon name="visibility" />
                    </template>
                  </q-input>
                  <div class="text-caption text-grey q-mt-xs">
                    {{ $t('admin.forms.viewsHint') }}
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
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminLayout from '../../../layouts/AdminLayout.vue'
import { useAdminNews } from '@/composables/useAdminApi'

const route = useRoute()
const router = useRouter()
const { loading, error, fetchNewsItem, updateNews } = useAdminNews()
const previewImage = ref<string | null>(null)
const currentImage = ref<string | null>(null)

const formData = ref({
  image: null as File | null,
  title_tm: '',
  title_ru: '',
  title_en: '',
  content_tm: '',
  content_ru: '',
  content_en: '',
  is_published: false,
  is_featured: false,
  views: 0
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
    const id = parseInt(route.params.id as string)
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
    
    await updateNews(id, formDataToSend)
    router.push('/management/landing/news')
  } catch (err: any) {
    error.value = err.response?.data?.detail || err.message || 'Failed to update news'
  }
}

onMounted(async () => {
  const id = parseInt(route.params.id as string)
  if (id) {
    try {
      const newsItem = await fetchNewsItem(id)
      formData.value.title_tm = newsItem.title_tm || ''
      formData.value.title_ru = newsItem.title_ru || ''
      formData.value.title_en = newsItem.title_en || ''
      formData.value.content_tm = newsItem.content_tm || ''
      formData.value.content_ru = newsItem.content_ru || ''
      formData.value.content_en = newsItem.content_en || ''
      formData.value.is_published = newsItem.is_published !== undefined ? newsItem.is_published : false
      formData.value.is_featured = newsItem.is_featured !== undefined ? newsItem.is_featured : false
      formData.value.views = newsItem.views || 0
      if (newsItem.image) {
        currentImage.value = newsItem.image
      }
    } catch (err: any) {
      error.value = err.response?.data?.detail || err.message || 'Failed to load news'
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
