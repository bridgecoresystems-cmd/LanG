<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <NH3 style="margin: 0;">Заявки на пополнение баланса</NH3>
      <NSpace>
        <NButton quaternary size="small" @click="navigateTo('/cabinet/head-accountant/gems')">
          💎 Все кошельки
        </NButton>
        <NButton type="primary" @click="navigateTo('/cabinet/head-accountant/gems/requests/add')">
          + Создать заявку
        </NButton>
      </NSpace>
    </div>

    <NDataTable
      :columns="columns"
      :data="requests"
      :loading="loading"
      :pagination="{ pageSize: 20 }"
      striped
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { NDataTable, NButton, NH3, NTag, NSpace } from 'naive-ui'
import { useRuntimeConfig } from '#app'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const config = useRuntimeConfig()
const API = config.public.apiBase as string

const loading = ref(false)
const requests = ref<any[]>([])

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

const columns = [
  {
    title: 'Название',
    key: 'title',
    render: (row: any) => h('span', { style: 'cursor:pointer; color: #18a058', onClick: () => navigateTo(`/cabinet/head-accountant/gems/requests/${row.id}`) }, row.title),
  },
  {
    title: 'Дата заявки',
    key: 'requestDate',
    render: (row: any) => new Date(row.requestDate).toLocaleDateString('ru-RU'),
  },
  {
    title: 'Сумма 💎',
    key: 'amount',
    render: (row: any) => `${row.amount} 💎`,
  },
  {
    title: 'Статус',
    key: 'status',
    render: (row: any) =>
      h(NTag, { type: STATUS_TYPES[row.status] || 'default', round: true, size: 'small' },
        { default: () => STATUS_LABELS[row.status] || row.status }),
  },
  {
    title: 'Создано',
    key: 'createdAt',
    render: (row: any) => new Date(row.createdAt).toLocaleDateString('ru-RU'),
  },
  {
    title: '',
    key: 'actions',
    render: (row: any) =>
      h(NSpace, {}, {
        default: () => [
          h(NButton, { size: 'small', onClick: () => navigateTo(`/cabinet/head-accountant/gems/requests/${row.id}`) }, { default: () => 'Открыть' }),
        ],
      }),
  },
]

async function load() {
  loading.value = true
  try {
    requests.value = await $fetch(`${API}/cabinet/gems/topup-requests`, { credentials: 'include' })
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
