<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { createTrip } from '../api/tripApi'

const router = useRouter()
const currentUser = ref<any>(null)
const isLoading = ref(false)
const errorMessage = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)
const descriptionRef = ref<HTMLTextAreaElement | null>(null)

// ---- Location picker ----
const showMap = ref(false)
const mapInitialized = ref(false)
const searchQuery = ref('')
const searchResults = ref<any[]>([])
const isSearching = ref(false)
let locationMap: any = null
let locationMarker: any = null

const form = ref({
  title: '',
  description: '',
  tagsInput: '',
  photos: [] as string[],
  latitude: null as number | null,
  longitude: null as number | null,
  locationName: ''
})

onMounted(() => {
  const userString = localStorage.getItem('user')
  if (userString) {
    currentUser.value = JSON.parse(userString)
  } else {
    alert('กรุณาเข้าสู่ระบบก่อนเขียนทริปครับ')
    router.push('/login')
  }
})

onUnmounted(() => { locationMap?.remove() })

function loadLeaflet(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).L) { resolve(); return }
    if (document.querySelector('script[src*="leaflet"]')) {
      const check = setInterval(() => { if ((window as any).L) { clearInterval(check); resolve() } }, 100)
      return
    }
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => resolve()
    document.head.appendChild(script)
  })
}

async function toggleMap() {
  showMap.value = !showMap.value
  if (showMap.value && !mapInitialized.value) {
    await loadLeaflet()
    await new Promise(r => setTimeout(r, 100))
    initLocationMap()
  }
}

function initLocationMap() {
  const L = (window as any).L
  const center: [number, number] = form.value.latitude ? [form.value.latitude, form.value.longitude!] : [13.0, 101.5]
  locationMap = L.map('location-map', { center, zoom: form.value.latitude ? 12 : 6 })
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors © CARTO', maxZoom: 19,
  }).addTo(locationMap)
  if (form.value.latitude && form.value.longitude) placeMarker(L, form.value.latitude, form.value.longitude)
  locationMap.on('click', (e: any) => {
    const { lat, lng } = e.latlng
    form.value.latitude = parseFloat(lat.toFixed(6))
    form.value.longitude = parseFloat(lng.toFixed(6))
    placeMarker(L, lat, lng)
    reverseGeocode(lat, lng)
  })
  mapInitialized.value = true
}

function placeMarker(L: any, lat: number, lng: number) {
  if (locationMarker) locationMarker.remove()
  const iconHtml = `<div style="background:#e53935;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);width:28px;height:28px;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`
  const icon = L.divIcon({ html: iconHtml, iconSize: [28, 28], iconAnchor: [14, 28], className: '' })
  locationMarker = L.marker([lat, lng], { icon }).addTo(locationMap)
}

async function reverseGeocode(lat: number, lng: number) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: { 'Accept-Language': 'th' } })
    const data = await res.json()
    const addr = data.address
    const parts = [addr.city || addr.town || addr.village || addr.suburb || addr.county, addr.state].filter(Boolean)
    form.value.locationName = parts.join(', ') || data.display_name?.split(',').slice(0, 2).join(',') || ''
  } catch {
    form.value.locationName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }
}

// ค้นหาสถานที่จากชื่อ
async function searchLocation() {
  const q = searchQuery.value.trim()
  if (!q) return
  isSearching.value = true
  searchResults.value = []
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&accept-language=th`,
      { headers: { 'Accept-Language': 'th' } }
    )
    searchResults.value = await res.json()
  } catch {
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

// เลือกสถานที่จาก dropdown แล้ว zoom แผนที่ไป
function selectSearchResult(result: any) {
  const lat = parseFloat(result.lat)
  const lng = parseFloat(result.lon)
  form.value.latitude = parseFloat(lat.toFixed(6))
  form.value.longitude = parseFloat(lng.toFixed(6))
  form.value.locationName = result.display_name.split(',').slice(0, 3).join(',').trim()
  searchResults.value = []
  searchQuery.value = form.value.locationName

  if (locationMap) {
    const L = (window as any).L
    locationMap.setView([lat, lng], 13)
    placeMarker(L, lat, lng)
  }
}

function clearLocation() {
  form.value.latitude = null; form.value.longitude = null; form.value.locationName = ''
  if (locationMarker) { locationMarker.remove(); locationMarker = null }
}

function useMyLocation() {
  if (!navigator.geolocation) return
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords
    form.value.latitude = parseFloat(latitude.toFixed(6))
    form.value.longitude = parseFloat(longitude.toFixed(6))
    const L = (window as any).L
    locationMap?.setView([latitude, longitude], 13)
    placeMarker(L, latitude, longitude)
    reverseGeocode(latitude, longitude)
  })
}

// ---- Photos ----
function triggerFileInput() { fileInputRef.value?.click() }

function handleFilesUpload(event: Event) {
  const files = (event.target as HTMLInputElement).files
  if (!files) return
  Array.from(files).forEach(file => {
    if (file.size > 3 * 1024 * 1024) { alert(`รูปภาพ ${file.name} มีขนาดใหญ่เกิน 3MB`); return }
    const reader = new FileReader()
    reader.onload = (e) => { form.value.photos.push(e.target?.result as string) }
    reader.readAsDataURL(file)
  })
}

function insertImageToText(index: number) {
  const textarea = descriptionRef.value
  if (!textarea) return
  const start = textarea.selectionStart
  const imageTag = `\n\n[IMAGE:${index}]\n\n`
  form.value.description = form.value.description.substring(0, start) + imageTag + form.value.description.substring(textarea.selectionEnd)
  setTimeout(() => { textarea.focus(); textarea.selectionStart = textarea.selectionEnd = start + imageTag.length }, 0)
}

function removePhoto(index: number) { form.value.photos.splice(index, 1) }

// ---- Submit ----
async function handleSubmit() {
  if (!form.value.title || !form.value.description) { errorMessage.value = 'กรุณากรอกหัวข้อและเนื้อหาทริป'; return }
  isLoading.value = true; errorMessage.value = ''
  try {
    const tagsArray = form.value.tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0)
    const savedTrip = await createTrip({
      title: form.value.title, description: form.value.description,
      photos: form.value.photos, tags: tagsArray,
      authorId: currentUser.value.id,
      latitude: form.value.latitude, longitude: form.value.longitude,
    })
    alert('สร้างทริปสำเร็จ! 🎉')
    router.push(`/trip/${savedTrip.id}`)
  } catch (error: any) {
    errorMessage.value = error.message || 'เกิดข้อผิดพลาดในการสร้างทริป'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="create-trip-page">
    <div class="container write-container">

      <div class="header">
        <h2>เขียนทริปใหม่ ✍️</h2>
        <p>แบ่งปันประสบการณ์การเดินทางของคุณให้โลกรู้</p>
      </div>

      <div v-if="errorMessage" class="alert error">{{ errorMessage }}</div>

      <form @submit.prevent="handleSubmit" class="trip-form">

        <div class="form-group">
          <label>หัวข้อทริป</label>
          <input type="text" v-model="form.title" placeholder="เช่น ตะลุยหิมะฮอกไกโด 5 วัน 4 คืน..." required :disabled="isLoading" class="title-input" />
        </div>

        <div class="form-group">
          <label>เนื้อหาบทความ / รีวิว</label>
          <textarea ref="descriptionRef" v-model="form.description" rows="12"
            placeholder="เล่าประสบการณ์การเดินทางของคุณ... (อัปโหลดรูปภาพด้านล่าง แล้วกดแทรกลงในข้อความได้เลย!)"
            required :disabled="isLoading"></textarea>
        </div>

        <div class="form-group">
          <label>แท็ก (Tags)</label>
          <input type="text" v-model="form.tagsInput" placeholder="เช่น ญี่ปุ่น, หิมะ, หน้าหนาว (คั่นด้วยเครื่องหมายลูกน้ำ , )" :disabled="isLoading" />
        </div>

        <!-- ✅ Location Picker -->
        <div class="location-section">
          <div class="location-label-row">
            <label>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-3px;margin-right:4px;">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
              </svg>
              ระบุตำแหน่งสถานที่ <span class="optional">(ไม่บังคับ)</span>
            </label>
            <div class="location-actions">
              <button type="button" class="btn-locate-me" @click="useMyLocation" v-if="showMap">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4"/>
                </svg>
                ตำแหน่งปัจจุบัน
              </button>
              <button type="button" class="btn-toggle-map" @click="toggleMap">
                {{ showMap ? 'ซ่อนแผนที่' : '🗺️ เปิดแผนที่เลือกตำแหน่ง' }}
              </button>
            </div>
          </div>

          <div v-if="form.latitude" class="location-selected">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#22c55e" stroke="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <span class="location-name">{{ form.locationName || `${form.latitude}, ${form.longitude}` }}</span>
            <span class="location-coords">({{ form.latitude }}, {{ form.longitude }})</span>
            <button type="button" class="btn-clear-loc" @click="clearLocation">✕ ลบ</button>
          </div>
          <p v-else-if="!showMap" class="location-hint">ยังไม่ได้ระบุตำแหน่ง — ทริปจะไม่ปรากฏบนแผนที่สำรวจ</p>

          <transition name="map-expand">
            <div v-if="showMap" class="map-picker-wrap">

              <!-- Search Box -->
              <div class="map-search-wrap">
                <div class="map-search-box">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  <input
                    v-model="searchQuery"
                    @keyup.enter="searchLocation"
                    placeholder="พิมพ์ชื่อสถานที่ เมือง หรือประเทศ..."
                    class="map-search-input"
                  />
                  <button type="button" @click="searchLocation" class="map-search-btn" :disabled="isSearching">
                    {{ isSearching ? '...' : 'ค้นหา' }}
                  </button>
                </div>

                <!-- Results dropdown -->
                <div v-if="searchResults.length > 0" class="search-results">
                  <button
                    v-for="result in searchResults"
                    :key="result.place_id"
                    type="button"
                    class="search-result-item"
                    @click="selectSearchResult(result)"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#3b82f6" stroke="none" style="flex-shrink:0">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                    </svg>
                    <span>{{ result.display_name }}</span>
                  </button>
                </div>
                <p v-else-if="!isSearching && searchQuery && searchResults.length === 0 && searchQuery !== form.locationName" class="no-result">
                  ไม่พบสถานที่ที่ค้นหา
                </p>
              </div>

              <div id="location-map" class="location-map"></div>
              <p class="map-hint">👆 หรือคลิกบนแผนที่โดยตรงเพื่อวาง pin</p>
            </div>
          </transition>
        </div>

        <!-- Photos -->
        <div class="photo-upload-section">
          <label>รูปภาพประกอบบทความ</label>
          <div class="photo-grid" v-if="form.photos.length > 0">
            <div v-for="(photo, index) in form.photos" :key="index" class="photo-preview">
              <img :src="photo" alt="preview" />
              <button type="button" @click="removePhoto(index)" class="btn-remove">✕</button>
              <button type="button" @click.prevent="insertImageToText(index)" class="btn-insert">แทรกลงข้อความ</button>
            </div>
          </div>
          <input type="file" ref="fileInputRef" @change="handleFilesUpload" accept="image/*" multiple style="display:none;" />
          <button type="button" @click="triggerFileInput" class="btn-upload" :disabled="isLoading">+ อัปโหลดรูปภาพเพิ่ม</button>
        </div>

        <div class="form-actions">
          <button type="button" @click="router.back()" class="btn-cancel" :disabled="isLoading">ยกเลิก</button>
          <button type="submit" class="btn-submit" :disabled="isLoading">
            {{ isLoading ? 'กำลังเผยแพร่...' : 'เผยแพร่ทริป' }}
          </button>
        </div>

      </form>
    </div>
  </div>
</template>

<style scoped>
.create-trip-page { background-color: #f8fafc; min-height: calc(100vh - 72px); padding: 40px 20px; }
.write-container { background: white; max-width: 800px; margin: 0 auto; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); border: 1px solid #f0f0f0; }
.header { margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
.header h2 { font-size: 2rem; color: #111; margin: 0 0 5px 0; }
.header p { color: #666; margin: 0; }
.form-group { margin-bottom: 25px; }
.form-group label { display: block; font-weight: 600; margin-bottom: 10px; color: #333; }
.form-group input, .form-group textarea { width: 100%; padding: 14px 16px; border: 1px solid #ddd; border-radius: 10px; font-size: 1rem; font-family: inherit; transition: 0.2s; box-sizing: border-box; }
.form-group input:focus, .form-group textarea:focus { border-color: #007bff; outline: none; box-shadow: 0 0 0 3px rgba(0,123,255,0.15); }
.title-input { font-size: 1.2rem !important; font-weight: 600; }
.form-group textarea { resize: vertical; min-height: 250px; line-height: 1.6; }

/* Location */
.location-section { margin-bottom: 25px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 16px 20px; }
.location-label-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 10px; }
.location-label-row label { font-weight: 600; color: #333; margin: 0; }
.optional { color: #9ca3af; font-weight: 400; font-size: 0.85rem; }
.location-actions { display: flex; gap: 8px; align-items: center; }
.btn-toggle-map { background: white; border: 1px solid #3b82f6; color: #3b82f6; padding: 7px 14px; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: 0.2s; font-family: inherit; }
.btn-toggle-map:hover { background: #eff6ff; }
.btn-locate-me { background: #f0fdf4; border: 1px solid #86efac; color: #16a34a; padding: 7px 12px; border-radius: 8px; font-size: 0.8rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 5px; font-family: inherit; }
.btn-locate-me:hover { background: #dcfce7; }
.location-selected { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 8px 12px; margin-bottom: 10px; }
.location-name { font-weight: 600; color: #15803d; font-size: 0.9rem; }
.location-coords { color: #6b7280; font-size: 0.8rem; }
.btn-clear-loc { margin-left: auto; background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.8rem; font-weight: 600; padding: 2px 6px; border-radius: 4px; }
.btn-clear-loc:hover { background: #fee2e2; }
.location-hint { color: #9ca3af; font-size: 0.85rem; margin: 4px 0 0; }
.map-picker-wrap { margin-top: 12px; }
.map-search-wrap { position: relative; margin-bottom: 10px; }
.map-search-box { display: flex; align-items: center; gap: 8px; background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; }
.map-search-input { flex: 1; border: none; outline: none; font-size: 0.9rem; color: #374151; font-family: inherit; background: transparent; }
.map-search-input::placeholder { color: #9ca3af; }
.map-search-btn { background: #3b82f6; color: white; border: none; padding: 6px 14px; border-radius: 7px; font-size: 0.85rem; font-weight: 600; cursor: pointer; font-family: inherit; white-space: nowrap; transition: 0.2s; }
.map-search-btn:hover:not(:disabled) { background: #2563eb; }
.map-search-btn:disabled { background: #93c5fd; cursor: not-allowed; }
.search-results { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: white; border: 1px solid #e2e8f0; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); z-index: 1000; overflow: hidden; }
.search-result-item { width: 100%; background: none; border: none; padding: 10px 14px; text-align: left; cursor: pointer; display: flex; align-items: flex-start; gap: 8px; font-size: 0.85rem; color: #374151; font-family: inherit; line-height: 1.4; border-bottom: 1px solid #f3f4f6; transition: background 0.15s; }
.search-result-item:last-child { border-bottom: none; }
.search-result-item:hover { background: #f0f9ff; }
.no-result { color: #9ca3af; font-size: 0.82rem; margin: 4px 0 8px; text-align: center; }
.location-map { width: 100%; height: 320px; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; }
.map-hint { text-align: center; color: #6b7280; font-size: 0.82rem; margin: 8px 0 0; }
.map-expand-enter-active, .map-expand-leave-active { transition: opacity 0.25s, transform 0.25s; }
.map-expand-enter-from, .map-expand-leave-to { opacity: 0; transform: translateY(-8px); }

/* Photos */
.photo-upload-section { margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px dashed #cbd5e1; }
.photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 15px; margin-bottom: 20px; }
.photo-preview { position: relative; width: 100%; aspect-ratio: 1; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.1); border: 1px solid #eee; }
.photo-preview img { width: 100%; height: 100%; object-fit: cover; }
.btn-remove { position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.6); color: white; border: none; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; display: flex; justify-content: center; align-items: center; font-size: 0.9rem; transition: 0.2s; }
.btn-remove:hover { background: #dc2626; }
.btn-insert { position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); background: rgba(0,123,255,0.9); color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; font-weight: 500; cursor: pointer; white-space: nowrap; transition: 0.2s; }
.btn-insert:hover { background: #0056b3; transform: translateX(-50%) translateY(-2px); }
.btn-upload { background: white; border: 1px solid #007bff; color: #007bff; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.btn-upload:hover { background: #eff6ff; }
.form-actions { display: flex; justify-content: flex-end; gap: 15px; border-top: 1px solid #eee; padding-top: 25px; margin-top: 10px; }
.btn-cancel { background: #f1f5f9; color: #475569; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; cursor: pointer; }
.btn-cancel:hover { background: #e2e8f0; }
.btn-submit { background: #007bff; color: white; border: none; padding: 12px 30px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: 0.3s; font-size: 1.05rem; }
.btn-submit:hover:not(:disabled) { background: #0056b3; transform: translateY(-2px); }
.btn-submit:disabled { background: #93c5fd; cursor: not-allowed; }
.alert.error { background-color: #fef2f2; color: #dc2626; padding: 15px; border-radius: 10px; border: 1px solid #fee2e2; margin-bottom: 25px; text-align: center; }
@media (max-width: 640px) {
  .write-container { padding: 20px; }
  .form-actions { flex-direction: column; }
  .btn-submit, .btn-cancel { width: 100%; }
  .location-label-row { flex-direction: column; align-items: flex-start; }
  .location-map { height: 260px; }
}
</style>
