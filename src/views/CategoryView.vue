<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import TripCard from '../components/TripCard.vue'
import { getAllTrips, type Trip } from '../api/tripApi'

const route = useRoute()
const categoryName = ref(route.params.name as string)
const trips = ref<Trip[]>([])
const loading = ref(false)

async function fetchTripsByCategory() {
  loading.value = true
  try {
    // โชคดีที่เราทำระบบค้นหาครอบคลุม Tag ไว้แล้ว เลยใช้ API เดิมได้เลย!
    const data = await getAllTrips(categoryName.value)
    trips.value = Array.isArray(data) ? data.sort((a: any, b: any) => b.id - a.id) : []
  } catch (e) {
    console.error('Fetch error:', e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchTripsByCategory)

// ถ้ามีการกดเปลี่ยนหมวดหมู่จากเมนู ให้โหลดข้อมูลใหม่
watch(() => route.params.name, (newName) => {
  categoryName.value = newName as string
  fetchTripsByCategory()
})
</script>

<template>
  <main class="container content">
    
    <div class="breadcrumbs">
      <router-link to="/">หน้าแรก</router-link> 
      <span class="separator">/</span> 
      <span class="current">{{ categoryName }}</span>
    </div>

    <div class="section-title">
      <h2>รวมทริป: {{ categoryName }}</h2>
      <div class="title-underline"></div>
    </div>

    <div v-if="loading" class="status-box">กำลังโหลดข้อมูล...</div>

    <div v-else class="trip-grid">
      <router-link v-for="trip in trips" :key="trip.id" :to="`/trip/${trip.id}`" class="clickable-card">
        <TripCard :trip="trip" />
      </router-link>
      
      <div v-if="trips.length === 0" class="no-results">
        ยังไม่มีบทความในหมวดหมู่นี้ 🏕️
      </div>
    </div>
  </main>
</template>

<style scoped>
.content { padding-top: 100px; padding-bottom: 80px; max-width: 100% !important; padding-left: 5%; padding-right: 5%;}
.breadcrumbs { font-size: 1rem; margin-bottom: 30px; color: #666; font-weight: 500;}
.breadcrumbs a { color: #007bff; text-decoration: none; transition: 0.2s; }
.breadcrumbs a:hover { color: #0056b3; text-decoration: underline; }
.separator { margin: 0 10px; color: #ccc; }
.current { color: #333; font-weight: 700; }

.section-title { margin-bottom: 40px; }
.section-title h2 { font-size: 2.5rem; font-weight: 800; color: #1a1a1a; margin-bottom: 10px;}
.title-underline { width: 80px; height: 5px; background: #007bff; border-radius: 3px; }

.trip-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 30px; }
.clickable-card { text-decoration: none; color: inherit; display: block; transition: transform 0.2s ease; }
.clickable-card:hover { transform: translateY(-5px); }
.no-results { grid-column: 1 / -1; padding: 50px; text-align: center; color: #888; background: #f8f9fa; border-radius: 12px; }
</style>