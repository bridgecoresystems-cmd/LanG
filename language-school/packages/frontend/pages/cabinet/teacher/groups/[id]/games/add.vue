<template>
  <div class="cabinet-page">
    <header class="page-header">
      <NButton quaternary circle @click="goBack">
        <template #icon>
          <NIcon><component :is="BackIcon" /></NIcon>
        </template>
      </NButton>
      <div class="page-header__text">
        <NH1 class="page-header__title">Создание игры</NH1>
        <p class="page-header__subtitle">Добавьте новую игру для группы</p>
      </div>
    </header>

    <NCard bordered class="editor-card">
      <NForm ref="formRef" :model="formData" :rules="rules" label-placement="top">
        <NGrid cols="1 m:2" :x-gap="24">
          <NGi>
            <NFormItem label="Название игры" path="title">
              <NInput v-model:value="formData.title" placeholder="Напр. Спряжение глаголов" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="Привязать к уроку" path="lesson_id">
              <NSelect
                v-model:value="formData.lesson_id"
                :options="lessonOptions"
                placeholder="Выберите урок (необязательно)"
                clearable
                :loading="lessonsLoading"
              />
            </NFormItem>
          </NGi>
        </NGrid>

        <NDivider title-placement="left">Тип игры</NDivider>

        <div class="game-types-grid">
          <div
            v-for="t in gameTypes"
            :key="t.value"
            class="game-type-card"
            :class="{ active: formData.type === t.value }"
            @click="formData.type = t.value"
          >
            <div class="type-icon">
              <NIcon :component="t.icon" size="32" />
            </div>
            <div class="type-info">
              <div class="type-title">{{ t.label }}</div>
              <div class="type-desc">{{ t.desc }}</div>
            </div>
          </div>
        </div>

        <NDivider title-placement="left">Слова (пары слово — перевод)</NDivider>

        <NFormItem label="Пары слов" path="pairs">
          <NDynamicInput v-model:value="formData.pairs" :on-create="onCreatePair">
            <template #default="{ value }">
              <div class="pair-row">
                <NInput v-model:value="value.word" placeholder="Слово" style="flex: 1" />
                <span class="pair-arrow">→</span>
                <NInput v-model:value="value.translation" placeholder="Перевод" style="flex: 1" />
              </div>
            </template>
          </NDynamicInput>
        </NFormItem>

        <div class="form-actions">
          <NSpace justify="end">
            <NButton @click="goBack">Отмена</NButton>
            <NButton type="primary" size="large" :loading="saving" @click="handleSave">
              Создать игру
            </NButton>
          </NSpace>
        </div>
      </NForm>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NH1, NButton, NIcon, NCard, NForm, NFormItem, NInput, NSelect,
  NDivider, NGrid, NGi, NDynamicInput, NSpace, useMessage
} from 'naive-ui'
import {
  ChevronBackOutline as BackIcon,
  ShapesOutline as MatchingIcon,
  FlashOutline as SprintIcon,
  GridOutline as MemoryIcon,
} from '@vicons/ionicons5'
import { useCabinetGroups } from '~/composables/useCabinetGroups'
import { useCabinetLessons } from '~/composables/useCabinetLessons'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const route = useRoute()
const groupId = computed(() => parseInt(route.params.id as string))
const groupsApi = useCabinetGroups()
const lessonsApi = useCabinetLessons()
const message = useMessage()

const formRef = ref<any>(null)
const saving = ref(false)
const lessonsLoading = ref(false)
const lessons = ref<any[]>([])

const formData = ref({
  title: '',
  type: 'matching' as string,
  lesson_id: null as number | null,
  pairs: [{ word: '', translation: '' }, { word: '', translation: '' }] as { word: string; translation: string }[],
})

const rules = {
  title: { required: true, message: 'Введите название игры', trigger: 'blur' },
}

const gameTypes = [
  { value: 'matching', label: 'Сопоставление', desc: 'Соедините слово с переводом', icon: MatchingIcon },
  { value: 'sprint', label: 'Спринт', desc: 'Быстро угадайте правильный перевод', icon: SprintIcon },
  { value: 'memory', label: 'Память', desc: 'Найдите пары карточек', icon: MemoryIcon },
]

const lessonOptions = computed(() =>
  lessons.value.map((l: any) => ({
    label: `${new Date(l.lesson_date).toLocaleDateString('ru-RU')} — ${l.title}`,
    value: l.id,
  }))
)

const onCreatePair = () => ({ word: '', translation: '' })

const loadLessons = async () => {
  lessonsLoading.value = true
  try {
    lessons.value = await lessonsApi.getList({ group_id: groupId.value }) ?? []
  } catch (e) {
    console.error(e)
  } finally {
    lessonsLoading.value = false
  }
}

const goBack = () => navigateTo(`/cabinet/teacher/groups/${groupId.value}/games`)

const handleSave = async () => {
  try {
    await formRef.value?.validate()
    const validPairs = formData.value.pairs.filter((p) => p.word?.trim() && p.translation?.trim())
    if (validPairs.length < 2) {
      message.warning('Добавьте минимум 2 пары слов')
      return
    }
    saving.value = true
    await groupsApi.saveGame({
      group_id: groupId.value,
      lesson_id: formData.value.lesson_id,
      title: formData.value.title.trim(),
      type: formData.value.type,
      data: validPairs,
    })
    message.success('Игра создана')
    goBack()
  } catch (e: any) {
    console.error('Save game error:', e)
    const errMsg = e?.data?.error || e?.message || e?.statusMessage || 'Не удалось создать игру'
    message.error(errMsg)
  } finally {
    saving.value = false
  }
}

onMounted(loadLessons)
</script>

<style scoped>
.cabinet-page {
  padding-bottom: 40px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.page-header__title {
  margin: 0 0 4px;
  font-weight: 700;
}

.page-header__subtitle {
  margin: 0;
  color: var(--n-text-color-3);
}

.editor-card {
  border-radius: 12px;
}

.game-types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.game-type-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: var(--n-color-hover);
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.game-type-card:hover {
  background: var(--n-color-hover);
}

.game-type-card.active {
  background: rgba(24, 160, 88, 0.08);
  border-color: #18a058;
}

.type-icon {
  width: 56px;
  height: 56px;
  background: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  color: #18a058;
}

.game-type-card.active .type-icon {
  background: #18a058;
  color: white;
}

.type-title {
  font-weight: 700;
  font-size: 1rem;
  margin-bottom: 4px;
}

.type-desc {
  font-size: 0.85rem;
  color: var(--n-text-color-3);
}

.pair-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.pair-arrow {
  color: var(--n-text-color-3);
}

.form-actions {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--n-border-color);
}
</style>
