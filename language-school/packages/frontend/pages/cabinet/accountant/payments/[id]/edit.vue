<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__text">
        <NH1 class="page-header__title">Редактировать оплату</NH1>
        <p class="page-header__subtitle">Изменение данных транзакции #{{ paymentId }}</p>
      </div>
      <div class="page-header__actions">
        <NButton quaternary @click="navigateTo('/cabinet/accountant/payments')">
          Назад к списку
        </NButton>
      </div>
    </header>

    <q-inner-loading :showing="loading && !formData.purpose">
      <q-spinner size="50px" color="primary" />
    </q-inner-loading>

    <NCard v-if="!loading || formData.purpose" bordered class="payment-form-card">
      <NForm
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-placement="top"
        size="medium"
        require-mark-placement="right-hanging"
      >
        <NGrid :cols="2" :x-gap="24">
          <!-- Payer Selection -->
          <NGi :span="2">
            <div class="payer-switch">
              <NText strong>Плательщик:</NText>
              <NSwitch v-model:value="isStudentPayer">
                <template #checked>Студент</template>
                <template #unchecked>Другой</template>
              </NSwitch>
            </div>
          </NGi>

          <NGi v-if="isStudentPayer" :span="2">
            <NFormItem label="Выберите студента" path="student_id">
              <NSelect
                v-model:value="formData.student_id"
                filterable
                placeholder="Поиск по имени или телефону"
                :options="studentOptions"
                :loading="studentsLoading"
                remote
                @search="handleStudentSearch"
                clearable
              />
            </NFormItem>
          </NGi>

          <template v-else>
            <NGi>
              <NFormItem label="ФИО плательщика" path="payer_name">
                <NInput v-model:value="formData.payer_name" placeholder="Введите ФИО" />
              </NFormItem>
            </NGi>
            <NGi>
              <NFormItem label="Телефон" path="payer_phone">
                <NInput v-model:value="formData.payer_phone" placeholder="+993..." />
              </NFormItem>
            </NGi>
          </template>

          <!-- Group Selection (Optional) -->
          <NGi :span="2">
            <NFormItem label="Группа (необязательно)" path="group_id">
              <NSelect
                v-model:value="formData.group_id"
                filterable
                placeholder="Выберите группу"
                :options="groupOptions"
                :loading="groupsLoading"
                remote
                @search="handleGroupSearch"
                clearable
              />
            </NFormItem>
          </NGi>

          <!-- Financials -->
          <NGi>
            <NFormItem label="Сумма (TMT)" path="amount">
              <NInputNumber
                v-model:value="formData.amount"
                :min="0"
                :precision="2"
                placeholder="0.00"
                style="width: 100%"
              />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="Скидка (TMT)" path="discount">
              <NInputNumber
                v-model:value="formData.discount"
                :min="0"
                :precision="2"
                placeholder="0.00"
                style="width: 100%"
              />
            </NFormItem>
          </NGi>

          <NGi :span="2">
            <div class="total-row">
              <NText depth="3">Итого к оплате:</NText>
              <NH2 style="margin: 0; color: #18a058;">{{ totalAmount }} TMT</NH2>
            </div>
          </NGi>

          <!-- Payment Details -->
          <NGi>
            <NFormItem label="Способ оплаты" path="method">
              <NSelect
                v-model:value="formData.method"
                :options="methodOptions"
                placeholder="Выберите способ"
              />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="Назначение платежа" path="purpose">
              <NAutoComplete
                v-model:value="formData.purpose"
                :options="purposeOptions"
                placeholder="Напр. Оплата за курс English"
              />
            </NFormItem>
          </NGi>

          <NGi :span="2">
            <NFormItem label="Комментарий" path="comment">
              <NInput
                v-model:value="formData.comment"
                type="textarea"
                placeholder="Дополнительные заметки..."
              />
            </NFormItem>
          </NGi>

          <NGi :span="2">
            <div class="actions">
              <NSpace>
                <NButton quaternary @click="navigateTo('/cabinet/accountant/payments')">
                  Отмена
                </NButton>
                <NButton type="primary" size="large" :loading="saving" @click="handleSubmit">
                  <template #icon><NIcon><SaveIcon /></NIcon></template>
                  Сохранить изменения
                </NButton>
              </NSpace>
            </div>
          </NGi>
        </NGrid>
      </NForm>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NH1, NH2, NText, NCard, NForm, NFormItem, NInput, NInputNumber,
  NSelect, NSwitch, NButton, NIcon, NGrid, NGi, NAutoComplete, useMessage, NSpace
} from 'naive-ui'
import { SaveOutline as SaveIcon } from '@vicons/ionicons5'
import { useEden } from '~/composables/useEden'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const api = useEden()
const message = useMessage()
const route = useRoute()
const paymentId = route.params.id as string

const formRef = ref<any>(null)
const loading = ref(true)
const saving = ref(false)
const isStudentPayer = ref(true)

const formData = ref({
  student_id: null as string | null,
  payer_name: '',
  payer_phone: '',
  group_id: null as number | null,
  amount: 0,
  discount: 0,
  method: 'cash',
  purpose: '',
  comment: '',
})

const rules = computed(() => ({
  student_id: isStudentPayer.value ? { required: true, message: 'Выберите студента', trigger: ['blur', 'change'] } : {},
  payer_name: !isStudentPayer.value ? { required: true, message: 'Введите имя плательщика', trigger: 'blur' } : {},
  amount: { required: true, type: 'number', min: 0.01, message: 'Введите сумму', trigger: 'blur' },
  method: { required: true, message: 'Выберите способ оплаты', trigger: ['blur', 'change'] },
  purpose: { required: true, message: 'Укажите назначение платежа', trigger: 'blur' },
}))

const methodOptions = [
  { label: 'Наличные', value: 'cash' },
  { label: 'Карта', value: 'card' },
  { label: 'Банковский перевод', value: 'bank_transfer' },
]

const purposeOptions = computed(() => {
  return ['Оплата за курс English', 'Оплата за курс Deutsch', 'Перевод документов', 'Индивидуальные занятия'].map(v => ({ label: v, value: v }))
})

const totalAmount = computed(() => {
  const amt = formData.value.amount || 0
  const disc = formData.value.discount || 0
  return Math.max(0, amt - disc).toFixed(2)
})

// Students Search
const studentsLoading = ref(false)
const studentOptions = ref<{ label: string, value: string }[]>([])

const handleStudentSearch = async (query: string) => {
  studentsLoading.value = true
  try {
    const { data } = await api.api.v1.cabinet.accountant.students.get({ query: { q: query } })
    if (data) {
      studentOptions.value = data.map((s: any) => ({
        label: `${s.full_name} (${s.phone || 'нет тел.'})`,
        value: s.id
      }))
    }
  } catch (e) {
    console.error(e)
  } finally {
    studentsLoading.value = false
  }
}

// Groups Search
const groupsLoading = ref(false)
const groupOptions = ref<{ label: string, value: number }[]>([])

const handleGroupSearch = async (query: string) => {
  groupsLoading.value = true
  try {
    const { data } = await api.api.v1.cabinet.accountant.groups.get({ query: { q: query } })
    if (data) {
      groupOptions.value = data.map((g: any) => ({
        label: g.name,
        value: g.id
      }))
    }
  } catch (e) {
    console.error(e)
  } finally {
    groupsLoading.value = false
  }
}

const loadPayment = async () => {
  loading.value = true
  try {
    const { data, error } = await api.api.v1.cabinet.accountant.payments[paymentId as any].receipt.get()
    if (error) throw error
    if (data) {
      isStudentPayer.value = !!data.studentFirstName
      formData.value = {
        student_id: (data as any).studentId || null,
        payer_name: (data as any).payerName || '',
        payer_phone: (data as any).payerPhone || '',
        group_id: (data as any).groupId || null,
        amount: (data as any).amount || 0,
        discount: (data as any).discount || 0,
        method: (data as any).method || 'cash',
        purpose: (data as any).purpose || '',
        comment: (data as any).comment || '',
      }
      
      // Load initial options for select fields
      if (formData.value.student_id) {
        studentOptions.value = [{
          label: `${(data as any).studentFirstName} ${(data as any).studentLastName || ''} (${(data as any).studentPhone || 'нет тел.'})`,
          value: formData.value.student_id
        }]
      }
      if (formData.value.group_id) {
        groupOptions.value = [{
          label: (data as any).groupName,
          value: formData.value.group_id
        }]
      }
    }
  } catch (e: any) {
    console.error(e)
    message.error('Ошибка при загрузке данных: ' + (e.message || 'Неизвестная ошибка'))
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    saving.value = true
    
    const payload = {
      student_id: isStudentPayer.value ? (formData.value.student_id || undefined) : undefined,
      payer_name: !isStudentPayer.value ? (formData.value.payer_name || undefined) : undefined,
      payer_phone: !isStudentPayer.value ? (formData.value.payer_phone || undefined) : undefined,
      group_id: formData.value.group_id || undefined,
      amount: formData.value.amount,
      discount: formData.value.discount || 0,
      method: formData.value.method,
      purpose: formData.value.purpose,
      comment: formData.value.comment || undefined,
    }

    const { error } = await api.api.v1.cabinet.accountant.payments[paymentId as any].patch(payload)
    
    if (error) throw error
    
    message.success('Данные успешно обновлены!')
    navigateTo('/cabinet/accountant/payments')
  } catch (e: any) {
    console.error(e)
    message.error('Ошибка при сохранении: ' + (e.message || 'Неизвестная ошибка'))
  } finally {
    saving.value = false
  }
}

onMounted(loadPayment)
</script>

<style scoped>
.cabinet-page {
  padding-bottom: 40px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
}

.page-header__title {
  margin: 0 0 4px;
  font-weight: 700;
}

.page-header__subtitle {
  margin: 0;
  color: #666;
}

.payment-form-card {
  max-width: 800px;
  margin: 0 auto;
}

.payer-switch {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #eee;
}

.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
