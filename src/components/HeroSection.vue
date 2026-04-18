<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

defineProps<{ modelValue: string }>()
defineEmits(['update:modelValue', 'search'])

const router = useRouter()
const localQuery = ref('')
const suggestions = ref<any[]>([])
const showDropdown = ref(false)
const isLoading = ref(false)
const searchBoxRef = ref<HTMLElement | null>(null)

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

let debounceTimer: any = null

watch(localQuery, (val) => {
  clearTimeout(debounceTimer)
  if (!val.trim()) { suggestions.value = []; showDropdown.value = false; return }
  isLoading.value = true
  debounceTimer = setTimeout(() => fetchSuggestions(val.trim()), 300)
})

async function fetchSuggestions(q: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/trips/search?keyword=${encodeURIComponent(q)}`)
    if (res.ok) {
      const data = await res.json()
      suggestions.value = data.slice(0, 6)
      showDropdown.value = suggestions.value.length > 0
    }
  } catch { suggestions.value = [] }
  finally { isLoading.value = false }
}

function goSearch() {
  showDropdown.value = false
  if (localQuery.value.trim()) {
    router.push({ path: '/search', query: { q: localQuery.value.trim() } })
  } else {
    router.push('/search')
  }
}

function selectTrip(trip: any) {
  showDropdown.value = false
  router.push(`/trip/${trip.id}`)
}

function selectSuggestion(trip: any) {
  localQuery.value = trip.title
  showDropdown.value = false
  router.push({ path: '/search', query: { q: trip.title } })
}

function handleClickOutside(e: MouseEvent) {
  if (searchBoxRef.value && !searchBoxRef.value.contains(e.target as Node)) {
    showDropdown.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))

function cleanDesc(text: string | null) {
  if (!text) return ''
  return text.replace(/\[IMAGE:\d+\]/g, '').trim().substring(0, 60)
}
</script>

<template>
  <header class="hero">
    <div class="hero-content">
      <h1>ค้นหาทริปในฝันของคุณ</h1>
      <p>รวมทริปท่องเที่ยวทั่วไทย พร้อมโปรโมชั่นพิเศษสำหรับสมาชิก</p>
      
      <div class="search-wrap" ref="searchBoxRef">
        <div class="search-box">
          <span class="icon">🔍</span>
          <input
            v-model="localQuery"
            type="text"
            placeholder="ค้นหาชื่อทริป หรือจังหวัด..."
            @keyup.enter="goSearch"
            @focus="showDropdown = suggestions.length > 0"
            autocomplete="off"
          >
          <button @click="goSearch">ค้นหา</button>
        </div>

        <!-- Dropdown Suggestions -->
        <div v-if="showDropdown" class="suggestions-dropdown">
          <div v-if="isLoading" class="suggestion-loading">กำลังค้นหา...</div>
          <template v-else>
            <div
              v-for="trip in suggestions"
              :key="trip.id"
              class="suggestion-item"
              @click="selectTrip(trip)"
            >
              <div class="suggestion-photo">
                <img v-if="trip.photos?.length" :src="trip.photos[0]" :alt="trip.title" />
                <div v-else class="suggestion-photo-placeholder">📷</div>
              </div>
              <div class="suggestion-info">
                <span class="suggestion-title">{{ trip.title }}</span>
                <span class="suggestion-desc">{{ cleanDesc(trip.description) }}</span>
              </div>
              <div class="suggestion-tags" v-if="trip.tags?.length">
                <span v-for="tag in trip.tags.slice(0,2)" :key="tag" class="suggestion-tag">{{ tag }}</span>
              </div>
            </div>
            <div class="suggestion-footer" @click="goSearch">
              ดูผลลัพธ์ทั้งหมดสำหรับ "<strong>{{ localQuery }}</strong>" →
            </div>
          </template>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.hero { background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80'); background-size: cover; background-position: center; height: 460px; display: flex; align-items: center; justify-content: center; text-align: center; color: white; }
.hero-content { width: 100%; max-width: 800px; padding: 0 20px; }
.hero-content h1 { font-size: 3rem; font-weight: 800; margin-bottom: 15px; text-shadow: 0 4px 10px rgba(0,0,0,0.3); }
.hero-content p { font-size: 1.2rem; opacity: 0.9; margin-bottom: 35px; }

.search-wrap { position: relative; max-width: 600px; margin: 0 auto; }

.search-box { background: var(--bg-card); padding: 8px; border-radius: 16px; display: flex; box-shadow: 0 15px 35px rgba(0,0,0,0.2); }
.icon { display: flex; align-items: center; padding-left: 15px; font-size: 1.2rem; }
.search-box input { flex: 1; border: none; padding: 15px; outline: none; font-size: 1.05rem; font-family: inherit; background: transparent; color: var(--text-primary); }
.search-box input::placeholder { color: var(--text-muted); }
.search-box button { background: #007bff; color: white; border: none; padding: 0 35px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; white-space: nowrap; }
.search-box button:hover { background: #0056b3; }

/* Dropdown */
.suggestions-dropdown {
  position: absolute; top: calc(100% + 8px); left: 0; right: 0;
  background: var(--bg-card); border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
  overflow: hidden; z-index: 999;
  animation: dropIn 0.15s ease-out;
}
@keyframes dropIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }

.suggestion-loading { padding: 16px; text-align: center; color: var(--text-muted); font-size: 0.9rem; }

.suggestion-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 16px; cursor: pointer; transition: background 0.15s;
  border-bottom: 1px solid #f9fafb;
}
.suggestion-item:hover { background: #f0f9ff; }

.suggestion-photo { width: 44px; height: 44px; border-radius: 8px; overflow: hidden; flex-shrink: 0; background: #f3f4f6; }
.suggestion-photo img { width: 100%; height: 100%; object-fit: cover; }
.suggestion-photo-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }

.suggestion-info { flex: 1; display: flex; flex-direction: column; min-width: 0; text-align: left; }
.suggestion-title { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.suggestion-desc { font-size: 0.78rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.suggestion-tags { display: flex; gap: 4px; flex-shrink: 0; }
.suggestion-tag { background: #eff6ff; color: #3b82f6; font-size: 0.7rem; padding: 2px 7px; border-radius: 8px; }

.suggestion-footer {
  padding: 12px 16px; font-size: 0.85rem; color: var(--text-secondary);
  cursor: pointer; text-align: left; transition: background 0.15s;
  background: #f9fafb;
}
.suggestion-footer:hover { background: #f0f9ff; color: #2563eb; }
.suggestion-footer strong { color: var(--text-primary); }

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
