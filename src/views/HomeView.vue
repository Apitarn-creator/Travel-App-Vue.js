<script setup lang="ts">
import { ref, onMounted } from 'vue'
// สังเกตว่าเราใช้ ../ เพื่อถอยออกจากโฟลเดอร์ views มาที่ src ก่อน
import HeroSection from '../components/HeroSection.vue'
import TripCard from '../components/TripCard.vue'
import { getAllTrips, type Trip } from '../api/tripApi'

const trips = ref<Trip[]>([])
const searchQuery = ref('')
const loading = ref(false)

async function handleSearch() {
  loading.value = true
  try {
    trips.value = await getAllTrips(searchQuery.value)
  } catch (e) { console.error('Fetch error:', e) }
  finally { loading.value = false }
}

onMounted(handleSearch)
</script>

<template>
  <div>
    <HeroSection v-model="searchQuery" @search="handleSearch" />
    
    <main class="container content">
      <div class="section-title">
        <h2>ทริปที่เราคัดสรรมาเพื่อคุณ</h2>
        <div class="title-underline"></div>
      </div>

      <div v-if="loading" class="status-box">
        <div class="loader"></div>
        <p>กำลังค้นหาทริปสุดพิเศษ...</p>
      </div>

      <div v-else class="trip-grid">
        <TripCard v-for="trip in trips" :key="trip.id" :trip="trip" />
        <div v-if="trips.length === 0" class="no-results">
          ไม่พบข้อมูลทริปที่คุณต้องการ ลองค้นหาใหม่อีกครั้งนะ 🌴
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.content { padding-top: 60px; padding-bottom: 80px; }
.section-title { margin-bottom: 40px; text-align: center; }
.section-title h2 { font-size: 2rem; font-weight: 700; margin-bottom: 10px; color: #1a1a1a; }
.title-underline { width: 60px; height: 4px; background: #007bff; margin: 0 auto; border-radius: 2px; }

.trip-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 30px; }

.status-box { text-align: center; padding: 100px 0; color: #888; }
.loader { border: 4px solid #f3f3f3; border-top: 4px solid #007bff; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 15px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.no-results { grid-column: 1 / -1; text-align: center; padding: 60px; background: white; border-radius: 20px; border: 2px dashed #eee; color: #888; font-size: 1.1rem; }

/* --- โค้ดสำหรับมือถือ (จอเล็กกว่า 768px) --- */
@media (max-width: 768px) {
  .content { padding-top: 40px; padding-bottom: 50px; }
  .section-title h2 { font-size: 1.5rem; }
  .section-title { margin-bottom: 25px; }
  
  /* บังคับให้การ์ดเรียงแถวละ 1 ใบเท่านั้น */
  .trip-grid { grid-template-columns: 1fr; gap: 20px; }
}
</style>