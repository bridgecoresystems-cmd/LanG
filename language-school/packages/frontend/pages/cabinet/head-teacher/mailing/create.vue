<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__top">
        <NButton circle secondary @click="navigateTo('/cabinet/head-teacher/mailing')">
          <template #icon>
            <NIcon><component :is="ArrowBackIcon" /></NIcon>
          </template>
        </NButton>
        <div>
          <NH2 class="page-header__title">Создать рассылку</NH2>
          <p class="page-header__subtitle">Заполните форму и выберите получателей</p>
        </div>
      </div>
    </header>

    <NGrid cols="1 m:12" responsive="screen" :x-gap="24" :y-gap="24">
      <NGi span="1 m:8">
        <NCard bordered class="form-card">
          <NForm ref="formRef" :model="formData" label-placement="top" @submit.prevent="handleSubmit">
            <NFormItem label="Заголовок *" required>
              <NInput
                v-model:value="formData.title"
                placeholder="Тема сообщения"
                size="large"
              />
            </NFormItem>

            <NFormItem label="Текст сообщения *" required>
              <NInput
                v-model:value="formData.content"
                type="textarea"
                placeholder="Введите текст рассылки..."
                :autosize="{ minRows: 6 }"
                size="large"
              />
            </NFormItem>

            <NGrid cols="1 s:2" :x-gap="16">
              <NGi>
                <NFormItem label="Кому отправить *" required>
                  <NSelect
                    v-model:value="formData.recipient_type"
                    :options="recipientTypeOptions"
                    placeholder="Выберите получателей"
                    size="large"
                  />
                </NFormItem>
              </NGi>
              <NGi>
                <NFormItem label="Запланировать на (необязательно)">
                  <NDatePicker
                    v-model:value="scheduledAtTs"
                    type="datetime"
                    clearable
                    placeholder="Дата и время"
                    :is-date-disabled="(ts) => ts < Date.now() - 86400000"
                    style="width: 100%"
                    size="large"
                  />
                </NFormItem>
              </NGi>
            </NGrid>

            <NAlert v-if="submitError" type="error" closable class="q-mb-md" @close="submitError = null">
              {{ submitError }}
            </NAlert>

            <NDivider />

            <NSpace justify="end">
              <NButton ghost @click="navigateTo('/cabinet/head-teacher/mailing')">Отмена</NButton>
              <NButton
                type="primary"
                attr-type="submit"
                :loading="submitting"
                :disabled="!isFormValid"
              >
                <template #icon>
                  <NIcon><component :is="SendIcon" /></NIcon>
                </template>
                {{ scheduledAtTs ? 'Сохранить и запланировать' : 'Создать рассылку' }}
              </NButton>
            </NSpace>
          </NForm>
        </NCard>
      </NGi>

      <NGi span="1 m:4">
        <div class="preview-panel">
          <NCard bordered title="Предпросмотр" size="small">
            <template #header-extra>
              <NIcon size="18" depth="3"><component :is="EyeIcon" /></NIcon>
            </template>
            <div class="preview-bubble">
              <NSpace vertical size="medium">
                <NH4 style="margin: 0; color: #18a058;">{{ formData.title || '...' }}</NH4>
                <NText style="white-space: pre-wrap; display: block; min-height: 100px;">
                  {{ formData.content || '...' }}
                </NText>
                <NDivider dashed />
                <NSpace align="center" size="small">
                  <NIcon depth="3"><component :is="UsersIcon" /></NIcon>
                  <NText depth="3" style="font-size: 13px;">{{ recipientPreview }}</NText>
                </NSpace>
              </NSpace>
            </div>
          </NCard>
        </div>
      </NGi>
    </NGrid>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCabinetMailing, type CreateMailingData } from '~/composables/useCabinetMailing'
import {
  NCard,
  NButton,
  NInput,
  NSelect,
  NForm,
  NFormItem,
  NDatePicker,
  NIcon,
  NH2,
  NH4,
  NText,
  NGrid,
  NGi,
  NDivider,
  NSpace,
  NAlert,
} from 'naive-ui'
import {
  ChevronBackOutline as ArrowBackIcon,
  SendOutline as SendIcon,
  EyeOutline as EyeIcon,
  PeopleOutline as UsersIcon,
} from '@vicons/ionicons5'
import { useMessage } from 'naive-ui'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const authStore = useAuthStore()
const message = useMessage()
const { create } = useCabinetMailing()

const formData = ref<CreateMailingData>({
  title: '',
  content: '',
  recipient_type: 'all',
  scheduled_at: null,
})

const scheduledAtTs = ref<number | null>(null)
watch(scheduledAtTs, (v) => {
  formData.value.scheduled_at = v ? new Date(v).toISOString() : null
})

const recipientTypeOptions = [
  { label: 'Все (ученики, родители, учителя)', value: 'all' },
  { label: 'Ученики', value: 'students' },
  { label: 'Родители', value: 'parents' },
  { label: 'Учителя', value: 'teachers' },
]

const recipientPreview = computed(() => {
  const opt = recipientTypeOptions.find((o) => o.value === formData.value.recipient_type)
  return opt?.label || ''
})

const isFormValid = computed(
  () =>
    formData.value.title.trim() !== '' &&
    formData.value.content.trim() !== '' &&
    formData.value.recipient_type !== ''
)

const submitting = ref(false)
const submitError = ref<string | null>(null)
const formRef = ref<any>(null)

async function handleSubmit() {
  if (!isFormValid.value) return
  submitting.value = true
  submitError.value = null
  try {
    await create({
      title: formData.value.title.trim(),
      content: formData.value.content.trim(),
      recipient_type: formData.value.recipient_type,
      scheduled_at: formData.value.scheduled_at,
    })
    message.success('Рассылка создана')
    navigateTo('/cabinet/head-teacher/mailing')
  } catch (e: any) {
    submitError.value = e?.message || e?.value?.error || 'Ошибка при создании'
    message.error(submitError.value)
  } finally {
    submitting.value = false
  }
}

function canAccess() {
  const u = authStore.user
  if (!u) return false
  const hasHeadTeacher = u.role === 'HEAD_TEACHER' || (u.additional_roles || []).includes('HEAD_TEACHER')
  return hasHeadTeacher || u.role === 'SUPERUSER'
}

onMounted(() => {
  if (!canAccess()) navigateTo('/cabinet')
})
</script>

<style scoped>
.cabinet-page { padding-bottom: 40px; }
.page-header { margin-bottom: 32px; }
.page-header__top {
  display: flex;
  align-items: center;
  gap: 20px;
}
.page-header__title { margin: 0 0 8px; font-weight: 700; font-size: 1.5rem; }
.page-header__subtitle { margin: 0; color: var(--n-text-color-3); }

.form-card { border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.preview-panel { position: sticky; top: 24px; }
.preview-bubble {
  padding: 20px;
  background: var(--n-color-embedded);
  border-radius: 12px;
  border: 1px solid var(--n-border-color);
}
</style>
