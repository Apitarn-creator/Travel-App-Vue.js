<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getTripById } from '../api/tripApi'
import { getUserById } from '../api/userApi' 
import { getCommentsByTripId, addComment } from '../api/tripApi'

const route = useRoute()
const tripId = Number(route.params.id)

// ตัวแปรสำหรับทริปและนักเขียน
const trip = ref<any>(null)
const author = ref<any>(null)
const isLoading = ref(true)
const errorMessage = ref('')

// ตัวแปรสำหรับระบบคอมเมนต์
const currentUser = ref<any>(null)
const comments = ref<any[]>([])
const newComment = ref('')
const isSubmitting = ref(false)

onMounted(async () => {
  // ดึงข้อมูลผู้ใช้ที่ล็อกอินอยู่จาก localStorage (เพื่อไว้เช็คว่าจะให้เห็นกล่องพิมพ์คอมเมนต์ไหม)
  const userString = localStorage.getItem('user')
  if (userString) {
    currentUser.value = JSON.parse(userString)
  }

  try {
    isLoading.value = true
    
    // 1. ดึงข้อมูลทริป
    const tripData = await getTripById(tripId)
    trip.value = tripData

    // 2. ถ้ามี author_id ให้ไปดึงข้อมูลผู้เขียนมาด้วย
    if (tripData.authorId) {
      const authorData = await getUserById(tripData.authorId)
      author.value = authorData
    }
    
    // 3. ดึงคอมเมนต์ทั้งหมดของทริปนี้มาแสดง
    comments.value = await getCommentsByTripId(tripId)

  } catch (error: any) {
    errorMessage.value = 'ไม่พบเนื้อหาที่คุณค้นหา หรือลิงก์อาจไม่ถูกต้อง'
  } finally {
    isLoading.value = false
  }
})

// ฟังก์ชันกดส่งคอมเมนต์
async function submitComment() {
  if (!newComment.value.trim() || !currentUser.value) return
  isSubmitting.value = true
  try {
    const addedComment = await addComment(tripId, currentUser.value.id, newComment.value)
    comments.value.unshift(addedComment) // เอาคอมเมนต์ใหม่ไปแทรกไว้บนสุด
    newComment.value = '' // ล้างข้อความในกล่อง
  } catch (error) {
    alert('เกิดข้อผิดพลาดในการส่งความเห็น')
  } finally {
    isSubmitting.value = false
  }
}

// ฟังก์ชันแปลงวันที่คอมเมนต์ให้อ่านง่าย
function formatCommentDate(dateString: string) {
  if (!dateString) return 'พึ่งส่ง'
  return new Date(dateString).toLocaleDateString('th-TH', { 
    year: 'numeric', month: 'short', day: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  })
}

// ดึงรูปแรกมาเป็นหน้าปก (ถ้าไม่มี ใช้รูปจำลอง)
const coverPhoto = computed(() => {
  if (trip.value?.photos && trip.value.photos.length > 0) {
    return trip.value.photos[0]
  }
  return 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200&auto=format&fit=crop'
})

// รูปอื่นๆ ที่เหลือเอามาทำ Gallery
const galleryPhotos = computed(() => {
  if (trip.value?.photos && trip.value.photos.length > 1) {
    return trip.value.photos.slice(1) // ตัดรูปแรกออก
  }
  return []
})

// แปลงวันที่ของบทความ
const formattedDate = computed(() => {
  if (!trip.value?.createdAt) return ''
  const date = new Date(trip.value.createdAt)
  return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
})

// 💡 ฟังก์ชันแปลง [IMAGE:X] ให้เป็นรูปภาพ
const formattedDescription = computed(() => {
  if (!trip.value?.description) return ''
  
  let html = trip.value.description
  html = html.replace(/\n/g, '<br>') // แปลงการขึ้นบรรทัดใหม่
  
  // แปลง [IMAGE:X] เป็นรูปภาพ
  html = html.replace(/\[IMAGE:(\d+)\]/g, (match: string, numberString: string) => {
    const index = parseInt(numberString, 10)
    const photoUrl = trip.value.photos[index]
    
    if (photoUrl) {
      return `<div class="inline-image-wrapper"><img src="${photoUrl}" class="inline-image" alt="trip-photo-${index}" /></div>`
    }
    return ''
  })
  
  return html
})
</script>

<template>
  <div class="travel-detail-page">
    
    <div v-if="isLoading" class="loading-state">กำลังโหลดเนื้อหา... ⏳</div>
    <div v-else-if="errorMessage" class="error-state">
      <h2>{{ errorMessage }}</h2>
      <router-link to="/" class="btn-back">กลับหน้าแรก</router-link>
    </div>

    <div v-else-if="trip" class="article-content">
      
      <div class="hero-section" :style="{ backgroundImage: `url(${coverPhoto})` }">
        <div class="hero-overlay"></div>
        <div class="container hero-content">
          <div class="tags" v-if="trip.tags && trip.tags.length > 0">
            <span v-for="tag in trip.tags" :key="tag" class="tag">#{{ tag }}</span>
          </div>
          
          <h1 class="title">{{ trip.title }}</h1>
          
          <div class="author-block">
            <router-link :to="`/@${author.username}`" class="author-link" v-if="author">
               </router-link>
          </div>
          
          <router-link :to="`/@${author.username}`" class="author-link" v-if="author">
              <img v-if="author.avatarUrl" :src="author.avatarUrl" alt="Author" class="author-avatar" />
              <div v-else class="author-avatar placeholder">{{ author.username.charAt(0).toUpperCase() }}</div>
              <div class="author-info">
                <span class="author-name">{{ author.profile?.nickname || author.username }}</span>
                <span class="publish-date">{{ formattedDate }}</span>
              </div>
            </router-link>
            <div v-else class="author-info"><span class="publish-date">{{ formattedDate }}</span></div>
          </div>
        </div>
      </div>

      <div class="container main-article">
        <div class="article-body">
          <div class="description-html" v-html="formattedDescription"></div> 
        </div>

        <div class="gallery-section" v-if="galleryPhotos.length > 0">
          <h3 class="gallery-title">รูปภาพเพิ่มเติม 📸</h3>
          <div class="gallery-grid">
            <img v-for="(photo, index) in galleryPhotos" :key="index" :src="photo" alt="Trip photo" class="gallery-img" />
          </div>
        </div>

        <div class="comments-section">
          <h3 class="comments-title">ความคิดเห็น ({{ comments.length }})</h3>
          
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
                <span v-else>{{ comment.user?.username.charAt(0).toUpperCase() || '?' }}</span>
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

    </div>
</template>

<style scoped>
/* 🎨 สไตล์หลักของหน้าเว็บ */
.travel-detail-page { background-color: #fcfdfd; min-height: calc(100vh - 72px); padding-bottom: 60px; font-family: 'Kanit', sans-serif; }
.loading-state, .error-state { text-align: center; padding: 100px 20px; font-size: 1.2rem; color: #666; }
.btn-back { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 8px; }

/* 🖼️ สไตล์ Hero Section */
.hero-section { position: relative; width: 100%; height: 500px; background-size: cover; background-position: center; display: flex; align-items: flex-end; }
.hero-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%); }
.hero-content { position: relative; z-index: 1; padding-bottom: 40px; color: white; width: 100%; max-width: 900px; margin: 0 auto; }
.tags { display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap; }
.tag { background: rgba(255,255,255,0.2); backdrop-filter: blur(5px); padding: 5px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 500; }
.title { font-size: 2.5rem; font-weight: 800; margin: 0 0 20px 0; line-height: 1.3; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }

/* 👤 สไตล์ Author Block */
.author-link { display: flex; align-items: center; gap: 12px; text-decoration: none; color: white; width: fit-content; }
.author-link:hover .author-name { text-decoration: underline; }
.author-avatar { width: 45px; height: 45px; border-radius: 50%; object-fit: cover; border: 2px solid white; }
.author-avatar.placeholder { background-color: #007bff; display: flex; justify-content: center; align-items: center; font-weight: bold; }
.author-info { display: flex; flex-direction: column; }
.author-name { font-weight: 600; font-size: 1rem; }
.publish-date { font-size: 0.85rem; opacity: 0.8; }

/* 📝 สไตล์เนื้อหาบทความ */
.main-article { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
.description { font-size: 1.15rem; line-height: 1.8; color: #333; white-space: pre-wrap; margin-bottom: 40px; }

/* 📸 สไตล์ Gallery */
.gallery-section { margin-top: 50px; padding-top: 30px; border-top: 1px solid #eee; }
.gallery-title { font-size: 1.4rem; font-weight: 700; color: #111; margin-bottom: 20px; }
.gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; }
.gallery-img { width: 100%; height: 200px; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); transition: transform 0.2s; }
.gallery-img:hover { transform: scale(1.02); }

/* 💬 สไตล์ส่วนคอมเมนต์ (Comments) */
.comments-section { margin-top: 50px; padding-top: 30px; border-top: 1px solid #eee; }
.comments-title { font-size: 1.4rem; font-weight: 700; color: #111; margin-bottom: 20px; }

.comment-input-box { display: flex; gap: 15px; margin-bottom: 30px; }
.avatar-small { width: 40px; height: 40px; flex-shrink: 0; border-radius: 50%; background: #007bff; color: white; display: flex; justify-content: center; align-items: center; font-weight: bold; overflow: hidden; }
.avatar-small img { width: 100%; height: 100%; object-fit: cover; }
.input-wrapper { flex: 1; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
.input-wrapper textarea { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 10px; font-family: inherit; resize: vertical; outline: none; transition: 0.2s; box-sizing: border-box; }
.input-wrapper textarea:focus { border-color: #007bff; }
.btn-comment { background: #007bff; color: white; border: none; padding: 8px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.btn-comment:disabled { background: #a0c4ff; cursor: not-allowed; }

.login-prompt { background: #f8f9fa; padding: 15px; text-align: center; border-radius: 10px; margin-bottom: 30px; color: #555; }
.login-prompt a { color: #007bff; font-weight: 600; text-decoration: none; }

.comments-list { display: flex; flex-direction: column; gap: 20px; }
.comment-item { display: flex; gap: 15px; }
.comment-content { background: #f8f9fa; padding: 15px; border-radius: 0 12px 12px 12px; flex: 1; }
.comment-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 5px; }
.comment-author { font-weight: 600; color: #333; }
.comment-date { font-size: 0.8rem; color: #888; }
.comment-text { margin: 0; color: #444; line-height: 1.5; white-space: pre-wrap; }

/* Responsive สำหรับมือถือ */
@media (max-width: 768px) {
  .hero-section { height: 400px; }
  .title { font-size: 1.8rem; }
  .description { font-size: 1.05rem; }
}

/* 💡 สไตล์สำหรับข้อความและรูปภาพที่แทรกอยู่ตรงกลาง */
.description-html { 
  font-size: 1.3rem; 
  line-height: 1.8; 
  color: #444; 
  white-space: normal; 
  margin-bottom: 40px; 
}
:deep(.inline-image-wrapper) { 
  margin: 10px 0; 
  text-align: center; 
}
:deep(.inline-image) { 
  max-width: 100%; 
  max-height: 600px; 
  border-radius: 10px; 
  box-shadow: 0 4px 15px rgba(0,0,0,0.1); 
  object-fit: contain; 
}
</style>