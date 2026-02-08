<template>
  <div class="admin-page-content">
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h1 class="text-h4 q-ma-none">Добавить подкатегорию</h1>
      </div>
      <div class="col-auto">
        <q-btn outline color="grey-7" icon="arrow_back" label="Назад" to="/admin/landing/subcategories" />
      </div>
    </div>

    <q-card flat bordered class="admin-form-card">
      <q-card-section>
        <q-form @submit.prevent="handleSubmit" class="admin-form">
          <q-select
            v-model="form.category_id"
            :options="categoryOptions"
            label="Категория *"
            option-label="label"
            option-value="id"
            emit-value
            map-options
            outlined
            :rules="[val => !!val || 'Обязательно']"
            class="q-mb-md"
          />
          <q-input v-model="form.name_tm" label="Название (TM)" outlined :rules="[val => !!val || 'Обязательно']" class="q-mb-md" />
          <q-input v-model="form.name_ru" label="Название (RU)" outlined :rules="[val => !!val || 'Обязательно']" class="q-mb-md" />
          <q-input v-model="form.name_en" label="Название (EN)" outlined class="q-mb-md" />
          <q-input v-model="form.description" label="Описание" type="textarea" outlined rows="3" class="q-mb-md" />
          <div class="row items-center q-gutter-md q-mb-md">
            <q-img v-if="form.image" :src="form.image" style="width: 80px; height: 80px" fit="cover" class="rounded-borders" />
            <q-file v-model="imageFile" label="Изображение" accept="image/*" outlined @update:model-value="handleImageUpload">
              <template v-slot:prepend><q-icon name="attach_file" /></template>
            </q-file>
          </div>
          <q-input v-model.number="form.order" type="number" label="Порядок" outlined class="q-mb-md" />
          <q-toggle v-model="form.is_active" label="Активна" class="q-mb-md" />
          <div class="row q-gutter-sm q-mt-lg">
            <q-btn type="submit" color="primary" label="Сохранить" :loading="saving" icon="save" />
            <q-btn outline color="grey-7" label="Отмена" to="/admin/landing/subcategories" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const config = useRuntimeConfig()
const apiBase = config.public.apiBase
const { locale } = useI18n()

const categories = ref<any[]>([])
const saving = ref(false)
const imageFile = ref<File | null>(null)

const form = ref({
  category_id: null as number | null,
  name_tm: '',
  name_ru: '',
  name_en: '',
  description: '',
  image: '',
  order: 0,
  is_active: true
})

const categoryOptions = computed(() =>
  categories.value.map(c => ({
    id: c.id,
    label: (locale.value === 'tm' && c.name_tm) ? c.name_tm : (locale.value === 'ru' && c.name_ru) ? c.name_ru : c.name_tm || c.name_ru || c.name_en || '-'
  }))
)

const handleImageUpload = async (file: File | null) => {
  if (!file) return
  const fd = new FormData()
  fd.append('file', file)
  try {
    const res = await $fetch<{ url: string }>(`${apiBase}/upload`, { method: 'POST', body: fd, credentials: 'include' })
    form.value.image = res.url
  } catch (e) {
    console.error(e)
  }
}

const handleSubmit = async () => {
  if (!form.value.category_id) return
  saving.value = true
  try {
    await $fetch(`${apiBase}/admin/subcategories`, {
      method: 'POST',
      body: { ...form.value },
      credentials: 'include'
    })
    navigateTo('/admin/landing/subcategories')
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  categories.value = await $fetch<any[]>(`${apiBase}/admin/categories`, { credentials: 'include' })
})
</script>

<style scoped>
.admin-form :deep(.q-input),
.admin-form :deep(.q-file),
.admin-form :deep(.q-select) {
  max-width: 600px;
}
</style>
