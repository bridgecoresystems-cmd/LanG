<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__text">
        <NH2 class="page-header__title">Редактировать сообщение</NH2>
      </div>
      <div class="page-header__actions">
        <NButton type="default" @click="navigateTo('/cabinet/editor/contact')">
          <template #icon>
            <NIcon><component :is="ArrowBackIcon" /></NIcon>
          </template>
          Назад
        </NButton>
      </div>
    </header>

    <NCard v-if="!loading || form.name" class="cabinet-card" :content-style="{ padding: '32px' }">
      <NSpin :show="loading && !form.name">
        <NForm ref="formRef" :model="form" :rules="rules" label-placement="top" @submit.prevent="handleSubmit">
          <div class="form-row">
            <NFormItem label="Имя *" path="name" class="form-row__item">
              <NInput v-model:value="form.name" placeholder="Введите имя" size="large">
                <template #prefix>
                  <NIcon><component :is="PersonIcon" /></NIcon>
                </template>
              </NInput>
            </NFormItem>

            <NFormItem label="Email *" path="email" class="form-row__item">
              <NInput v-model:value="form.email" type="email" placeholder="Введите email" size="large">
                <template #prefix>
                  <NIcon><component :is="MailIcon" /></NIcon>
                </template>
              </NInput>
            </NFormItem>
          </div>

          <NFormItem label="Телефон" path="phone">
            <NInput v-model:value="form.phone" placeholder="Введите телефон" size="large">
              <template #prefix>
                <NIcon><component :is="CallIcon" /></NIcon>
              </template>
            </NInput>
          </NFormItem>

          <NFormItem label="Сообщение *" path="message">
            <NInput
              v-model:value="form.message"
              type="textarea"
              placeholder="Введите сообщение"
              :rows="8"
              size="large"
            />
          </NFormItem>

          <div class="form-row">
            <NFormItem label="Статус" path="status" class="form-row__item">
              <NSelect
                v-model:value="form.status"
                :options="statusOptions"
                placeholder="Выберите статус"
                size="large"
              />
            </NFormItem>

            <NFormItem label="Лайки" path="likes" class="form-row__item">
              <NInputNumber
                :value="form.likes"
                placeholder="0"
                :min="0"
                readonly
                size="large"
                style="width: 100%"
              >
                <template #prefix>
                  <NIcon><component :is="ThumbsUpIcon" /></NIcon>
                </template>
              </NInputNumber>
            </NFormItem>
          </div>

          <div class="form-actions">
            <NButton type="default" @click="navigateTo('/cabinet/editor/contact')">Отмена</NButton>
            <NButton type="primary" :loading="saving" @click="handleSubmit" size="large">
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
  NSelect,
  NIcon,
  NH2,
  NSpin,
  useMessage,
  type FormInst,
  type FormRules,
} from 'naive-ui'
import {
  ArrowBackOutline as ArrowBackIcon,
  PersonOutline as PersonIcon,
  MailOutline as MailIcon,
  CallOutline as CallIcon,
  ThumbsUpOutline as ThumbsUpIcon,
  SaveOutline as SaveIcon,
} from '@vicons/ionicons5'
import { useAdminContact } from '~/composables/useAdminContact'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const route = useRoute()
const message = useMessage()
const { getById, update } = useAdminContact()

const formRef = ref<FormInst | null>(null)
const loading = ref(true)
const saving = ref(false)

const form = ref({
  name: '',
  email: '',
  phone: '',
  message: '',
  status: 'pending' as 'pending' | 'approved' | 'rejected',
  likes: 0,
})

const rules: FormRules = {
  name: [{ required: true, message: 'Введите имя', trigger: 'blur' }],
  email: [
    { required: true, message: 'Введите email', trigger: 'blur' },
    { type: 'email', message: 'Неверный email', trigger: 'blur' },
  ],
  message: [{ required: true, message: 'Введите сообщение', trigger: 'blur' }],
}

const statusOptions = [
  { label: 'Ожидает', value: 'pending' },
  { label: 'Одобрено', value: 'approved' },
  { label: 'Отклонено', value: 'rejected' },
]

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    saving.value = true
    const id = Number(route.params.id)
    await update(id, {
      name: form.value.name,
      email: form.value.email,
      phone: form.value.phone || '',
      message: form.value.message,
      status: form.value.status,
    })
    message.success('Сообщение успешно обновлено')
    navigateTo('/cabinet/editor/contact')
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
  try {
    const id = Number(route.params.id)
    const item = await getById(id)
    if (item) {
      const itemData = item as any
      form.value = {
        name: itemData.name || '',
        email: itemData.email || '',
        phone: itemData.phone || '',
        message: itemData.message || '',
        status: itemData.status || 'pending',
        likes: itemData.likes ?? 0,
      }
    }
  } catch (e) {
    console.error(e)
    message.error('Ошибка загрузки данных')
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
