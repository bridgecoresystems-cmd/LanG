<template>
  <q-page class="q-pa-md">
    <div class="flex justify-between items-center q-mb-md">
      <h1 class="text-h4 q-ma-none">Подписчики на новости</h1>
      <q-btn
        color="primary"
        icon="download"
        label="Экспорт в CSV"
        @click="exportToCSV"
      />
    </div>

    <q-banner v-if="error" class="bg-negative text-white q-mb-md">
      {{ error }}
    </q-banner>

    <q-card flat bordered class="admin-table-card">
      <q-table
        :rows="subscribers"
        :columns="columns"
        row-key="id"
        :loading="loading"
        flat
        :pagination="{ rowsPerPage: 15 }"
      >
        <template v-slot:body-cell-status="props">
          <q-td :props="props">
            <q-badge :color="props.row.isActive ? 'positive' : 'grey'">
              {{ props.row.isActive ? 'Активен' : 'Отписан' }}
            </q-badge>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props" class="text-right">
            <q-btn
              flat
              round
              color="negative"
              icon="delete"
              @click="confirmDelete(props.row)"
            >
              <q-tooltip>Удалить подписчика</q-tooltip>
            </q-btn>
          </q-td>
        </template>

        <template v-slot:no-data>
          <div class="full-width row flex-center q-pa-lg text-grey-7">
            Подписчиков пока нет
          </div>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar, exportFile } from 'quasar'
import dayjs from 'dayjs'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const $q = useQuasar()
const { loading, error, getSubscribers, removeSubscriber } = useAdminNews()
const subscribers = ref<any[]>([])

const columns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
  { name: 'email', label: 'Email', field: 'email', align: 'left', sortable: true },
  { 
    name: 'createdAt', 
    label: 'Дата подписки', 
    field: 'createdAt', 
    align: 'left', 
    sortable: true,
    format: (val: string) => dayjs(val).format('DD.MM.YYYY HH:mm')
  },
  { name: 'status', label: 'Статус', field: 'isActive', align: 'center' },
  { name: 'actions', label: 'Действия', field: 'actions', align: 'right' }
]

const fetchSubscribers = async () => {
  const data = await getSubscribers()
  subscribers.value = Array.isArray(data) ? data : []
}

const confirmDelete = (row: any) => {
  $q.dialog({
    title: 'Удаление',
    message: `Вы действительно хотите удалить подписчика ${row.email}?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await removeSubscriber(row.id)
      $q.notify({ color: 'positive', message: 'Подписчик удален' })
      await fetchSubscribers()
    } catch {
      $q.notify({ color: 'negative', message: 'Ошибка при удалении' })
    }
  })
}

const exportToCSV = () => {
  if (subscribers.value.length === 0) return
  
  const content = [
    ['ID', 'Email', 'Date', 'Status'],
    ...subscribers.value.map(s => [
      s.id,
      s.email,
      dayjs(s.createdAt).format('YYYY-MM-DD HH:mm'),
      s.isActive ? 'Active' : 'Unsubscribed'
    ])
  ].map(e => e.join(',')).join('\n')

  const status = exportFile(
    'subscribers.csv',
    content,
    'text/csv'
  )

  if (status !== true) {
    $q.notify({
      message: 'Браузер заблокировал скачивание файла...',
      color: 'negative',
      icon: 'warning'
    })
  }
}

onMounted(() => {
  fetchSubscribers()
})
</script>
