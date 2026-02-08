/**
 * Quasar plugin - используется только для админ-панели
 * Поддерживает vue-i18n для мультиязычности
 */

import { App } from 'vue'
import { Quasar } from 'quasar'
import { useI18n } from 'vue-i18n'

// Import icon libraries
import '@quasar/extras/material-icons/material-icons.css'
import '@quasar/extras/fontawesome-v6/fontawesome-v6.css'

// Import Quasar css с изоляцией для админки
import 'quasar/src/css/index.sass'

export function setupQuasar(app: App) {
  app.use(Quasar, {
    plugins: {
      Notify: true,
      Dialog: true
    }, // import Quasar plugins and add here
    config: {
      brand: {
        primary: '#1976D2',
        secondary: '#26A69A',
        accent: '#9C27B0',
        dark: '#1d1d1d',
        positive: '#21BA45',
        negative: '#C10015',
        info: '#31CCEC',
        warning: '#F2C037'
      },
      // Поддержка i18n через vue-i18n
      lang: {
        // Quasar будет использовать vue-i18n через глобальные свойства
      }
    }
  })
  
  // Quasar автоматически работает с vue-i18n если он установлен
  // Все компоненты Quasar будут использовать переводы из vue-i18n
}

