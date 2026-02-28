const STORAGE_KEY_PREFIX = 'admin-pagination-'
const DEFAULT_ROWS_PER_PAGE = 20
const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100]

export interface AdminPaginationState {
  sortBy: string
  descending: boolean
  page: number
  rowsPerPage: number
}

const defaultState: AdminPaginationState = {
  sortBy: 'id',
  descending: false,
  page: 1,
  rowsPerPage: DEFAULT_ROWS_PER_PAGE
}

function loadFromStorage(storageKey: string): AdminPaginationState {
  if (typeof window === 'undefined') return { ...defaultState }
  try {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<AdminPaginationState>
      const rpp = parsed.rowsPerPage ?? 0
      const validRpp = ROWS_PER_PAGE_OPTIONS.includes(rpp) ? rpp : DEFAULT_ROWS_PER_PAGE
      return {
        sortBy: parsed.sortBy ?? defaultState.sortBy,
        descending: parsed.descending ?? defaultState.descending,
        page: Math.max(1, parsed.page ?? 1),
        rowsPerPage: validRpp
      }
    }
  } catch { /* ignore */ }
  return { ...defaultState }
}

function saveToStorage(storageKey: string, data: AdminPaginationState) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(storageKey, JSON.stringify(data))
  } catch { /* ignore */ }
}

/**
 * Composable for Quasar tables (Admin Panel)
 */
export function useAdminPagination(pageKey: string) {
  const storageKey = `${STORAGE_KEY_PREFIX}${pageKey}`
  const initialState = loadFromStorage(storageKey)

  const pagination = ref<AdminPaginationState>({ ...initialState })

  watch(
    () => ({
      sortBy: pagination.value.sortBy,
      descending: pagination.value.descending,
      page: pagination.value.page,
      rowsPerPage: pagination.value.rowsPerPage
    }),
    (val) => saveToStorage(storageKey, val),
    { deep: true }
  )

  const resetPage = () => {
    pagination.value.page = 1
  }

  const savePagination = (val: Partial<AdminPaginationState>) => {
    pagination.value = { ...pagination.value, ...val }
  }

  return {
    pagination,
    rowsPerPageOptions: ROWS_PER_PAGE_OPTIONS,
    resetPage,
    savePagination
  }
}

/**
 * Composable for Naive UI tables (Cabinet)
 */
export function useCabinetPagination(pageKey: string) {
  const storageKey = `${STORAGE_KEY_PREFIX}${pageKey}`
  const initialState = loadFromStorage(storageKey)

  const pagination = reactive({
    page: initialState.page,
    pageSize: initialState.rowsPerPage,
    showSizePicker: true,
    pageSizes: ROWS_PER_PAGE_OPTIONS,
    itemCount: 0,
    prefix({ itemCount }: { itemCount: number }) {
      return `Всего: ${itemCount}`
    },
    onUpdatePage: (page: number) => {
      pagination.page = page
    },
    onUpdatePageSize: (pageSize: number) => {
      pagination.pageSize = pageSize
      pagination.page = 1
    }
  })

  watch(
    () => ({
      page: pagination.page,
      pageSize: pagination.pageSize
    }),
    (val) => {
      const current = loadFromStorage(storageKey)
      saveToStorage(storageKey, {
        ...current,
        page: val.page,
        rowsPerPage: val.pageSize
      })
    },
    { deep: true, flush: 'post' }
  )

  const resetPage = () => {
    pagination.page = 1
  }

  return {
    pagination,
    resetPage
  }
}
