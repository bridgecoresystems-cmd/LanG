<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__text">
        <NH1 class="page-header__title">Принять оплату</NH1>
        <p class="page-header__subtitle">Внесите данные о платеже</p>
      </div>
    </header>

    <NCard bordered class="payment-form-card">
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
                @focus="handleFocusStudent"
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
                @focus="handleFocusGroup"
                clearable
              />
              <template #feedback>
                Если группа ещё не сформирована, оставьте пустым.
              </template>
            </NFormItem>
          </NGi>

          <!-- Debt and Tariff Info -->
          <template v-if="formData.student_id && formData.group_id">
            <NGi :span="2">
              <NCard size="small" embedded :bordered="false" style="background-color: #f0f7ff; margin-bottom: 16px;">
                <NSpace vertical>
                  <div class="row justify-between">
                    <NText depth="3">Текущий тариф:</NText>
                    <NText strong>{{ currentDebtInfo.tariffPrice }} TMT</NText>
                  </div>
                  <div class="row justify-between">
                    <NText depth="3">Уже оплачено:</NText>
                    <NText strong type="success">{{ currentDebtInfo.totalPaid }} TMT</NText>
                  </div>
                  <div class="row justify-between">
                    <NText depth="3">Остаток долга:</NText>
                    <NText strong type="error">{{ remainingDebt }} TMT</NText>
                  </div>
                </NSpace>
              </NCard>
            </NGi>

            <NGi>
              <NFormItem label="Установить/Изменить тариф" path="tariff_id">
                <NSelect
                  v-model:value="formData.tariff_id"
                  :options="tariffOptions"
                  placeholder="Выберите тариф"
                  clearable
                />
              </NFormItem>
            </NGi>
            <NGi>
              <NFormItem label="Тип оплаты">
                <NCheckbox v-model:checked="formData.is_partial">
                  Оплата частями
                </NCheckbox>
              </NFormItem>
            </NGi>
          </template>

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
              <NButton type="primary" size="large" :loading="saving" @click="handleSubmit">
                <template #icon><NIcon><SaveIcon /></NIcon></template>
                Принять оплату
              </NButton>
            </div>
          </NGi>
        </NGrid>
      </NForm>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  NH1, NH2, NText, NCard, NForm, NFormItem, NInput, NInputNumber,
  NSelect, NSwitch, NButton, NIcon, NGrid, NGi, NAutoComplete, useMessage, NSpace, NCheckbox
} from 'naive-ui'
import { SaveOutline as SaveIcon } from '@vicons/ionicons5'
import { useEden } from '~/composables/useEden'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const api = useEden()
const message = useMessage()

const formRef = ref<any>(null)
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
  is_partial: false,
  tariff_id: null as number | null,
})

const currentDebtInfo = ref({
  tariffPrice: 0,
  discount: 0,
  totalPaid: 0,
  remaining: 0
})

const remainingDebt = computed(() => {
  const expected = Math.max(0, currentDebtInfo.value.tariffPrice - currentDebtInfo.value.discount)
  return Math.max(0, expected - currentDebtInfo.value.totalPaid)
})

watch([() => formData.value.student_id, () => formData.value.group_id], async ([sId, gId]) => {
  if (sId && gId) {
    try {
      const { data } = await api.api.v1.cabinet.accountant['student-group-info'].get({
        query: { studentId: sId, groupId: gId.toString() }
      })
      if (data && !('error' in data)) {
        currentDebtInfo.value = {
          tariffPrice: (data as any).tariffPrice || 0,
          discount: (data as any).discount || 0,
          totalPaid: (data as any).totalPaid || 0,
          remaining: 0
        }
        if ((data as any).tariffId) {
          formData.value.tariff_id = (data as any).tariffId
        }
      }
    } catch (e) {
      console.error(e)
    }
  } else {
    currentDebtInfo.value = { tariffPrice: 0, discount: 0, totalPaid: 0, remaining: 0 }
  }
})

// Tariffs
const tariffOptions = ref<{ label: string, value: number, price: number }[]>([])
const loadTariffs = async () => {
  try {
    const { data } = await api.api.v1.cabinet.tariffs.get()
    if (data) {
      tariffOptions.value = data.map((t: any) => ({
        label: `${t.name} (${t.price} TMT)`,
        value: t.id,
        price: parseFloat(t.price)
      }))
    }
  } catch (e) {
    console.error(e)
  }
}

watch(() => formData.value.tariff_id, (tId) => {
  if (tId) {
    const tariff = tariffOptions.value.find(t => t.value === tId)
    if (tariff) {
      currentDebtInfo.value.tariffPrice = tariff.price
      if (!formData.value.is_partial) {
        formData.value.amount = Math.max(0, tariff.price - currentDebtInfo.value.discount - currentDebtInfo.value.totalPaid)
      }
    }
  }
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
    const { data } = await api.api.v1.cabinet.accountant.students.get({ query: { q: query || '' } })
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

const handleFocusStudent = () => {
  if (studentOptions.value.length === 0) {
    handleStudentSearch('')
  }
}

// Groups Search
const groupsLoading = ref(false)
const groupOptions = ref<{ label: string, value: number }[]>([])

const handleGroupSearch = async (query: string) => {
  groupsLoading.value = true
  try {
    const { data } = await api.api.v1.cabinet.accountant.groups.get({ query: { q: query || '' } })
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

const handleFocusGroup = () => {
  if (groupOptions.value.length === 0) {
    handleGroupSearch('')
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
      is_partial: formData.value.is_partial,
      tariff_id: formData.value.tariff_id || undefined,
    }

    const { data, error } = await api.api.v1.cabinet.accountant.payments.post(payload)
    
    if (error) throw error
    
    message.success('Оплата успешно принята!')
    // Redirect to receipt or list
    if (data?.id) {
        navigateTo(`/cabinet/accountant/payments/${data.id}/receipt`)
    } else {
        navigateTo('/cabinet/accountant/payments')
    }
  } catch (e: any) {
    console.error(e)
    message.error('Ошибка при сохранении: ' + (e.message || 'Неизвестная ошибка'))
  } finally {
    saving.value = false
  }
}

// Initial load
onMounted(() => {
  handleGroupSearch('')
  handleStudentSearch('')
  loadTariffs()
})
</script>

<style scoped>
.cabinet-page {
  padding-bottom: 40px;
}

.page-header {
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
