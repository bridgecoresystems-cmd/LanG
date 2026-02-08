<template>
  <AdminLayout>
    <div class="admin-page">
      <!-- Page Header -->
      <div class="row items-center q-mb-lg">
        <div class="col">
          <h1 class="text-h4 q-ma-none">{{ $t('admin.actions.edit') }} {{ $t('admin.models.courses') }}</h1>
        </div>
        <div class="col-auto">
          <q-btn
            outline
            color="grey-7"
            icon="arrow_back"
            :label="$t('common.back')"
            :to="{ name: 'AdminCourses' }"
          />
        </div>
      </div>

      <!-- Loading State -->
      <q-inner-loading :showing="loading && !formData.name_tm">
        <q-spinner size="50px" color="primary" />
      </q-inner-loading>

      <!-- Error Banner -->
      <q-banner v-if="error" class="bg-negative text-white q-mb-md">
        {{ error }}
      </q-banner>

      <!-- Form Card -->
      <q-card v-if="!loading || formData.name_tm" flat bordered>
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
                    @update:model-value="loadSubcategories"
                    class="q-mb-md"
                  >
                    <template v-slot:prepend>
                      <q-icon name="category" />
                    </template>
                  </q-select>
                </div>
                <div class="col-12">
                  <q-select
                    v-model="formData.subcategory"
                    :options="subcategories"
                    :label="$t('admin.courses.subCategory')"
                    option-label="name"
                    option-value="id"
                    emit-value
                    map-options
                    outlined
                    :rules="[val => !!val || $t('admin.forms.required')]"
                    :disable="!formData.category"
                    use-input
                    input-debounce="300"
                    @filter="filterSubcategories"
                    class="q-mb-md"
                  >
                    <template v-slot:prepend>
                      <q-icon name="subdirectory_arrow_right" />
                    </template>
                  </q-select>
                </div>
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
                    v-model="formData.name_tm"
                    :label="$t('admin.forms.titleTm')"
                    outlined
                    :rules="[val => !!val || $t('admin.forms.required')]"
                    class="q-mb-md"
                  />
                </div>
                <div class="col-12">
                  <q-input
                    v-model="formData.name_ru"
                    :label="$t('admin.forms.titleRu')"
                    outlined
                    :rules="[val => !!val || $t('admin.forms.required')]"
                    class="q-mb-md"
                  />
                </div>
                <div class="col-12">
                  <q-input
                    v-model="formData.name_en"
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
                    v-model="formData.description_tm"
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
                    v-model="formData.description_ru"
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
                    v-model="formData.description_en"
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

            <!-- Pricing Section -->
            <div class="q-mb-xl">
              <div class="text-h6 q-mb-md">
                <q-icon name="attach_money" class="q-mr-sm" />
                {{ $t('admin.courses.pricing') }}
              </div>
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <q-input
                    v-model.number="formData.price"
                    :label="$t('admin.courses.price') + ' (💎)'"
                    type="number"
                    min="0"
                    step="0.01"
                    outlined
                    :rules="[val => val >= 0 || $t('admin.forms.required')]"
                    class="q-mb-md"
                  >
                    <template v-slot:prepend>
                      <q-icon name="payments" />
                    </template>
                  </q-input>
                </div>
                <div class="col-12 col-md-6">
                  <q-input
                    v-model.number="formData.discount_price"
                    :label="$t('admin.courses.discountPrice') + ' (💎)'"
                    type="number"
                    min="0"
                    step="0.01"
                    outlined
                    class="q-mb-md"
                  >
                    <template v-slot:prepend>
                      <q-icon name="local_offer" />
                    </template>
                  </q-input>
                </div>
              </div>
            </div>

            <q-separator spaced />

            <!-- Details Section -->
            <div class="q-mb-xl">
              <div class="text-h6 q-mb-md">
                <q-icon name="settings" class="q-mr-sm" />
                {{ $t('admin.courses.details') }}
              </div>
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <q-input
                    v-model.number="formData.duration_weeks"
                    :label="$t('admin.courses.duration') + ' (' + $t('admin.courses.weeks') + ')'"
                    type="number"
                    min="1"
                    outlined
                    class="q-mb-md"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <q-input
                    v-model.number="formData.hours_per_week"
                    :label="$t('admin.courses.hoursPerWeek')"
                    type="number"
                    min="1"
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
                :to="{ name: 'AdminCourses' }"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '../../../layouts/AdminLayout.vue'
import { useAdminCourses, useAdminCourseCategories, useAdminCourseSubCategories } from '@/composables/useAdminApi'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const { loading, error, fetchCourse, updateCourse } = useAdminCourses()
const { fetchCategories } = useAdminCourseCategories()
const { fetchSubCategories } = useAdminCourseSubCategories()

const categories = ref<any[]>([])
const allCategories = ref<any[]>([])
const subcategories = ref<any[]>([])
const allSubcategories = ref<any[]>([])
const previewImage = ref<string | null>(null)
const currentImage = ref<string | null>(null)

const getCategoryName = (cat: any) => {
  if (locale.value === 'tm' && cat.name_tm) return cat.name_tm
  if (locale.value === 'ru' && cat.name_ru) return cat.name_ru
  if (locale.value === 'en' && cat.name_en) return cat.name_en
  return cat.name_tm || cat.name_ru || cat.name_en || '-'
}

const getSubCategoryName = (subcat: any) => {
  if (locale.value === 'tm' && subcat.name_tm) return subcat.name_tm
  if (locale.value === 'ru' && subcat.name_ru) return subcat.name_ru
  if (locale.value === 'en' && subcat.name_en) return subcat.name_en
  return subcat.name_tm || subcat.name_ru || subcat.name_en || '-'
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

const filterSubcategories = (val: string, update: (callback: () => void) => void) => {
  if (val === '') {
    update(() => {
      subcategories.value = allSubcategories.value.map(subcat => ({
        ...subcat,
        name: getSubCategoryName(subcat)
      }))
    })
    return
  }

  update(() => {
    const needle = val.toLowerCase()
    subcategories.value = allSubcategories.value
      .filter(subcat => {
        const name = getSubCategoryName(subcat).toLowerCase()
        return name.includes(needle)
      })
      .map(subcat => ({
        ...subcat,
        name: getSubCategoryName(subcat)
      }))
  })
}

const loadCategories = async () => {
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
}

const loadSubcategories = async () => {
  try {
    const params: any = {}
    if (formData.value.category) {
      params.category = formData.value.category
    }
    const response = await fetchSubCategories(params)
    const subcats = Array.isArray(response) ? response : response.results || []
    allSubcategories.value = subcats
    subcategories.value = subcats.map(subcat => ({
      ...subcat,
      name: getSubCategoryName(subcat)
    }))
  } catch (err) {
    console.error('Load subcategories error:', err)
  }
}

const formData = ref({
  image: null as File | null,
  category: null as number | null,
  subcategory: null as number | null,
  name_tm: '',
  name_ru: '',
  name_en: '',
  description_tm: '',
  description_ru: '',
  description_en: '',
  price: 0,
  discount_price: null as number | null,
  duration_weeks: 12,
  hours_per_week: 4,
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
  if (!formData.value.subcategory) return
  try {
    const id = parseInt(route.params.id as string)
    const formDataToSend = new FormData()
    
    if (formData.value.image) {
      formDataToSend.append('image', formData.value.image)
    }
    formDataToSend.append('subcategory', formData.value.subcategory.toString())
    formDataToSend.append('title_tm', formData.value.name_tm)
    formDataToSend.append('title_ru', formData.value.name_ru)
    formDataToSend.append('title_en', formData.value.name_en)
    formDataToSend.append('description_tm', formData.value.description_tm)
    formDataToSend.append('description_ru', formData.value.description_ru)
    formDataToSend.append('description_en', formData.value.description_en)
    formDataToSend.append('price', formData.value.price.toString())
    if (formData.value.discount_price) {
      formDataToSend.append('discount_price', formData.value.discount_price.toString())
    }
    formDataToSend.append('duration_weeks', formData.value.duration_weeks.toString())
    formDataToSend.append('hours_per_week', formData.value.hours_per_week.toString())
    formDataToSend.append('is_active', formData.value.is_active.toString())
    
    await updateCourse(id, formDataToSend)
    router.push('/management/landing/courses')
  } catch (err: any) {
    error.value = err.response?.data?.detail || err.message || 'Failed to update course'
  }
}

onMounted(async () => {
  await loadCategories()
  const id = parseInt(route.params.id as string)
  if (id) {
    try {
      const course = await fetchCourse(id)
      formData.value.name_tm = course.title_tm || ''
      formData.value.name_ru = course.title_ru || ''
      formData.value.name_en = course.title_en || ''
      formData.value.description_tm = course.description_tm || ''
      formData.value.description_ru = course.description_ru || ''
      formData.value.description_en = course.description_en || ''
      formData.value.price = course.price || 0
      formData.value.discount_price = course.discount_price || null
      formData.value.duration_weeks = course.duration_weeks || 12
      formData.value.hours_per_week = course.hours_per_week || 4
      formData.value.is_active = course.is_active !== undefined ? course.is_active : true
      
      if (course.subcategory_id) {
        formData.value.subcategory = course.subcategory_id
        formData.value.category = course.category_id
        await loadSubcategories()
      }
      if (course.image) {
        currentImage.value = course.image
      }
    } catch (err: any) {
      error.value = err.response?.data?.detail || err.message || 'Failed to load course'
    }
  }
})

watch(() => formData.value.category, () => {
  if (formData.value.category) {
    loadSubcategories()
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
