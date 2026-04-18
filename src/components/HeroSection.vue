<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

defineProps<{ modelValue: string }>()
defineEmits(['update:modelValue', 'search'])

const router = useRouter()
const localQuery = ref('')

function goSearch() {
  if (localQuery.value.trim()) {
    router.push({ path: '/search', query: { q: localQuery.value.trim() } })
  } else {
    router.push('/search')
  }
}
</script>

<template>
  <header class="hero">
    <div class="hero-content">
      <h1>ค้นหาทริปในฝันของคุณ</h1>
      <p>รวมทริปท่องเที่ยวทั่วไทย พร้อมโปรโมชั่นพิเศษสำหรับสมาชิก</p>
      
      <div class="search-box">
        <span class="icon">🔍</span>
        <input
          v-model="localQuery"
          type="text"
          placeholder="ค้นหาชื่อทริป หรือจังหวัด..."
          @keyup.enter="goSearch"
        >
        <button @click="goSearch">ค้นหา</button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.hero { background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80'); background-size: cover; background-position: center; height: 460px; display: flex; align-items: center; justify-content: center; text-align: center; color: white; }
.hero-content { width: 100%; max-width: 800px; padding: 0 20px; }
.hero-content h1 { font-size: 3rem; font-weight: 800; margin-bottom: 15px; text-shadow: 0 4px 10px rgba(0,0,0,0.3); }
.hero-content p { font-size: 1.2rem; opacity: 0.9; margin-bottom: 35px; }

.search-box { background: white; padding: 8px; border-radius: 16px; display: flex; max-width: 600px; margin: 0 auto; box-shadow: 0 15px 35px rgba(0,0,0,0.2); }
.icon { display: flex; align-items: center; padding-left: 15px; font-size: 1.2rem; }
.search-box input { flex: 1; border: none; padding: 15px; outline: none; font-size: 1.05rem; font-family: inherit; background: transparent; }
.search-box button { background: #007bff; color: white; border: none; padding: 0 35px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; }
.search-box button:hover { background: #0056b3; }

@media (max-width: 768px) {
  .hero { height: 380px; }
  .hero-content h1 { font-size: 2rem; }
  .hero-content p { font-size: 1rem; margin-bottom: 20px; }
  .search-box { flex-direction: column; padding: 12px; gap: 10px; border-radius: 20px; }
  .icon { display: none; }
  .search-box input { padding: 10px; text-align: center; font-size: 1rem; }
  .search-box button { padding: 12px; width: 100%; border-radius: 10px; }
}
</style>
