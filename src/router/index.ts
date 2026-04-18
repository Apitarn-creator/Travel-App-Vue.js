import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import RegisterView from '../views/RegisterView.vue'
import LoginView from '../views/LoginView.vue'
import ProfileView from '../views/ProfileView.vue'
import PublicProfileView from '../views/PublicProfileView.vue'
import TravelDetailView from '../views/TravelDetailView.vue'
import CreateTripView from '../views/CreateTripView.vue'
import ExploreView from '../views/ExploreView.vue'
import NotificationsView from '../views/NotificationsView.vue'
import SearchView from '../views/SearchView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/explore', name: 'explore', component: ExploreView },
    { path: '/notifications', name: 'notifications', component: NotificationsView },
    { path: '/search', name: 'search', component: SearchView },
    { path: '/register', name: 'register', component: RegisterView },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/profile', name: 'profile', component: ProfileView },
    { path: '/user/:id', name: 'public-profile', component: PublicProfileView },
    { path: '/trip/:id', name: 'trip-detail', component: TravelDetailView },
    { path: '/create-trip', name: 'create-trip', component: CreateTripView },
    { path: '/@:username', name: 'user-profile', component: () => import('../views/PublicProfileView.vue'), props: true },
    { path: '/category/:name', name: 'category', component: () => import('../views/CategoryView.vue') },
  ]
})

export default router
