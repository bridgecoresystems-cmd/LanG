<!--
  Пример использования Quasar в админке
  apps/admin/pages/ExamplePage.vue
-->
<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <q-page class="q-pa-md">
        <q-card>
          <q-card-section>
            <div class="text-h6">Админ-панель (Quasar)</div>
            <div class="text-subtitle2">Мощные компоненты для управления</div>
          </q-card-section>

          <q-card-section>
            <!-- Фильтры -->
            <q-input
              v-model="search"
              placeholder="Поиск..."
              outlined
              class="q-mb-md"
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>

            <!-- Таблица -->
            <q-table
              :rows="rows"
              :columns="columns"
              :filter="search"
              row-key="id"
              :pagination="pagination"
            >
              <template v-slot:body-cell-actions="props">
                <q-td :props="props">
                  <q-btn
                    flat
                    round
                    dense
                    icon="edit"
                    @click="editItem(props.row)"
                  />
                  <q-btn
                    flat
                    round
                    dense
                    icon="delete"
                    @click="deleteItem(props.row)"
                  />
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
// Quasar компоненты доступны глобально после setupQuasar()

const search = ref('')
const pagination = ref({
  rowsPerPage: 10
})

const columns = [
  { name: 'id', label: 'ID', field: 'id', sortable: true },
  { name: 'name', label: 'Имя', field: 'name', sortable: true },
  { name: 'email', label: 'Email', field: 'email' },
  { name: 'actions', label: 'Действия', field: 'actions' }
]

const rows = ref([
  { id: 1, name: 'Иван', email: 'ivan@example.com' },
  { id: 2, name: 'Мария', email: 'maria@example.com' }
])

function editItem(row: any) {
  console.log('Edit:', row)
}

function deleteItem(row: any) {
  console.log('Delete:', row)
}
</script>

<style scoped>
/* Стили для админки */
</style>

