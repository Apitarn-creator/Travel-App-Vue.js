<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { updateProfile } from '../api/userApi'

const router = useRouter()
const currentUser = ref<any>(null)
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const form = ref({
  username: '',
  avatarUrl: ''
})

// ดึงข้อมูลผู้ใช้จาก localStorage
onMounted(() => {
  const userString = localStorage.getItem('user')
  if (userString) {
    currentUser.value = JSON.parse(userString)
    form.value.username = currentUser.value.username
    form.value.avatarUrl = currentUser.value.avatarUrl || ''
  } else {
    router.push('/login')
  }
})

// ดึงตัวอักษรตัวแรกมาทำเป็นรูปโปรไฟล์จำลอง
const userInitials = computed(() => {
  return currentUser.value?.username ? currentUser.value.username.charAt(0).toUpperCase() : '?'
})

async function handleSave() {
  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const updatedUser = await updateProfile(currentUser.value.id, {
      username: form.value.username,
      avatarUrl: form.value.avatarUrl
    })

    localStorage.setItem('user', JSON.stringify(updatedUser))
    currentUser.value = updatedUser
    
    successMessage.value = 'บันทึกข้อมูลสำเร็จ! 🎉'
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
            <h3>{{ currentUser?.username }}</h3>
            <p>สมาชิกทั่วไป</p>
          </div>
        </div>

        <nav class="sidebar-nav">
          <a href="#" class="nav-item active">
            <span class="icon">👤</span> ข้อมูลโปรไฟล์
          </a>
          <a href="#" class="nav-item">
            <span class="icon">🔒</span> ความปลอดภัย
          </a>
          <a href="#" class="nav-item">
            <span class="icon">🔔</span> การแจ้งเตือน
          </a>
          <a href="#" class="nav-item">
            <span class="icon">⚙️</span> ตั้งค่าระบบ
          </a>
        </nav>

        <div class="sidebar-footer">
          <button @click="handleLogout" class="nav-item logout-btn">
            <span class="icon">🚪</span> ออกจากระบบ
          </button>
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
              <p>ใส่ลิงก์ URL รูปภาพของคุณ (แนะนำขนาด 1:1)</p>
              <input type="text" v-model="form.avatarUrl" class="url-input" placeholder="https://example.com/my-photo.jpg" :disabled="loading" />
            </div>
          </div>

          <hr class="divider" />

          <div class="form-grid">
            <div class="form-group">
              <label>ชื่อผู้ใช้งาน</label>
              <input type="text" v-model="form.username" required :disabled="loading" />
            </div>
            
            <div class="form-group">
              <label>อีเมล (ไม่อนุญาตให้เปลี่ยน)</label>
              <input type="email" :value="currentUser?.email" disabled class="disabled-input" />
            </div>
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
/* โครงสร้างหลัก */
.profile-page { background-color: #f4f7f6; min-height: calc(100vh - 72px); padding: 40px 20px; font-family: 'Kanit', sans-serif; }
.layout-grid { display: grid; grid-template-columns: 280px 1fr; gap: 30px; max-width: 1000px; margin: 0 auto; align-items: start; }

/* Sidebar */
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
.nav-item .icon { font-size: 1.2rem; }

.sidebar-footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; }
.logout-btn { color: #ef4444; }
.logout-btn:hover { background: #fef2f2; color: #dc2626; }

/* Main Content */
.content-area { background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); border: 1px solid #f0f0f0; }
.content-header { margin-bottom: 30px; }
.content-header h2 { font-size: 1.8rem; color: #111; margin: 0 0 8px 0; }
.content-header p { color: #666; font-size: 1rem; margin: 0; }

/* Avatar Section */
.avatar-section { display: flex; align-items: center; gap: 24px; margin-bottom: 30px; }
.main-avatar { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
.main-avatar.placeholder { background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center; font-size: 3rem; font-weight: 700; }
.avatar-actions h4 { margin: 0 0 5px 0; font-size: 1.1rem; color: #333; }
.avatar-actions p { margin: 0 0 12px 0; font-size: 0.9rem; color: #666; }
.url-input { width: 100%; max-width: 350px; padding: 10px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 0.95rem; transition: 0.2s; }
.url-input:focus { border-color: #007bff; outline: none; box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15); }

.divider { border: 0; border-top: 1px solid #eee; margin: 30px 0; }

/* Form Grid */
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 30px; }
.form-group label { display: block; font-weight: 600; margin-bottom: 8px; color: #333; font-size: 0.95rem; }
.form-group input { width: 100%; padding: 12px 16px; border: 1px solid #ddd; border-radius: 10px; font-size: 1rem; transition: 0.2s; box-sizing: border-box; }
.form-group input:focus:not(:disabled) { border-color: #007bff; outline: none; box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15); }
.disabled-input { background-color: #f8fafc; color: #94a3b8; cursor: not-allowed; border-color: #e2e8f0 !important; }

/* Buttons & Alerts */
.form-actions { display: flex; justify-content: flex-end; }
.btn-save { background: #007bff; color: white; border: none; padding: 12px 28px; border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: 0.3s; }
.btn-save:hover:not(:disabled) { background: #0056b3; transform: translateY(-2px); }
.btn-save:disabled { background: #93c5fd; cursor: not-allowed; }

.alert { padding: 14px 20px; border-radius: 10px; margin-bottom: 25px; font-size: 0.95rem; font-weight: 500; display: flex; align-items: center; }
.alert.success { background-color: #ecfdf5; color: #059669; border: 1px solid #d1fae5; }
.alert.error { background-color: #fef2f2; color: #dc2626; border: 1px solid #fee2e2; }

/* รองรับมือถือ */
@media (max-width: 768px) {
  .layout-grid { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: 1fr; gap: 16px; }
  .content-area { padding: 24px; }
  .avatar-section { flex-direction: column; align-items: flex-start; text-align: left; }
  .url-input { max-width: 100%; }
}
</style>