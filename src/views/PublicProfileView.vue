<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getUserByUsername, updateProfile, toggleFollow, getFollowStats } from '../api/userApi'
import { getTripsByUserId, getCommentedTripsByUserId } from '../api/tripApi'
import SkeletonProfile from '../components/SkeletonProfile.vue'

const route = useRoute()
const targetUsername = route.params.username as string

const publicProfile = ref<any>(null)
const isLoading = ref(true)
const errorMessage = ref('')
const currentUser = ref<any>(null)
const targetUserId = ref<number | null>(null)

const userPosts = ref<any[]>([])
const commentedPosts = ref<any[]>([])
const activeTab = ref('my-posts')

// ✅ Follow state
const isFollowing = ref(false)
const isFollowLoading = ref(false)
const followerCount = ref(0)
const followingCount = ref(0)

const showCoverModal = ref(false)
const isUploading = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

onMounted(async () => {
  const userString = localStorage.getItem('user')
  if (userString) currentUser.value = JSON.parse(userString)

  try {
    isLoading.value = true
    const data = await getUserByUsername(targetUsername)
    publicProfile.value = data
    targetUserId.value = data.id

    // โหลด trips และ follow stats พร้อมกัน
    const [posts, commented, stats] = await Promise.all([
      getTripsByUserId(targetUserId.value!),
      getCommentedTripsByUserId(targetUserId.value!),
      getFollowStats(targetUserId.value!)
    ])
    userPosts.value = posts
    commentedPosts.value = commented
    followerCount.value = stats.followers
    followingCount.value = stats.following

    // เช็คว่า login user follow คนนี้อยู่ไหม
    if (currentUser.value?.following) {
      isFollowing.value = currentUser.value.following
        .split(',').includes(String(targetUserId.value))
    }

  } catch (error: any) {
    errorMessage.value = 'ไม่พบผู้ใช้งานนี้ หรือลิงก์อาจไม่ถูกต้อง 😢'
  } finally {
    isLoading.value = false
  }
})

// ✅ กด Follow / Unfollow
async function handleFollow() {
  if (!currentUser.value) { window.location.href = '/login'; return }
  if (isFollowLoading.value) return
  isFollowLoading.value = true
  try {
    const res = await toggleFollow(targetUserId.value!)
    isFollowing.value = res.following
    followerCount.value += res.following ? 1 : -1
    // อัปเดต localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    user.following = res.followingList
    localStorage.setItem('user', JSON.stringify(user))
    currentUser.value = user
  } catch { /* silent */ } finally {
    isFollowLoading.value = false
  }
}

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
    
    <SkeletonProfile v-if="isLoading" />
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

            <!-- ✅ Social Links Icons -->
            <div class="social-icons-row" v-if="publicProfile?.profile?.facebookUrl || publicProfile?.profile?.instagramUrl || publicProfile?.profile?.tiktokUrl || publicProfile?.profile?.youtubeUrl || publicProfile?.profile?.twitterUrl">
              <a v-if="publicProfile.profile.facebookUrl" :href="publicProfile.profile.facebookUrl" target="_blank" class="social-link-icon facebook" title="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a v-if="publicProfile.profile.instagramUrl" :href="publicProfile.profile.instagramUrl" target="_blank" class="social-link-icon instagram" title="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="white" stroke="none"/></svg>
              </a>
              <a v-if="publicProfile.profile.tiktokUrl" :href="publicProfile.profile.tiktokUrl" target="_blank" class="social-link-icon tiktok" title="TikTok">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/></svg>
              </a>
              <a v-if="publicProfile.profile.youtubeUrl" :href="publicProfile.profile.youtubeUrl" target="_blank" class="social-link-icon youtube" title="YouTube">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#ff0000" stroke="none"/></svg>
              </a>
              <a v-if="publicProfile.profile.twitterUrl" :href="publicProfile.profile.twitterUrl" target="_blank" class="social-link-icon twitter" title="X (Twitter)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            </div>
            <div class="profile-stats">
              <div class="stat-box"><span class="stat-number">{{ userPosts.length }}</span><span class="stat-label">ทริป</span></div>
              <div class="stat-box"><span class="stat-number">{{ followerCount }}</span><span class="stat-label">ผู้ติดตาม</span></div>
              <div class="stat-box"><span class="stat-number">{{ followingCount }}</span><span class="stat-label">กำลังติดตาม</span></div>
            </div>

            <!-- ✅ Follow button — ซ่อนถ้าเป็นโปรไฟล์ตัวเอง -->
            <button
              v-if="!isMyProfile && currentUser"
              class="btn-follow"
              :class="{ 'following': isFollowing, 'loading': isFollowLoading }"
              @click="handleFollow"
              :disabled="isFollowLoading"
            >
              <svg v-if="isFollowing" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <line x1="19" y1="8" x2="19" y2="14"/>
                <line x1="22" y1="11" x2="16" y2="11"/>
              </svg>
              {{ isFollowing ? 'กำลังติดตาม' : 'ติดตาม' }}
            </button>

            <router-link v-if="isMyProfile" to="/profile" class="btn-edit-profile">
              ✏️ แก้ไขโปรไฟล์
            </router-link>
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
.public-profile-page { background-color: var(--bg-secondary); min-height: calc(100vh - 72px); padding-bottom: 50px; font-family: 'Kanit', sans-serif; }
.loading-state, .error-state { text-align: center; padding: 100px 20px; font-size: 1.2rem; color: var(--text-secondary); }
.btn-back { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 8px; }

.cover-container { width: 100%; height: 320px; background-color: var(--bg-tertiary); position: relative; }
.cover-image { width: 100%; height: 100%; object-fit: cover; }
.btn-edit-cover { position: absolute; bottom: 20px; right: 20px; background: rgba(255, 255, 255, 0.9); border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; }

.profile-info-section { position: relative; margin-top: -80px; padding: 0 20px; }
.profile-card { background: var(--bg-card); border-radius: 16px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); display: flex; flex-direction: column; align-items: center; text-align: center; }
.avatar-wrapper { margin-top: -80px; margin-bottom: 15px; }
.profile-avatar { width: 160px; height: 160px; border-radius: 50%; object-fit: cover; border: 5px solid white; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
.profile-avatar.placeholder { background-color: #007bff; color: white; display: flex; justify-content: center; align-items: center; font-size: 4rem; font-weight: bold; }
.user-details .nickname { font-size: 1.8rem; font-weight: 700; color: var(--text-primary); margin: 0 0 5px 0; }
.user-details .username { font-size: 1rem; color: var(--text-muted); margin: 0 0 15px 0; }
.user-details .bio { font-size: 1rem; color: var(--text-secondary); max-width: 500px; margin: 0 auto 12px auto; line-height: 1.5; }

/* ✅ Social Icons Row */
.social-icons-row { display: flex; gap: 8px; justify-content: center; margin-bottom: 16px; }
.social-link-icon {
  width: 34px; height: 34px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  text-decoration: none; transition: transform 0.2s, opacity 0.2s;
}
.social-link-icon:hover { transform: translateY(-2px); opacity: 0.85; }
.social-link-icon.facebook { background: #1877f2; }
.social-link-icon.instagram { background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); }
.social-link-icon.tiktok { background: #000000; }
.social-link-icon.youtube { background: #ff0000; }
.social-link-icon.twitter { background: #000000; }

.profile-stats { display: flex; gap: 30px; justify-content: center; padding-top: 20px; border-top: 1px solid #f1f5f9; width: 100%; }
.stat-box { display: flex; flex-direction: column; }
.stat-number { font-size: 1.2rem; font-weight: 700; color: var(--text-primary); }
.stat-label { font-size: 0.9rem; color: var(--text-muted); }

/* 💡 สไตล์สำหรับแท็บและกล่องโพสต์ใหม่ */
.posts-section { 
  margin-top: 40px; 
  padding: 0 5%; /* เผื่อระยะขอบซ้าย-ขวา 5% เหมือนหน้า Home */
  max-width: 100% !important; /* ทลายขีดจำกัดความกว้างของคลาส .container */
}
.profile-tabs { display: flex; justify-content: center; gap: 20px; border-bottom: 2px solid #eee; margin-bottom: 30px; }
.tab-btn { background: none; border: none; padding: 10px 20px; font-size: 1.1rem; font-weight: 600; color: var(--text-muted); cursor: pointer; border-bottom: 3px solid transparent; transition: 0.2s; font-family: inherit; }
.tab-btn:hover { color: #007bff; }
.tab-btn.active { color: #007bff; border-bottom-color: #007bff; }

.empty-state { text-align: center; padding: 50px 20px; color: var(--text-secondary); width: 100%; grid-column: 1 / -1; }
.btn-primary { display: inline-block; margin-top: 10px; background: #007bff; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; }

/* ✅ Follow button */
.btn-follow {
  display: inline-flex; align-items: center; gap: 8px;
  margin-top: 16px; padding: 10px 24px; border-radius: 20px;
  font-size: 0.95rem; font-weight: 600; cursor: pointer;
  border: 2px solid #007bff; color: #007bff; background: var(--bg-card);
  transition: all 0.2s; font-family: inherit;
}
.btn-follow:hover:not(:disabled) { background: #007bff; color: white; transform: translateY(-1px); }
.btn-follow.following { background: #007bff; color: white; }
.btn-follow.following:hover:not(:disabled) { background: #dc2626; border-color: #dc2626; }
.btn-follow.following:hover:not(:disabled)::after { content: 'ยกเลิก'; }
.btn-follow.loading { opacity: 0.7; cursor: not-allowed; }

.btn-edit-profile {
  display: inline-flex; align-items: center; gap: 6px;
  margin-top: 16px; padding: 9px 20px; border-radius: 20px;
  font-size: 0.9rem; font-weight: 600; cursor: pointer;
  border: 1.5px solid #e2e8f0; color: var(--text-secondary); background: var(--bg-card);
  text-decoration: none; transition: all 0.2s;
}
.btn-edit-profile:hover { border-color: #007bff; color: #007bff; }

.posts-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); /* ขนาดขั้นต่ำ 380px เหมือน Home */
  gap: 30px; /* ขยายระยะห่างเป็น 30px เหมือน Home */
}
.post-card { background: var(--bg-card); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid var(--border-light); cursor: pointer; text-decoration: none; color: inherit; transition: 0.2s; }
.post-card:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.08); }
.post-image-wrapper { height: 200px; overflow: hidden; }
.post-image { width: 100%; height: 100%; object-fit: cover; }
.post-content { padding: 16px; }
.post-title { font-size: 1.1rem; font-weight: 600; margin: 0 0 10px 0; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.post-meta { font-size: 0.85rem; color: var(--text-muted); }

/* Popup Styles */
.modal-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 2000; }
.modal-content { background: var(--bg-card); padding: 30px; border-radius: 16px; width: 90%; max-width: 400px; text-align: center; }
.btn-upload-modal { width: 100%; background: #007bff; color: white; border: none; padding: 12px; border-radius: 8px; margin-bottom: 10px; cursor: pointer; }
.btn-cancel { width: 100%; background: var(--bg-tertiary); border: none; padding: 12px; border-radius: 8px; cursor: pointer; }

@media (max-width: 768px) {
  .cover-container { height: 200px; }
  .profile-card { margin: 0 12px; padding: 16px; }
  .profile-avatar { width: 90px; height: 90px; }
  .user-details .nickname { font-size: 1.3rem; }
  .profile-stats { gap: 16px; }
  .posts-section { padding: 0 12px; }
  .posts-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
  .profile-tabs { gap: 0; }
  .tab-btn { padding: 10px 16px; font-size: 0.95rem; }
  .btn-follow, .btn-edit-profile { padding: 8px 18px; font-size: 0.85rem; }
}

@media (max-width: 640px) {
  .profile-avatar { width: 80px; height: 80px; }
  .posts-grid { grid-template-columns: 1fr; }
  .tab-btn { padding: 10px; font-size: 0.9rem; }
}
</style>