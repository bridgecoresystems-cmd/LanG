<template>
  <div class="cabinet-page">
    <header class="page-header">
      <NButton quaternary circle @click="goBack">
        <template #icon>
          <NIcon><component :is="BackIcon" /></NIcon>
        </template>
      </NButton>
      <div class="page-header__text">
        <NH1 class="page-header__title">Редактирование игры</NH1>
        <p class="page-header__subtitle">{{ game?.title || 'Загрузка...' }}</p>
      </div>
    </header>

    <div v-if="loading" class="loading-state">
      <NSpin size="large" />
    </div>

    <NCard v-else-if="game" bordered class="editor-card">
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
        <NAlert type="info" :bordered="false" class="mb-4">
          Тип игры нельзя изменить после создания.
        </NAlert>
        <div class="game-type-display">
          <NTag :type="formData.type === 'sprint' ? 'warning' : formData.type === 'memory' ? 'success' : 'info'" size="medium">
            {{ typeLabel }}
          </NTag>
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
              Сохранить
            </NButton>
          </NSpace>
        </div>
      </NForm>
    </NCard>

    <NEmpty v-else description="Игра не найдена" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NH1, NButton, NIcon, NCard, NForm, NFormItem, NInput, NSelect,
  NDivider, NGrid, NGi, NDynamicInput, NSpace, NAlert, NTag, NEmpty, NSpin, useMessage
} from 'naive-ui'
import { ChevronBackOutline as BackIcon } from '@vicons/ionicons5'
import { useCabinetGroups } from '~/composables/useCabinetGroups'
import { useCabinetLessons } from '~/composables/useCabinetLessons'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const route = useRoute()
const groupId = computed(() => parseInt(route.params.id as string))
const gameId = computed(() => parseInt(route.params.gameId as string))
const groupsApi = useCabinetGroups()
const lessonsApi = useCabinetLessons()
const message = useMessage()

const formRef = ref<any>(null)
const saving = ref(false)
const loading = ref(true)
const lessonsLoading = ref(false)
const game = ref<any>(null)
const lessons = ref<any[]>([])

const formData = ref({
  title: '',
  type: 'matching' as string,
  lesson_id: null as number | null,
  pairs: [] as { word: string; translation: string }[],
})

const rules = {
  title: { required: true, message: 'Введите название игры', trigger: 'blur' },
}

const TYPE_LABELS: Record<string, string> = {
  matching: 'Сопоставление',
  sprint: 'Спринт',
  memory: 'Память',
}

const typeLabel = computed(() => TYPE_LABELS[formData.value.type] || formData.value.type)

const lessonOptions = computed(() =>
  lessons.value.map((l: any) => ({
    label: `${new Date(l.lesson_date).toLocaleDateString('ru-RU')} — ${l.title}`,
    value: l.id,
  }))
)

const onCreatePair = () => ({ word: '', translation: '' })

const loadGame = async () => {
  loading.value = true
  try {
    game.value = await groupsApi.getGameById(gameId.value)
    if (game.value) {
      const d = game.value.data
      const pairs = Array.isArray(d) ? d : []
      formData.value = {
        title: game.value.title,
        type: game.value.type || 'matching',
        lesson_id: game.value.lesson_id ?? null,
        pairs: pairs.length > 0 ? pairs : [{ word: '', translation: '' }],
      }
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

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
    await groupsApi.updateGame(gameId.value, {
      title: formData.value.title.trim(),
      lesson_id: formData.value.lesson_id,
      type: formData.value.type,
      data: validPairs,
    })
    message.success('Игра сохранена')
    goBack()
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadGame(), loadLessons()])
})
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

.loading-state {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}

.editor-card {
  border-radius: 12px;
}

.mb-4 {
  margin-bottom: 16px;
}

.game-type-display {
  margin-bottom: 24px;
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
