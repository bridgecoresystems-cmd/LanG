<template>
  <form class="search" @submit.prevent="handleSearch">
    <div class="search__wrapper">
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        class="search__field"
        :placeholder="displayPlaceholder"
        @input="handleInput"
      />
      <button
        class="search__icon"
        type="button"
        :aria-label="$t('search.submit')"
        @click="handleIconClick"
      >
        <i class="pi pi-search"></i>
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{ placeholder?: string; modelValue?: string }>(),
  { placeholder: '', modelValue: '' }
)
const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: [query: string]
}>()

const { t } = useI18n()
const searchQuery = ref(props.modelValue)
const searchInput = ref<HTMLInputElement>()

const displayPlaceholder = computed(
  () => props.placeholder || t('search.placeholder')
)

watch(
  () => props.modelValue,
  (newValue) => {
    searchQuery.value = newValue
  }
)

const handleInput = () => {
  emit('update:modelValue', searchQuery.value)
  emit('search', searchQuery.value)
}

const handleSearch = () => {
  emit('search', searchQuery.value)
}

const handleIconClick = () => {
  if (document.activeElement !== searchInput.value) {
    searchInput.value?.focus()
  } else {
    handleSearch()
  }
}
</script>

<style scoped>
.search {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.search__wrapper {
  position: relative;
}

.search__field {
  width: 50px;
  height: 50px;
  padding: 0.35em 50px 0.35em 0;
  border: 1px solid transparent;
  border-bottom-color: transparent;
  border-radius: 0;
  background: transparent;
  font-size: 1.35em;
  transition: all 0.3s ease;
}

.search__field:focus {
  width: 100%;
  border-bottom-color: #ccc;
  color: var(--text-primary);
  outline: none;
}

.search__icon {
  position: absolute;
  top: 0;
  right: 0;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e9f1f4;
  border: none;
  border-radius: 50%;
  cursor: pointer;
}
</style>
