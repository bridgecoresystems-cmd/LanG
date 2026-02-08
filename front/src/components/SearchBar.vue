<template>
  <form class="search" @submit.prevent="handleSearch">
    <div class="search__wrapper">
      <input
        class="search__field"
        type="text"
        name="searchQuery"
        :placeholder="displayPlaceholder"
        v-model="searchQuery"
        @input="handleInput"
        ref="searchInput"
      />
      <button
        class="search__icon"
        type="button"
        :aria-label="t('search.submit')"
        @click="handleIconClick"
      >
        <i class="pi pi-search"></i>
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  placeholder?: string
  modelValue?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'search', query: string): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  modelValue: ''
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

const searchQuery = ref(props.modelValue)
const searchInput = ref<HTMLInputElement>()

// Используем переведенный placeholder, если он не передан явно
const displayPlaceholder = computed(() => {
  return props.placeholder || t('search.placeholder')
})

// Синхронизация с внешним modelValue
watch(() => props.modelValue, (newValue) => {
  searchQuery.value = newValue
})

const handleInput = () => {
  emit('update:modelValue', searchQuery.value)
  // Автоматически эмитим событие поиска при вводе
  emit('search', searchQuery.value)
}

const handleSearch = (event?: Event) => {
  if (event) {
    event.preventDefault()
  }
  emit('search', searchQuery.value)
}

const handleIconClick = () => {
  // Если поле не в фокусе - фокусируем его
  if (document.activeElement !== searchInput.value) {
    searchInput.value?.focus()
  } else {
    // Если в фокусе - выполняем поиск
    handleSearch()
  }
}
</script>

<style lang="scss" scoped>
@use "sass:color";

$icon-size: 50px;
$main-color: #e9f1f4;

.search {
  position: relative;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;

  * {
    outline: none;
    box-sizing: border-box;
  }
}

.search__wrapper {
  position: relative;
}

.search__field {
  width: $icon-size;
  height: $icon-size;
  color: transparent;
  font-family: inherit;
  font-size: 1.35em;
  padding: 0.35em $icon-size 0.35em 0;
  border: 1px solid transparent;
  border-bottom: 1px solid transparent;
  border-radius: 0;
  cursor: pointer;
  background-color: transparent;
  transition: all 0.3s ease-in-out;

  // Placeholder должен быть виден даже когда color: transparent
  &::-webkit-input-placeholder {
    color: var(--text-secondary, #999) !important;
    opacity: 0.8 !important;
    transition: opacity 0.3s ease-in-out;
  }

  &:-moz-placeholder {
    color: var(--text-secondary, #999) !important;
    opacity: 0.8 !important;
    transition: opacity 0.3s ease-in-out;
  }

  &::-moz-placeholder {
    color: var(--text-secondary, #999) !important;
    opacity: 0.8 !important;
    transition: opacity 0.3s ease-in-out;
  }

  &:-ms-input-placeholder {
    color: var(--text-secondary, #999) !important;
    opacity: 0.8 !important;
    transition: opacity 0.3s ease-in-out;
  }

  &:focus {
    border-bottom-color: #ccc;
    width: 100%;
    color: var(--text-primary, #2b2b2b);
    cursor: text;

    &::-webkit-input-placeholder,
    &:-moz-placeholder,
    &::-moz-placeholder,
    &:-ms-input-placeholder {
      opacity: 0.5 !important;
    }

    ~ .search__icon {
      background-color: transparent;
      cursor: pointer;
      pointer-events: auto;

      i {
        color: var(--text-secondary, #666);
      }
    }
  }

  // Когда поле НЕ в фокусе
  &:not(:focus) {
    ~ .search__icon {
      pointer-events: auto;
      cursor: pointer;
    }
  }
}

.search__icon {
  position: absolute;
  top: 0;
  right: 0;
  background-color: $main-color;
  width: $icon-size;
  height: $icon-size;
  font-size: 1.35em;
  text-align: center;
  line-height: $icon-size;
  border: none;
  border-radius: 50%;
  pointer-events: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease-in-out;
  cursor: default;

  i {
    font-size: 1.2em;
    color: #2b2b2b;
    transition: color 0.2s ease-in-out;
  }

  &:hover {
    background-color: color.adjust($main-color, $lightness: -5%);
  }
}

// FIELD LABELING - для анимации placeholder
.search__field {
  &::-webkit-input-placeholder {
    position: relative;
    top: 0;
    left: 0;
    transition-property: top, color, font-size;
    transition-duration: 0.2s;
    transform: translateZ(0);
    backface-visibility: hidden;
    perspective: 1000px;
  }

  &:-moz-placeholder {
    position: relative;
    top: 0;
    left: 0;
    transition-property: top, color, font-size;
    transition-duration: 0.2s;
    transform: translateZ(0);
    backface-visibility: hidden;
    perspective: 1000px;
  }

  &::-moz-placeholder {
    position: relative;
    top: 0;
    left: 0;
    transition-property: top, color, font-size;
    transition-duration: 0.2s;
    transform: translateZ(0);
    backface-visibility: hidden;
    perspective: 1000px;
  }

  &:-ms-input-placeholder {
    position: relative;
    top: 0;
    left: 0;
    transition-property: top, color, font-size;
    transition-duration: 0.2s;
    transform: translateZ(0);
    backface-visibility: hidden;
    perspective: 1000px;
  }

  // Когда поле в фокусе и не пустое
  &:focus:not(:placeholder-shown) {
    &::-webkit-input-placeholder,
    &:-moz-placeholder,
    &::-moz-placeholder,
    &:-ms-input-placeholder {
      color: color.adjust($main-color, $lightness: -30%);
      font-size: 0.65em;
      font-weight: normal;
      top: -20px;
      opacity: 1;
    }
  }
}
</style>
