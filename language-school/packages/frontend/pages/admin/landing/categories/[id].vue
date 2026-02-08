<template>
  <div class="admin-page-content">
    <div class="row items-center justify-between q-mb-md">
      <h1 class="text-h4 q-ma-none">Редактировать категорию</h1>
      <q-btn flat round icon="arrow_back" @click="router.push('/admin/landing/categories')" />
    </div>

    <q-card flat bordered>
      <q-card-section class="q-gutter-md">
        <q-input v-model="form.name_ru" label="Название (RU)" filled :rules="[val => !!val || 'Обязательно']" />
        <q-input v-model="form.name_tm" label="Название (TM)" filled />
        <q-input v-model="form.name_en" label="Название (EN)" filled />

        <div class="row items-center q-gutter-md">
          <q-img
            v-if="form.image"
            :src="form.image"
            style="width: 100px; height: 100px"
            fit="cover"
            class="rounded-borders"
          />
          <q-file
            v-model="fileToUpload"
            label="Загрузить изображение"
            filled
            accept="image/*"
            @update:model-value="handleFileUpload"
          >
            <template v-slot:prepend>
              <q-icon name="attach_file" />
            </template>
          </q-file>
        </div>

        <q-input v-model.number="form.order" type="number" label="Порядок" filled />
        <q-toggle v-model="form.is_active" label="Активна" />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Отмена" color="primary" @click="router.push('/admin/landing/categories')" />
        <q-btn flat label="Сохранить" color="primary" @click="saveCategory" :loading="saving" />
      </q-card-actions>
    </q-card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const config = useRuntimeConfig()
const apiBase = config.public.apiBase
const router = useRouter()
const route = useRoute()

const saving = ref(false)
const fileToUpload = ref<File | null>(null)

const form = ref({
  id: null as number | null,
  name_ru: '',
  name_tm: '',
  name_en: '',
  image: '',
  order: 0,
  is_active: true
})

const fetchCategory = async (id: number) => {
  try {
    const data = await $fetch<any>(`${apiBase}/admin/categories/${id}`, { credentials: 'include' })
    form.value = { ...data }
  } catch (e) {
    console.error('Fetch category error:', e)
    router.push('/admin/landing/categories')
  }
}

const handleFileUpload = async (file: File) => {
  if (!file) return

  const formData = new FormData()
  formData.append('file', file)

  try {
    const data = await $fetch<any>(`${apiBase}/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    })
    form.value.image = data.url
  } catch (e) {
    console.error('Upload error:', e)
  }
}

const saveCategory = async () => {
  saving.value = true
  try {
    const payload = {
      name: form.value.name_ru, // Assuming name_ru is the primary name
      name_ru: form.value.name_ru,
      name_tm: form.value.name_tm,
      name_en: form.value.name_en,
      image: form.value.image,
      order: form.value.order,
      is_active: form.value.is_active
    }

    await $fetch(`${apiBase}/admin/categories/${form.value.id}`, {
      method: 'PATCH',
      body: payload,
      credentials: 'include'
    })

    router.push('/admin/landing/categories')
  } catch (e) {
    console.error('Save error:', e)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (route.params.id) {
    fetchCategory(Number(route.params.id))
  }
})
</script>
