<template>
  <div class="cabinet-page-content">
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h1 class="text-h4 q-ma-none">Добавить категорию (Редактор)</h1>
      </div>
      <div class="col-auto">
        <q-btn outline color="grey-7" icon="arrow_back" label="Назад" to="/cabinet/editor/categories" />
      </div>
    </div>

    <q-card flat bordered class="cabinet-form-card">
      <q-card-section>
        <q-form @submit.prevent="handleSubmit" class="cabinet-form">
          <q-input v-model="form.name_tm" label="Название (TM)" outlined :rules="[val => !!val || 'Обязательно']" class="q-mb-md" />
          <q-input v-model="form.name_ru" label="Название (RU)" outlined :rules="[val => !!val || 'Обязательно']" class="q-mb-md" />
          <q-input v-model="form.name_en" label="Название (EN)" outlined class="q-mb-md" />
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
            <q-btn outline color="grey-7" label="Отмена" to="/cabinet/editor/categories" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const { create } = useAdminCategories()
const { uploadFile } = useUpload()

const saving = ref(false)
const imageFile = ref<File | null>(null)

const form = ref({
  name_tm: '',
  name_ru: '',
  name_en: '',
  image: '',
  order: 0,
  is_active: true
})

const handleImageUpload = async (file: File | null) => {
  if (!file) return
  try {
    const res = await uploadFile(file)
    form.value.image = (res as any).url
  } catch (e) {
    console.error(e)
  }
}

const handleSubmit = async () => {
  saving.value = true
  try {
    await create({
      name: form.value.name_ru || form.value.name_tm || form.value.name_en,
      name_tm: form.value.name_tm,
      name_ru: form.value.name_ru,
      name_en: form.value.name_en,
      image: form.value.image,
      order: form.value.order,
      is_active: form.value.is_active
    })
    navigateTo('/cabinet/editor/categories')
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.cabinet-form :deep(.q-input),
.cabinet-form :deep(.q-file) {
  max-width: 600px;
}
</style>
