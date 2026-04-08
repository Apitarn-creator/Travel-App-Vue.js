<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getUserByUsername, updateProfile } from '../api/userApi'
import { getTripsByUserId, getCommentedTripsByUserId } from '../api/tripApi'

const route = useRoute()
const targetUsername = route.params.username as string

const publicProfile = ref<any>(null)
const isLoading = ref(true)
const errorMessage = ref('')
const currentUser = ref<any>(null)
const targetUserId = ref<number | null>(null)

// 💡 ตัวแปรสำหรับทริปของจริง และระบบแท็บ
const userPosts = ref<any[]>([])
const commentedPosts = ref<any[]>([])
const activeTab = ref('my-posts') // 'my-posts' หรือ 'commented'

// Popup รูปปก
const showCoverModal = ref(false)
const isUploading = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

    onMounted(async () => {
  const userString = localStorage.getItem('user')
  if (userString) currentUser.value = JSON.parse(userString)

  try {
    isLoading.value = true
    
    // 💡 1. ดึงข้อมูล User จาก Username แทน
    const data = await getUserByUsername(targetUsername)
    publicProfile.value = data
    targetUserId.value = data.id // 💡 พอได้ข้อมูลมา ค่อยเอา ID ไปใช้ต่อ

    // 💡 2. ดึงข้อมูลทริป โดยใช้ ID ที่ได้มา
    userPosts.value = await getTripsByUserId(targetUserId.value!)
    commentedPosts.value = await getCommentedTripsByUserId(targetUserId.value!)

  } catch (error: any) {
    errorMessage.value = 'ไม่พบผู้ใช้งานนี้ หรือลิงก์อาจไม่ถูกต้อง 😢'
  } finally {
    isLoading.value = false
  }
})

// 💡 เช็คว่าเป็นโปรไฟล์เราเองไหม โดยเทียบจาก Username แทน
const isMyProfile = computed(() => currentUser.value?.username === targetUsername)


const userInitials = computed(() => publicProfile.value?.username ? publicProfile.value.username.charAt(0).toUpperCase() : '?')
const displayCover = computed(() => publicProfile.value?.profile?.coverUrl || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop')

// ฟังก์ชันได้รูปหน้าปกของแต่ละทริป (เอารูปแรกมาโชว์)
function getCoverPhoto(photos: string[]) {
  return (photos && photos.length > 0) ? photos[0] : 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=400'
}

function formatDate(dateString: string) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
}

// --- ฟังก์ชันเปลี่ยนรูปปกเดิม ---
function triggerCoverInput() { fileInputRef.value?.click() }
async function handleCoverUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  isUploading.value = true
  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
        const base64Image = e.target?.result as string
      // 💡 เติม .value เข้าไปตรง targetUserId.value
      await updateProfile(targetUserId.value!, { username: publicProfile.value.username, coverUrl: base64Image })
      if (!publicProfile.value.profile) publicProfile.value.profile = {}
      publicProfile.value.profile.coverUrl = base64Image
      showCoverModal.value = false
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการเปลี่ยนรูปปก')
    } finally {
      isUploading.value = false
    }
  }
  reader.readAsDataURL(file)
}
</script>

<template>
  <div class="public-profile-page">
    
    <div v-if="isLoading" class="loading-state">กำลังโหลดข้อมูล... ⏳</div>
    <div v-else-if="errorMessage" class="error-state">
      <h2>{{ errorMessage }}</h2>
      <router-link to="/" class="btn-back">กลับหน้าแรก</router-link>
    </div>

    <div v-else class="profile-content">
      
      <div class="cover-container">
        <img :src="displayCover" alt="Cover" class="cover-image" />
        <button v-if="isMyProfile" @click="showCoverModal = true" class="btn-edit-cover"><span class="icon">📷</span> แก้ไขรูปปก</button>
      </div>

      <div class="container profile-info-section">
        <div class="profile-card">
          <div class="avatar-wrapper">
            <img v-if="publicProfile?.avatarUrl" :src="publicProfile.avatarUrl" alt="Avatar" class="profile-avatar" />
            <div v-else class="profile-avatar placeholder">{{ userInitials }}</div>
          </div>
          <div class="user-details">
            <h1 class="nickname">{{ publicProfile?.profile?.nickname || publicProfile?.username }}</h1>
            <p class="username">@{{ publicProfile?.username }}</p>
            <p class="bio">{{ publicProfile?.profile?.bio || 'นักเดินทางที่ยังไม่ได้เขียนแนะนำตัว 🎒' }}</p>
            <div class="profile-stats">
              <div class="stat-box"><span class="stat-number">{{ userPosts.length }}</span><span class="stat-label">ทริปที่สร้าง</span></div>
              <div class="stat-box"><span class="stat-number">{{ commentedPosts.length }}</span><span class="stat-label">ไปคอมเมนต์</span></div>
            </div>
          </div>
        </div>
      </div>

      <div class="container posts-section">
        
        <div class="profile-tabs">
          <button class="tab-btn" :class="{ 'active': activeTab === 'my-posts' }" @click="activeTab = 'my-posts'">
            Created ({{ userPosts.length }})
          </button>
          <button class="tab-btn" :class="{ 'active': activeTab === 'commented' }" @click="activeTab = 'commented'">
            Comments ({{ commentedPosts.length }})
          </button>
        </div>

        <div v-if="activeTab === 'my-posts'" class="posts-grid">
            
          <div v-if="userPosts.length === 0" class="empty-state">
            <p>ยังไม่มีทริปที่สร้างครับ 🎒</p>
            <router-link v-if="isMyProfile" to="/create-trip" class="btn-primary">เขียนทริปแรกเลย!</router-link>
          </div>
          
          <router-link :to="`/trip/${post.id}`" v-for="post in userPosts" :key="post.id" class="post-card">
            <div class="post-image-wrapper"><img :src="getCoverPhoto(post.photos)" class="post-image" /></div>
            <div class="post-content">
              <h3 class="post-title">{{ post.title }}</h3>
              <div class="post-meta"><span class="post-date">{{ formatDate(post.createdAt) }}</span></div>
            </div>
          </router-link>
        </div>

        <div v-if="activeTab === 'commented'" class="posts-grid">
          <div v-if="commentedPosts.length === 0" class="empty-state">
            <p>ยังไม่ได้ไปคอมเมนต์พูดคุยในทริปไหนเลย 💬</p>
          </div>

          <router-link :to="`/trip/${post.id}`" v-for="post in commentedPosts" :key="post.id" class="post-card">
            <div class="post-image-wrapper"><img :src="getCoverPhoto(post.photos)" class="post-image" /></div>
            <div class="post-content">
              <h3 class="post-title">{{ post.title }}</h3>
              <div class="post-meta"><span class="post-date">{{ formatDate(post.createdAt) }}</span></div>
            </div>
          </router-link>
        </div>

      </div>

      <div v-if="showCoverModal" class="modal-backdrop" @click="showCoverModal = false">
        <div class="modal-content" @click.stop>
          <h3>เปลี่ยนรูปหน้าปก 🖼️</h3>
          <input type="file" ref="fileInputRef" @change="handleCoverUpload" accept="image/*" style="display: none;" />
          <button @click="triggerCoverInput" class="btn-upload-modal" :disabled="isUploading">{{ isUploading ? 'กำลังอัปโหลด...' : 'เลือกรูปภาพจากเครื่อง' }}</button>
          <button @click="showCoverModal = false" class="btn-cancel">ยกเลิก</button>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* สไตล์เดิมบางส่วนขอตัดออกเพื่อไม่ให้โค้ดยาวเกินไป ให้คงของเก่าไว้ได้เลยนะครับ แล้วเพิ่มสไตล์ใหม่ด้านล่างนี้ */
.public-profile-page { background-color: #f8fafc; min-height: calc(100vh - 72px); padding-bottom: 50px; font-family: 'Kanit', sans-serif; }
.loading-state, .error-state { text-align: center; padding: 100px 20px; font-size: 1.2rem; color: #666; }
.btn-back { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 8px; }

.cover-container { width: 100%; height: 320px; background-color: #e2e8f0; position: relative; }
.cover-image { width: 100%; height: 100%; object-fit: cover; }
.btn-edit-cover { position: absolute; bottom: 20px; right: 20px; background: rgba(255, 255, 255, 0.9); border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; }

.profile-info-section { position: relative; margin-top: -80px; padding: 0 20px; }
.profile-card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); display: flex; flex-direction: column; align-items: center; text-align: center; }
.avatar-wrapper { margin-top: -80px; margin-bottom: 15px; }
.profile-avatar { width: 160px; height: 160px; border-radius: 50%; object-fit: cover; border: 5px solid white; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
.profile-avatar.placeholder { background-color: #007bff; color: white; display: flex; justify-content: center; align-items: center; font-size: 4rem; font-weight: bold; }
.user-details .nickname { font-size: 1.8rem; font-weight: 700; color: #111; margin: 0 0 5px 0; }
.user-details .username { font-size: 1rem; color: #64748b; margin: 0 0 15px 0; }
.user-details .bio { font-size: 1rem; color: #475569; max-width: 500px; margin: 0 auto 20px auto; line-height: 1.5; }

.profile-stats { display: flex; gap: 30px; justify-content: center; padding-top: 20px; border-top: 1px solid #f1f5f9; width: 100%; }
.stat-box { display: flex; flex-direction: column; }
.stat-number { font-size: 1.2rem; font-weight: 700; color: #0f172a; }
.stat-label { font-size: 0.9rem; color: #64748b; }

/* 💡 สไตล์สำหรับแท็บและกล่องโพสต์ใหม่ */
.posts-section { 
  margin-top: 40px; 
  padding: 0 5%; /* เผื่อระยะขอบซ้าย-ขวา 5% เหมือนหน้า Home */
  max-width: 100% !important; /* ทลายขีดจำกัดความกว้างของคลาส .container */
}
.profile-tabs { display: flex; justify-content: center; gap: 20px; border-bottom: 2px solid #eee; margin-bottom: 30px; }
.tab-btn { background: none; border: none; padding: 10px 20px; font-size: 1.1rem; font-weight: 600; color: #64748b; cursor: pointer; border-bottom: 3px solid transparent; transition: 0.2s; font-family: inherit; }
.tab-btn:hover { color: #007bff; }
.tab-btn.active { color: #007bff; border-bottom-color: #007bff; }

.empty-state { text-align: center; padding: 50px 20px; color: #666; width: 100%; grid-column: 1 / -1; }
.btn-primary { display: inline-block; margin-top: 10px; background: #007bff; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; }

.posts-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); /* ขนาดขั้นต่ำ 380px เหมือน Home */
  gap: 30px; /* ขยายระยะห่างเป็น 30px เหมือน Home */
}
.post-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; cursor: pointer; text-decoration: none; color: inherit; transition: 0.2s; }
.post-card:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.08); }
.post-image-wrapper { height: 200px; overflow: hidden; }
.post-image { width: 100%; height: 100%; object-fit: cover; }
.post-content { padding: 16px; }
.post-title { font-size: 1.1rem; font-weight: 600; margin: 0 0 10px 0; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.post-meta { font-size: 0.85rem; color: #64748b; }

/* Popup Styles */
.modal-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 2000; }
.modal-content { background: white; padding: 30px; border-radius: 16px; width: 90%; max-width: 400px; text-align: center; }
.btn-upload-modal { width: 100%; background: #007bff; color: white; border: none; padding: 12px; border-radius: 8px; margin-bottom: 10px; cursor: pointer; }
.btn-cancel { width: 100%; background: #f1f5f9; border: none; padding: 12px; border-radius: 8px; cursor: pointer; }

@media (max-width: 640px) {
  .profile-avatar { width: 120px; height: 120px; }
  .tab-btn { padding: 10px; font-size: 1rem; }
}
</style>