import { createApp } from 'vue'
import { createPinia } from 'pinia'

// Styles - порядок важен для предотвращения конфликтов
import './assets/styles/main.css'
import './assets/styles/cabinet-shared.css'
import './styles/ui-isolation.css'

import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { useAuthStore } from './stores/authStore'

// PrimeVue для landing (уже установлен, оставляем как есть)
import PrimeVue from 'primevue/config'
import 'primevue/resources/themes/lara-light-blue/theme.css'
import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css'

// UI Libraries - загружаем все три, используем условно
import { setupQuasar } from './plugins/quasar'
import { setupNaiveUI } from './plugins/naive-ui'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)

// PrimeVue для landing (используется на всех страницах, но не конфликтует)
app.use(PrimeVue)

// Настраиваем библиотеки для разных частей приложения
// PrimeVue - для landing (уже подключен выше)
// Quasar - для админки (/management/*)
// Naive UI - для кабинета (/cabinet/*)
setupQuasar(app)
setupNaiveUI(app)

// Initialize auth when app starts (non-blocking)
const authStore = useAuthStore()
authStore.initializeAuth()

app.mount('#app')
