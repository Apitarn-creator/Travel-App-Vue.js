<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { updateProfile, getMyBookmarks } from '../api/userApi'

const router = useRouter()
const currentUser = ref<any>(null)
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

// ✅ Bookmark tab
const activeSection = ref<'profile' | 'bookmarks'>('profile')
const bookmarks = ref<any[]>([])
const bookmarksLoading = ref(false)

// ฟอร์มเก็บข้อมูลทั้งหมด
const form = ref({
  username: '',
  nickname: '',
  bio: '',
  gender: '',
  birthdate: '',
  socialLink: '',
  avatarUrl: '',
  facebookUrl: '',
  instagramUrl: '',
  twitterUrl: '',
  tiktokUrl: '',
  youtubeUrl: ''
})

onMounted(() => {
  const userString = localStorage.getItem('user')
  if (userString) {
    currentUser.value = JSON.parse(userString)
    
    // โหลดข้อมูลเดิมมาแสดง
    form.value.username = currentUser.value.username || ''
    form.value.avatarUrl = currentUser.value.avatarUrl || ''
    
    // 💡 ดึงจากก้อน profile (ใช้เครื่องหมาย ? เผื่อกรณีที่ profile ยังไม่มี)
    form.value.nickname = currentUser.value.profile?.nickname || ''
    form.value.bio = currentUser.value.profile?.bio || ''
    form.value.gender = currentUser.value.profile?.gender || ''
    form.value.birthdate = currentUser.value.profile?.birthdate || ''
    form.value.socialLink = currentUser.value.profile?.socialLink || ''
    form.value.facebookUrl = currentUser.value.profile?.facebookUrl || ''
    form.value.instagramUrl = currentUser.value.profile?.instagramUrl || ''
    form.value.twitterUrl = currentUser.value.profile?.twitterUrl || ''
    form.value.tiktokUrl = currentUser.value.profile?.tiktokUrl || ''
    form.value.youtubeUrl = currentUser.value.profile?.youtubeUrl || ''
  } else {
    router.push('/login')
  }
})

const userInitials = computed(() => currentUser.value?.username?.charAt(0).toUpperCase() || '?')

// ฟังก์ชันจำลองการกดปุ่มอัปโหลดรูป
function triggerFileInput() {
  fileInputRef.value?.click()
}

// ฟังก์ชันแปลงไฟล์รูปที่เลือก ให้เป็นข้อความ Base64
function handleFileUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  // เช็คขนาดไฟล์ (ไม่เกิน 2MB)
  if (file.size > 2 * 1024 * 1024) {
    alert('ขนาดรูปภาพต้องไม่เกิน 2MB ครับ')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    form.value.avatarUrl = e.target?.result as string // เก็บ Base64 ลงฟอร์ม
  }
  reader.readAsDataURL(file)
}

async function handleSave() {
  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const updatedUser = await updateProfile(currentUser.value.id, {
      ...form.value,
      profile: {
        nickname: form.value.nickname,
        bio: form.value.bio,
        gender: form.value.gender,
        birthdate: form.value.birthdate,
        socialLink: form.value.socialLink,
        facebookUrl: form.value.facebookUrl,
        instagramUrl: form.value.instagramUrl,
        twitterUrl: form.value.twitterUrl,
        tiktokUrl: form.value.tiktokUrl,
        youtubeUrl: form.value.youtubeUrl,
      }
    })

    localStorage.setItem('user', JSON.stringify(updatedUser))
    currentUser.value = updatedUser
    
    successMessage.value = 'บันทึกข้อมูลโปรไฟล์สำเร็จ! 🎉'
    setTimeout(() => { window.location.reload() }, 1500)

  } catch (error: any) {
    errorMessage.value = error.message || 'บันทึกข้อมูลไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}

function handleLogout() {
  localStorage.removeItem('user')
  localStorage.removeItem('token')
  window.location.href = '/login'
}

// ✅ โหลด bookmarks
async function loadBookmarks() {
  if (bookmarksLoading.value) return
  bookmarksLoading.value = true
  try {
    bookmarks.value = await getMyBookmarks()
  } catch { bookmarks.value = [] }
  finally { bookmarksLoading.value = false }
}

async function switchSection(section: 'profile' | 'bookmarks') {
  activeSection.value = section
  if (section === 'bookmarks' && bookmarks.value.length === 0) {
    await loadBookmarks()
  }
}

function cleanDescription(text: string | null): string {
  if (!text) return ''
  return text.replace(/\[IMAGE:\d+\]/g, '').replace(/\s+/g, ' ').trim()
}
</script>

<template>
  <div class="profile-page">
    <div class="container layout-grid">
      
      <aside class="sidebar">
        <div class="sidebar-user">
          <img v-if="currentUser?.avatarUrl" :src="currentUser.avatarUrl" class="sidebar-avatar" />
          <div v-else class="sidebar-avatar placeholder">{{ userInitials }}</div>
          <div class="user-info">
            <h3>{{ currentUser?.profile?.nickname || currentUser?.username }}</h3>
            <p>สมาชิกทั่วไป</p>
          </div>
        </div>

        <nav class="sidebar-nav">
          <a href="#" class="nav-item" :class="{ active: activeSection === 'profile' }" @click.prevent="switchSection('profile')">
            <span class="icon">👤</span> ข้อมูลโปรไฟล์
          </a>
          <a href="#" class="nav-item" :class="{ active: activeSection === 'bookmarks' }" @click.prevent="switchSection('bookmarks')">
            <span class="icon">🔖</span> ทริปที่บันทึกไว้
          </a>
          <a href="#" class="nav-item"><span class="icon">🔒</span> ความปลอดภัย</a>
        </nav>

        <div class="sidebar-footer">
          <button @click="handleLogout" class="nav-item logout-btn"><span class="icon">🚪</span> ออกจากระบบ</button>
        </div>
      </aside>

      <main class="content-area">

        <!-- ===== PROFILE SECTION ===== -->
        <template v-if="activeSection === 'profile'">
          <div class="content-header">
            <h2>ตั้งค่าโปรไฟล์</h2>
            <p>จัดการข้อมูลส่วนตัวและตั้งค่าบัญชีของคุณ</p>
          </div>

          <div v-if="successMessage" class="alert success">{{ successMessage }}</div>
          <div v-if="errorMessage" class="alert error">{{ errorMessage }}</div>

          <form @submit.prevent="handleSave" class="profile-form">
            
            <div class="avatar-section">
              <img v-if="form.avatarUrl" :src="form.avatarUrl" class="main-avatar" />
              <div v-else class="main-avatar placeholder">{{ userInitials }}</div>
              
              <div class="avatar-actions">
                <h4>รูปโปรไฟล์</h4>
                <p>รองรับ JPG, PNG (ขนาดไม่เกิน 2MB)</p>
                <input type="file" ref="fileInputRef" @change="handleFileUpload" accept="image/*" style="display: none;" />
                <button type="button" @click="triggerFileInput" class="btn-upload" :disabled="loading">
                  อัปโหลดรูปภาพใหม่
                </button>
              </div>
            </div>

            <hr class="divider" />

            <div class="form-grid">
              <div class="form-group">
                <label>ชื่อผู้ใช้งาน (Username)</label>
                <input type="text" v-model="form.username" required :disabled="loading" />
              </div>
              
              <div class="form-group">
                <label>นามแฝง (Nickname)</label>
                <input type="text" v-model="form.nickname" placeholder="ชื่อเล่น หรือนามแฝง" :disabled="loading" />
              </div>

              <div class="form-group">
                <label>เพศ</label>
                <select v-model="form.gender" :disabled="loading" class="form-select">
                  <option value="">ไม่ระบุ</option>
                  <option value="MALE">ชาย</option>
                  <option value="FEMALE">หญิง</option>
                  <option value="OTHER">อื่นๆ</option>
                </select>
              </div>

              <div class="form-group">
                <label>วันเกิด</label>
                <input type="date" v-model="form.birthdate" :disabled="loading" />
              </div>
            </div>

            <div class="form-group full-width">
              <label>ข้อความแนะนำตัว (Bio)</label>
              <textarea v-model="form.bio" placeholder="บอกเล่าเรื่องราวการท่องเที่ยวของคุณให้เพื่อนๆ ฟังหน่อย..." rows="3" :disabled="loading"></textarea>
            </div>

            <div class="form-group full-width">
              <label>โซเชียลมีเดีย</label>
              <div class="social-links-grid">

                <div class="social-input-row">
                  <div class="social-icon facebook">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                    </svg>
                  </div>
                  <input type="url" v-model="form.facebookUrl" placeholder="https://facebook.com/username" :disabled="loading" />
                  <a v-if="form.facebookUrl" :href="form.facebookUrl" target="_blank" class="btn-open-link">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                    </svg>
                  </a>
                </div>

                <div class="social-input-row">
                  <div class="social-icon instagram">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                      <circle cx="12" cy="12" r="4"/>
                      <circle cx="17.5" cy="6.5" r="0.5" fill="white" stroke="none"/>
                    </svg>
                  </div>
                  <input type="url" v-model="form.instagramUrl" placeholder="https://instagram.com/username" :disabled="loading" />
                  <a v-if="form.instagramUrl" :href="form.instagramUrl" target="_blank" class="btn-open-link">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                    </svg>
                  </a>
                </div>

                <div class="social-input-row">
                  <div class="social-icon tiktok">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
                    </svg>
                  </div>
                  <input type="url" v-model="form.tiktokUrl" placeholder="https://tiktok.com/@username" :disabled="loading" />
                  <a v-if="form.tiktokUrl" :href="form.tiktokUrl" target="_blank" class="btn-open-link">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                    </svg>
                  </a>
                </div>

                <div class="social-input-row">
                  <div class="social-icon youtube">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
                      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#ff0000" stroke="none"/>
                    </svg>
                  </div>
                  <input type="url" v-model="form.youtubeUrl" placeholder="https://youtube.com/@channel" :disabled="loading" />
                  <a v-if="form.youtubeUrl" :href="form.youtubeUrl" target="_blank" class="btn-open-link">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                    </svg>
                  </a>
                </div>

                <div class="social-input-row">
                  <div class="social-icon twitter">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  <input type="url" v-model="form.twitterUrl" placeholder="https://x.com/username" :disabled="loading" />
                  <a v-if="form.twitterUrl" :href="form.twitterUrl" target="_blank" class="btn-open-link">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                    </svg>
                  </a>
                </div>

              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-save" :disabled="loading">
                {{ loading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง' }}
              </button>
            </div>

          </form>
        </template>

        <!-- ===== BOOKMARKS SECTION ===== -->
        <template v-else-if="activeSection === 'bookmarks'">
          <div class="content-header">
            <h2>🔖 ทริปที่บันทึกไว้</h2>
            <p>เฉพาะคุณเท่านั้นที่เห็นรายการนี้</p>
          </div>

          <div v-if="bookmarksLoading" class="bm-loading">กำลังโหลด...</div>

          <div v-else-if="bookmarks.length === 0" class="bm-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
            <p>ยังไม่มีทริปที่บันทึกไว้</p>
            <p class="bm-hint">กดปุ่ม "บันทึก" ในหน้าทริปที่คุณชอบ</p>
          </div>

          <div v-else class="bm-grid">
            <router-link
              v-for="trip in bookmarks"
              :key="trip.id"
              :to="`/trip/${trip.id}`"
              class="bm-card"
            >
              <div class="bm-photo">
                <img v-if="trip.photos?.length" :src="trip.photos[0]" :alt="trip.title" />
                <div v-else class="bm-photo-placeholder">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
                <div v-if="trip.tags?.length" class="bm-tags">
                  <span v-for="tag in trip.tags.slice(0,2)" :key="tag" class="bm-tag">{{ tag }}</span>
                </div>
              </div>
              <div class="bm-info">
                <h4 class="bm-title">{{ trip.title }}</h4>
                <p class="bm-desc">{{ cleanDescription(trip.description) }}</p>
              </div>
            </router-link>
          </div>
        </template>

      </main>

    </div>
  </div>
</template>

<style scoped>
/* ดีไซน์เดิมที่เราทำไว้ยังอยู่ครบ เพิ่มเติมสไตล์ฟอร์มใหม่นิดหน่อย */
.profile-page { background-color: var(--bg-secondary); min-height: calc(100vh - 72px); padding: 40px 20px; font-family: 'Kanit', sans-serif; }
.layout-grid { display: grid; grid-template-columns: 280px 1fr; gap: 30px; max-width: 1000px; margin: 0 auto; align-items: start; }

.sidebar { background: var(--bg-card); border-radius: 16px; padding: 24px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); border: 1px solid var(--border-light); }
.sidebar-user { display: flex; align-items: center; gap: 15px; padding-bottom: 24px; border-bottom: 1px solid #eee; margin-bottom: 15px; px-padding: 0 10px; }
.sidebar-avatar { width: 50px; height: 50px; border-radius: 50%; object-fit: cover; }
.sidebar-avatar.placeholder { background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; }
.user-info h3 { font-size: 1.1rem; color: var(--text-primary); margin: 0 0 4px 0; }
.user-info p { font-size: 0.85rem; color: var(--text-secondary); margin: 0; }
.sidebar-nav { display: flex; flex-direction: column; gap: 5px; }
.nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; color: var(--text-secondary); text-decoration: none; border-radius: 10px; font-weight: 500; transition: 0.2s; border: none; background: none; width: 100%; text-align: left; font-size: 1rem; cursor: pointer; }
.nav-item:hover { background: var(--bg-secondary); color: #007bff; }
.nav-item.active { background: var(--accent-light); color: #007bff; font-weight: 600; }
.sidebar-footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid var(--border-color); }
.logout-btn { color: #ef4444; }

.content-area { background: var(--bg-card); border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); border: 1px solid var(--border-light); }
.content-header { margin-bottom: 30px; }
.content-header h2 { font-size: 1.8rem; color: var(--text-primary); margin: 0 0 8px 0; }
.content-header p { color: var(--text-secondary); font-size: 1rem; margin: 0; }

.avatar-section { display: flex; align-items: center; gap: 24px; margin-bottom: 30px; }
.main-avatar { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
.main-avatar.placeholder { background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center; font-size: 3rem; font-weight: 700; }
.avatar-actions h4 { margin: 0 0 5px 0; font-size: 1.1rem; color: var(--text-primary); }
.avatar-actions p { margin: 0 0 12px 0; font-size: 0.9rem; color: var(--text-secondary); }

/* 💡 ปุ่มอัปโหลดรูป */
.btn-upload { background: var(--bg-card); border: 1px solid var(--accent); color: #007bff; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.btn-upload:hover { background: var(--accent-light); }

.divider { border: 0; border-top: 1px solid var(--border-color); margin: 30px 0; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
.form-group { margin-bottom: 20px; }
.form-group.full-width { grid-column: 1 / -1; margin-bottom: 24px; }
.form-group label { display: block; font-weight: 600; margin-bottom: 8px; color: var(--text-primary); font-size: 0.95rem; }
.form-group input, .form-group textarea, .form-select { width: 100%; padding: 12px 16px; border: 1px solid var(--border-color); border-radius: 10px; font-size: 1rem; font-family: inherit; transition: 0.2s; box-sizing: border-box; background: var(--bg-card); color: var(--text-primary); }
.form-group input:focus, .form-group textarea:focus, .form-select:focus { border-color: #007bff; outline: none; box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15); }
.form-group textarea { resize: vertical; min-height: 80px; }

.form-actions { display: flex; justify-content: flex-end; margin-top: 10px; }
.btn-save { background: #007bff; color: white; border: none; padding: 12px 28px; border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: 0.3s; }
.btn-save:hover:not(:disabled) { background: #0056b3; transform: translateY(-2px); }

.alert { padding: 14px 20px; border-radius: 10px; margin-bottom: 25px; font-size: 0.95rem; font-weight: 500; display: flex; align-items: center; }
.alert.success { background-color: #ecfdf5; color: #059669; border: 1px solid #d1fae5; }
.alert.error { background-color: #fef2f2; color: #dc2626; border: 1px solid #fee2e2; }

/* ✅ Social Links */
.social-links-grid { display: flex; flex-direction: column; gap: 10px; }
.social-input-row { display: flex; align-items: center; gap: 10px; }
.social-icon {
  width: 38px; height: 38px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.social-icon.facebook { background: #1877f2; }
.social-icon.instagram { background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); }
.social-icon.tiktok { background: #000000; }
.social-icon.youtube { background: #ff0000; }
.social-icon.twitter { background: #000000; }
.social-input-row input {
  flex: 1; padding: 10px 14px; border: 1px solid var(--border-color);
  border-radius: 10px; font-size: 0.9rem; font-family: inherit;
  background: var(--bg-card); color: var(--text-primary);
  transition: 0.2s; outline: none;
}
.social-input-row input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(0,123,255,0.12); }
.social-input-row input::placeholder { color: var(--text-muted); }
.btn-open-link {
  width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-tertiary); color: var(--text-muted);
  text-decoration: none; transition: 0.2s;
}
.btn-open-link:hover { background: var(--accent-light); color: var(--accent); }
.bm-loading { text-align: center; padding: 60px; color: var(--text-muted); }
.bm-empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px 20px; color: var(--text-muted); text-align: center; }
.bm-empty p { margin: 0; font-size: 1rem; }
.bm-hint { font-size: 0.85rem !important; }
.bm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
.bm-card { text-decoration: none; border-radius: 12px; overflow: hidden; border: 1px solid var(--border-light); background: var(--bg-card); transition: transform 0.2s, box-shadow 0.2s; }
.bm-card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.1); }
.bm-photo { position: relative; height: 140px; background: var(--bg-tertiary); overflow: hidden; }
.bm-photo img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
.bm-card:hover .bm-photo img { transform: scale(1.05); }
.bm-photo-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.bm-tags { position: absolute; bottom: 8px; left: 8px; display: flex; gap: 4px; }
.bm-tag { background: rgba(0,0,0,0.5); color: white; font-size: 0.7rem; padding: 2px 7px; border-radius: 10px; }
.bm-info { padding: 12px; }
.bm-title { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); margin: 0 0 6px; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
.bm-desc { font-size: 0.8rem; color: var(--text-secondary); margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.5; }

@media (max-width: 768px) {
  .layout-grid { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: 1fr; gap: 16px; }
  .content-area { padding: 20px 16px; }
  .avatar-section { flex-direction: column; align-items: flex-start; text-align: left; }
  .bm-grid { grid-template-columns: 1fr 1fr; }
  .profile-page { padding: 16px 12px; }
  .sidebar { padding: 16px 12px; }
}
</style>