<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__text">
        <NH2 class="page-header__title">Редактировать категорию (Редактор)</NH2>
      </div>
      <div class="page-header__actions">
        <NButton type="default" @click="navigateTo('/cabinet/editor/categories')">
          <template #icon>
            <NIcon><component :is="ArrowBackIcon" /></NIcon>
          </template>
          Назад
        </NButton>
      </div>
    </header>

    <NCard v-if="!loading || form.name_ru" class="cabinet-card" :content-style="{ padding: '32px' }">
      <NSpin :show="loading && !form.name_ru">
        <NForm ref="formRef" :model="form" :rules="rules" label-placement="top" @submit.prevent="handleSubmit">
          <NFormItem label="Название (TM) *" path="name_tm">
            <NInput v-model:value="form.name_tm" placeholder="Введите название на туркменском" size="large" />
          </NFormItem>
          <NFormItem label="Название (RU) *" path="name_ru">
            <NInput v-model:value="form.name_ru" placeholder="Введите название на русском" size="large" />
          </NFormItem>
          <NFormItem label="Название (EN)" path="name_en">
            <NInput v-model:value="form.name_en" placeholder="Введите название на английском" size="large" />
          </NFormItem>

          <NFormItem label="Изображение" path="image">
            <div class="form-image-upload">
              <NImage
                v-if="form.image"
                :src="form.image"
                width="80"
                height="80"
                object-fit="cover"
                class="form-image-preview"
              />
              <NUpload
                :file-list="imageFileList"
                :max="1"
                accept="image/*"
                @change="handleImageUpload"
                @remove="handleImageRemove"
              >
                <NButton>
                  <template #icon>
                    <NIcon><component :is="AttachIcon" /></NIcon>
                  </template>
                  Загрузить изображение
                </NButton>
              </NUpload>
            </div>
          </NFormItem>

          <NFormItem label="Порядок" path="order">
            <NInputNumber v-model:value="form.order" placeholder="0" :min="0" size="large" style="width: 200px" />
          </NFormItem>

          <NFormItem label="Статус" path="is_active">
            <NSwitch v-model:value="form.is_active">
              <template #checked>Активна</template>
              <template #unchecked>Неактивна</template>
            </NSwitch>
          </NFormItem>

          <div class="form-actions">
            <NButton type="default" @click="navigateTo('/cabinet/editor/categories')">Отмена</NButton>
            <NButton type="primary" :loading="saving" @click="handleSubmit">
              <template #icon>
                <NIcon><component :is="SaveIcon" /></NIcon>
              </template>
              Сохранить
            </NButton>
          </div>
        </NForm>
      </NSpin>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  NCard,
  NButton,
  NInput,
  NInputNumber,
  NForm,
  NFormItem,
  NIcon,
  NH2,
  NImage,
  NUpload,
  NSwitch,
  NSpin,
  useMessage,
  type FormInst,
  type FormRules,
  type UploadFileInfo,
} from 'naive-ui'
import {
  ArrowBackOutline as ArrowBackIcon,
  AttachOutline as AttachIcon,
  SaveOutline as SaveIcon,
} from '@vicons/ionicons5'
import { useAdminCategories } from '~/composables/useAdminCategories'
import { useUpload } from '~/composables/useUpload'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const route = useRoute()
const message = useMessage()
const { getById, update } = useAdminCategories()
const { uploadFile } = useUpload()

const formRef = ref<FormInst | null>(null)
const loading = ref(true)
const saving = ref(false)
const imageFileList = ref<UploadFileInfo[]>([])

const form = ref({
  id: null as number | null,
  name_tm: '',
  name_ru: '',
  name_en: '',
  image: '',
  order: 0,
  is_active: true,
})

const rules: FormRules = {
  name_tm: [{ required: true, message: 'Введите название на туркменском', trigger: 'blur' }],
  name_ru: [{ required: true, message: 'Введите название на русском', trigger: 'blur' }],
}

const handleImageUpload = async ({ fileList }: { fileList: UploadFileInfo[] }) => {
  imageFileList.value = fileList
  if (fileList.length > 0 && fileList[0].file) {
    try {
      const res = await uploadFile(fileList[0].file as File)
      form.value.image = (res as any).url
    } catch (e) {
      console.error(e)
      message.error('Ошибка загрузки изображения')
    }
  }
}

const handleImageRemove = () => {
  imageFileList.value = []
  form.value.image = ''
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    saving.value = true
    await update(form.value.id as any, {
      name: form.value.name_ru || form.value.name_tm || form.value.name_en,
      name_tm: form.value.name_tm,
      name_ru: form.value.name_ru,
      name_en: form.value.name_en,
      image: form.value.image,
      order: form.value.order,
      is_active: form.value.is_active,
    })
    message.success('Категория успешно обновлена')
    navigateTo('/cabinet/editor/categories')
  } catch (err: any) {
    if (err.message) {
      message.error(err.message)
    } else {
      console.error(err)
    }
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  const id = Number(route.params.id)
  if (!id) {
    loading.value = false
    return
  }
  try {
    const item = await getById(id)
    if (!item) {
      navigateTo('/cabinet/editor/categories')
      return
    }
    form.value = {
      id: item.id,
      name_tm: item.name_tm || '',
      name_ru: item.name_ru || '',
      name_en: item.name_en || '',
      image: item.image || '',
      order: item.order ?? 0,
      is_active: item.is_active ?? true,
    }
    if (item.image) {
      imageFileList.value = [
        {
          id: 'current',
          name: 'image',
          status: 'finished',
          url: item.image,
        } as UploadFileInfo,
      ]
    }
  } catch (e) {
    console.error('Fetch category error:', e)
    message.error('Ошибка загрузки данных')
    navigateTo('/cabinet/editor/categories')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.cabinet-page {
  padding-bottom: 40px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 32px;
}

.page-header__title {
  margin: 0 0 8px;
  font-weight: 700;
}

.cabinet-card {
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.form-image-upload {
  display: flex;
  align-items: center;
  gap: 16px;
}

.form-image-preview {
  border-radius: 8px;
  overflow: hidden;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--n-border-color);
}
</style>
