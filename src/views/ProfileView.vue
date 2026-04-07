<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { updateProfile } from '../api/userApi'

const router = useRouter()
const currentUser = ref<any>(null)
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

// ฟอร์มเก็บข้อมูลทั้งหมด
const form = ref({
  username: '',
  nickname: '',
  bio: '',
  gender: '',
  birthdate: '',
  socialLink: '',
  avatarUrl: ''
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
    const updatedUser = await updateProfile(currentUser.value.id, form.value)

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
  window.location.href = '/login'
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
          <a href="#" class="nav-item active"><span class="icon">👤</span> ข้อมูลโปรไฟล์</a>
          <a href="#" class="nav-item"><span class="icon">🔒</span> ความปลอดภัย</a>
        </nav>

        <div class="sidebar-footer">
          <button @click="handleLogout" class="nav-item logout-btn"><span class="icon">🚪</span> ออกจากระบบ</button>
        </div>
      </aside>

      <main class="content-area">
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
            <label>ลิงก์โซเชียลมีเดีย (Facebook, Instagram ฯลฯ)</label>
            <input type="url" v-model="form.socialLink" placeholder="https://..." :disabled="loading" />
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-save" :disabled="loading">
              {{ loading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง' }}
            </button>
          </div>

        </form>
      </main>

    </div>
  </div>
</template>

<style scoped>
/* ดีไซน์เดิมที่เราทำไว้ยังอยู่ครบ เพิ่มเติมสไตล์ฟอร์มใหม่นิดหน่อย */
.profile-page { background-color: #f4f7f6; min-height: calc(100vh - 72px); padding: 40px 20px; font-family: 'Kanit', sans-serif; }
.layout-grid { display: grid; grid-template-columns: 280px 1fr; gap: 30px; max-width: 1000px; margin: 0 auto; align-items: start; }

.sidebar { background: white; border-radius: 16px; padding: 24px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); border: 1px solid #f0f0f0; }
.sidebar-user { display: flex; align-items: center; gap: 15px; padding-bottom: 24px; border-bottom: 1px solid #eee; margin-bottom: 15px; px-padding: 0 10px; }
.sidebar-avatar { width: 50px; height: 50px; border-radius: 50%; object-fit: cover; }
.sidebar-avatar.placeholder { background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; }
.user-info h3 { font-size: 1.1rem; color: #111; margin: 0 0 4px 0; }
.user-info p { font-size: 0.85rem; color: #666; margin: 0; }
.sidebar-nav { display: flex; flex-direction: column; gap: 5px; }
.nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; color: #555; text-decoration: none; border-radius: 10px; font-weight: 500; transition: 0.2s; border: none; background: none; width: 100%; text-align: left; font-size: 1rem; cursor: pointer; }
.nav-item:hover { background: #f8fafc; color: #007bff; }
.nav-item.active { background: #eff6ff; color: #007bff; font-weight: 600; }
.sidebar-footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; }
.logout-btn { color: #ef4444; }

.content-area { background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); border: 1px solid #f0f0f0; }
.content-header { margin-bottom: 30px; }
.content-header h2 { font-size: 1.8rem; color: #111; margin: 0 0 8px 0; }
.content-header p { color: #666; font-size: 1rem; margin: 0; }

.avatar-section { display: flex; align-items: center; gap: 24px; margin-bottom: 30px; }
.main-avatar { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
.main-avatar.placeholder { background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center; font-size: 3rem; font-weight: 700; }
.avatar-actions h4 { margin: 0 0 5px 0; font-size: 1.1rem; color: #333; }
.avatar-actions p { margin: 0 0 12px 0; font-size: 0.9rem; color: #666; }

/* 💡 ปุ่มอัปโหลดรูป */
.btn-upload { background: white; border: 1px solid #cce5ff; color: #007bff; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.btn-upload:hover { background: #e6f2ff; }

.divider { border: 0; border-top: 1px solid #eee; margin: 30px 0; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
.form-group { margin-bottom: 20px; }
.form-group.full-width { grid-column: 1 / -1; margin-bottom: 24px; }
.form-group label { display: block; font-weight: 600; margin-bottom: 8px; color: #333; font-size: 0.95rem; }
.form-group input, .form-group textarea, .form-select { width: 100%; padding: 12px 16px; border: 1px solid #ddd; border-radius: 10px; font-size: 1rem; font-family: inherit; transition: 0.2s; box-sizing: border-box; background: white; }
.form-group input:focus, .form-group textarea:focus, .form-select:focus { border-color: #007bff; outline: none; box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15); }
.form-group textarea { resize: vertical; min-height: 80px; }

.form-actions { display: flex; justify-content: flex-end; margin-top: 10px; }
.btn-save { background: #007bff; color: white; border: none; padding: 12px 28px; border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: 0.3s; }
.btn-save:hover:not(:disabled) { background: #0056b3; transform: translateY(-2px); }

.alert { padding: 14px 20px; border-radius: 10px; margin-bottom: 25px; font-size: 0.95rem; font-weight: 500; display: flex; align-items: center; }
.alert.success { background-color: #ecfdf5; color: #059669; border: 1px solid #d1fae5; }
.alert.error { background-color: #fef2f2; color: #dc2626; border: 1px solid #fee2e2; }

@media (max-width: 768px) {
  .layout-grid { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: 1fr; gap: 16px; }
  .content-area { padding: 24px; }
  .avatar-section { flex-direction: column; align-items: flex-start; text-align: left; }
}
</style>