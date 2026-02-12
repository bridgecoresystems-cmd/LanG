<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__text">
        <NH2 class="page-header__title">Добавить звонок</NH2>
      </div>
      <div class="page-header__actions">
        <NButton type="default" @click="navigateTo('/cabinet/sales')">
          <template #icon>
            <NIcon><component :is="ArrowBackIcon" /></NIcon>
          </template>
          Назад
        </NButton>
      </div>
    </header>

    <NCard class="cabinet-card" :content-style="{ padding: '32px' }">
      <NForm ref="formRef" :model="form" :rules="rules" label-placement="top">
        <NFormItem label="Имя *" path="firstName">
          <NInput
            v-model:value="form.firstName"
            placeholder="Имя клиента"
            size="large"
          />
        </NFormItem>

        <NFormItem label="Фамилия *" path="lastName">
          <NInput
            v-model:value="form.lastName"
            placeholder="Фамилия клиента"
            size="large"
          />
        </NFormItem>

        <NFormItem label="Телефон *" path="phone">
          <NInput
            v-model:value="form.phone"
            placeholder="+993 ..."
            size="large"
          />
        </NFormItem>

        <NFormItem label="Дата и время звонка *" path="datetime">
          <NDatePicker
            v-model:value="form.datetime"
            type="datetime"
            size="large"
            :is-date-disabled="(ts: number) => ts > Date.now()"
            clearable
            placeholder="Выберите дату и время"
            style="width: 100%"
          />
        </NFormItem>

        <NFormItem label="Результат *" path="outcome">
          <NSelect
            v-model:value="form.outcome"
            :options="outcomeOptions"
            placeholder="Выберите результат звонка"
            size="large"
          />
        </NFormItem>

        <NFormItem label="Заметки" path="notes">
          <NInput
            v-model:value="form.notes"
            type="textarea"
            :rows="4"
            placeholder="Кратко: что обсудили, следующие шаги..."
          />
        </NFormItem>

        <div class="form-actions">
          <NButton type="default" @click="navigateTo('/cabinet/sales')">Отмена</NButton>
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
import { ref } from 'vue'
import { useCabinetSales } from '~/composables/useCabinetSales'
import {
  NCard,
  NButton,
  NInput,
  NForm,
  NFormItem,
  NIcon,
  NH2,
  NDatePicker,
  NSelect,
  useMessage,
  type FormInst,
  type FormRules,
} from 'naive-ui'
import {
  ArrowBackOutline as ArrowBackIcon,
  SaveOutline as SaveIcon,
} from '@vicons/ionicons5'

definePageMeta({
  layout: 'cabinet',
  middleware: 'cabinet-auth',
})

type Outcome = 'no_answer' | 'interested' | 'not_interested' | 'follow_up'

const message = useMessage()
const { create } = useCabinetSales()

const formRef = ref<FormInst | null>(null)
const saving = ref(false)

const form = ref({
  firstName: '',
  lastName: '',
  phone: '',
  datetime: Date.now(),
  outcome: null as Outcome | null,
  notes: '',
})

const rules: FormRules = {
  firstName: [{ required: true, message: 'Введите имя', trigger: 'blur' }],
  lastName: [{ required: true, message: 'Введите фамилию', trigger: 'blur' }],
  phone: [{ required: true, message: 'Введите телефон', trigger: 'blur' }],
  datetime: [
    { 
      required: true, 
      message: 'Укажите дату и время звонка', 
      trigger: ['change', 'blur'],
      validator: (_rule, value) => {
        return !!value
      }
    }
  ],
  outcome: [{ required: true, message: 'Выберите результат', trigger: 'change' }],
}

const outcomeOptions = [
  { label: 'Не ответил(а)', value: 'no_answer' },
  { label: 'Заинтересован(а)', value: 'interested' },
  { label: 'Не интересно', value: 'not_interested' },
  { label: 'Нужен перезвон', value: 'follow_up' },
] as const

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    
    if (!form.value.datetime) {
      message.error('Укажите дату и время звонка')
      return
    }
    
    saving.value = true

    const datetimeValue = typeof form.value.datetime === 'number' 
      ? new Date(form.value.datetime) 
      : new Date(form.value.datetime)
    
    const payload = {
      firstName: form.value.firstName.trim(),
      lastName: form.value.lastName.trim(),
      phone: form.value.phone.trim(),
      datetime: datetimeValue.toISOString(),
      outcome: form.value.outcome as Outcome,
      notes: form.value.notes.trim() || undefined,
    }

    await create(payload)
    message.success('Звонок добавлен в дневник')
    navigateTo('/cabinet/sales')
  } catch (err: any) {
    console.error('Save sales call error:', err)
    let errorMsg = 'Не удалось сохранить запись'
    if (err.value) {
      errorMsg = err.value.error || errorMsg
    } else if (err.message) {
      errorMsg = err.message
    } else if (Array.isArray(err) && err.length > 0) {
      errorMsg = err[0]?.error || err[0]?.message || errorMsg
    }
    message.error(errorMsg)
  } finally {
    saving.value = false
  }
}
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

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--n-border-color);
}
</style>
