<template>
  <div class="admin-page-content">
    <div class="row items-center justify-between q-mb-md">
      <h1 class="text-h4 q-ma-none">Добавить звонок</h1>
      <q-btn color="primary" outline icon="arrow_back" label="Назад" @click="navigateTo('/admin/sales')" />
    </div>

    <q-card flat bordered>
      <q-card-section>
        <q-form @submit.prevent="handleSubmit" class="q-gutter-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.firstName"
                label="Имя *"
                outlined
                dense
                :rules="[(val) => !!val || 'Введите имя']"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.lastName"
                label="Фамилия *"
                outlined
                dense
                :rules="[(val) => !!val || 'Введите фамилию']"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.phone"
                label="Телефон *"
                outlined
                dense
                :rules="[(val) => !!val || 'Введите телефон']"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.datetime"
                label="Дата и время звонка *"
                outlined
                dense
                type="datetime-local"
                :rules="[(val) => !!val || 'Укажите дату и время звонка']"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-select
                v-model="form.outcome"
                :options="outcomeOptions"
                label="Результат *"
                outlined
                dense
                emit-value
                map-options
                :rules="[(val) => !!val || 'Выберите результат']"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-select
                v-model="form.salesManagerId"
                :options="salesManagerOptions"
                label="Менеджер *"
                outlined
                dense
                emit-value
                map-options
                :rules="[(val) => !!val || 'Выберите менеджера']"
              />
            </div>
            <div class="col-12">
              <q-input
                v-model="form.notes"
                label="Заметки"
                outlined
                dense
                type="textarea"
                :rows="4"
              />
            </div>
          </div>

          <div class="row justify-end q-mt-md">
            <q-btn
              flat
              label="Отмена"
              color="primary"
              @click="navigateTo('/admin/sales')"
              class="q-mr-sm"
            />
            <q-btn
              type="submit"
              label="Сохранить"
              color="primary"
              :loading="saving"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAdminSales } from '~/composables/useAdminSales'
import { useAdminUsers } from '~/composables/useAdminUsers'
import { useQuasar } from 'quasar'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

type Outcome = 'no_answer' | 'interested' | 'not_interested' | 'follow_up'

const $q = useQuasar()
const { create } = useAdminSales()
const { getAll: getAllUsers } = useAdminUsers()

const saving = ref(false)
const salesManagers = ref<any[]>([])

const form = ref({
  firstName: '',
  lastName: '',
  phone: '',
  datetime: '',
  outcome: null as Outcome | null,
  notes: '',
  salesManagerId: null as string | null,
})

const outcomeOptions = [
  { label: 'Не ответил(а)', value: 'no_answer' },
  { label: 'Заинтересован(а)', value: 'interested' },
  { label: 'Не интересно', value: 'not_interested' },
  { label: 'Нужен перезвон', value: 'follow_up' },
]

const salesManagerOptions = computed(() =>
  salesManagers.value.map((u) => ({
    label: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
    value: u.id,
  }))
)

async function handleSubmit() {
  if (!form.value.datetime || !form.value.outcome || !form.value.salesManagerId) {
    $q.notify({
      type: 'negative',
      message: 'Заполните все обязательные поля',
    })
    return
  }

  saving.value = true
  try {
    const datetimeValue = new Date(form.value.datetime)
    
    const payload = {
      firstName: form.value.firstName.trim(),
      lastName: form.value.lastName.trim(),
      phone: form.value.phone.trim(),
      datetime: datetimeValue.toISOString(),
      outcome: form.value.outcome as Outcome,
      notes: form.value.notes.trim() || undefined,
      salesManagerId: form.value.salesManagerId,
    }

    await create(payload)
    $q.notify({
      type: 'positive',
      message: 'Звонок добавлен',
    })
    navigateTo('/admin/sales')
  } catch (err: any) {
    console.error('Create sales call error:', err)
    let errorMsg = 'Не удалось сохранить запись'
    if (err.value) {
      errorMsg = err.value.error || errorMsg
    } else if (err.message) {
      errorMsg = err.message
    } else if (Array.isArray(err) && err.length > 0) {
      errorMsg = err[0]?.error || err[0]?.message || errorMsg
    }
    $q.notify({
      type: 'negative',
      message: errorMsg,
    })
  } finally {
    saving.value = false
  }
}

async function loadSalesManagers() {
  try {
    const users = await getAllUsers()
    salesManagers.value = (users as any[]).filter((u: any) => u.role === 'SALES')
  } catch (err: any) {
    console.error('Load sales managers error:', err)
  }
}

onMounted(async () => {
  await loadSalesManagers()
})
</script>

<style scoped>
.admin-page-content {
  padding: 24px;
}
</style>
