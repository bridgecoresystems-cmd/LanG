<template>
  <AdminLayout>
    <div class="admin-page">
      <!-- Page Header -->
      <div class="row items-center q-mb-lg">
        <div class="col">
          <h1 class="text-h4 q-ma-none">{{ $t('admin.actions.edit') }} {{ $t('admin.courses.subCategories') }}</h1>
        </div>
        <div class="col-auto">
          <q-btn
            outline
            color="grey-7"
            icon="arrow_back"
            :label="$t('common.back')"
            :to="{ name: 'AdminCourseSubCategories' }"
          />
        </div>
      </div>

      <!-- Loading State -->
      <q-inner-loading :showing="(loading && !formData.name_tm) || loadingCategories">
        <q-spinner size="50px" color="primary" />
      </q-inner-loading>

      <!-- Error Banner -->
      <q-banner v-if="error" class="bg-negative text-white q-mb-md">
        {{ error }}
      </q-banner>

      <!-- Form Card -->
      <q-card v-if="(!loading || formData.name_tm) && !loadingCategories" flat bordered>
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

            <!-- Basic Info Section -->
            <div class="q-mb-xl">
              <div class="text-h6 q-mb-md">
                <q-icon name="info" class="q-mr-sm" />
                {{ $t('admin.forms.basicInfo') }}
              </div>
              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <q-select
                    v-model="formData.category"
                    :options="categories"
                    :label="$t('admin.courses.category')"
                    option-label="name"
                    option-value="id"
                    emit-value
                    map-options
                    outlined
                    :rules="[val => !!val || $t('admin.forms.required')]"
                    use-input
                    input-debounce="300"
                    @filter="filterCategories"
                    class="q-mb-md"
                  >
                    <template v-slot:prepend>
                      <q-icon name="category" />
                    </template>
                  </q-select>
                </div>
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
                :to="{ name: 'AdminCourseSubCategories' }"
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
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '../../../layouts/AdminLayout.vue'
import { useAdminCourseSubCategories, useAdminCourseCategories } from '@/composables/useAdminApi'

const router = useRouter()
const route = useRoute()
const { t, locale } = useI18n()
const { loading, error, fetchSubCategory, updateSubCategory } = useAdminCourseSubCategories()
const { loading: loadingCategories, fetchCategories } = useAdminCourseCategories()

const categories = ref<any[]>([])
const allCategories = ref<any[]>([])

const previewImage = ref<string | null>(null)
const currentImage = ref<string | null>(null)

const formData = ref({
  image: null as File | null,
  category: null as number | null,
  name_tm: '',
  name_ru: '',
  name_en: '',
  description_tm: '',
  description_ru: '',
  description_en: '',
  order: 0,
  is_active: true
})

const getCategoryName = (cat: any) => {
  if (locale.value === 'tm' && cat.name_tm) return cat.name_tm
  if (locale.value === 'ru' && cat.name_ru) return cat.name_ru
  if (locale.value === 'en' && cat.name_en) return cat.name_en
  return cat.name_tm || cat.name_ru || cat.name_en || '-'
}

const filterCategories = (val: string, update: (callback: () => void) => void) => {
  if (val === '') {
    update(() => {
      categories.value = allCategories.value.map(cat => ({
        ...cat,
        name: getCategoryName(cat)
      }))
    })
    return
  }

  update(() => {
    const needle = val.toLowerCase()
    categories.value = allCategories.value
      .filter(cat => {
        const name = getCategoryName(cat).toLowerCase()
        return name.includes(needle)
      })
      .map(cat => ({
        ...cat,
        name: getCategoryName(cat)
      }))
  })
}

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

const loadSubCategory = async () => {
  const id = parseInt(route.params.id as string)
  try {
    const data = await fetchSubCategory(id)
    formData.value = {
      image: null,
      category: data.category_id || null,
      name_tm: data.name_tm || '',
      name_ru: data.name_ru || '',
      name_en: data.name_en || '',
      description_tm: data.description_tm || '',
      description_ru: data.description_ru || '',
      description_en: data.description_en || '',
      order: data.order || 0,
      is_active: data.is_active !== undefined ? data.is_active : true
    }
    if (data.image) {
      currentImage.value = data.image
    }
  } catch (err) {
    console.error('Load subcategory error:', err)
  }
}

const handleSubmit = async () => {
  if (!formData.value.category) return
  const id = parseInt(route.params.id as string)
  try {
    const formDataToSend = new FormData()
    
    if (formData.value.image) {
      formDataToSend.append('image', formData.value.image)
    }
    formDataToSend.append('category', formData.value.category.toString())
    formDataToSend.append('name_tm', formData.value.name_tm)
    formDataToSend.append('name_ru', formData.value.name_ru)
    formDataToSend.append('name_en', formData.value.name_en)
    formDataToSend.append('description_tm', formData.value.description_tm)
    formDataToSend.append('description_ru', formData.value.description_ru)
    formDataToSend.append('description_en', formData.value.description_en)
    formDataToSend.append('order', formData.value.order.toString())
    formDataToSend.append('is_active', formData.value.is_active.toString())
    
    await updateSubCategory(id, formDataToSend)
    router.push('/management/course-subcategories')
  } catch (err) {
    console.error('Update subcategory error:', err)
  }
}

onMounted(async () => {
  await Promise.all([
    loadSubCategory(),
    (async () => {
      try {
        const response = await fetchCategories()
        const cats = Array.isArray(response) ? response : response.results || []
        allCategories.value = cats
        categories.value = cats.map(cat => ({
          ...cat,
          name: getCategoryName(cat)
        }))
      } catch (err) {
        console.error('Load categories error:', err)
      }
    })()
  ])
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
