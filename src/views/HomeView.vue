<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import HeroSection from '../components/HeroSection.vue'
import TripCard from '../components/TripCard.vue'
import SkeletonCard from '../components/SkeletonCard.vue'
import { getAllTrips, type Trip } from '../api/tripApi'
import { getFollowingFeed } from '../api/userApi'

const trips = ref<Trip[]>([])
const feedTrips = ref<Trip[]>([])
const loading = ref(true)
const feedLoading = ref(false)
const activeTab = ref<'discover' | 'following'>('discover')
const currentUser = ref<any>(null)

const searchQuery = ref('')
const isSearching = ref(false)

const filterCategories = [
  { name: 'ทั้งหมด', icon: '🌍' },
  { name: 'ที่พัก', icon: '🏨' },
  { name: 'ที่ท่องเที่ยว', icon: '⛰️' },
  { name: 'ที่ถ่ายรูป', icon: '📸' },
  { name: 'คาเฟ่', icon: '☕' }
]
const activeCategory = ref('ทั้งหมด')

const categories = [
  { name: 'ที่พัก', icon: '🏨', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&auto=format&fit=crop' },
  { name: 'ที่ท่องเที่ยว', icon: '⛰️', image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=500&auto=format&fit=crop' },
  { name: 'ที่ถ่ายรูป', icon: '📸', image: 'https://images.unsplash.com/photo-1516483638261-f4daaf28dd0e?w=500&auto=format&fit=crop' },
  { name: 'คาเฟ่', icon: '☕', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop' }
]

async function loadData(keyword: string = '') {
  loading.value = true
  try {
    const data = await getAllTrips(keyword)
    if (Array.isArray(data)) {
      trips.value = data.sort((a: any, b: any) => b.id - a.id)
    } else { trips.value = [] }
  } finally { loading.value = false }
}

async function loadFeed() {
  if (feedLoading.value) return
  feedLoading.value = true
  try {
    feedTrips.value = await getFollowingFeed()
  } catch { feedTrips.value = [] }
  finally { feedLoading.value = false }
}

async function switchTab(tab: 'discover' | 'following') {
  activeTab.value = tab
  if (tab === 'following' && feedTrips.value.length === 0) {
    await loadFeed()
  }
}

async function handleSearch() {
  if (searchQuery.value.trim() === '') {
    isSearching.value = false; activeCategory.value = 'ทั้งหมด'
    await loadData()
  } else {
    isSearching.value = true; activeCategory.value = ''
    await loadData(searchQuery.value)
  }
}

async function selectCategory(catName: string) {
  activeCategory.value = catName
  if (catName === 'ทั้งหมด') {
    searchQuery.value = ''; isSearching.value = false; await loadData()
  } else {
    searchQuery.value = catName; isSearching.value = true; await loadData(catName)
  }
}

onMounted(() => {
  const u = localStorage.getItem('user')
  if (u) currentUser.value = JSON.parse(u)
  loadData()
})

const latestTrips = computed(() => trips.value.slice(0, 8))
const activeSliderIndex = ref(0)
const highlightTrips = computed(() => trips.value.slice(0, 6))
const setSlide = (index: number) => { activeSliderIndex.value = index }
const nextSlide = () => {
  if (!highlightTrips.value.length) return
  activeSliderIndex.value = (activeSliderIndex.value + 1) % highlightTrips.value.length
}
const prevSlide = () => {
  if (!highlightTrips.value.length) return
  activeSliderIndex.value = (activeSliderIndex.value - 1 + highlightTrips.value.length) % highlightTrips.value.length
}
</script>

<template>
  <div class="home-wrapper">
    <HeroSection v-model="searchQuery" @search="handleSearch" />

    <div class="category-filter-bar">
      <div class="filter-scroll">
        <button
          v-for="cat in filterCategories"
          :key="cat.name"
          class="filter-btn"
          :class="{ active: activeCategory === cat.name }"
          @click="selectCategory(cat.name)"
        >
          <span class="filter-icon">{{ cat.icon }}</span>
          <span class="filter-text">{{ cat.name }}</span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="skeleton-container">
      <div class="skeleton-grid">
        <SkeletonCard v-for="i in 8" :key="i" />
      </div>
    </div>

    <div v-else class="content-container">

      <!-- ✅ Feed Tabs — แสดงเฉพาะเมื่อ login และไม่ได้ค้นหา -->
      <div v-if="currentUser && !isSearching" class="feed-tabs">
        <button
          class="feed-tab"
          :class="{ active: activeTab === 'discover' }"
          @click="switchTab('discover')"
        >
          🌍 สำรวจทั้งหมด
        </button>
        <button
          class="feed-tab"
          :class="{ active: activeTab === 'following' }"
          @click="switchTab('following')"
        >
          👥 คนที่ติดตาม
        </button>
      </div>

      <!-- Search results -->
      <div v-if="isSearching">
        <div class="section-title text-center">
          <h2>ผลการค้นหา: "{{ searchQuery }}"</h2>
          <div class="title-underline"></div>
        </div>
        <div class="trip-grid">
          <router-link v-for="trip in trips" :key="trip.id" :to="`/trip/${trip.id}`" class="clickable-card">
            <TripCard :trip="trip" />
          </router-link>
        </div>
        <div v-if="trips.length === 0" class="no-results">
          ไม่พบทริปในหมวดหมู่นี้ ลองเลือกหมวดหมู่อื่น หรือ <a href="#" @click.prevent="selectCategory('ทั้งหมด')">กลับไปหน้าแนะนำ</a>
        </div>
      </div>

      <!-- ✅ Following Feed -->
      <div v-else-if="activeTab === 'following'">
        <div v-if="feedLoading" class="skeleton-grid">
          <SkeletonCard v-for="i in 6" :key="i" />
        </div>
        <div v-else-if="feedTrips.length === 0" class="feed-empty">
          <div class="feed-empty-inner">
            <span style="font-size:3rem">👥</span>
            <h3>ยังไม่มีทริปจากคนที่ติดตาม</h3>
            <p>ลองกด "ติดตาม" คนที่คุณชอบสไตล์การเที่ยว แล้ว feed จะแสดงทริปของพวกเขาที่นี่</p>
            <router-link to="/explore" class="btn-explore">🗺️ สำรวจหาคนน่าติดตาม</router-link>
          </div>
        </div>
        <div v-else>
          <div class="section-title">
            <h2>จากคนที่คุณติดตาม</h2>
            <div class="title-underline-left"></div>
          </div>
          <div class="posts-grid">
            <router-link v-for="trip in feedTrips" :key="trip.id" :to="`/trip/${trip.id}`" class="clickable-card">
              <TripCard :trip="trip" />
            </router-link>
          </div>
        </div>
      </div>

      <!-- Discover (default) -->
      <div v-else>
        
        <div v-if="highlightTrips.length > 0" class="section-block highlight-slider-container">
          <router-link :to="`/trip/${highlightTrips[activeSliderIndex]?.id}`" class="highlight-main">
            <img :src="highlightTrips[activeSliderIndex]?.photos[0] || 'https://via.placeholder.com/800x400'" alt="highlight" />
            <div class="highlight-overlay">
              <h2>{{ highlightTrips[activeSliderIndex]?.title }}</h2>
              <p>{{ (highlightTrips[activeSliderIndex] as any)?.description?.replace(/\[IMAGE:\d+\]/g, '').trim().substring(0, 120) || 'คลิกเพื่อดูรายละเอียดเพิ่มเติม...' }}</p>
            </div>
          </router-link>
          
          <div class="highlight-thumbnails-wrapper">
            <button class="nav-arrow" @click="prevSlide">❮</button>
            <div class="thumbnails-track">
              <div 
                v-for="(trip, index) in highlightTrips" 
                :key="trip.id"
                class="thumb-box"
                :class="{ active: activeSliderIndex === index }"
                @click="setSlide(index)"
              >
                <img :src="trip.photos[0] || 'https://via.placeholder.com/150'" />
                <div v-if="activeSliderIndex !== index" class="thumb-overlay"></div>
              </div>
            </div>
            <button class="nav-arrow" @click="nextSlide">❯</button>
          </div>
        </div>

        <div v-if="latestTrips.length > 0" class="section-block">
          <div class="section-title">
            <h2>บทความล่าสุด</h2>
            <div class="title-underline-left"></div>
          </div>
          <div class="posts-grid">
            <router-link v-for="trip in latestTrips" :key="trip.id" :to="`/trip/${trip.id}`" class="clickable-card">
               <TripCard :trip="trip" />
            </router-link>
          </div>
        </div>

        <div class="section-block">
          <div class="section-title">
            <h2>ค้นหาตามหมวดหมู่</h2>
            <div class="title-underline-left"></div>
          </div>
          <div class="category-grid">
            <router-link v-for="cat in categories" :key="cat.name" :to="`/category/${cat.name}`" class="category-box">
              <img :src="cat.image" />
              <div class="cat-overlay">
                <span class="cat-icon">{{ cat.icon }}</span>
                <h4>{{ cat.name }}</h4>
              </div>
            </router-link>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.home-wrapper { padding-bottom: 100px; }
.loading { text-align: center; padding: 100px; font-size: 1.2rem; color: var(--text-secondary); }
.skeleton-container { padding: 30px 20px; max-width: 1200px; margin: 0 auto; }
.skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
.content-container { max-width: 1200px; margin: 30px auto 0; padding: 0 20px; }

/* ✅ Feed Tabs */
.feed-tabs {
  display: flex; gap: 4px;
  background: #f1f5f9; border-radius: 12px;
  padding: 4px; margin-bottom: 28px;
  width: fit-content;
}
.feed-tab {
  padding: 9px 20px; border-radius: 9px;
  border: none; background: transparent;
  font-size: 0.9rem; font-weight: 600; color: #64748b;
  cursor: pointer; transition: all 0.2s; font-family: inherit;
}
.feed-tab:hover { color: #374151; }
.feed-tab.active { background: var(--bg-card); color: #007bff; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }

/* ✅ Feed Empty */
.feed-empty { padding: 60px 20px; }
.feed-empty-inner {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; text-align: center; max-width: 400px; margin: 0 auto;
}
.feed-empty-inner h3 { font-size: 1.2rem; font-weight: 700; color: var(--text-primary); margin: 0; }
.feed-empty-inner p { color: var(--text-secondary); font-size: 0.95rem; margin: 0; line-height: 1.6; }
.btn-explore {
  display: inline-flex; align-items: center; gap: 6px;
  margin-top: 8px; padding: 10px 20px; border-radius: 10px;
  background: #007bff; color: white; text-decoration: none;
  font-weight: 600; font-size: 0.9rem; transition: 0.2s;
}
.btn-explore:hover { background: #0056b3; transform: translateY(-1px); } 

/* แถบไอคอนหมวดหมู่ด้านบน */
.category-filter-bar { border-bottom: 1px solid var(--border-color); background: var(--bg-card); margin-bottom: 20px; padding: 12px 40px 0; }
.filter-scroll { display: flex; justify-content: center; gap: 40px; overflow-x: auto; padding-bottom: 10px; scrollbar-width: none; }
.filter-scroll::-webkit-scrollbar { display: none; }
.filter-btn { display: flex; flex-direction: column; align-items: center; gap: 8px; background: none; border: none; cursor: pointer; opacity: 0.5; transition: all 0.2s ease; padding-bottom: 10px; border-bottom: 2px solid transparent; min-width: 60px; outline: none; }
.filter-btn:hover { opacity: 1; transform: scale(1.05); }
.filter-btn.active { opacity: 1; border-bottom: 2px solid #1a1a1a; }
.filter-icon { font-size: 1.8rem; }
.filter-text { font-size: 0.95rem; font-weight: 600; white-space: nowrap; color: var(--text-primary); }

/* Typography */
.section-title { margin-bottom: 30px; }
.section-title h2 { font-size: 2rem; font-weight: 700; color: var(--text-primary); margin-bottom: 10px; }
.text-center { text-align: center; }
.title-underline { width: 60px; height: 4px; background: #007bff; border-radius: 2px; margin: 0 auto; }
.title-underline-left { width: 60px; height: 4px; background: #007bff; border-radius: 2px; margin: 0; }
.section-block { margin-bottom: 60px; }

/* 🌟 สไตล์สำหรับ Highlight Slider */
.highlight-slider-container { 
  border: 1px solid #eaeaea; 
  background: var(--bg-card); 
  border-radius: 8px; 
  overflow: hidden; 
  box-shadow: 0 4px 15px rgba(0,0,0,0.05); 
}
.highlight-main { 
  display: block; 
  position: relative; 
  width: 100%; 
  
  /* 1. เปลี่ยนสัดส่วนให้เป็นแนวยาวแบบแบนเนอร์ (กว้าง 21 ส่วน สูง 8 ส่วน) */
  aspect-ratio: 16 / 7; 
  min-height: 350px; 
  
  overflow: hidden; 
  text-decoration: none; 
}
.highlight-main img { 
  width: 100%; 
  height: 100%; 
  object-fit: cover; 
  object-position: center; 
  transition: transform 0.5s ease; 
}
.highlight-main:hover img { transform: scale(1.02); }
.highlight-overlay { position: absolute; bottom: 0; left: 0; right: 0; padding: 60px 40px 30px 40px; background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%); color: white; }
.highlight-overlay h2 { font-size: 2.2rem; font-weight: 700; margin: 0 0 10px 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.5); line-height: 1.3; }
.highlight-overlay p { font-size: 1.1rem; margin: 0; opacity: 0.9; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-shadow: 1px 1px 3px rgba(0,0,0,0.8); }

.highlight-thumbnails-wrapper { display: flex; align-items: center; padding: 15px; background: #fff; }
.nav-arrow { background: none; border: none; font-size: 1.5rem; color: #555; cursor: pointer; padding: 0 15px; transition: color 0.2s; }
.nav-arrow:hover { color: #007bff; }
.thumbnails-track { display: flex; gap: 12px; overflow-x: auto; flex: 1; scrollbar-width: none; padding: 5px 0; }
.thumbnails-track::-webkit-scrollbar { display: none; }
.thumb-box { flex: 0 0 140px; height: 85px; position: relative; border-radius: 6px; overflow: hidden; cursor: pointer; border: 2px solid transparent; transition: all 0.3s ease; }
.thumb-box.active { border-color: #007bff; transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
.thumb-box img { width: 100%; height: 100%; object-fit: cover; }
.thumb-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.4); transition: background 0.3s; }
.thumb-box:hover .thumb-overlay { background: rgba(255,255,255,0.1); }

/* โหมดค้นหา */
.trip-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 30px; }
.clickable-card { text-decoration: none; color: inherit; display: block; transition: transform 0.2s ease; height: 100%; }
.clickable-card:hover { transform: translateY(-5px); }
.no-results { text-align: center; padding: 50px; color: #888; font-size: 1.1rem; background: var(--bg-secondary); border-radius: 12px; margin-top: 20px;}
.no-results a { color: #007bff; text-decoration: underline; cursor: pointer; }

/* 🌟 บทความล่าสุดแบบ Grid (แบบกล่องที่ขอเข้ามาใหม่) */
.posts-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); /* ขนาดขั้นต่ำ 380px เหมือน Home */
  gap: 30px; /* ขยายระยะห่างเป็น 30px เหมือน Home */
}

/* Categories แบบกล่องภาพ */
.category-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
.category-box { position: relative; height: 180px; border-radius: 16px; overflow: hidden; text-decoration: none; transition: 0.3s; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
.category-box:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.15); }
.category-box img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
.category-box:hover img { transform: scale(1.1); }
.cat-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; }
.cat-icon { font-size: 2.5rem; margin-bottom: 10px; }
.cat-overlay h4 { font-size: 1.5rem; font-weight: 700; margin: 0; text-shadow: 0 2px 5px rgba(0,0,0,0.5); }

@media (max-width: 768px) {
  .highlight-main {
    aspect-ratio: 4 / 3; /* บนมือถือปรับสัดส่วนให้เกือบเป็นสี่เหลี่ยมจัตุรัส จะมองเห็นชัดกว่า */
    max-height: none;
  }
}
</style>