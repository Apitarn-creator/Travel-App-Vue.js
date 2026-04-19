<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getTripById, getCommentsByTripId, addComment, toggleLike } from '../api/tripApi'
import { getUserById, toggleBookmark } from '../api/userApi'
import SkeletonTripDetail from '../components/SkeletonTripDetail.vue'

const route = useRoute()
const tripId = Number(route.params.id)

const trip = ref<any>(null)
const author = ref<any>(null)
const isLoading = ref(true)
const errorMessage = ref('')
const currentUser = ref<any>(null)
const comments = ref<any[]>([])
const newComment = ref('')
const isSubmitting = ref(false)

// Like state
const likeCount = ref(0)
const isLiked = ref(false)
const isLiking = ref(false)

// Bookmark state
const isBookmarked = ref(false)
const isBookmarking = ref(false)

// Map
let detailMap: any = null

onMounted(async () => {
  const userString = localStorage.getItem('user')
  if (userString) currentUser.value = JSON.parse(userString)

  try {
    isLoading.value = true
    const tripData = await getTripById(tripId)
    trip.value = tripData
    likeCount.value = tripData.likes ?? 0

    // เช็คว่า user ปัจจุบันกด like ไว้แล้วหรือยัง
    if (currentUser.value && tripData.likedByStr) {
      isLiked.value = tripData.likedByStr.split(',').includes(String(currentUser.value.id))
    }

    // เช็ค bookmark จาก localStorage
    if (currentUser.value?.bookmarkedTrips) {
      isBookmarked.value = currentUser.value.bookmarkedTrips.split(',').includes(String(tripId))
    }

    if (tripData.authorId) {
      author.value = await getUserById(tripData.authorId)
    }
    comments.value = await getCommentsByTripId(tripId)

  } catch (error: any) {
    errorMessage.value = 'ไม่พบเนื้อหาที่คุณค้นหา หรือลิงก์อาจไม่ถูกต้อง'
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => { detailMap?.remove() })

// ✅ Bookmark
async function handleBookmark() {
  if (!currentUser.value) { window.location.href = '/login'; return }
  if (isBookmarking.value) return
  isBookmarking.value = true
  try {
    const res = await toggleBookmark(tripId)
    isBookmarked.value = res.bookmarked
    // อัปเดต bookmarkedTrips ใน localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    user.bookmarkedTrips = res.bookmarkedTrips
    localStorage.setItem('user', JSON.stringify(user))
    currentUser.value = user
  } catch { /* silent */ } finally {
    isBookmarking.value = false
  }
}

// ✅ Like / Unlike
async function handleLike() {
  if (!currentUser.value) { window.location.href = '/login'; return }
  if (isLiking.value) return
  isLiking.value = true
  try {
    const res = await toggleLike(tripId)
    likeCount.value = res.likes
    isLiked.value = res.liked
  } catch { /* silent */ } finally {
    isLiking.value = false
  }
}

// ✅ [ฟีเจอร์ 3] Mini map
async function initMiniMap() {
  if (!trip.value?.latitude || !trip.value?.longitude) return

  const L = (window as any).L
  if (!L) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
    await new Promise<void>(resolve => {
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = () => resolve()
      document.head.appendChild(script)
    })
  }

  await new Promise(r => setTimeout(r, 100))
  const Lx = (window as any).L
  if (!Lx || !document.getElementById('detail-map')) return

  detailMap = Lx.map('detail-map', {
    center: [trip.value.latitude, trip.value.longitude],
    zoom: 12,
    zoomControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
  })

  Lx.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors', maxZoom: 19,
  }).addTo(detailMap)

  const iconHtml = `<div style="background:#e53935;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);width:24px;height:24px;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`
  const icon = Lx.divIcon({ html: iconHtml, iconSize: [24, 24], iconAnchor: [12, 24], className: '' })
  Lx.marker([trip.value.latitude, trip.value.longitude], { icon }).addTo(detailMap)
}

// เรียก initMiniMap หลัง trip โหลดเสร็จ
const mapReady = ref(false)
const stopWatch = ref<any>(null)
stopWatch.value = watch(() => trip.value, async (val) => {
  if (val?.latitude) {
    mapReady.value = true
    await new Promise(r => setTimeout(r, 200))
    initMiniMap()
    stopWatch.value?.()
  }
})

// Comment
async function submitComment() {
  if (!newComment.value.trim() || !currentUser.value) return
  isSubmitting.value = true
  try {
    const added = await addComment(tripId, newComment.value)
    comments.value.unshift(added)
    newComment.value = ''
  } catch { alert('เกิดข้อผิดพลาดในการส่งความเห็น') }
  finally { isSubmitting.value = false }
}

function formatCommentDate(d: string) {
  if (!d) return 'พึ่งส่ง'
  return new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const coverPhoto = computed(() => trip.value?.photos?.[0] || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200')
const galleryPhotos = computed(() => trip.value?.photos?.slice(1) || [])
const formattedDate = computed(() => {
  if (!trip.value?.createdAt) return ''
  return new Date(trip.value.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
})
const formattedDescription = computed(() => {
  if (!trip.value?.description) return ''
  let html = trip.value.description.replace(/\n/g, '<br>')
  html = html.replace(/\[IMAGE:(\d+)\]/g, (_: string, n: string) => {
    const url = trip.value.photos[parseInt(n)]
    return url ? `<div class="inline-image-wrapper"><img src="${url}" class="inline-image" /></div>` : ''
  })
  return html
})
</script>

<template>
  <div class="travel-detail-page">
    <SkeletonTripDetail v-if="isLoading" />
    <div v-else-if="errorMessage" class="error-state">
      <h2>{{ errorMessage }}</h2>
      <router-link to="/" class="btn-back">กลับหน้าแรก</router-link>
    </div>

    <div v-else-if="trip">

      <!-- Hero -->
      <div class="hero-section" :style="{ backgroundImage: `url(${coverPhoto})` }">
        <div class="hero-overlay"></div>
        <div class="container hero-content">
          <div class="tags" v-if="trip.tags?.length">
            <span v-for="tag in trip.tags" :key="tag" class="tag">#{{ tag }}</span>
          </div>
          <h1 class="title">{{ trip.title }}</h1>
          <div class="hero-bottom-row">
            <router-link :to="`/@${author?.username}`" class="author-link" v-if="author">
              <img v-if="author.avatarUrl" :src="author.avatarUrl" class="author-avatar" />
              <div v-else class="author-avatar placeholder">{{ author.username.charAt(0).toUpperCase() }}</div>
              <div class="author-info">
                <span class="author-name">{{ author.profile?.nickname || author.username }}</span>
                <span class="publish-date">{{ formattedDate }}</span>
              </div>
            </router-link>
            <div v-else class="author-info"><span class="publish-date">{{ formattedDate }}</span></div>

            <!-- ✅ Like + Bookmark buttons -->
            <div class="hero-actions">
              <button class="like-btn" :class="{ liked: isLiked, loading: isLiking }" @click="handleLike" :disabled="isLiking">
                <svg width="20" height="20" viewBox="0 0 24 24" :fill="isLiked ? '#ef4444' : 'none'" stroke="currentColor" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span class="like-count">{{ likeCount }}</span>
                <span class="like-label">{{ isLiked ? 'ถูกใจแล้ว' : 'ถูกใจ' }}</span>
              </button>

              <button class="bookmark-btn" :class="{ bookmarked: isBookmarked, loading: isBookmarking }" @click="handleBookmark" :disabled="isBookmarking">
                <svg width="20" height="20" viewBox="0 0 24 24" :fill="isBookmarked ? '#f59e0b' : 'none'" stroke="currentColor" stroke-width="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                <span class="bookmark-label">{{ isBookmarked ? 'บันทึกแล้ว' : 'บันทึก' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Main layout: article + sidebar -->
      <div class="container page-layout">

        <!-- Article -->
        <div class="article-col">
          <div class="description-html" v-html="formattedDescription"></div>

          <div class="gallery-section" v-if="galleryPhotos.length > 0">
            <h3 class="section-title">รูปภาพเพิ่มเติม 📸</h3>
            <div class="gallery-grid">
              <img v-for="(photo, i) in galleryPhotos" :key="i" :src="photo" class="gallery-img" />
            </div>
          </div>

          <div class="comments-section">
            <h3 class="section-title">ความคิดเห็น ({{ comments.length }})</h3>
            <div v-if="currentUser" class="comment-input-box">
              <div class="avatar-small">
                <img v-if="currentUser.avatarUrl" :src="currentUser.avatarUrl" />
                <span v-else>{{ currentUser.username.charAt(0).toUpperCase() }}</span>
              </div>
              <div class="input-wrapper">
                <textarea v-model="newComment" placeholder="แสดงความคิดเห็นของคุณ..." rows="2" :disabled="isSubmitting"></textarea>
                <button @click="submitComment" :disabled="!newComment.trim() || isSubmitting" class="btn-comment">
                  {{ isSubmitting ? 'กำลังส่ง...' : 'ส่งความเห็น' }}
                </button>
              </div>
            </div>
            <div v-else class="login-prompt">
              กรุณา <router-link to="/login">เข้าสู่ระบบ</router-link> เพื่อแสดงความคิดเห็น
            </div>
            <div class="comments-list">
              <div v-for="comment in comments" :key="comment.id" class="comment-item">
                <div class="avatar-small">
                  <img v-if="comment.user?.avatarUrl" :src="comment.user.avatarUrl" />
                  <span v-else>{{ comment.user?.username?.charAt(0).toUpperCase() || '?' }}</span>
                </div>
                <div class="comment-content">
                  <div class="comment-header">
                    <span class="comment-author">{{ comment.user?.profile?.nickname || comment.user?.username }}</span>
                    <span class="comment-date">{{ formatCommentDate(comment.createdAt) }}</span>
                  </div>
                  <p class="comment-text">{{ comment.content }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ✅ [ฟีเจอร์ 3] Sidebar -->
        <aside class="sidebar">

          <!-- Mini Map -->
          <div class="sidebar-card" v-if="trip.latitude && trip.longitude">
            <h4 class="sidebar-card-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#3b82f6" stroke="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              ตำแหน่งสถานที่
            </h4>
            <div id="detail-map" class="mini-map"></div>
            <a :href="`https://www.google.com/maps?q=${trip.latitude},${trip.longitude}`" target="_blank" class="btn-open-maps">
              เปิดใน Google Maps →
            </a>
          </div>

          <!-- Trip Info card -->
          <div class="sidebar-card info-card">
            <h4 class="sidebar-card-title">ข้อมูลทริป</h4>
            <div class="info-row" v-if="trip.tags?.length">
              <span class="info-label">หมวดหมู่</span>
              <div class="tag-list">
                <span v-for="tag in trip.tags" :key="tag" class="info-tag">{{ tag }}</span>
              </div>
            </div>
            <div class="info-row">
              <span class="info-label">วันที่เผยแพร่</span>
              <span class="info-value">{{ formattedDate }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">ความคิดเห็น</span>
              <span class="info-value">{{ comments.length }} รายการ</span>
            </div>
            <div class="info-row">
              <span class="info-label">ถูกใจ</span>
              <span class="info-value">{{ likeCount }} คน</span>
            </div>
          </div>

        </aside>
      </div>

    </div>
  </div>
</template>

<style scoped>
.travel-detail-page { background: var(--bg-secondary); min-height: calc(100vh - 72px); padding-bottom: 60px; }
.loading-state, .error-state { text-align: center; padding: 100px 20px; font-size: 1.2rem; color: var(--text-secondary); }
.btn-back { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 8px; }

/* Hero */
.hero-section { position: relative; width: 100%; height: 500px; background-size: cover; background-position: center; display: flex; align-items: flex-end; }
.hero-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.72) 100%); }
.hero-content { position: relative; z-index: 1; padding-bottom: 36px; color: white; width: 100%; max-width: 1100px; margin: 0 auto; padding-left: 20px; padding-right: 20px; }
.tags { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
.tag { background: rgba(255,255,255,0.2); backdrop-filter: blur(5px); padding: 4px 12px; border-radius: 20px; font-size: 0.82rem; }
.title { font-size: 2.4rem; font-weight: 800; margin: 0 0 20px; line-height: 1.3; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
.hero-bottom-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }

/* Author */
.author-link { display: flex; align-items: center; gap: 12px; text-decoration: none; color: white; }
.author-link:hover .author-name { text-decoration: underline; }
.author-avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid white; }
.author-avatar.placeholder { background: #007bff; display: flex; justify-content: center; align-items: center; font-weight: bold; }
.author-info { display: flex; flex-direction: column; }
.author-name { font-weight: 600; font-size: 1rem; }
.publish-date { font-size: 0.82rem; opacity: 0.8; }

/* ✅ Like + Bookmark */
.hero-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

.like-btn {
  display: flex; align-items: center; gap: 8px;
  background: rgba(255,255,255,0.15); backdrop-filter: blur(8px);
  border: 1.5px solid rgba(255,255,255,0.4); color: white;
  padding: 10px 20px; border-radius: 30px; cursor: pointer;
  font-size: 0.95rem; font-weight: 600; font-family: inherit;
  transition: all 0.2s;
}
.like-btn:hover:not(:disabled) { background: rgba(255,255,255,0.25); transform: scale(1.05); }
.like-btn.liked { background: rgba(239,68,68,0.25); border-color: #ef4444; color: #fca5a5; }
.like-btn.loading { opacity: 0.7; cursor: not-allowed; }
.like-count { font-size: 1rem; font-weight: 700; }
.like-label { font-size: 0.85rem; }

.bookmark-btn {
  display: flex; align-items: center; gap: 8px;
  background: rgba(255,255,255,0.15); backdrop-filter: blur(8px);
  border: 1.5px solid rgba(255,255,255,0.4); color: white;
  padding: 10px 20px; border-radius: 30px; cursor: pointer;
  font-size: 0.95rem; font-weight: 600; font-family: inherit;
  transition: all 0.2s;
}
.bookmark-btn:hover:not(:disabled) { background: rgba(255,255,255,0.25); transform: scale(1.05); }
.bookmark-btn.bookmarked { background: rgba(245,158,11,0.25); border-color: #f59e0b; color: #fde68a; }
.bookmark-btn.loading { opacity: 0.7; cursor: not-allowed; }
.bookmark-label { font-size: 0.85rem; }

/* ✅ Page layout with sidebar */
.page-layout { max-width: 1100px; margin: 0 auto; padding: 40px 20px; display: grid; grid-template-columns: 1fr 300px; gap: 40px; align-items: start; }

/* Article */
.article-col { min-width: 0; }
.description-html { font-size: 1.15rem; line-height: 1.9; color: var(--text-primary); margin-bottom: 40px; }
:deep(.inline-image-wrapper) { margin: 20px 0; text-align: center; }
:deep(.inline-image) { max-width: 100%; max-height: 600px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); object-fit: contain; }

.section-title { font-size: 1.3rem; font-weight: 700; color: var(--text-primary); margin: 0 0 16px; }
.gallery-section { margin-top: 48px; padding-top: 28px; border-top: 1px solid var(--border-color); }
.gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
.gallery-img { width: 100%; height: 180px; object-fit: cover; border-radius: 10px; }

.comments-section { margin-top: 48px; padding-top: 28px; border-top: 1px solid var(--border-color); }
.comment-input-box { display: flex; gap: 14px; margin-bottom: 28px; }
.avatar-small { width: 38px; height: 38px; flex-shrink: 0; border-radius: 50%; background: #3b82f6; color: white; display: flex; justify-content: center; align-items: center; font-weight: bold; overflow: hidden; }
.avatar-small img { width: 100%; height: 100%; object-fit: cover; }
.input-wrapper { flex: 1; display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.input-wrapper textarea { width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 10px; font-family: inherit; resize: vertical; outline: none; box-sizing: border-box; background: var(--bg-card); color: var(--text-primary); }
.input-wrapper textarea:focus { border-color: #3b82f6; }
.btn-comment { background: #3b82f6; color: white; border: none; padding: 8px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; }
.btn-comment:disabled { background: #93c5fd; cursor: not-allowed; }
.login-prompt { background: var(--bg-secondary); padding: 14px; text-align: center; border-radius: 10px; margin-bottom: 28px; color: #555; }
.login-prompt a { color: #3b82f6; font-weight: 600; text-decoration: none; }
.comments-list { display: flex; flex-direction: column; gap: 16px; }
.comment-item { display: flex; gap: 12px; }
.comment-content { background: var(--bg-secondary); padding: 14px; border-radius: 0 12px 12px 12px; flex: 1; }
.comment-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
.comment-author { font-weight: 600; color: var(--text-primary); font-size: 0.9rem; }
.comment-date { font-size: 0.78rem; color: var(--text-muted); }
.comment-text { margin: 0; color: var(--text-secondary); line-height: 1.5; }

/* ✅ Sidebar */
.sidebar { display: flex; flex-direction: column; gap: 20px; position: sticky; top: 20px; }
.sidebar-card { background: var(--bg-card); border-radius: 14px; padding: 18px; border: 1px solid var(--border-light); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.sidebar-card-title { font-size: 0.9rem; font-weight: 700; color: var(--text-primary); margin: 0 0 12px; display: flex; align-items: center; gap: 6px; }
.mini-map { width: 100%; height: 200px; border-radius: 10px; overflow: hidden; border: 1px solid var(--border-color); }
.btn-open-maps { display: block; text-align: center; margin-top: 10px; font-size: 0.82rem; color: #3b82f6; text-decoration: none; font-weight: 600; }
.btn-open-maps:hover { text-decoration: underline; }

.info-row { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
.info-row:last-child { margin-bottom: 0; }
.info-label { font-size: 0.78rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.info-value { font-size: 0.9rem; color: var(--text-primary); font-weight: 500; }
.tag-list { display: flex; flex-wrap: wrap; gap: 4px; }
.info-tag { background: var(--accent-light); color: #3b82f6; font-size: 0.78rem; padding: 2px 8px; border-radius: 10px; font-weight: 500; }

@media (max-width: 900px) {
  .page-layout { grid-template-columns: 1fr; }
  .sidebar { position: static; }
  .hero-section { height: 420px; }
  .title { font-size: 1.8rem; }
}
</style>
