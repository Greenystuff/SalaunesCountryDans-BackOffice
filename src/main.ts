import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Calendar } from 'v-calendar'
import 'v-calendar/style.css'

import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)
// Enregistrer seulement le composant Calendar de v-calendar pour éviter les conflits avec Vuetify
app.component('VCalendar', Calendar)

app.mount('#app')
