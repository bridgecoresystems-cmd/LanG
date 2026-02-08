/**
 * Naive UI plugin - используется только для кабинета
 * Компоненты импортируются напрямую в компонентах, здесь только настройка темы
 * Поддерживает vue-i18n для мультиязычности
 */

import { App } from 'vue'
import { create, lightTheme, darkTheme } from 'naive-ui'

// Создаем провайдер темы Naive UI
// Naive UI полностью совместим с vue-i18n
// Используй $t() или useI18n() в компонентах для переводов
const naive = create({
  themes: {
    light: lightTheme,
    dark: darkTheme
  }
})

export function setupNaiveUI(app: App) {
  app.use(naive)
  // Naive UI работает с vue-i18n из коробки
  // Все тексты в компонентах можно переводить через $t() или useI18n()
}

