<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { createTrip } from '../api/tripApi'
import RichTextEditor from '../components/RichTextEditor.vue'

const router = useRouter()
const currentUser = ref<any>(null)
const isLoading = ref(false)
const errorMessage = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)
const editorRef = ref<any>(null)
const isDragging = ref(false)
const draftSaved = ref(false)
const hasDraft = ref(false)

const DRAFT_KEY = 'travelbetter_draft'
const showPreview = ref(false)

// format description สำหรับ preview
function formatForPreview(desc: string) {
  if (!desc) return ''
  const isHtml = /<[a-z][\s\S]*>/i.test(desc)
  if (!isHtml) return desc.replace(/\n/g, '<br>')
  return desc.replace(/\[IMAGE:(\d+)\]/g, (_: string, n: string) => {
    const url = form.value.photos[parseInt(n)]
    return url ? `<div style="margin:16px 0;text-align:center"><img src="${url}" style="max-width:100%;border-radius:12px;max-height:500px;object-fit:contain" /></div>` : ''
  })
}

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
    return
  }

  // เช็คว่ามี draft ค้างอยู่ไหม
  const saved = localStorage.getItem(DRAFT_KEY)
  if (saved) {
    hasDraft.value = true
  }
})

// Auto-save draft ทุก 30 วินาที เมื่อมีการแก้ไข
let autoSaveTimer: any = null
watch(form, () => {
  clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => saveDraft(false), 30000)
}, { deep: true })

function saveDraft(notify = true) {
  const draft = {
    title: form.value.title,
    description: form.value.description,
    tagsInput: form.value.tagsInput,
    photos: form.value.photos,
    latitude: form.value.latitude,
    longitude: form.value.longitude,
    locationName: form.value.locationName,
    savedAt: new Date().toISOString()
  }
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  if (notify) {
    draftSaved.value = true
    setTimeout(() => { draftSaved.value = false }, 2000)
  }
}

function loadDraft() {
  const saved = localStorage.getItem(DRAFT_KEY)
  if (!saved) return
  const draft = JSON.parse(saved)
  form.value.title = draft.title || ''
  form.value.description = draft.description || ''
  form.value.tagsInput = draft.tagsInput || ''
  form.value.photos = draft.photos || []
  form.value.latitude = draft.latitude || null
  form.value.longitude = draft.longitude || null
  form.value.locationName = draft.locationName || ''
  hasDraft.value = false
}

function deleteDraft() {
  localStorage.removeItem(DRAFT_KEY)
  hasDraft.value = false
}

function formatDraftTime() {
  const saved = localStorage.getItem(DRAFT_KEY)
  if (!saved) return ''
  const draft = JSON.parse(saved)
  if (!draft.savedAt) return ''
  const date = new Date(draft.savedAt)
  return date.toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

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

function processFiles(files: FileList | File[]) {
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) { alert(`${file.name} ไม่ใช่ไฟล์รูปภาพ`); return }
    if (file.size > 3 * 1024 * 1024) { alert(`รูปภาพ ${file.name} มีขนาดใหญ่เกิน 3MB`); return }
    const reader = new FileReader()
    reader.onload = (e) => { form.value.photos.push(e.target?.result as string) }
    reader.readAsDataURL(file)
  })
}

function handleFilesUpload(event: Event) {
  const files = (event.target as HTMLInputElement).files
  if (!files) return
  processFiles(files)
  // reset input เพื่อให้เลือกไฟล์เดิมซ้ำได้
  ;(event.target as HTMLInputElement).value = ''
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  const files = event.dataTransfer?.files
  if (files) processFiles(files)
}

function insertImageToText(index: number) {
  if (editorRef.value) {
    editorRef.value.insertImage(index)
  }
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
    deleteDraft() // ลบ draft หลัง publish สำเร็จ
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

      <!-- ✅ Draft Banner — มี draft ค้างอยู่ -->
      <div v-if="hasDraft" class="draft-banner">
        <div class="draft-banner-left">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <div>
            <span class="draft-title">มีบทความที่บันทึกค้างไว้</span>
            <span class="draft-time">บันทึกเมื่อ {{ formatDraftTime() }}</span>
          </div>
        </div>
        <div class="draft-actions">
          <button type="button" @click="loadDraft" class="btn-load-draft">โหลด draft</button>
          <button type="button" @click="deleteDraft" class="btn-discard-draft">ลบทิ้ง</button>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="trip-form">

        <div class="form-group">
          <label>หัวข้อทริป</label>
          <input type="text" v-model="form.title" placeholder="เช่น ตะลุยหิมะฮอกไกโด 5 วัน 4 คืน..." required :disabled="isLoading" class="title-input" />
        </div>

        <div class="form-group">
          <label>เนื้อหาบทความ / รีวิว</label>
          <RichTextEditor
            ref="editorRef"
            v-model="form.description"
            :disabled="isLoading"
            placeholder="เล่าประสบการณ์การเดินทางของคุณ... ใส่หัวข้อ, ตัวหนา, รายการ หรือแทรกรูปภาพได้เลย!"
          />
          <p class="editor-hint">💡 อัปโหลดรูปด้านล่าง แล้วกด "แทรกรูปลงในเนื้อหา" เพื่อวางรูปในตำแหน่งที่ต้องการ</p>
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

        <!-- Photos — Drag & Drop -->
        <div class="photo-upload-section">
          <label>รูปภาพประกอบบทความ</label>

          <!-- Drop Zone -->
          <div
            class="drop-zone"
            :class="{ dragging: isDragging, 'has-photos': form.photos.length > 0 }"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
            @click="triggerFileInput"
          >
            <input type="file" ref="fileInputRef" @change="handleFilesUpload" accept="image/*" multiple style="display:none;" />

            <div v-if="form.photos.length === 0" class="drop-placeholder">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.4">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <p class="drop-text">ลากรูปมาวางที่นี่ หรือ <span class="drop-link">คลิกเพื่อเลือก</span></p>
              <p class="drop-hint">รองรับ JPG, PNG — สูงสุด 3MB ต่อรูป</p>
            </div>

            <div v-else class="photo-grid" @click.stop>
              <div v-for="(photo, index) in form.photos" :key="index" class="photo-preview">
                <img :src="photo" alt="preview" />
                <div class="photo-overlay">
                  <button type="button" @click.stop="insertImageToText(index)" class="btn-insert-img" title="แทรกลงในเนื้อหา">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                    แทรก
                  </button>
                  <button type="button" @click.stop="removePhoto(index)" class="btn-remove-img" title="ลบรูป">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
                <div class="photo-index">{{ index + 1 }}</div>
              </div>

              <!-- Add more button inside grid -->
              <div class="photo-add-more" @click="triggerFileInput">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                <span>เพิ่มรูป</span>
              </div>
            </div>
          </div>

          <p v-if="form.photos.length > 0" class="photo-count-hint">
            {{ form.photos.length }} รูป — กด "แทรก" บนรูปเพื่อวางลงในเนื้อหา
          </p>
        </div>

        <div class="form-actions">
          <button type="button" @click="router.back()" class="btn-cancel" :disabled="isLoading">ยกเลิก</button>
          <button type="button" @click="saveDraft()" class="btn-save-draft" :disabled="isLoading">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            {{ draftSaved ? '✓ บันทึกแล้ว' : 'บันทึก Draft' }}
          </button>
          <button type="button" @click="showPreview = true" class="btn-preview" :disabled="isLoading || !form.title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            ดูตัวอย่าง
          </button>
          <button type="submit" class="btn-submit" :disabled="isLoading">
            {{ isLoading ? 'กำลังเผยแพร่...' : 'เผยแพร่ทริป' }}
          </button>
        </div>

      </form>
    </div>
  </div>

  <!-- ✅ Preview Modal -->
  <teleport to="body">
    <div v-if="showPreview" class="preview-overlay" @click.self="showPreview = false">
      <div class="preview-modal">
        <div class="preview-toolbar">
          <span class="preview-label">👁 ตัวอย่างทริป</span>
          <div class="preview-actions">
            <button @click="showPreview = false; handleSubmit()" class="btn-publish-now" :disabled="isLoading">
              {{ isLoading ? 'กำลังเผยแพร่...' : '🚀 เผยแพร่เลย' }}
            </button>
            <button @click="showPreview = false" class="btn-close-preview">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="preview-content">
          <!-- Hero -->
          <div class="preview-hero" :style="form.photos.length ? `background-image:url(${form.photos[0]})` : ''">
            <div class="preview-hero-overlay"></div>
            <div class="preview-hero-content">
              <div class="preview-tags" v-if="form.tagsInput">
                <span v-for="tag in form.tagsInput.split(',').map(t=>t.trim()).filter(t=>t)" :key="tag" class="preview-tag">
                  {{ tag }}
                </span>
              </div>
              <h1 class="preview-title">{{ form.title || 'ยังไม่มีหัวข้อ' }}</h1>
              <div class="preview-meta">
                <div class="preview-author">
                  <div class="preview-avatar">{{ currentUser?.username?.charAt(0).toUpperCase() }}</div>
                  <span>{{ currentUser?.profile?.nickname || currentUser?.username }}</span>
                </div>
                <span>{{ new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) }}</span>
              </div>
            </div>
          </div>

          <!-- Article body -->
          <div class="preview-body">
            <div v-if="form.description" class="preview-description" v-html="formatForPreview(form.description)"></div>
            <div v-else class="preview-empty-desc">ยังไม่มีเนื้อหา...</div>

            <!-- Photos gallery -->
            <div v-if="form.photos.length > 1" class="preview-gallery">
              <h3>รูปภาพทั้งหมด</h3>
              <div class="preview-gallery-grid">
                <img v-for="(photo, i) in form.photos" :key="i" :src="photo" :alt="`รูปที่ ${i+1}`" />
              </div>
            </div>

            <!-- Location -->
            <div v-if="form.locationName" class="preview-location">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#ef4444" stroke="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              {{ form.locationName }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.create-trip-page { background-color: var(--bg-secondary); min-height: calc(100vh - 72px); padding: 40px 20px; }
.write-container { background: var(--bg-card); max-width: 800px; margin: 0 auto; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); border: 1px solid var(--border-light); }
.header { margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
.header h2 { font-size: 2rem; color: var(--text-primary); margin: 0 0 5px 0; }
.header p { color: var(--text-secondary); margin: 0; }
.form-group { margin-bottom: 25px; }
.form-group label { display: block; font-weight: 600; margin-bottom: 10px; color: var(--text-primary); }
.form-group input, .form-group textarea { width: 100%; padding: 14px 16px; border: 1px solid var(--border-color); border-radius: 10px; font-size: 1rem; font-family: inherit; transition: 0.2s; box-sizing: border-box; }
.form-group input:focus, .form-group textarea:focus { border-color: #007bff; outline: none; box-shadow: 0 0 0 3px rgba(0,123,255,0.15); }
.title-input { font-size: 1.2rem !important; font-weight: 600; }
.form-group textarea { resize: vertical; min-height: 250px; line-height: 1.6; }
.editor-hint { font-size: 0.82rem; color: var(--text-muted); margin-top: 8px; }

/* Photos — Drag & Drop */
.photo-upload-section { margin-bottom: 25px; }
.photo-upload-section > label { display: block; font-weight: 600; margin-bottom: 10px; color: var(--text-primary); }

.drop-zone {
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  background: var(--bg-secondary);
  transition: all 0.2s;
  cursor: pointer;
  overflow: hidden;
}
.drop-zone:hover, .drop-zone.dragging {
  border-color: var(--accent);
  background: var(--accent-light);
}
.drop-zone.dragging { transform: scale(1.01); }
.drop-zone.has-photos { cursor: default; border-style: solid; border-color: var(--border-color); }

.drop-placeholder {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 10px;
  padding: 48px 20px; text-align: center;
  color: var(--text-muted);
}
.drop-text { font-size: 0.95rem; font-weight: 500; color: var(--text-secondary); margin: 0; }
.drop-link { color: var(--accent); font-weight: 600; }
.drop-hint { font-size: 0.8rem; margin: 0; }

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
  padding: 14px;
}
.photo-preview {
  position: relative; border-radius: 10px; overflow: hidden;
  aspect-ratio: 1; background: var(--bg-tertiary);
}
.photo-preview img { width: 100%; height: 100%; object-fit: cover; display: block; }
.photo-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center; gap: 8px;
  opacity: 0; transition: opacity 0.2s;
}
.photo-preview:hover .photo-overlay { opacity: 1; }
.btn-insert-img {
  display: flex; align-items: center; gap: 4px;
  background: var(--accent); color: white; border: none;
  padding: 6px 10px; border-radius: 8px; font-size: 0.78rem;
  font-weight: 600; cursor: pointer; font-family: inherit;
  transition: 0.2s;
}
.btn-insert-img:hover { background: var(--accent-hover); }
.btn-remove-img {
  background: #ef4444; color: white; border: none;
  width: 28px; height: 28px; border-radius: 50%; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: 0.2s;
}
.btn-remove-img:hover { background: #dc2626; }
.photo-index {
  position: absolute; top: 6px; left: 6px;
  background: rgba(0,0,0,0.55); color: white;
  font-size: 0.72rem; font-weight: 700;
  width: 22px; height: 22px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}

.photo-add-more {
  aspect-ratio: 1; border-radius: 10px;
  border: 2px dashed var(--border-color);
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 6px; cursor: pointer;
  color: var(--text-muted); font-size: 0.8rem;
  transition: 0.2s;
}
.photo-add-more:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-light); }

.photo-count-hint { font-size: 0.82rem; color: var(--text-muted); margin-top: 8px; }
.location-section { margin-bottom: 25px; background: var(--bg-secondary); border-radius: 12px; border: 1px solid var(--border-color); padding: 16px 20px; }
.location-label-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 10px; }
.location-label-row label { font-weight: 600; color: var(--text-primary); margin: 0; }
.optional { color: var(--text-muted); font-weight: 400; font-size: 0.85rem; }
.location-actions { display: flex; gap: 8px; align-items: center; }
.btn-toggle-map { background: var(--bg-card); border: 1px solid #3b82f6; color: #3b82f6; padding: 7px 14px; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: 0.2s; font-family: inherit; }
.btn-toggle-map:hover { background: var(--accent-light); }
.btn-locate-me { background: var(--bg-tertiary); border: 1px solid #86efac; color: #16a34a; padding: 7px 12px; border-radius: 8px; font-size: 0.8rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 5px; font-family: inherit; }
.btn-locate-me:hover { background: #dcfce7; }
.location-selected { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; background: var(--bg-tertiary); border: 1px solid #bbf7d0; border-radius: 8px; padding: 8px 12px; margin-bottom: 10px; }
.location-name { font-weight: 600; color: #15803d; font-size: 0.9rem; }
.location-coords { color: var(--text-secondary); font-size: 0.8rem; }
.btn-clear-loc { margin-left: auto; background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.8rem; font-weight: 600; padding: 2px 6px; border-radius: 4px; }
.btn-clear-loc:hover { background: #fee2e2; }
.location-hint { color: var(--text-muted); font-size: 0.85rem; margin: 4px 0 0; }
.map-picker-wrap { margin-top: 12px; }
.map-search-wrap { position: relative; margin-bottom: 10px; }
.map-search-box { display: flex; align-items: center; gap: 8px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 10px; padding: 10px 14px; }
.map-search-input { flex: 1; border: none; outline: none; font-size: 0.9rem; color: var(--text-primary); font-family: inherit; background: transparent; }
.map-search-input::placeholder { color: var(--text-muted); }
.map-search-btn { background: #3b82f6; color: white; border: none; padding: 6px 14px; border-radius: 7px; font-size: 0.85rem; font-weight: 600; cursor: pointer; font-family: inherit; white-space: nowrap; transition: 0.2s; }
.map-search-btn:hover:not(:disabled) { background: #2563eb; }
.map-search-btn:disabled { background: #93c5fd; cursor: not-allowed; }
.search-results { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); z-index: 1000; overflow: hidden; }
.search-result-item { width: 100%; background: none; border: none; padding: 10px 14px; text-align: left; cursor: pointer; display: flex; align-items: flex-start; gap: 8px; font-size: 0.85rem; color: var(--text-primary); font-family: inherit; line-height: 1.4; border-bottom: 1px solid #f3f4f6; transition: background 0.15s; }
.search-result-item:last-child { border-bottom: none; }
.search-result-item:hover { background: var(--accent-light); }
.no-result { color: var(--text-muted); font-size: 0.82rem; margin: 4px 0 8px; text-align: center; }
.location-map { width: 100%; height: 320px; border-radius: 10px; overflow: hidden; border: 1px solid var(--border-color); }
.map-hint { text-align: center; color: var(--text-secondary); font-size: 0.82rem; margin: 8px 0 0; }
.map-expand-enter-active, .map-expand-leave-active { transition: opacity 0.25s, transform 0.25s; }
.map-expand-enter-from, .map-expand-leave-to { opacity: 0; transform: translateY(-8px); }

/* Photos */
.photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 15px; margin-bottom: 20px; }
.photo-preview { position: relative; width: 100%; aspect-ratio: 1; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.1); border: 1px solid #eee; }
.form-actions { display: flex; justify-content: flex-end; gap: 15px; border-top: 1px solid #eee; padding-top: 25px; margin-top: 10px; align-items: center; }
.btn-cancel { background: var(--bg-tertiary); color: var(--text-secondary); border: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; cursor: pointer; font-family: inherit; }
.btn-save-draft {
  display: flex; align-items: center; gap: 6px;
  background: none; border: 1.5px solid var(--border-color);
  color: var(--text-secondary); padding: 11px 20px;
  border-radius: 10px; font-weight: 600; cursor: pointer;
  font-family: inherit; transition: 0.2s; font-size: 0.9rem;
}
.btn-save-draft:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
.btn-submit { background: #007bff; color: white; border: none; padding: 12px 30px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: 0.3s; font-size: 1.05rem; font-family: inherit; }
.btn-submit:hover:not(:disabled) { background: #0056b3; transform: translateY(-2px); }
.btn-submit:disabled { background: #93c5fd; cursor: not-allowed; }

/* Draft Banner */
.draft-banner {
  display: flex; align-items: center; justify-content: space-between;
  background: var(--accent-light); border: 1px solid var(--accent);
  border-radius: 10px; padding: 12px 16px; margin-bottom: 20px;
  flex-wrap: wrap; gap: 10px;
}
.draft-banner-left { display: flex; align-items: center; gap: 10px; color: var(--accent-text); }
.draft-title { font-weight: 600; font-size: 0.9rem; display: block; }
.draft-time { font-size: 0.78rem; color: var(--text-muted); display: block; }
.draft-actions { display: flex; gap: 8px; }
.btn-load-draft {
  background: var(--accent); color: white; border: none;
  padding: 7px 14px; border-radius: 8px; font-size: 0.85rem;
  font-weight: 600; cursor: pointer; font-family: inherit; transition: 0.2s;
}
.btn-load-draft:hover { background: var(--accent-hover); }
.btn-discard-draft {
  background: none; border: 1px solid var(--border-color);
  color: var(--text-muted); padding: 7px 14px; border-radius: 8px;
  font-size: 0.85rem; font-weight: 600; cursor: pointer; font-family: inherit; transition: 0.2s;
}
.btn-discard-draft:hover { border-color: #ef4444; color: #ef4444; }
.alert.error { background-color: #fef2f2; color: #dc2626; padding: 15px; border-radius: 10px; border: 1px solid #fee2e2; margin-bottom: 25px; text-align: center; }
.btn-preview {
  display: flex; align-items: center; gap: 6px;
  background: none; border: 1.5px solid #22c55e;
  color: #16a34a; padding: 11px 20px;
  border-radius: 10px; font-weight: 600; cursor: pointer;
  font-family: inherit; transition: 0.2s; font-size: 0.9rem;
}
.btn-preview:hover:not(:disabled) { background: #f0fdf4; }
.btn-preview:disabled { opacity: 0.5; cursor: not-allowed; }

/* Preview Modal */
.preview-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  z-index: 9999; display: flex; align-items: center; justify-content: center;
  padding: 20px;
  backdrop-filter: blur(4px);
}
.preview-modal {
  background: var(--bg-card); border-radius: 16px;
  width: 100%; max-width: 820px; max-height: 90vh;
  display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.preview-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px; border-bottom: 1px solid var(--border-color);
  background: var(--bg-tertiary); flex-shrink: 0;
}
.preview-label { font-weight: 700; color: var(--text-primary); font-size: 0.95rem; }
.preview-actions { display: flex; align-items: center; gap: 10px; }
.btn-publish-now {
  background: #007bff; color: white; border: none;
  padding: 8px 18px; border-radius: 8px; font-weight: 600;
  cursor: pointer; font-family: inherit; transition: 0.2s; font-size: 0.88rem;
}
.btn-publish-now:hover { background: #0056b3; }
.btn-close-preview {
  background: none; border: none; cursor: pointer;
  color: var(--text-muted); display: flex; align-items: center;
  padding: 4px; border-radius: 6px; transition: 0.2s;
}
.btn-close-preview:hover { background: var(--bg-secondary); color: var(--text-primary); }

.preview-content { overflow-y: auto; flex: 1; }

.preview-hero {
  position: relative; height: 280px;
  background: linear-gradient(135deg, #1e3a5f, #0f172a);
  background-size: cover; background-position: center;
}
.preview-hero-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.7)); }
.preview-hero-content { position: relative; z-index: 1; padding: 28px; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; }
.preview-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
.preview-tag { background: rgba(255,255,255,0.2); color: white; font-size: 0.78rem; padding: 3px 10px; border-radius: 12px; }
.preview-title { color: white; font-size: 1.8rem; font-weight: 800; margin: 0 0 12px; line-height: 1.3; }
.preview-meta { display: flex; align-items: center; gap: 16px; color: rgba(255,255,255,0.85); font-size: 0.85rem; }
.preview-author { display: flex; align-items: center; gap: 8px; }
.preview-avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--accent); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; }

.preview-body { padding: 28px; }
.preview-description { font-size: 1.05rem; line-height: 1.85; color: var(--text-primary); }
.preview-description h2 { font-size: 1.4rem; font-weight: 700; margin: 20px 0 10px; }
.preview-description h3 { font-size: 1.2rem; font-weight: 600; margin: 16px 0 8px; }
.preview-description p { margin-bottom: 10px; }
.preview-description ul, .preview-description ol { padding-left: 20px; margin-bottom: 12px; }
.preview-description blockquote { border-left: 4px solid var(--accent); background: var(--accent-light); padding: 10px 16px; margin: 12px 0; border-radius: 0 8px 8px 0; }
.preview-empty-desc { color: var(--text-muted); font-style: italic; padding: 20px 0; }

.preview-gallery { margin-top: 28px; }
.preview-gallery h3 { font-size: 1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 12px; }
.preview-gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px; }
.preview-gallery-grid img { width: 100%; height: 120px; object-fit: cover; border-radius: 8px; }

.preview-location { display: flex; align-items: center; gap: 6px; margin-top: 20px; font-size: 0.9rem; color: var(--text-secondary); }

@media (max-width: 640px) {
  .write-container { padding: 20px; }
  .form-actions { flex-direction: column; }
  .btn-submit, .btn-cancel, .btn-preview, .btn-save-draft { width: 100%; justify-content: center; }
  .location-label-row { flex-direction: column; align-items: flex-start; }
  .location-map { height: 260px; }
  .preview-overlay { padding: 0; }
  .preview-modal { border-radius: 0; max-height: 100vh; }
  .preview-title { font-size: 1.3rem; }
}
</style>
