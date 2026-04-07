import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import DetailView from '../views/DetailView.vue'
import RegisterView from '../views/RegisterView.vue'
import LoginView from '../views/LoginView.vue'
import ProfileView from '../views/ProfileView.vue'  
import PublicProfileView from '../views/PublicProfileView.vue'
import TravelDetailView from '../views/TravelDetailView.vue'
import CreateTripView from '../views/CreateTripView.vue'

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
        path: '/login',          // 👈  เพิ่ม Route สำหรับหน้าเข้าสู่ระบบ
        name: 'login',
        component: LoginView
    },
    {
        path: '/profile',
        name: 'profile',
        component: ProfileView
    },
    {
      path: '/user/:id', 
      name: 'public-profile',
      component: PublicProfileView
    },
    {
      path: '/trip/:id', 
      name: 'trip-detail',
      component: TravelDetailView
    },
    {
      path: '/create-trip',
      name: 'create-trip',
      component: CreateTripView
    },
  ]
})

export default router