<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__text">
        <NH2 class="page-header__title">Добавить курс (Редактор)</NH2>
      </div>
      <div class="page-header__actions">
        <NButton type="default" @click="navigateTo('/cabinet/editor/courses')">
          <template #icon>
            <NIcon><component :is="ArrowBackIcon" /></NIcon>
          </template>
          Назад
        </NButton>
      </div>
    </header>

    <NCard class="cabinet-card" :content-style="{ padding: '32px' }">
      <NForm ref="formRef" :model="form" :rules="rules" label-placement="top" @submit.prevent="handleSubmit">
        <NFormItem label="Категория *" path="category_id">
          <NSelect
            v-model:value="form.category_id"
            :options="categoryOptions"
            placeholder="Выберите категорию"
            size="large"
            @update:value="onCategoryChange"
          />
        </NFormItem>

        <NFormItem label="Подкатегория *" path="subcategory_id">
          <NSelect
            v-model:value="form.subcategory_id"
            :options="subcategoryOptions"
            placeholder="Выберите подкатегорию"
            size="large"
            :disabled="!form.category_id"
          />
        </NFormItem>

        <NFormItem label="Название (TM) *" path="title_tm">
          <NInput v-model:value="form.title_tm" placeholder="Введите название на туркменском" size="large" />
        </NFormItem>

        <NFormItem label="Название (RU) *" path="title_ru">
          <NInput v-model:value="form.title_ru" placeholder="Введите название на русском" size="large" />
        </NFormItem>

        <NFormItem label="Название (EN)" path="title_en">
          <NInput v-model:value="form.title_en" placeholder="Введите название на английском" size="large" />
        </NFormItem>

        <NFormItem label="Описание (TM) *" path="description_tm">
          <NInput
            v-model:value="form.description_tm"
            type="textarea"
            placeholder="Введите описание на туркменском"
            :rows="4"
            size="large"
          />
        </NFormItem>

        <NFormItem label="Описание (RU) *" path="description_ru">
          <NInput
            v-model:value="form.description_ru"
            type="textarea"
            placeholder="Введите описание на русском"
            :rows="4"
            size="large"
          />
        </NFormItem>

        <NFormItem label="Описание (EN)" path="description_en">
          <NInput
            v-model:value="form.description_en"
            type="textarea"
            placeholder="Введите описание на английском"
            :rows="4"
            size="large"
          />
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

        <div class="form-row">
          <NFormItem label="Недель" path="duration_weeks" class="form-row__item">
            <NInputNumber
              v-model:value="form.duration_weeks"
              placeholder="0"
              :min="0"
              size="large"
              style="width: 100%"
            />
          </NFormItem>

          <NFormItem label="Часов в неделю" path="hours_per_week" class="form-row__item">
            <NInputNumber
              v-model:value="form.hours_per_week"
              placeholder="0"
              :min="0"
              size="large"
              style="width: 100%"
            />
          </NFormItem>
        </div>

        <div class="form-row">
          <NFormItem label="Цена (💎) *" path="price" class="form-row__item">
            <NInputNumber
              v-model:value="form.price"
              placeholder="0"
              :min="0"
              size="large"
              style="width: 100%"
            />
          </NFormItem>

          <NFormItem label="Цена со скидкой (💎)" path="discount_price" class="form-row__item">
            <NInputNumber
              v-model:value="form.discount_price"
              placeholder="0"
              :min="0"
              size="large"
              style="width: 100%"
            />
          </NFormItem>
        </div>

        <NFormItem label="Статус" path="is_active">
          <NSwitch v-model:value="form.is_active">
            <template #checked>Активен</template>
            <template #unchecked>Неактивен</template>
          </NSwitch>
        </NFormItem>

        <div class="form-actions">
          <NButton type="default" @click="navigateTo('/cabinet/editor/courses')">Отмена</NButton>
          <NButton type="primary" :loading="saving" @click="handleSubmit">
            <template #icon>
              <NIcon><component :is="SaveIcon" /></NIcon>
            </template>
            Сохранить
          </NButton>
        </div>
      </NForm>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NCard,
  NButton,
  NInput,
  NInputNumber,
  NForm,
  NFormItem,
  NSelect,
  NIcon,
  NH2,
  NImage,
  NUpload,
  NSwitch,
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
import { useAdminCourses } from '~/composables/useAdminCourses'
import { useAdminCategories } from '~/composables/useAdminCategories'
import { useAdminSubcategories } from '~/composables/useAdminSubcategories'
import { useUpload } from '~/composables/useUpload'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const { locale } = useI18n()
const message = useMessage()
const { create } = useAdminCourses()
const { getAll: getAllCategories } = useAdminCategories()
const { getAll: getAllSubcategories } = useAdminSubcategories()
const { uploadFile } = useUpload()

const formRef = ref<FormInst | null>(null)
const categories = ref<any[]>([])
const subcategories = ref<any[]>([])
const saving = ref(false)
const imageFileList = ref<UploadFileInfo[]>([])

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
  price: null as number | null,
  discount_price: null as number | null,
  is_active: true,
})

const rules: FormRules = {
  category_id: [{ required: true, message: 'Выберите категорию', trigger: 'change' }],
  subcategory_id: [{ required: true, message: 'Выберите подкатегорию', trigger: 'change' }],
  title_tm: [{ required: true, message: 'Введите название на туркменском', trigger: 'blur' }],
  title_ru: [{ required: true, message: 'Введите название на русском', trigger: 'blur' }],
  description_tm: [{ required: true, message: 'Введите описание на туркменском', trigger: 'blur' }],
  description_ru: [{ required: true, message: 'Введите описание на русском', trigger: 'blur' }],
  price: [{ required: true, message: 'Введите цену', trigger: 'blur' }],
}

const categoryOptions = computed(() =>
  categories.value.map((c) => ({
    value: c.id,
    label:
      (locale.value === 'tm' && c.name_tm)
        ? c.name_tm
        : (locale.value === 'ru' && c.name_ru)
          ? c.name_ru
          : c.name_tm || c.name_ru || c.name_en || '-',
  }))
)

const subcategoryOptions = computed(() =>
  subcategories.value.map((s) => ({
    value: s.id,
    label:
      (locale.value === 'tm' && s.name_tm)
        ? s.name_tm
        : (locale.value === 'ru' && s.name_ru)
          ? s.name_ru
          : s.name_tm || s.name_ru || s.name_en || '-',
  }))
)

const onCategoryChange = async () => {
  form.value.subcategory_id = null
  if (form.value.category_id) {
    const all = await getAllSubcategories()
    subcategories.value = (all as any[]).filter(
      (s: any) => s.categoryId === form.value.category_id || (s as any).category_id === form.value.category_id
    )
  } else {
    subcategories.value = []
  }
}

const handleImageUpload = async ({ fileList }: { fileList: UploadFileInfo[] }) => {
  imageFileList.value = fileList
  if (fileList.length > 0 && fileList[0].file) {
    try {
      const res = await uploadFile(fileList[0].file as File)
      form.value.image = (res as any).url
    } catch (e) {
      console.error('Upload error:', e)
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
    await create({
      ...form.value,
      price: String(form.value.price || 0),
      discount_price: form.value.discount_price ? String(form.value.discount_price) : null,
    } as any)
    message.success('Курс успешно создан')
    navigateTo('/cabinet/editor/courses')
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
  categories.value = await getAllCategories()
  if (form.value.category_id) await onCategoryChange()
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

.page-header__subtitle {
  margin: 0;
  color: var(--n-text-color-3);
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.form-row__item {
  margin-bottom: 0;
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
