<script setup lang="ts">
import { ref, onMounted } from 'vue'
import HeroSection from '../components/HeroSection.vue'
import TripCard from '../components/TripCard.vue'
import { getAllTrips, type Trip } from '../api/tripApi'

const trips = ref<Trip[]>([])
const searchQuery = ref('')
const loading = ref(false)

async function handleSearch() {
  loading.value = true
  try {
    const data = await getAllTrips(searchQuery.value)
    
    if (Array.isArray(data)) {
      trips.value = data.sort((a: any, b: any) => b.id - a.id)
    } else {
      trips.value = []
    }
  } catch (e) { 
    console.error('Fetch error:', e)
    trips.value = []
  } finally { 
    loading.value = false 
  }
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
        
        <router-link 
          v-for="trip in trips" 
          :key="trip.id" 
          :to="`/trip/${trip.id}`" 
          class="clickable-card"
        >
          <TripCard :trip="trip" />
        </router-link>

        <div v-if="trips.length === 0" class="no-results">
          ไม่พบข้อมูลทริปที่คุณต้องการ ลองค้นหาใหม่อีกครั้งนะ 🌴
        </div>

      </div>
    </main>
  </div>
</template>

<style scoped>
.content { 
  padding-top: 60px; 
  padding-bottom: 80px; 
  max-width: 100% !important; /* บังคับยกเลิก max-width ของ .container */
  padding-left: 5%; /* เผื่อที่ว่างขอบซ้าย */
  padding-right: 5%; /* เผื่อที่ว่างขอบขวา */
}
.section-title { margin-bottom: 40px; text-align: center; }
.section-title h2 { font-size: 2rem; font-weight: 700; margin-bottom: 10px; color: #1a1a1a; }
.title-underline { width: 60px; height: 4px; background: #007bff; margin: 0 auto; border-radius: 2px; }

.trip-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); 
  gap: 30px; 
}

/* 💡 สไตล์ใหม่ เพื่อให้กล่องที่กดได้ดูเนียนสวย ไม่เป็นตัวหนังสือสีฟ้ามีขีดเส้นใต้ */
.clickable-card {
  text-decoration: none; 
  color: inherit; 
  display: block; 
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border-radius: 12px;
}
.clickable-card:hover {
  transform: translateY(-5px); /* เวลาเอาเมาส์ชี้ กล่องจะลอยขึ้นมานิดนึง */
}

.status-box { text-align: center; padding: 100px 0; color: #888; }
.loader { border: 4px solid #f3f3f3; border-top: 4px solid #007bff; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 15px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.no-results { grid-column: 1 / -1; text-align: center; padding: 50px; color: #666; font-size: 1.1rem; }
</style>