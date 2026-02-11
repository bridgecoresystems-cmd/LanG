<template>
  <div class="admin-page-content">
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h1 class="text-h4 q-ma-none">Редактировать курс</h1>
      </div>
      <div class="col-auto">
        <q-btn outline color="grey-7" icon="arrow_back" label="Назад" to="/admin/landing/courses" />
      </div>
    </div>

    <q-inner-loading :showing="loading && !form.title_tm">
      <q-spinner size="50px" color="primary" />
    </q-inner-loading>

    <q-card v-if="!loading || form.title_tm" flat bordered class="admin-form-card">
      <q-card-section>
        <q-form @submit.prevent="handleSubmit" class="admin-form">
          <q-select v-model="form.category_id" :options="categoryOptions" label="Категория *" option-label="label" option-value="id" emit-value map-options outlined :rules="[val => !!val || 'Обязательно']" @update:model-value="onCategoryChange" class="q-mb-md" />
          <q-select v-model="form.subcategory_id" :options="subcategoryOptions" label="Подкатегория *" option-label="label" option-value="id" emit-value map-options outlined :rules="[val => !!val || 'Обязательно']" :disable="!form.category_id" class="q-mb-md" />
          <q-input v-model="form.title_tm" label="Название (TM)" outlined :rules="[val => !!val || 'Обязательно']" class="q-mb-md" />
          <q-input v-model="form.title_ru" label="Название (RU)" outlined :rules="[val => !!val || 'Обязательно']" class="q-mb-md" />
          <q-input v-model="form.title_en" label="Название (EN)" outlined class="q-mb-md" />
          <q-input v-model="form.description_tm" label="Описание (TM)" type="textarea" outlined rows="4" :rules="[val => !!val || 'Обязательно']" class="q-mb-md" />
          <q-input v-model="form.description_ru" label="Описание (RU)" type="textarea" outlined rows="4" :rules="[val => !!val || 'Обязательно']" class="q-mb-md" />
          <q-input v-model="form.description_en" label="Описание (EN)" type="textarea" outlined rows="4" class="q-mb-md" />
          <div class="row items-center q-gutter-md q-mb-md">
            <q-img v-if="form.image" :src="form.image" style="width: 80px; height: 80px" fit="cover" class="rounded-borders" />
            <q-file v-model="imageFile" label="Изображение" accept="image/*" outlined @update:model-value="handleImageUpload">
              <template v-slot:prepend><q-icon name="attach_file" /></template>
            </q-file>
          </div>
          <div class="row q-col-gutter-md">
            <div class="col-6"><q-input v-model.number="form.duration_weeks" type="number" label="Недель" outlined min="0" class="q-mb-md" /></div>
            <div class="col-6"><q-input v-model.number="form.hours_per_week" type="number" label="Часов в неделю" outlined min="0" class="q-mb-md" /></div>
          </div>
          <div class="row q-col-gutter-md">
            <div class="col-6"><q-input v-model="form.price" type="number" label="Цена (💎)" outlined :rules="[val => !!val || 'Обязательно']" class="q-mb-md" /></div>
            <div class="col-6"><q-input v-model="form.discount_price" type="number" label="Цена со скидкой (💎)" outlined class="q-mb-md" /></div>
          </div>
          <q-toggle v-model="form.is_active" label="Активен" class="q-mb-md" />
          <div class="row q-gutter-sm q-mt-lg">
            <q-btn type="submit" color="primary" label="Сохранить" :loading="saving" icon="save" />
            <q-btn outline color="grey-7" label="Отмена" to="/admin/landing/courses" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const route = useRoute()
const { locale } = useI18n()
const { getById, update } = useAdminCourses()
const { getAll: getAllCategories } = useAdminCategories()
const { getAll: getAllSubcategories } = useAdminSubcategories()
const { uploadFile } = useUpload()

const categories = ref<any[]>([])
const subcategories = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const imageFile = ref<File | null>(null)

const form = ref({
  category_id: null as number | null,
  subcategory_id: null as number | null,
  title_tm: '',
  title_ru: '',
  title_en: '',
  description_tm: '',
  description_ru: '',
  description_en: '',
  image: '',
  duration_weeks: 0,
  hours_per_week: 0,
  price: '' as string | number,
  discount_price: '' as string | number | null,
  is_active: true
})

const categoryOptions = computed(() =>
  categories.value.map(c => ({ id: c.id, label: (locale.value === 'tm' && c.name_tm) ? c.name_tm : (locale.value === 'ru' && c.name_ru) ? c.name_ru : c.name_tm || c.name_ru || c.name_en || '-' }))
)

const subcategoryOptions = computed(() =>
  subcategories.value.map(s => ({ id: s.id, label: (locale.value === 'tm' && s.name_tm) ? s.name_tm : (locale.value === 'ru' && s.name_ru) ? s.name_ru : s.name_tm || s.name_ru || s.name_en || '-' }))
)

const onCategoryChange = async () => {
  if (!form.value.category_id) {
    subcategories.value = []
    return
  }
  const all = await getAllSubcategories()
  subcategories.value = (all as any[]).filter((s: any) => s.categoryId === form.value.category_id || s.category_id === form.value.category_id)
  if (!subcategories.value.some((s: any) => s.id === form.value.subcategory_id)) {
    form.value.subcategory_id = null
  }
}

const handleImageUpload = async (file: File | null) => {
  if (!file) return
  const res = await uploadFile(file)
  form.value.image = (res as any).url
}

const handleSubmit = async () => {
  const id = Number(route.params.id)
  saving.value = true
  try {
    await update(id, {
      ...form.value,
      price: String(form.value.price || 0),
      discount_price: form.value.discount_price ? String(form.value.discount_price) : null
    } as any)
    navigateTo('/admin/landing/courses')
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const [item, cats] = await Promise.all([
      getById(Number(route.params.id)),
      getAllCategories()
    ])
    categories.value = cats
    if (item) {
      form.value = {
        category_id: item.categoryId ?? item.category_id,
        subcategory_id: item.subcategoryId ?? item.subcategory_id,
        title_tm: item.title_tm || '',
        title_ru: item.title_ru || '',
        title_en: item.title_en || '',
        description_tm: item.description_tm || '',
        description_ru: item.description_ru || '',
        description_en: item.description_en || '',
        image: item.image || '',
        duration_weeks: item.duration_weeks ?? 0,
        hours_per_week: item.hours_per_week ?? 0,
        price: item.price ?? '',
        discount_price: item.discount_price ?? null,
        is_active: item.is_active ?? true
      }
    }
    await onCategoryChange()
    if (!form.value.subcategory_id && subcategories.value.length) {
      form.value.subcategory_id = subcategories.value[0].id
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.admin-form :deep(.q-input),
.admin-form :deep(.q-file),
.admin-form :deep(.q-select) {
  max-width: 600px;
}
.admin-form :deep(.q-field--textarea) {
  max-width: 800px;
}
</style>
