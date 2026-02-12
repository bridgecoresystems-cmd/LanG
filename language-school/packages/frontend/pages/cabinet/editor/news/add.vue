<template>
  <div class="cabinet-page-content">
    <!-- Page Header -->
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h1 class="text-h4 q-ma-none">Добавить новость</h1>
      </div>
      <div class="col-auto">
        <q-btn
          outline
          color="grey-7"
          icon="arrow_back"
          label="Назад"
          to="/cabinet/editor/news"
        />
      </div>
    </div>

    <!-- Error Banner -->
    <q-banner v-if="error" class="bg-negative text-white q-mb-md">
      {{ error }}
    </q-banner>

    <!-- Form Card -->
    <q-card flat bordered class="cabinet-form-card">
      <q-card-section>
        <q-form @submit.prevent="handleSubmit" class="cabinet-form">
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
            <div v-if="previewImage" class="q-mt-md">
              <q-img
                :src="previewImage"
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
          </div>

          <div class="row q-gutter-sm q-mt-lg">
            <q-btn type="submit" color="primary" label="Сохранить" :loading="loading" icon="save" />
            <q-btn outline color="grey-7" label="Отмена" to="/cabinet/editor/news" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const router = useRouter()
const { loading, error, create } = useAdminNews()
const { uploadFile } = useUpload()

const imageFile = ref<File | null>(null)
const previewImage = ref<string | null>(null)

const formData = ref({
  title_tm: '',
  title_ru: '',
  title_en: '',
  content_tm: '',
  content_ru: '',
  content_en: '',
  image: '',
  is_featured: false
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
  const payload: Record<string, unknown> = {
    ...formData.value,
    content_tm: formData.value.content_tm || formData.value.content_ru,
    content_ru: formData.value.content_ru || formData.value.content_tm,
    content_en: formData.value.content_en || formData.value.content_ru
  }
  try {
    await create(payload)
    router.push('/cabinet/editor/news')
  } catch (err: any) {
    console.error('Failed to create news', err)
  }
}
</script>

<style scoped>
.cabinet-form :deep(.q-input),
.cabinet-form :deep(.q-file) {
  max-width: 600px;
}

.cabinet-form :deep(.q-field--textarea) {
  max-width: 800px;
}
</style>
