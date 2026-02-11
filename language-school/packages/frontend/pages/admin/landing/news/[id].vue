<template>
  <div class="admin-page-content">
    <!-- Page Header -->
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h1 class="text-h4 q-ma-none">Редактировать новость</h1>
      </div>
      <div class="col-auto">
        <q-btn
          outline
          color="grey-7"
          icon="arrow_back"
          label="Назад"
          to="/admin/landing/news"
        />
      </div>
    </div>

    <!-- Loading -->
    <q-inner-loading :showing="loading && !formData.title_tm">
      <q-spinner size="50px" color="primary" />
    </q-inner-loading>

    <!-- Error Banner -->
    <q-banner v-if="error" class="bg-negative text-white q-mb-md">
      {{ error }}
    </q-banner>

    <!-- Form Card -->
    <q-card v-if="!loading || formData.title_tm" flat bordered class="admin-form-card">
      <q-card-section>
        <q-form @submit.prevent="handleSubmit" class="admin-form">
          <!-- Изображение -->
          <div class="q-mb-xl">
            <div class="text-h6 q-mb-md">
              <q-icon name="image" class="q-mr-sm" />
              Изображение
            </div>
            <q-file
              v-model="imageFile"
              label="Загрузить изображение"
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
                style="max-width: 300px; max-height: 200px"
                class="rounded-borders"
              />
            </div>
          </div>

          <q-separator spaced />

          <!-- Заголовки -->
          <div class="q-mb-xl">
            <div class="text-h6 q-mb-md">
              <q-icon name="title" class="q-mr-sm" />
              Заголовки
            </div>
            <q-input
              v-model="formData.title_tm"
              label="Заголовок (TM)"
              outlined
              :rules="[val => !!val || 'Обязательно']"
              class="q-mb-md"
            />
            <q-input
              v-model="formData.title_ru"
              label="Заголовок (RU)"
              outlined
              :rules="[val => !!val || 'Обязательно']"
              class="q-mb-md"
            />
            <q-input
              v-model="formData.title_en"
              label="Заголовок (EN)"
              outlined
              :rules="[val => !!val || 'Обязательно']"
              class="q-mb-md"
            />
          </div>

          <q-separator spaced />

          <!-- Основной текст -->
          <div class="q-mb-xl">
            <div class="text-h6 q-mb-md">
              <q-icon name="description" class="q-mr-sm" />
              Основной текст новости
            </div>
            <q-input
              v-model="formData.content_tm"
              label="Текст (TM)"
              type="textarea"
              outlined
              rows="6"
              :rules="[val => !!val || 'Обязательно']"
              class="q-mb-md"
            />
            <q-input
              v-model="formData.content_ru"
              label="Текст (RU)"
              type="textarea"
              outlined
              rows="6"
              :rules="[val => !!val || 'Обязательно']"
              class="q-mb-md"
            />
            <q-input
              v-model="formData.content_en"
              label="Текст (EN)"
              type="textarea"
              outlined
              rows="6"
              class="q-mb-md"
            />
          </div>

          <q-separator spaced />

          <!-- Настройки -->
          <div class="q-mb-xl">
            <div class="text-h6 q-mb-md">
              <q-icon name="settings" class="q-mr-sm" />
              Настройки
            </div>
            <q-checkbox v-model="formData.is_featured" label="Главная новость (показывать на главной)" />
            <div v-if="formData.views !== undefined" class="q-mt-md">
              <q-input
                :model-value="formData.views"
                label="Просмотры"
                type="number"
                outlined
                readonly
                style="max-width: 150px"
              >
                <template v-slot:append>
                  <q-icon name="visibility" />
                </template>
              </q-input>
            </div>
          </div>

          <div class="row q-gutter-sm q-mt-lg">
            <q-btn type="submit" color="primary" label="Сохранить" :loading="loading" icon="save" />
            <q-btn outline color="grey-7" label="Отмена" to="/admin/landing/news" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const route = useRoute()
const router = useRouter()
const { loading, error, getById, update } = useAdminNews()
const { uploadFile } = useUpload()

const imageFile = ref<File | null>(null)
const previewImage = ref<string | null>(null)
const currentImage = ref<string | null>(null)

const formData = ref({
  title_tm: '',
  title_ru: '',
  title_en: '',
  content_tm: '',
  content_ru: '',
  content_en: '',
  image: '',
  is_featured: false,
  views: 0
})

const handleImageChange = async (file: File | null) => {
  if (!file) {
    previewImage.value = null
    imageFile.value = null
    return
  }
  imageFile.value = file
  previewImage.value = URL.createObjectURL(file)

  try {
    const res = await uploadFile(file)
    formData.value.image = (res as any).url
  } catch (e) {
    console.error('Upload error:', e)
    error.value = 'Ошибка загрузки изображения'
  }
}

const handleSubmit = async () => {
  if (!formData.value.image && imageFile.value) {
    await handleImageChange(imageFile.value)
  }
  const id = Number(route.params.id)
  const payload = {
    title_tm: formData.value.title_tm,
    title_ru: formData.value.title_ru,
    title_en: formData.value.title_en,
    content_tm: formData.value.content_tm || formData.value.content_ru,
    content_ru: formData.value.content_ru || formData.value.content_tm,
    content_en: formData.value.content_en || formData.value.content_ru,
    image: formData.value.image,
    is_featured: formData.value.is_featured
  }
  try {
    await update(id, payload)
    router.push('/admin/landing/news')
  } catch (err: any) {
    console.error('Failed to update news', err)
  }
}

onMounted(async () => {
  const id = Number(route.params.id)
  if (id) {
    try {
      const item = await getById(id)
      if (item) {
        formData.value = {
          title_tm: item.title_tm || '',
          title_ru: item.title_ru || '',
          title_en: item.title_en || '',
          content_tm: item.content_tm || '',
          content_ru: item.content_ru || '',
          content_en: item.content_en || '',
          image: item.image || '',
          is_featured: item.is_featured ?? false,
          views: item.views ?? 0
        }
        if (item.image) currentImage.value = item.image
      }
    } catch (err: any) {
      console.error('Failed to load news', err)
    }
  }
})
</script>

<style scoped>
.admin-form :deep(.q-input),
.admin-form :deep(.q-file) {
  max-width: 600px;
}

.admin-form :deep(.q-field--textarea) {
  max-width: 800px;
}
</style>
