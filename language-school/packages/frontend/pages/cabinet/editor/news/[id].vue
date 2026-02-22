<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__text">
        <NH2 class="page-header__title">Редактировать новость</NH2>
      </div>
      <div class="page-header__actions">
        <NButton type="default" @click="navigateTo('/cabinet/editor/news')">
          <template #icon>
            <NIcon><component :is="ArrowBackIcon" /></NIcon>
          </template>
          Назад
        </NButton>
      </div>
    </header>

    <NCard v-if="!loading || formData.title_tm" class="cabinet-card" :content-style="{ padding: '32px' }">
      <NSpin :show="loading && !formData.title_tm">
        <NForm ref="formRef" :model="formData" :rules="rules" label-placement="top" @submit.prevent="handleSubmit">
          <NDivider title-placement="left">Изображение</NDivider>
          <NFormItem label="Загрузить изображение" path="image">
            <div class="form-image-upload">
              <NImage
                v-if="previewImage || currentImage || formData.image"
                :src="(previewImage || currentImage || formData.image) as string"
                width="300"
                height="200"
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

          <NDivider title-placement="left">Заголовки</NDivider>
          <NFormItem label="Заголовок (TM) *" path="title_tm">
            <NInput v-model:value="formData.title_tm" placeholder="Введите заголовок на туркменском" size="large" />
          </NFormItem>
          <NFormItem label="Заголовок (RU) *" path="title_ru">
            <NInput v-model:value="formData.title_ru" placeholder="Введите заголовок на русском" size="large" />
          </NFormItem>
          <NFormItem label="Заголовок (EN) *" path="title_en">
            <NInput v-model:value="formData.title_en" placeholder="Введите заголовок на английском" size="large" />
          </NFormItem>

          <NDivider title-placement="left">Основной текст новости</NDivider>
          <NFormItem label="Текст (TM) *" path="content_tm">
            <NInput
              v-model:value="formData.content_tm"
              type="textarea"
              placeholder="Введите текст на туркменском"
              :rows="6"
              size="large"
            />
          </NFormItem>
          <NFormItem label="Текст (RU) *" path="content_ru">
            <NInput
              v-model:value="formData.content_ru"
              type="textarea"
              placeholder="Введите текст на русском"
              :rows="6"
              size="large"
            />
          </NFormItem>
          <NFormItem label="Текст (EN)" path="content_en">
            <NInput
              v-model:value="formData.content_en"
              type="textarea"
              placeholder="Введите текст на английском"
              :rows="6"
              size="large"
            />
          </NFormItem>

          <NDivider title-placement="left">Настройки</NDivider>
          <NFormItem label="Статус">
            <NSwitch v-model:value="formData.is_featured">
              <template #checked>Главная новость</template>
              <template #unchecked>Обычная новость</template>
            </NSwitch>
          </NFormItem>
          <NFormItem v-if="formData.views !== undefined" label="Просмотры">
            <NInputNumber
              :value="formData.views"
              placeholder="0"
              readonly
              size="large"
              style="width: 150px"
            >
              <template #prefix>
                <NIcon><component :is="EyeIcon" /></NIcon>
              </template>
            </NInputNumber>
          </NFormItem>

          <div class="form-actions">
            <NButton type="default" @click="navigateTo('/cabinet/editor/news')">Отмена</NButton>
            <NButton type="primary" :loading="loading" @click="handleSubmit">
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
import { ref, onMounted, onBeforeUnmount } from 'vue'
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
  NDivider,
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
  EyeOutline as EyeIcon,
} from '@vicons/ionicons5'
import { useAdminNews } from '~/composables/useAdminNews'
import { useUpload } from '~/composables/useUpload'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const route = useRoute()
const message = useMessage()
const { loading, error, getById, update } = useAdminNews()
const { uploadFile } = useUpload()

const formRef = ref<FormInst | null>(null)
const imageFileList = ref<UploadFileInfo[]>([])
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
  views: 0,
})

const rules: FormRules = {
  title_tm: [{ required: true, message: 'Введите заголовок на туркменском', trigger: 'blur' }],
  title_ru: [{ required: true, message: 'Введите заголовок на русском', trigger: 'blur' }],
  title_en: [{ required: true, message: 'Введите заголовок на английском', trigger: 'blur' }],
  content_tm: [{ required: true, message: 'Введите текст на туркменском', trigger: 'blur' }],
  content_ru: [{ required: true, message: 'Введите текст на русском', trigger: 'blur' }],
}

const handleImageUpload = async ({ fileList }: { fileList: UploadFileInfo[] }) => {
  imageFileList.value = fileList
  if (fileList.length > 0 && fileList[0].file) {
    const file = fileList[0].file as File
    previewImage.value = URL.createObjectURL(file)
    try {
      const res = await uploadFile(file)
      formData.value.image = (res as any).url
    } catch (e) {
      console.error('Upload error:', e)
      message.error('Ошибка загрузки изображения')
    }
  }
}

const handleImageRemove = () => {
  imageFileList.value = []
  previewImage.value = null
  formData.value.image = ''
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    if (!formData.value.image && imageFileList.value.length > 0) {
      const file = imageFileList.value[0].file as File
      const res = await uploadFile(file)
      formData.value.image = (res as any).url
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
      is_featured: formData.value.is_featured,
    }
    await update(id, payload)
    message.success('Новость успешно обновлена')
    navigateTo('/cabinet/editor/news')
  } catch (err: any) {
    if (err.message) {
      message.error(err.message)
    } else {
      console.error(err)
    }
  }
}

onMounted(async () => {
  const id = Number(route.params.id)
  if (id) {
    try {
      const item = await getById(id)
      if (item) {
        const itemData = item as any
        formData.value = {
          title_tm: itemData.title_tm || '',
          title_ru: itemData.title_ru || '',
          title_en: itemData.title_en || '',
          content_tm: itemData.content_tm || '',
          content_ru: itemData.content_ru || '',
          content_en: itemData.content_en || '',
          image: itemData.image || '',
          is_featured: itemData.is_featured ?? false,
          views: itemData.views ?? 0,
        }
        if (itemData.image) {
          currentImage.value = itemData.image
          imageFileList.value = [
            {
              id: 'current',
              name: 'image',
              status: 'finished',
              url: itemData.image,
            } as UploadFileInfo,
          ]
        }
      }
    } catch (err: any) {
      console.error('Failed to load news', err)
      message.error('Ошибка загрузки данных')
    }
  }
})

onBeforeUnmount(() => {
  if (previewImage.value) URL.revokeObjectURL(previewImage.value)
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
  flex-direction: column;
  gap: 16px;
}

.form-image-preview {
  border-radius: 8px;
  overflow: hidden;
  max-width: 300px;
  max-height: 200px;
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
