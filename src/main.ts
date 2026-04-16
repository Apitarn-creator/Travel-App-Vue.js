import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import vue3GoogleLogin from 'vue3-google-login'

import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import 'primeicons/primeicons.css'

const app = createApp(App)
app.use(router)

// ✅ อ่าน Google Client ID จาก .env แทนการฝัง hardcode ใน code
// สร้างไฟล์ .env.local แล้วใส่: VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
app.use(vue3GoogleLogin, {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID
})

app.use(PrimeVue, {
  theme: {
    preset: Aura
  }
})

app.mount('#app')