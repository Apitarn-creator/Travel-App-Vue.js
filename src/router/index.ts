import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import DetailView from '../views/DetailView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      // ใส่ :id เพื่อให้รู้ว่ากำลังเปิดทริปหมายเลขอะไร
      path: '/trip/:id', 
      name: 'trip-detail',
      component: DetailView
    }
  ]
})

export default router