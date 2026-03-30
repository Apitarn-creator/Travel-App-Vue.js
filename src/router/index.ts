import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import DetailView from '../views/DetailView.vue'
import RegisterView from '../views/RegisterView.vue'
import LoginView from '../views/LoginView.vue'
import ProfileView from '../views/ProfileView.vue'  

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/trip/:id', 
      name: 'trip-detail',
      component: DetailView
    },
    {
        path: '/register',          
        name: 'register',
        component: RegisterView     
    },
    {
        path: '/login',          // 👈 2. เพิ่ม Route สำหรับหน้าเข้าสู่ระบบ
        name: 'login',
        component: LoginView
    },
    {
        path: '/profile',
        name: 'profile',
        component: ProfileView
    },
  ]
})

export default router