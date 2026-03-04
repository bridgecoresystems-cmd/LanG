<template>
  <div style="max-width: 700px;">
    <div class="flex items-center gap-3 mb-4">
      <NButton text @click="navigateTo('/cabinet/head-accountant/gems/requests')">← Назад</NButton>
      <NH3 style="margin: 0;">Заявка #{{ request?.id }}</NH3>
      <NTag v-if="request" :type="STATUS_TYPES[request.status] || 'default'" round>
        {{ STATUS_LABELS[request.status] || request.status }}
      </NTag>
    </div>

    <NSpin v-if="loading" />

    <template v-else-if="request">
      <!-- Details card -->
      <NCard style="margin-bottom: 16px;">
        <NDescriptions label-placement="left" :column="1" bordered>
          <NDescriptionsItem label="Название">{{ request.title }}</NDescriptionsItem>
          <NDescriptionsItem label="Дата заявки">{{ new Date(request.requestDate).toLocaleDateString('ru-RU') }}</NDescriptionsItem>
          <NDescriptionsItem label="Сумма">{{ request.amount }} 💎</NDescriptionsItem>
          <NDescriptionsItem label="Создано">{{ new Date(request.createdAt).toLocaleDateString('ru-RU') }}</NDescriptionsItem>
          <NDescriptionsItem v-if="request.directorComment" label="Комментарий директора">
            <NText type="error">{{ request.directorComment }}</NText>
          </NDescriptionsItem>
        </NDescriptions>
      </NCard>

      <!-- Edit form for rejected requests -->
      <NCard v-if="request.status === 'rejected'" title="Исправить и отправить повторно" style="margin-bottom: 16px;">
        <NAlert type="warning" style="margin-bottom: 16px;">
          Заявка отклонена. Вы можете исправить данные и отправить повторно.
        </NAlert>

        <NForm ref="formRef" :model="editForm" :rules="rules" label-placement="top">
          <NFormItem label="Название *" path="title">
            <NInput v-model:value="editForm.title" />
          </NFormItem>
          <NFormItem label="Дата заявки *" path="requestDate">
            <NDatePicker v-model:value="editForm.requestDate" type="date" style="width: 100%;" />
          </NFormItem>
          <NFormItem label="Сумма (gems) *" path="amount">
            <NInputNumber v-model:value="editForm.amount" :min="1" :precision="0" style="width: 100%;">
              <template #suffix>💎</template>
            </NInputNumber>
          </NFormItem>
          <NButton type="primary" :loading="submitting" @click="handleResubmit">
            Отправить повторно
          </NButton>
        </NForm>
      </NCard>

      <!-- Audit log timeline -->
      <NCard title="История изменений">
        <NTimeline v-if="request.logs && request.logs.length">
          <NTimelineItem
            v-for="log in request.logs"
            :key="log.id"
            :type="LOG_TYPES[log.action] || 'default'"
            :title="LOG_LABELS[log.action] || log.action"
            :content="[log.actorName, log.actorRole].filter(Boolean).join(' · ') + (log.comment ? ': ' + log.comment : '')"
            :time="new Date(log.createdAt).toLocaleString('ru-RU')"
          />
        </NTimeline>
        <NEmpty v-else description="Нет записей" />
      </NCard>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NH3, NCard, NDescriptions, NDescriptionsItem, NTag, NText, NAlert, NForm, NFormItem, NInput, NDatePicker, NInputNumber, NButton, NTimeline, NTimelineItem, NEmpty, NSpin, useMessage } from 'naive-ui'
import { useRuntimeConfig, useRoute } from '#app'

definePageMeta({ layout: 'cabinet' })

const config = useRuntimeConfig()
const API = config.public.apiBase as string
const route = useRoute()
const message = useMessage()

const loading = ref(false)
const submitting = ref(false)
const request = ref<any>(null)
const formRef = ref()

const editForm = ref({ title: '', requestDate: null as number | null, amount: null as number | null })

const rules = {
  title: { required: true, message: 'Введите название', trigger: 'blur' },
  requestDate: { required: true, type: 'number' as const, message: 'Выберите дату', trigger: 'change' },
  amount: { required: true, type: 'number' as const, message: 'Введите сумму', trigger: 'change' },
}

const STATUS_LABELS: Record<string, string> = {
  pending_director: 'Ожидает директора',
  pending_admin: 'Ожидает админа',
  rejected: 'Отклонено',
  completed: 'Выполнено',
}

const STATUS_TYPES: Record<string, 'info' | 'warning' | 'error' | 'success'> = {
  pending_director: 'info',
  pending_admin: 'warning',
  rejected: 'error',
  completed: 'success',
}

const LOG_LABELS: Record<string, string> = {
  created: 'Заявка создана',
  resubmitted: 'Отправлено повторно',
  director_approved: 'Одобрено директором',
  director_rejected: 'Отклонено директором',
  admin_completed: 'Выполнено администратором',
}

const LOG_TYPES: Record<string, 'default' | 'info' | 'success' | 'error' | 'warning'> = {
  created: 'info',
  resubmitted: 'warning',
  director_approved: 'success',
  director_rejected: 'error',
  admin_completed: 'success',
}

async function load() {
  loading.value = true
  try {
    request.value = await $fetch(`${API}/cabinet/gems/topup-requests/${route.params.id}`, { credentials: 'include' })
    // Populate edit form
    editForm.value.title = request.value.title
    editForm.value.amount = request.value.amount
    editForm.value.requestDate = new Date(request.value.requestDate).getTime()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function handleResubmit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    await $fetch(`${API}/cabinet/gems/topup-requests/${route.params.id}`, {
      method: 'PATCH',
      credentials: 'include',
      body: {
        title: editForm.value.title,
        amount: editForm.value.amount,
        requestDate: new Date(editForm.value.requestDate!).toISOString(),
      },
    })
    message.success('Заявка отправлена повторно')
    await load()
  } catch (e: any) {
    const body = e?.data ?? e?.value
    const err = body && typeof body === 'object' ? (body.error || JSON.stringify(body)) : (e?.message || 'Ошибка')
    message.error(err)
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>
