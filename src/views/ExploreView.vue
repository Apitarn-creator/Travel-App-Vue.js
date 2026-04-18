<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getAllTrips, type Trip } from '../api/tripApi'

const router = useRouter()

// ---- State ----
const trips = ref<Trip[]>([])
const selectedLocation = ref<string | null>(null)
const selectedTrips = ref<Trip[]>([])
const searchQuery = ref('')
const mapReady = ref(false)
const showLayerMenu = ref(false)
let map: any = null
let markers: any[] = []

// ---- Computed ----
const filteredTrips = computed(() => {
  if (!searchQuery.value.trim()) return trips.value
  const q = searchQuery.value.toLowerCase()
  return trips.value.filter(t =>
    t.title.toLowerCase().includes(q) ||
    (t.description ?? '').toLowerCase().includes(q) ||
    (t.tags ?? []).some((tag: string) => tag.toLowerCase().includes(q))
  )
})

// จัดกลุ่ม trips ตาม lat/lng ที่ใกล้เคียงกัน
const tripGroups = computed(() => {
  const groups: Map<string, Trip[]> = new Map()
  filteredTrips.value.forEach(trip => {
    if (trip.latitude == null || trip.longitude == null) return
    const key = `${trip.latitude.toFixed(2)},${trip.longitude.toFixed(2)}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(trip)
  })
  return groups
})

// ---- Map Setup ----
function loadGoogleMaps(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).google?.maps) { resolve(); return }
    const script = document.createElement('script')
    // ใช้ Google Maps Embed ฟรี (ไม่ต้องใช้ API key สำหรับ static map)
    // สำหรับ interactive map ใช้ Leaflet + OpenStreetMap แทน
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => resolve()
    document.head.appendChild(script)

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
  })
}

async function initMap() {
  await loadGoogleMaps()
  const L = (window as any).L

  map = L.map('map-container', {
    center: [13.0, 101.5],
    zoom: 6,
    zoomControl: false,
  })

  // OpenStreetMap tile (ฟรี ไม่ต้องใช้ API key)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors © CARTO',
    maxZoom: 19,
  }).addTo(map)

  // Custom zoom control (ขวาล่าง)
  L.control.zoom({ position: 'bottomright' }).addTo(map)

  mapReady.value = true
  renderMarkers()
}

function renderMarkers() {
  if (!map) return
  const L = (window as any).L

  // Clear เดิม
  markers.forEach(m => m.remove())
  markers = []

  tripGroups.value.forEach((groupTrips, key) => {
    const [lat, lng] = key.split(',').map(Number)
    const count = groupTrips.length
    const locationName = guessLocationName(groupTrips[0])

    // Custom marker icon
    const iconHtml = `
      <div style="
        background: #e53935;
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        width: 32px; height: 32px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
      ">
        <div style="transform: rotate(45deg); color: white; font-size: 11px; font-weight: bold;">
          ${count > 1 ? count : ''}
        </div>
      </div>
    `

    const icon = L.divIcon({
      html: iconHtml,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      className: '',
    })

    const marker = L.marker([lat, lng], { icon })
      .addTo(map)
      .on('click', () => selectLocation(locationName, groupTrips))

    // Tooltip แสดงชื่อ
    marker.bindTooltip(`<div style="font-family: inherit; font-size: 13px; font-weight: 600; padding: 2px 4px;">${locationName}</div>`, {
      permanent: false,
      direction: 'top',
      offset: [0, -35],
    })

    markers.push(marker)
  })
}

function guessLocationName(trip: Trip): string {
  // ดึงชื่อจาก tags หรือ title
  if (trip.tags && trip.tags.length > 0) {
    const locationTag = trip.tags.find((t: string) =>
      ['กรุงเทพ','เชียงใหม่','ภูเก็ต','พัทยา','ชลบุรี','ตราด','เกาะช้าง','กาญจนบุรี','อยุธยา',
       'สุโขทัย','เลย','น่าน','แม่ฮ่องสอน','กระบี่','สมุย','พะงัน','ลิบง','ตรัง','สตูล',
       'ระยอง','จันทบุรี','ประจวบ','หัวหิน','เพชรบุรี'].some(loc => t.includes(loc))
    )
    if (locationTag) return locationTag
  }
  return trip.title.length > 20 ? trip.title.substring(0, 20) + '...' : trip.title
}

function selectLocation(name: string, locationTrips: Trip[]) {
  selectedLocation.value = name
  selectedTrips.value = locationTrips
}

function closePanel() {
  selectedLocation.value = null
  selectedTrips.value = []
}

function goToTrip(id: number) {
  router.push(`/trip/${id}`)
}

function centerToMyLocation() {
  if (!navigator.geolocation) return
  navigator.geolocation.getCurrentPosition(pos => {
    map?.setView([pos.coords.latitude, pos.coords.longitude], 10)
  })
}

// ---- Search ----
function handleSearch() {
  renderMarkers()
  // ถ้ามีผลลัพธ์เดียว zoom ไปที่นั่นเลย
  if (tripGroups.value.size === 1) {
    const [[lat, lng]] = [...tripGroups.value.keys()].map(k => k.split(',').map(Number))
    map?.setView([lat, lng], 10)
    const firstGroup = [...tripGroups.value.values()][0]
    selectLocation(guessLocationName(firstGroup[0]), firstGroup)
  }
}

// ---- Lifecycle ----
onMounted(async () => {
  try {
    trips.value = await getAllTrips()
  } catch (e) {
    // ถ้า API ยังไม่พร้อม ใช้ข้อมูล mock แทน
    trips.value = []
  }
  await initMap()
})

onUnmounted(() => {
  map?.remove()
})
</script>

<template>
  <div class="explore-page">
    <!-- Header -->
    <div class="explore-header">
      <h1 class="explore-title">สำรวจสถานที่ท่องเที่ยว</h1>
      <p class="explore-subtitle">ค้นหาแรงบันดาลใจจากรูปภาพทั่วไทย</p>
    </div>

    <!-- Main Layout -->
    <div class="explore-layout">
      <!-- Map Area -->
      <div class="map-wrapper">
        <!-- Search Bar over map -->
        <div class="map-search-bar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            v-model="searchQuery"
            @input="handleSearch"
            placeholder="ค้นหาสถานที่..."
            class="map-search-input"
          />
        </div>

        <!-- Layer button -->
        <button class="layer-btn" @click="showLayerMenu = !showLayerMenu">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2"/>
            <polyline points="2 17 12 22 22 17"/>
            <polyline points="2 12 12 17 22 12"/>
          </svg>
          เลเยอร์
        </button>

        <!-- Map Container -->
        <div id="map-container" class="map-container">
          <div v-if="!mapReady" class="map-loading">
            <div class="loading-spinner"></div>
            <p>กำลังโหลดแผนที่...</p>
          </div>
        </div>

        <!-- My location button -->
        <button class="locate-btn" @click="centerToMyLocation" title="ตำแหน่งของฉัน">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v4M12 19v4M1 12h4M19 12h4"/>
            <circle cx="12" cy="12" r="8" stroke-dasharray="2 2"/>
          </svg>
        </button>

        <!-- No trips on map notice -->
        <div v-if="mapReady && tripGroups.size === 0" class="no-pins-notice">
          ไม่พบสถานที่ที่ตรงกับการค้นหา
        </div>
      </div>

      <!-- Side Panel -->
      <transition name="panel-slide">
        <div v-if="selectedLocation" class="side-panel">
          <!-- Panel Header -->
          <div class="panel-header">
            <div class="panel-title-row">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#3b82f6" stroke="#3b82f6" stroke-width="0">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <h2 class="panel-title">{{ selectedLocation }}</h2>
            </div>
            <button @click="closePanel" class="close-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <p class="panel-count">{{ selectedTrips.length }} รูปภาพ</p>

          <!-- Trip Cards -->
          <div class="panel-cards">
            <div
              v-for="trip in selectedTrips"
              :key="trip.id"
              class="trip-card"
              @click="goToTrip(trip.id)"
            >
              <!-- Photo -->
              <div class="trip-photo">
                <img
                  v-if="trip.photos && trip.photos.length > 0"
                  :src="trip.photos[0]"
                  :alt="trip.title"
                  class="trip-img"
                />
                <div v-else class="trip-img-placeholder">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
                <!-- Tag badges -->
                <div v-if="trip.tags && trip.tags.length > 0" class="trip-tags">
                  <span v-for="tag in trip.tags.slice(0,2)" :key="tag" class="trip-tag">{{ tag }}</span>
                </div>
              </div>

              <!-- Info -->
              <div class="trip-info">
                <h3 class="trip-title">{{ trip.title }}</h3>
                <div class="trip-author">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span>ผู้ใช้ #{{ trip.author_id ?? '—' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty panel hint -->
        <div v-else class="side-panel-hint">
          <div class="hint-inner">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
            <p>คลิก pin บนแผนที่<br>เพื่อดูทริปในบริเวณนั้น</p>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.explore-page {
  min-height: calc(100vh - 72px);
  background: var(--bg-secondary);
  display: flex;
  flex-direction: column;
  padding: 28px 32px 0;
}

.explore-header {
  margin-bottom: 20px;
}
.explore-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px;
}
.explore-subtitle {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin: 0;
}

/* Layout */
.explore-layout {
  display: flex;
  gap: 20px;
  flex: 1;
  min-height: 0;
  padding-bottom: 28px;
}

/* Map */
.map-wrapper {
  flex: 1;
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  min-height: 580px;
}

.map-container {
  width: 100%;
  height: 100%;
  min-height: 580px;
  background: var(--accent-light);
}

.map-loading {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  background: var(--bg-tertiary);
  gap: 12px; color: var(--text-secondary);
}

.loading-spinner {
  width: 36px; height: 36px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Map overlays */
.map-search-bar {
  position: absolute; top: 16px; left: 16px;
  z-index: 1000;
  background: var(--bg-card);
  border-radius: 10px;
  padding: 10px 14px;
  display: flex; align-items: center; gap: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.12);
  width: 260px;
}
.map-search-input {
  border: none; outline: none;
  font-size: 0.9rem; color: var(--text-primary);
  width: 100%; background: transparent;
  font-family: inherit;
}
.map-search-input::placeholder { color: var(--text-muted); }

.layer-btn {
  position: absolute; top: 16px; right: 16px;
  z-index: 1000;
  background: var(--bg-card);
  border: none; border-radius: 10px;
  padding: 10px 16px;
  display: flex; align-items: center; gap: 6px;
  font-size: 0.9rem; font-weight: 600; color: var(--text-primary);
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0,0,0,0.12);
  transition: background 0.2s;
}
.layer-btn:hover { background: var(--bg-tertiary); }

.locate-btn {
  position: absolute; bottom: 56px; right: 16px;
  z-index: 1000;
  background: var(--bg-card); border: none;
  width: 40px; height: 40px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--text-primary);
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  transition: background 0.2s;
}
.locate-btn:hover { background: #f0f9ff; color: #3b82f6; }

.no-pins-notice {
  position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%);
  z-index: 1000;
  background: rgba(0,0,0,0.7); color: white;
  padding: 8px 16px; border-radius: 20px;
  font-size: 0.85rem;
}

/* Side Panel */
.side-panel {
  width: 360px;
  flex-shrink: 0;
  background: var(--bg-card);
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  display: flex; flex-direction: column;
  overflow: hidden;
}

.side-panel-hint {
  width: 360px;
  flex-shrink: 0;
  background: var(--bg-card);
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  display: flex; align-items: center; justify-content: center;
}
.hint-inner {
  text-align: center; color: var(--text-muted);
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 40px 20px;
  line-height: 1.6;
}

.panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 20px 8px;
  border-bottom: 1px solid #f3f4f6;
}
.panel-title-row {
  display: flex; align-items: center; gap: 8px;
}
.panel-title {
  font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin: 0;
}
.panel-count {
  padding: 6px 20px 12px;
  font-size: 0.85rem; color: var(--text-secondary); margin: 0;
}
.close-btn {
  background: none; border: none; cursor: pointer;
  color: var(--text-muted); padding: 4px; border-radius: 6px;
  display: flex; align-items: center;
  transition: color 0.2s, background 0.2s;
}
.close-btn:hover { color: var(--text-primary); background: var(--bg-tertiary); }

/* Cards */
.panel-cards {
  flex: 1; overflow-y: auto; padding: 0 16px 16px;
  display: flex; flex-direction: column; gap: 12px;
}
.panel-cards::-webkit-scrollbar { width: 4px; }
.panel-cards::-webkit-scrollbar-track { background: transparent; }
.panel-cards::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 2px; }

.trip-card {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #f3f4f6;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.trip-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}

.trip-photo {
  position: relative;
  height: 180px; overflow: hidden;
  background: var(--bg-tertiary);
}
.trip-img {
  width: 100%; height: 100%; object-fit: cover;
  transition: transform 0.3s;
}
.trip-card:hover .trip-img { transform: scale(1.04); }
.trip-img-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
}

.trip-tags {
  position: absolute; bottom: 8px; left: 8px;
  display: flex; gap: 4px;
}
.trip-tag {
  background: rgba(0,0,0,0.55); color: white;
  font-size: 0.7rem; padding: 2px 8px; border-radius: 10px;
  backdrop-filter: blur(4px);
}

.trip-info {
  padding: 10px 12px 12px;
}
.trip-title {
  font-size: 0.95rem; font-weight: 600; color: var(--text-primary);
  margin: 0 0 6px; line-height: 1.4;
}
.trip-author {
  display: flex; align-items: center; gap: 4px;
  font-size: 0.8rem; color: var(--text-muted);
}

/* Transition */
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: opacity 0.2s, transform 0.25s;
}
.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0; transform: translateX(20px);
}

/* Responsive */
@media (max-width: 768px) {
  .explore-page { padding: 20px 16px 0; }
  .explore-layout { flex-direction: column; }
  .side-panel, .side-panel-hint { width: 100%; }
  .map-wrapper { min-height: 400px; }
}
</style>
