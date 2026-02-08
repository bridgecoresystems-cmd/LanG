<template>
  <AdminLayout>
    <div class="admin-page">
      <!-- Page Header -->
      <div class="row items-center q-mb-md">
        <div class="col">
          <h1 class="text-h4 q-ma-none">{{ $t('admin.models.contact-messages') }}</h1>
        </div>
      </div>

      <!-- Filters -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-input
                v-model="searchQuery"
                :placeholder="$t('admin.search')"
                outlined
                dense
                clearable
              >
                <template v-slot:prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>
            <div class="col-12 col-md-3">
              <q-select
                v-model="statusFilter"
                :options="statusOptions"
                :label="$t('admin.filters.status')"
                outlined
                dense
                clearable
                emit-value
                map-options
              />
            </div>
            <div class="col-12 col-md-3">
              <q-btn
                :label="$t('admin.contact.sortByLikes')"
                :icon="likesSort === 'desc' ? 'arrow_downward' : likesSort === 'asc' ? 'arrow_upward' : 'sort'"
                :color="likesSort !== 'none' ? 'primary' : 'grey'"
                outline
                @click="toggleLikesSort"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Loading State -->
      <q-inner-loading :showing="loading">
        <q-spinner size="50px" color="primary" />
      </q-inner-loading>

      <!-- Error State -->
      <q-banner v-if="error" class="bg-negative text-white q-mb-md">
        {{ error }}
      </q-banner>

      <!-- Contact Messages Table -->
      <q-card v-if="!loading && !error" flat bordered>
        <q-card-section>
          <q-table
            :rows="sortedItems"
            :columns="columns"
            row-key="id"
            :loading="loading"
            v-model:pagination="pagination"
            :rows-per-page-options="[10, 20, 50, 100]"
            @row-click="(_evt, row) => editMessage(row.id)"
            class="cursor-pointer admin-table"
            binary-state-sort
          >
            <template v-slot:body-cell-status="props">
              <q-td :props="props">
                <q-badge
                  :color="props.row.status === 'approved' ? 'positive' : props.row.status === 'rejected' ? 'negative' : 'warning'"
                >
                  {{ props.row.status === 'approved' ? $t('admin.filters.approved') : props.row.status === 'rejected' ? $t('admin.filters.rejected') : $t('admin.filters.pending') }}
                </q-badge>
              </q-td>
            </template>

            <template v-slot:body-cell-likes="props">
              <q-td :props="props">
                <div class="row items-center">
                  <q-icon name="thumb_up" size="16px" class="q-mr-xs" />
                  <span class="text-weight-bold">{{ getLikesCount(props.row.id, props.row.likes) }}</span>
                </div>
              </q-td>
            </template>

            <template v-slot:body-cell-createdAt="props">
              <q-td :props="props">
                {{ formatDate(props.row.created_at) }}
              </q-td>
            </template>

            <template v-slot:body-cell-actions="props">
              <q-td :props="props" @click.stop>
                <q-btn
                  flat
                  round
                  dense
                  icon="thumb_up"
                  color="warning"
                  @click.stop="handleLike(props.row.id)"
                  class="q-mr-xs"
                  :title="$t('admin.contact.like')"
                />
                <q-btn
                  flat
                  round
                  dense
                  icon="visibility"
                  color="info"
                  @click.stop="viewMessage(props.row.id)"
                  class="q-mr-xs"
                  :title="$t('admin.actions.view')"
                />
                <q-btn
                  flat
                  round
                  dense
                  :icon="props.row.status === 'approved' ? 'close' : 'check'"
                  :color="props.row.status === 'approved' ? 'negative' : 'positive'"
                  @click.stop="handleToggleApproval(props.row.id)"
                  class="q-mr-xs"
                  :title="$t('admin.actions.toggleApproval')"
                />
                <q-btn
                  flat
                  round
                  dense
                  icon="delete"
                  color="negative"
                  @click.stop="handleDelete(props.row.id)"
                  :title="$t('admin.actions.delete')"
                />
              </q-td>
            </template>

            <template v-slot:no-data>
              <div class="full-width row flex-center text-grey q-gutter-sm q-pa-lg">
                <q-icon name="inbox" size="2em" />
                <span>{{ $t('admin.table.noData') }}</span>
              </div>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, shallowRef, triggerRef } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '../../../layouts/AdminLayout.vue'
import { useAdminContactMessages } from '@/composables/useAdminApi'
import dayjs from 'dayjs'

const router = useRouter()
const { t } = useI18n()
const { loading, error, fetchMessages, toggleApproval: toggleApprovalApi, deleteMessage, likeMessage } = useAdminContactMessages()

const searchQuery = ref('')
const statusFilter = ref('')
const likesSort = ref<'none' | 'asc' | 'desc'>('none')
const items = ref<any[]>([])
// Отдельный Map для хранения счетчиков лайков - используем shallowRef чтобы Vue не отслеживал изменения внутри Map
const likesMap = shallowRef<Map<number, number>>(new Map())

// #region agent log
fetch('http://127.0.0.1:7242/ingest/e0f0c177-1599-46f9-a935-06c557ce3108',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ContactMessagesListPage.vue:178',message:'Pagination initialized',data:{sortBy:'id',page:1,rowsPerPage:20},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion
const pagination = ref({
  sortBy: 'id',
  descending: false,
  page: 1,
  rowsPerPage: 20
})

// Сбрасываем на первую страницу при изменении rowsPerPage
watch(() => pagination.value.rowsPerPage, () => {
  pagination.value.page = 1
})

const statusOptions = [
  { label: t('admin.filters.all'), value: '' },
  { label: t('admin.filters.approved'), value: 'approved' },
  { label: t('admin.filters.pending'), value: 'pending' }
]

const columns = computed(() => [
  {
    name: 'id',
    label: t('admin.table.id'),
    field: 'id',
    align: 'left' as const,
    sortable: true
  },
  {
    name: 'name',
    label: t('admin.contact.name'),
    field: 'name',
    align: 'left' as const,
    sortable: true
  },
  {
    name: 'email',
    label: t('admin.contact.email'),
    field: 'email',
    align: 'left' as const,
    sortable: true
  },
  {
    name: 'phone',
    label: t('admin.contact.phone'),
    field: 'phone',
    align: 'left' as const,
    sortable: true
  },
  {
    name: 'status',
    label: t('admin.table.status'),
    field: 'status',
    align: 'center' as const,
    sortable: true
  },
  {
    name: 'likes',
    label: t('admin.contact.likes'),
    field: 'likes',
    align: 'center' as const,
    sortable: true
  },
  {
    name: 'createdAt',
    label: t('admin.table.createdAt'),
    field: 'created_at',
    align: 'left' as const,
    sortable: true
  },
  {
    name: 'actions',
    label: t('admin.table.actions'),
    field: 'actions',
    align: 'center' as const
  }
])

const filteredItems = computed(() => {
  let filtered = items.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item =>
      (item.name && item.name.toLowerCase().includes(query)) ||
      (item.email && item.email.toLowerCase().includes(query)) ||
      (item.phone && item.phone.toLowerCase().includes(query)) ||
      (item.message && item.message.toLowerCase().includes(query))
    )
  }

  if (statusFilter.value) {
    filtered = filtered.filter(item =>
      statusFilter.value === 'approved' ? item.status === 'approved' : 
      statusFilter.value === 'pending' ? item.status === 'pending' : true
    )
  }

  return filtered
})

// Используем отдельный computed для сортировки, который не зависит от likesMap напрямую
// Это предотвратит пересчет при изменении только счетчика лайков
const sortedItems = computed(() => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e0f0c177-1599-46f9-a935-06c557ce3108',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ContactMessagesListPage.vue:279',message:'sortedItems computed triggered',data:{filteredCount:filteredItems.value.length,likesSort:likesSort.value},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  // Если сортировка по лайкам активна - используем данные из Map
  if (likesSort.value !== 'none') {
    const sorted = [...filteredItems.value]
    if (likesSort.value === 'desc') {
      sorted.sort((a, b) => {
        const aLikes = likesMap.value.get(a.id) ?? (a.likes || 0)
        const bLikes = likesMap.value.get(b.id) ?? (b.likes || 0)
        return bLikes - aLikes
      })
    } else {
      sorted.sort((a, b) => {
        const aLikes = likesMap.value.get(a.id) ?? (a.likes || 0)
        const bLikes = likesMap.value.get(b.id) ?? (b.likes || 0)
        return aLikes - bLikes
      })
    }
    return sorted
  }
  
  // При обычной сортировке таблицы
  const sortBy = pagination.value.sortBy
  const descending = pagination.value.descending
  
  if (sortBy) {
    const sorted = [...filteredItems.value]
    sorted.sort((a, b) => {
      let aVal: any
      let bVal: any
      
      if (sortBy === 'createdAt' || sortBy === 'created_at') {
        aVal = new Date(a.created_at).getTime()
        bVal = new Date(b.created_at).getTime()
      } else if (sortBy === 'status') {
        const statusOrder = { 'approved': 1, 'pending': 2, 'rejected': 3 }
        aVal = statusOrder[a.status as keyof typeof statusOrder] || 0
        bVal = statusOrder[b.status as keyof typeof statusOrder] || 0
      } else {
        aVal = a[sortBy]
        bVal = b[sortBy]
      }
      
      if (aVal == null) return 1
      if (bVal == null) return -1
      
      if (aVal < bVal) return descending ? 1 : -1
      if (aVal > bVal) return descending ? -1 : 1
      return 0
    })
    return sorted
  }
  
  // Если нет сортировки, возвращаем отфильтрованные элементы как есть
  const result = filteredItems.value
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e0f0c177-1599-46f9-a935-06c557ce3108',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ContactMessagesListPage.vue:332',message:'sortedItems result',data:{resultCount:result.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  return result
})

const toggleLikesSort = () => {
  if (likesSort.value === 'none') {
    likesSort.value = 'desc'
  } else if (likesSort.value === 'desc') {
    likesSort.value = 'asc'
  } else {
    likesSort.value = 'none'
  }
}

const editMessage = (id: number) => {
  router.push(`/management/landing/contact-messages/${id}/change`)
}

// Функция для получения актуального количества лайков
const getLikesCount = (id: number, defaultLikes: number = 0): number => {
  return likesMap.value.get(id) ?? defaultLikes
}

const handleLike = async (id: number) => {
  try {
    // Находим элемент до запроса
    const item = items.value.find(m => m.id === id)
    if (!item) return
    
    // Оптимистичное обновление - обновляем только Map, не трогая основной массив
    const currentLikes = likesMap.value.get(id) ?? (item.likes || 0)
    const newLikes = currentLikes + 1
    likesMap.value.set(id, newLikes)
    // Явно триггерим обновление только для этого ref (не для items)
    triggerRef(likesMap)
    
    try {
      const response = await likeMessage(id)
      // Если API возвращает обновленные данные, используем их
      if (response && typeof response === 'object' && 'likes' in response) {
        likesMap.value.set(id, response.likes)
        triggerRef(likesMap)
        // Также обновляем в основном массиве для синхронизации
        item.likes = response.likes
      } else {
        // Обновляем основной массив для синхронизации
        item.likes = newLikes
      }
    } catch (err) {
      // В случае ошибки возвращаем старое значение
      likesMap.value.set(id, currentLikes)
      triggerRef(likesMap)
      console.error('Like error:', err)
    }
  } catch (err) {
    console.error('Like error:', err)
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  return dayjs(dateString).format('YYYY-MM-DD HH:mm')
}

const viewMessage = (id: number) => {
  const message = items.value.find(m => m.id === id)
  if (message) {
    alert(`Message from ${message.name}:\n\n${message.message}`)
  }
}

const handleToggleApproval = async (id: number) => {
  try {
    const item = items.value.find(m => m.id === id)
    if (!item) return
    
    // Оптимистичное обновление
    const oldStatus = item.status
    const newStatus = oldStatus === 'approved' ? 'pending' : 'approved'
    Object.assign(item, { status: newStatus })
    
    try {
      const response = await toggleApprovalApi(id)
      // Если API возвращает обновленные данные, используем их
      if (response && typeof response === 'object' && 'status' in response) {
        Object.assign(item, { status: response.status })
      }
      // Иначе оставляем оптимистичное значение
    } catch (err) {
      // В случае ошибки возвращаем старое значение
      Object.assign(item, { status: oldStatus })
      console.error('Toggle approval error:', err)
    }
  } catch (err) {
    console.error('Toggle approval error:', err)
  }
}

const handleDelete = async (id: number) => {
  const confirmed = await new Promise<boolean>((resolve) => {
    resolve(window.confirm(t('admin.confirmDelete')))
  })

  if (confirmed) {
    try {
      await deleteMessage(id)
      // Удаляем элемент из массива без перезагрузки всех данных
      const index = items.value.findIndex(m => m.id === id)
      if (index !== -1) {
        items.value.splice(index, 1)
      }
    } catch (err) {
      console.error('Delete error:', err)
    }
  }
}

const loadMessages = async () => {
  try {
    const params: any = {}
    if (statusFilter.value === 'approved') {
      params.status = 'approved'
    } else if (statusFilter.value === 'pending') {
      params.status = 'pending'
    }
    if (searchQuery.value) {
      params.search = searchQuery.value
    }
    // Загружаем все сообщения для клиентской пагинации
    params.page_size = 9999
    
    const response = await fetchMessages(params)
    const newItems = Array.isArray(response) ? response : response.results || []
    
    // Инициализируем Map с текущими значениями лайков
    const newMap = new Map<number, number>()
    newItems.forEach((item: any) => {
      if (item.likes !== undefined) {
        newMap.set(item.id, item.likes)
      }
    })
    likesMap.value = newMap
    
    items.value = newItems
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e0f0c177-1599-46f9-a935-06c557ce3108',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ContactMessagesListPage.vue:474',message:'Items loaded',data:{itemsCount:newItems.length,sortedItemsCount:sortedItems.value.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    // QTable automatically calculates rowsNumber from rows array for client-side pagination
    // No need to manually set rowsNumber - it's computed from sortedItems.length
  } catch (err) {
    console.error('Load messages error:', err)
  }
}

// Убрали onRequest - для клиентской пагинации QTable сам обрабатывает все через v-model:pagination

onMounted(() => {
  loadMessages()
})

watch([statusFilter, searchQuery], () => {
  loadMessages()
  // Сбрасываем на первую страницу при изменении фильтров
  pagination.value.page = 1
})

// Проверка границ страниц при изменении данных
watch(sortedItems, () => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e0f0c177-1599-46f9-a935-06c557ce3108',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ContactMessagesListPage.vue:498',message:'sortedItems watch triggered',data:{sortedCount:sortedItems.value.length,currentPage:pagination.value.page,rowsPerPage:pagination.value.rowsPerPage},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  const totalPages = Math.ceil(sortedItems.value.length / pagination.value.rowsPerPage) || 1
  if (pagination.value.page > totalPages) {
    pagination.value.page = totalPages
  }
}, { flush: 'post' })
</script>

<style scoped>
.admin-page {
  padding: 0;
}

:deep(.q-table tbody tr) {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

:deep(.q-table tbody tr:hover) {
  background-color: rgba(0, 0, 0, 0.04) !important;
}

/* Плавные переходы для таблицы при пагинации */
.admin-table :deep(.q-table__middle) {
  transition: opacity 0.15s ease;
}

.admin-table :deep(.q-table tbody) {
  transition: opacity 0.15s ease;
}

/* Плавная анимация для пагинации */
.admin-table :deep(.q-table__bottom) {
  transition: opacity 0.2s ease;
}

/* Плавное появление строк при смене страницы */
.admin-table :deep(.q-table tbody tr) {
  animation: fadeInRow 0.2s ease-in;
}

@keyframes fadeInRow {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
