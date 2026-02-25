<template>
  <div class="cabinet-page">
    <header class="page-header">
      <NButton quaternary circle @click="goBack">
        <template #icon>
          <NIcon><component :is="BackIcon" /></NIcon>
        </template>
      </NButton>
      <div class="page-header__text">
        <NH1 class="page-header__title">Редактирование урока</NH1>
        <p class="page-header__subtitle">{{ lesson?.title }}</p>
      </div>
    </header>

    <div v-if="pending" class="loading-state">
      <NSpin size="large" />
    </div>

    <NCard v-else-if="lesson" bordered class="edit-form">
      <NForm ref="formRef" :model="form" label-placement="top">
        <NFormItem label="Название">
          <NInput v-model:value="form.title" placeholder="Название урока" />
        </NFormItem>
        <NFormItem label="О чём урок">
          <NInput
            v-model:value="form.description"
            type="textarea"
            placeholder="Краткое описание"
            :rows="3"
          />
        </NFormItem>
        <NFormItem label="Домашнее задание">
          <NInput
            v-model:value="form.homework"
            type="textarea"
            placeholder="Домашнее задание"
            :rows="4"
          />
        </NFormItem>
        <NFormItem label="Конспект">
          <NInput
            v-model:value="form.lesson_plan"
            type="textarea"
            placeholder="Конспект урока (для завуча)"
            :rows="6"
          />
        </NFormItem>
        <NFormItem label="Заметки">
          <NInput
            v-model:value="form.lesson_notes"
            type="textarea"
            placeholder="Заметки по уроку"
            :rows="4"
          />
        </NFormItem>
        <div class="form-actions">
          <NButton @click="goBack">Отмена</NButton>
          <NButton type="primary" :loading="saving" @click="save">
            Сохранить
          </NButton>
        </div>
      </NForm>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { NH1, NButton, NIcon, NCard, NForm, NFormItem, NInput, NSpin } from 'naive-ui'
import { ChevronBackOutline as BackIcon } from '@vicons/ionicons5'
import { useCabinetLessons } from '~/composables/useCabinetLessons'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth', key: (route) => route.fullPath })

const route = useRoute()
const groupId = computed(() => route.params.id as string)
const lessonId = computed(() => parseInt(route.params.lessonId as string))
const lessonsApi = useCabinetLessons()

const lesson = ref<any>(null)
const pending = ref(true)
const saving = ref(false)
const formRef = ref<any>(null)

const form = reactive({
  title: '',
  description: '',
  homework: '',
  lesson_plan: '',
  lesson_notes: '',
})

const loadLesson = async () => {
  pending.value = true
  try {
    lesson.value = await lessonsApi.getById(lessonId.value)
    form.title = lesson.value.title || ''
    form.description = lesson.value.description || ''
    form.homework = lesson.value.homework || ''
    form.lesson_plan = lesson.value.lesson_plan || ''
    form.lesson_notes = lesson.value.lesson_notes || ''
  } catch (e) {
    console.error(e)
  } finally {
    pending.value = false
  }
}

const save = async () => {
  saving.value = true
  try {
    await lessonsApi.update(lessonId.value, {
      title: form.title,
      description: form.description || null,
      homework: form.homework || null,
      lesson_plan: form.lesson_plan || null,
      lesson_notes: form.lesson_notes || null,
    })
    navigateTo(`/cabinet/teacher/groups/${groupId.value}/lessons/${lessonId.value}`)
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

const goBack = () => navigateTo(`/cabinet/teacher/groups/${groupId.value}/lessons/${lessonId.value}`)

onMounted(loadLesson)
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

.page-header__text {
  flex: 1;
}

.page-header__title {
  margin: 0 0 4px;
  font-weight: 700;
}

.page-header__subtitle {
  margin: 0;
  font-size: 0.95rem;
  color: var(--n-text-color-3);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}

.edit-form {
  border-radius: 12px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}
</style>
