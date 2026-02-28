<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__text">
        <NH1 class="page-header__title">Добавить новый тариф</NH1>
        <p class="page-header__subtitle">Установите стоимость новой услуги или курса</p>
      </div>
      <div class="page-header__actions">
        <NButton quaternary @click="navigateTo('/cabinet/head-accountant/tariffs')">
          Назад к списку
        </NButton>
      </div>
    </header>

    <NCard bordered class="tariff-form-card">
      <NForm
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-placement="top"
        size="large"
      >
        <NFormItem label="Название тарифа" path="name">
          <NInput v-model:value="formData.name" placeholder="Напр. General English (Adults)" />
        </NFormItem>

        <NGrid :cols="2" :x-gap="24">
          <NGi>
            <NFormItem label="Категория" path="category">
              <NSelect
                v-model:value="formData.category"
                :options="categoryOptions"
                placeholder="Выберите категорию"
              />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="Стоимость (TMT)" path="price">
              <NInputNumber
                v-model:value="formData.price"
                :min="0"
                :precision="2"
                placeholder="0.00"
                style="width: 100%"
              />
            </NFormItem>
          </NGi>
        </NGrid>

        <NFormItem label="Описание (необязательно)" path="description">
          <NInput
            v-model:value="formData.description"
            type="textarea"
            placeholder="Краткая информация о тарифе..."
            :autosize="{ minRows: 3 }"
          />
        </NFormItem>

        <div class="actions">
          <NSpace>
            <NButton quaternary @click="navigateTo('/cabinet/head-accountant/tariffs')">
              Отмена
            </NButton>
            <NButton type="primary" size="large" :loading="saving" @click="handleSubmit">
              <template #icon><NIcon><SaveIcon /></NIcon></template>
              Сохранить тариф
            </NButton>
          </NSpace>
        </div>
      </NForm>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NH1, NButton, NIcon, NCard, NForm, NFormItem, NInput, NInputNumber, NSelect, NGrid, NGi, useMessage, NSpace } from 'naive-ui'
import { SaveOutline as SaveIcon } from '@vicons/ionicons5'
import { useEden } from '~/composables/useEden'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const api = useEden()
const message = useMessage()
const formRef = ref<any>(null)
const saving = ref(false)

const formData = ref({
  name: '',
  category: 'course_adult',
  price: 0,
  description: ''
})

const categoryOptions = [
  { label: 'Курс (Взрослые)', value: 'course_adult' },
  { label: 'Курс (Дети)', value: 'course_kid' },
  { label: 'Перевод', value: 'translation' },
  { label: 'Сертификат', value: 'certificate' },
  { label: 'Прочее', value: 'other' }
]

const rules = {
  name: { required: true, message: 'Введите название тарифа', trigger: 'blur' },
  category: { required: true, message: 'Выберите категорию', trigger: 'change' },
  price: { required: true, type: 'number', min: 0.01, message: 'Введите стоимость', trigger: 'blur' }
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    saving.value = true
    
    const { error } = await api.api.v1.cabinet.tariffs.post(formData.value)
    
    if (error) throw error
    
    message.success('Тариф успешно добавлен!')
    navigateTo('/cabinet/head-accountant/tariffs')
  } catch (e: any) {
    console.error(e)
    message.error('Ошибка при сохранении: ' + (e.message || 'Неизвестная ошибка'))
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
.page-header__subtitle {
  margin: 0;
  color: var(--n-text-color-3);
}
.tariff-form-card {
  max-width: 700px;
  margin: 0 auto;
  border-radius: 16px;
}
.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}
</style>
