<!--
  Пример использования Naive UI в кабинете
  apps/cabinet/pages/ExamplePage.vue
-->
<template>
  <div class="cabinet-container">
    <NCard title="Кабинет (Naive UI)" :bordered="false">
      <template #header-extra>
        <NButton type="primary" @click="handleAction">
          Действие
        </NButton>
      </template>

      <!-- Фильтры -->
      <NForm inline class="filters">
        <NFormItem label="Поиск">
          <NInput
            v-model:value="search"
            placeholder="Введите текст..."
            clearable
          />
        </NFormItem>
        <NFormItem label="Статус">
          <NSelect
            v-model:value="status"
            :options="statusOptions"
            placeholder="Выберите статус"
            clearable
          />
        </NFormItem>
      </NForm>

      <!-- Таблица -->
      <NDataTable
        :columns="columns"
        :data="data"
        :pagination="pagination"
        :loading="loading"
        striped
        bordered
      />
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref, h } from 'vue'
import {
  NCard,
  NButton,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NDataTable,
  type DataTableColumns
} from 'naive-ui'

const search = ref('')
const status = ref(null)
const loading = ref(false)

const statusOptions = [
  { label: 'Активен', value: 'active' },
  { label: 'Неактивен', value: 'inactive' }
]

const columns: DataTableColumns = [
  { title: 'ID', key: 'id', width: 80 },
  { title: 'Имя', key: 'name', sorter: true },
  { title: 'Email', key: 'email' },
  {
    title: 'Действия',
    key: 'actions',
    render: (row) => {
      return h('div', [
        h(NButton, { size: 'small', onClick: () => editItem(row) }, 'Редактировать'),
        h(NButton, { size: 'small', type: 'error', onClick: () => deleteItem(row) }, 'Удалить')
      ])
    }
  }
]

const data = ref([
  { id: 1, name: 'Иван', email: 'ivan@example.com' },
  { id: 2, name: 'Мария', email: 'maria@example.com' }
])

const pagination = ref({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 20, 50]
})

function handleAction() {
  console.log('Action clicked')
}

function editItem(row: any) {
  console.log('Edit:', row)
}

function deleteItem(row: any) {
  console.log('Delete:', row)
}
</script>

<style scoped>
.cabinet-container {
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
}

.filters {
  margin-bottom: 16px;
  padding: 16px;
  background: white;
  border-radius: 8px;
}
</style>

