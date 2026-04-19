<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAllTrips } from '../api/tripApi'

const route = useRoute()
const router = useRouter()

const keyword = ref((route.query.q as string) || '')
const selectedTag = ref((route.query.tag as string) || '')
const sortBy = ref((route.query.sort as string) || 'latest')
const activeTab = ref<'trips' | 'users'>('trips')

const trips = ref<any[]>([])
const users = ref<any[]>([])
const popularTags = ref<string[]>([])
const isLoading = ref(false)

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

onMounted(async () => {
  await loadTags()
  await doSearch()
})

async function loadTags() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/trips/tags`)
    if (res.ok) popularTags.value = (await res.json()).slice(0, 20)
  } catch { /* silent */ }
}

async function doSearch() {
  isLoading.value = true
  try {
    const params = new URLSearchParams()
    if (keyword.value.trim()) params.set('keyword', keyword.value.trim())
    if (selectedTag.value) params.set('tag', selectedTag.value)
    params.set('sort', sortBy.value)

    // Search trips
    const tripRes = await fetch(`${API_BASE_URL}/api/trips/search?${params}`)
    trips.value = tripRes.ok ? await tripRes.json() : []

    // Search users (ถ้ามี keyword)
    if (keyword.value.trim()) {
      const userRes = await fetch(`${API_BASE_URL}/api/users/search?q=${encodeURIComponent(keyword.value.trim())}`)
      users.value = userRes.ok ? await userRes.json() : []
    } else {
      users.value = []
    }

    // อัปเดต URL
    router.replace({ query: {
      ...(keyword.value && { q: keyword.value }),
      ...(selectedTag.value && { tag: selectedTag.value }),
      sort: sortBy.value
    }})
  } finally {
    isLoading.value = false
  }
}

function selectTag(tag: string) {
  selectedTag.value = selectedTag.value === tag ? '' : tag
  doSearch()
}

function clearFilters() {
  keyword.value = ''
  selectedTag.value = ''
  sortBy.value = 'latest'
  doSearch()
}

function cleanDescription(text: string | null): string {
  if (!text) return ''
  return text.replace(/\[IMAGE:\d+\]/g, '').replace(/\s+/g, ' ').trim()
}
</script>

<template>
  <div class="search-page">
    <div class="search-container">

      <!-- Search Header -->
      <div class="search-header">
        <h1>ค้นหา</h1>

        <!-- Search Input -->
        <div class="search-input-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            v-model="keyword"
            @keyup.enter="doSearch"
            placeholder="ค้นหาทริป, สถานที่, หรือ @ชื่อผู้ใช้..."
            class="search-input"
          />
          <button v-if="keyword" @click="keyword = ''; doSearch()" class="btn-clear-input">✕</button>
          <button @click="doSearch" class="btn-search-go">ค้นหา</button>
        </div>

        <!-- Sort + Filter row -->
        <div class="filter-row">
          <div class="sort-group">
            <span class="filter-label">เรียงตาม</span>
            <button
              v-for="s in [{ value: 'latest', label: '🕐 ใหม่สุด' }, { value: 'likes', label: '❤️ ยอดนิยม' }]"
              :key="s.value"
              class="sort-btn"
              :class="{ active: sortBy === s.value }"
              @click="sortBy = s.value; doSearch()"
            >{{ s.label }}</button>
          </div>

          <button v-if="selectedTag || keyword" @click="clearFilters" class="btn-clear-all">
            ล้างทั้งหมด ✕
          </button>
        </div>

        <!-- Popular Tags -->
        <div class="tags-row" v-if="popularTags.length">
          <span class="filter-label">แท็ก</span>
          <div class="tags-scroll">
            <button
              v-for="tag in popularTags"
              :key="tag"
              class="tag-chip"
              :class="{ active: selectedTag === tag }"
              @click="selectTag(tag)"
            >{{ tag }}</button>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="result-tabs">
        <button class="result-tab" :class="{ active: activeTab === 'trips' }" @click="activeTab = 'trips'">
          🗺️ ทริป ({{ trips.length }})
        </button>
        <button class="result-tab" :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'" v-if="keyword">
          👤 ผู้ใช้ ({{ users.length }})
        </button>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="search-loading">
        <div class="spinner"></div>
      </div>

      <!-- Trip Results -->
      <div v-else-if="activeTab === 'trips'">
        <div v-if="trips.length === 0" class="empty-result">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <p>ไม่พบทริปที่ตรงกัน</p>
          <p class="sub">ลองเปลี่ยน keyword หรือเลือก tag อื่น</p>
        </div>
        <div v-else class="trips-grid">
          <router-link
            v-for="trip in trips"
            :key="trip.id"
            :to="`/trip/${trip.id}`"
            class="trip-card"
          >
            <div class="card-photo">
              <img v-if="trip.photos?.length" :src="trip.photos[0]" :alt="trip.title" />
              <div v-else class="photo-placeholder">📷</div>
              <div class="card-likes">❤️ {{ trip.likes ?? 0 }}</div>
            </div>
            <div class="card-body">
              <h3>{{ trip.title }}</h3>
              <p>{{ cleanDescription(trip.description) }}</p>
              <div class="card-tags" v-if="trip.tags?.length">
                <span v-for="tag in trip.tags.slice(0,3)" :key="tag" class="mini-tag" @click.prevent="selectTag(tag)">
                  {{ tag }}
                </span>
              </div>
            </div>
          </router-link>
        </div>
      </div>

      <!-- User Results -->
      <div v-else-if="activeTab === 'users'">
        <div v-if="users.length === 0" class="empty-result">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <p>ไม่พบผู้ใช้ที่ตรงกัน</p>
        </div>
        <div v-else class="users-list">
          <router-link
            v-for="user in users"
            :key="user.id"
            :to="`/@${user.username}`"
            class="user-card"
          >
            <img v-if="user.avatarUrl" :src="user.avatarUrl" class="user-avatar" />
            <div v-else class="user-avatar placeholder">
              {{ user.username?.charAt(0).toUpperCase() }}
            </div>
            <div class="user-info">
              <span class="user-displayname">{{ user.nickname || user.username }}</span>
              <span class="user-username">@{{ user.username }}</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </router-link>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.search-page { min-height: calc(100vh - 72px); background: var(--bg-secondary); padding: 32px 20px 60px; }
.search-container { max-width: 900px; margin: 0 auto; }

/* Header */
.search-header { background: var(--bg-card); border-radius: 16px; padding: 28px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid var(--border-light); }
.search-header h1 { font-size: 1.6rem; font-weight: 700; color: var(--text-primary); margin: 0 0 20px; }

/* Input */
.search-input-wrap { display: flex; align-items: center; gap: 10px; background: var(--bg-secondary); border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 10px 16px; margin-bottom: 16px; transition: border-color 0.2s; }
.search-input-wrap:focus-within { border-color: #3b82f6; }
.search-input { flex: 1; border: none; outline: none; font-size: 1rem; background: transparent; font-family: inherit; color: var(--text-primary); }
.search-input::placeholder { color: var(--text-muted); }
.btn-clear-input { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.9rem; padding: 0 4px; }
.btn-search-go { background: #3b82f6; color: white; border: none; padding: 8px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; font-family: inherit; transition: 0.2s; white-space: nowrap; }
.btn-search-go:hover { background: #2563eb; }

/* Filter row */
.filter-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 8px; }
.filter-label { font-size: 0.8rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-right: 6px; }
.sort-group { display: flex; align-items: center; gap: 6px; }
.sort-btn { background: var(--bg-tertiary); border: none; padding: 6px 14px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; color: var(--text-muted); cursor: pointer; font-family: inherit; transition: 0.2s; }
.sort-btn.active { background: var(--accent-light); color: var(--accent-text); }
.sort-btn:hover:not(.active) { background: var(--bg-tertiary); }
.btn-clear-all { background: none; border: 1px solid var(--border-color); color: var(--text-muted); padding: 5px 12px; border-radius: 8px; font-size: 0.8rem; cursor: pointer; font-family: inherit; transition: 0.2s; }
.btn-clear-all:hover { border-color: #ef4444; color: #ef4444; }

/* Tags */
.tags-row { display: flex; align-items: center; gap: 8px; }
.tags-scroll { display: flex; gap: 6px; overflow-x: auto; flex-wrap: wrap; scrollbar-width: none; }
.tags-scroll::-webkit-scrollbar { display: none; }
.tag-chip { background: var(--bg-tertiary); border: 1.5px solid #e2e8f0; color: var(--text-muted); padding: 4px 12px; border-radius: 20px; font-size: 0.82rem; font-weight: 500; cursor: pointer; white-space: nowrap; transition: 0.2s; font-family: inherit; }
.tag-chip:hover { border-color: #3b82f6; color: #3b82f6; }
.tag-chip.active { background: var(--accent-light); border-color: #3b82f6; color: var(--accent-text); font-weight: 700; }

/* Tabs */
.result-tabs { display: flex; gap: 4px; background: var(--bg-tertiary); border-radius: 12px; padding: 4px; width: fit-content; margin-bottom: 20px; }
.result-tab { padding: 8px 18px; border-radius: 9px; border: none; background: transparent; font-size: 0.88rem; font-weight: 600; color: var(--text-muted); cursor: pointer; transition: 0.2s; font-family: inherit; }
.result-tab.active { background: var(--bg-card); color: #3b82f6; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }

/* Loading */
.search-loading { display: flex; justify-content: center; padding: 60px; }
.spinner { width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Empty */
.empty-result { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 60px 20px; text-align: center; color: var(--text-muted); }
.empty-result p { margin: 0; font-size: 1rem; font-weight: 500; }
.empty-result .sub { font-size: 0.85rem; font-weight: 400; }

/* Trip Grid */
.trips-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.trip-card { text-decoration: none; background: var(--bg-card); border-radius: 14px; overflow: hidden; border: 1px solid var(--border-light); transition: transform 0.2s, box-shadow 0.2s; }
.trip-card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.1); }
.card-photo { position: relative; height: 160px; background: var(--bg-tertiary); overflow: hidden; }
.card-photo img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
.trip-card:hover .card-photo img { transform: scale(1.05); }
.photo-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #d1d5db; }
.card-likes { position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.5); color: white; font-size: 0.75rem; padding: 3px 8px; border-radius: 10px; }
.card-body { padding: 14px; }
.card-body h3 { font-size: 0.95rem; font-weight: 600; color: var(--text-primary); margin: 0 0 6px; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
.card-body p { font-size: 0.82rem; color: var(--text-secondary); margin: 0 0 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.5; }
.card-tags { display: flex; gap: 4px; flex-wrap: wrap; }
.mini-tag { background: var(--accent-light); color: #3b82f6; font-size: 0.72rem; padding: 2px 8px; border-radius: 10px; cursor: pointer; }
.mini-tag:hover { background: var(--accent-light); }

/* User List */
.users-list { display: flex; flex-direction: column; gap: 8px; }
.user-card { display: flex; align-items: center; gap: 14px; background: var(--bg-card); border-radius: 12px; padding: 14px 18px; text-decoration: none; border: 1px solid var(--border-light); transition: 0.2s; }
.user-card:hover { border-color: #3b82f6; box-shadow: 0 2px 8px rgba(59,130,246,0.1); }
.user-avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
.user-avatar.placeholder { background: #3b82f6; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem; }
.user-info { flex: 1; display: flex; flex-direction: column; }
.user-displayname { font-weight: 600; color: var(--text-primary); font-size: 0.95rem; }
.user-username { font-size: 0.82rem; color: var(--text-muted); }

@media (max-width: 768px) {
  .search-page { padding: 16px 12px 40px; }
  .search-header { padding: 20px 16px; }
  .search-header h1 { font-size: 1.3rem; margin-bottom: 14px; }
  .btn-search-go { padding: 8px 14px; font-size: 0.85rem; }
  .filter-row { flex-direction: column; align-items: flex-start; gap: 10px; }
  .tags-row { flex-wrap: wrap; }
  .trips-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
}

@media (max-width: 480px) {
  .trips-grid { grid-template-columns: 1fr; }
}
</style>
