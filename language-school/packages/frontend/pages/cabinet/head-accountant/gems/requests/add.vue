<template>
  <div style="max-width: 560px;">
    <NH3 style="margin-bottom: 24px;">Новая заявка на пополнение</NH3>

    <NForm ref="formRef" :model="form" :rules="rules" label-placement="top">
      <NFormItem label="Название заявки *" path="title">
        <NInput v-model:value="form.title" placeholder="Например: Пополнение на апрель 2026" />
      </NFormItem>

      <NFormItem label="Дата заявки *" path="requestDate">
        <NDatePicker v-model:value="form.requestDate" type="date" style="width: 100%;" />
      </NFormItem>

      <NFormItem label="Сумма (gems) *" path="amount">
        <NInputNumber v-model:value="form.amount" :min="1" :precision="0" style="width: 100%;" placeholder="Например: 5000">
          <template #suffix>💎</template>
        </NInputNumber>
      </NFormItem>

      <NSpace>
        <NButton type="primary" :loading="submitting" @click="handleSubmit">Отправить заявку</NButton>
        <NButton @click="navigateTo('/cabinet/head-accountant/gems/requests')">Отмена</NButton>
      </NSpace>
    </NForm>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NH3, NForm, NFormItem, NInput, NDatePicker, NInputNumber, NButton, NSpace, useMessage } from 'naive-ui'
import { useRuntimeConfig } from '#app'

definePageMeta({ layout: 'cabinet' })

const config = useRuntimeConfig()
const API = config.public.apiBase as string
const message = useMessage()

const formRef = ref()
const submitting = ref(false)

const form = ref({
  title: '',
  requestDate: null as number | null,
  amount: null as number | null,
})

const rules = {
  title: { required: true, message: 'Введите название', trigger: 'blur' },
  requestDate: { required: true, type: 'number' as const, message: 'Выберите дату', trigger: 'change' },
  amount: { required: true, type: 'number' as const, message: 'Введите сумму', trigger: 'change' },
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    await $fetch(`${API}/cabinet/gems/topup-requests`, {
      method: 'POST',
      credentials: 'include',
      body: {
        title: form.value.title,
        amount: form.value.amount,
        requestDate: new Date(form.value.requestDate!).toISOString(),
      },
    })
    message.success('Заявка отправлена директору на согласование')
    navigateTo('/cabinet/head-accountant/gems/requests')
  } catch (e: any) {
    const body = e?.data ?? e?.value
    const err = body && typeof body === 'object' ? (body.error || JSON.stringify(body)) : (e?.message || 'Ошибка')
    message.error(err)
  } finally {
    submitting.value = false
  }
}
</script>
