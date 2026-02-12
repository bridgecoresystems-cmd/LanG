<template>
  <div class="admin-page-content">
    <div class="row items-center justify-between q-mb-md">
      <h1 class="text-h4 q-ma-none">Редактировать звонок</h1>
      <q-btn color="primary" outline icon="arrow_back" label="Назад" @click="navigateTo('/admin/sales')" />
    </div>

    <q-card v-if="!loading || form.firstName" flat bordered>
      <q-card-section>
        <q-inner-loading :showing="loading && !form.firstName">
          <q-spinner size="50px" color="primary" />
        </q-inner-loading>

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
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAdminSales } from '~/composables/useAdminSales'
import { useQuasar } from 'quasar'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

type Outcome = 'no_answer' | 'interested' | 'not_interested' | 'follow_up'

const route = useRoute()
const $q = useQuasar()
const { getById, update } = useAdminSales()

const loading = ref(true)
const saving = ref(false)

const form = ref({
  firstName: '',
  lastName: '',
  phone: '',
  datetime: '',
  outcome: null as Outcome | null,
  notes: '',
})

const outcomeOptions = [
  { label: 'Не ответил(а)', value: 'no_answer' },
  { label: 'Заинтересован(а)', value: 'interested' },
  { label: 'Не интересно', value: 'not_interested' },
  { label: 'Нужен перезвон', value: 'follow_up' },
]

async function handleSubmit() {
  if (!form.value.datetime || !form.value.outcome) {
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
    }

    await update(Number(route.params.id), payload)
    $q.notify({
      type: 'positive',
      message: 'Запись обновлена',
    })
    navigateTo('/admin/sales')
  } catch (err: any) {
    console.error('Update sales call error:', err)
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

onMounted(async () => {
  try {
    const item = await getById(Number(route.params.id))
    if (item) {
      const itemData = item as any
      const dt = typeof itemData.datetime === 'string' 
        ? new Date(itemData.datetime) 
        : (itemData.datetime instanceof Date ? itemData.datetime : new Date(itemData.datetime))
      
      // Format datetime for input[type="datetime-local"]
      const year = dt.getFullYear()
      const month = String(dt.getMonth() + 1).padStart(2, '0')
      const day = String(dt.getDate()).padStart(2, '0')
      const hours = String(dt.getHours()).padStart(2, '0')
      const minutes = String(dt.getMinutes()).padStart(2, '0')
      const datetimeLocal = `${year}-${month}-${day}T${hours}:${minutes}`
      
      form.value = {
        firstName: itemData.firstName || '',
        lastName: itemData.lastName || '',
        phone: itemData.phone || '',
        datetime: datetimeLocal,
        outcome: itemData.outcome,
        notes: itemData.notes || '',
      }
    }
  } catch (err: any) {
    console.error('Load sales call error:', err)
    $q.notify({
      type: 'negative',
      message: 'Ошибка загрузки данных',
    })
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.admin-page-content {
  padding: 24px;
}
</style>
