import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import vue3GoogleLogin from 'vue3-google-login'

const app = createApp(App)
app.use(router)
app.use(vue3GoogleLogin, {
    clientId: '139676068128-jgtitph7qi1lflfd31rpssnsvi91k5v1.apps.googleusercontent.com'
  })
app.mount('#app')