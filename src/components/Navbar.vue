<script setup lang="ts">
import { ref, onMounted } from 'vue'

const currentUser = ref<any>(null)
const isDropdownOpen = ref(false)

onMounted(() => {
  const userString = localStorage.getItem('user')
  if (userString) {
    currentUser.value = JSON.parse(userString)
  }
})

function handleLogout() {
  localStorage.removeItem('user')
  localStorage.removeItem('token') // 👈 เพิ่มบรรทัดนี้ เพื่อทิ้งบัตร
  currentUser.value = null
  window.location.href = '/login'
}
</script>

<template>
  <nav class="navbar">
    <div class="container nav-content">
      <router-link to="/" class="logo" style="text-decoration: none;">
        Travel<span>Better</span>
      </router-link>
      
      <div class="menu">
        <router-link to="/" class="nav-link active">หน้าแรก</router-link>
        <a href="#" class="nav-link">ค้นหาทริป</a>
        
        <div v-if="!currentUser" class="auth-buttons">
          <router-link to="/login" class="btn-text" style="text-decoration: none;">
            เข้าสู่ระบบ
          </router-link>
          <router-link to="/register" class="btn-primary" style="text-decoration: none;">
            สมัครสมาชิก
          </router-link>
        </div>

        <div v-else class="user-menu-wrapper">
          <div v-if="isDropdownOpen" @click="isDropdownOpen = false" class="dropdown-backdrop"></div>

          <button @click="isDropdownOpen = !isDropdownOpen" class="user-profile-btn" :class="{ 'active': isDropdownOpen }">
            <img v-if="currentUser.avatarUrl" :src="currentUser.avatarUrl" alt="Avatar" class="avatar-square" />
            <div v-else class="avatar-square placeholder">
              {{ currentUser.username.charAt(0).toUpperCase() }}
            </div>
            
            <span class="username">{{ currentUser?.profile?.nickname || currentUser.username }}</span>
            
            <svg class="chevron" :class="{ 'rotate': isDropdownOpen }" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          <div v-if="isDropdownOpen" class="dropdown-menu" @click="isDropdownOpen = false">
            <div class="dropdown-header">
              <p class="role">สมาชิกทั่วไป</p>
              <p class="email">{{ currentUser.email }}</p>
            </div>
            
            <div class="divider"></div>
            
            <router-link :to="`/@${currentUser.username}`" class="dropdown-item">
              <span class="icon">👤</span> โปรไฟล์ของฉัน
            </router-link>

            <router-link to="/profile" class="dropdown-item">
              <span class="icon">⚙️</span> ตั้งค่าบัญชี
            </router-link>

            <a href="#" class="dropdown-item">
              <span class="icon">📝</span> จัดการทริป
            </a>

            <router-link to="/create-trip" class="dropdown-item">
              <span class="icon">✍️</span> เขียนทริปใหม่
            </router-link>
            
            <div class="divider"></div>
            
            <button @click="handleLogout" class="dropdown-item text-red">
              <span class="icon">🚪</span> ออกจากระบบ
            </button>
          </div>
        </div>

      </div>
    </div>
  </nav>
</template>

<style scoped>
/* สไตล์ทั้งหมดเหมือนเดิมเป๊ะครับ */
.navbar { background: #ffffff; border-bottom: 1px solid #f0f0f0; position: sticky; top: 0; z-index: 1000; height: 72px; display: flex; align-items: center; }
.nav-content { display: flex; justify-content: space-between; align-items: center; width: 100%; }
.logo { font-size: 1.6rem; font-weight: 800; color: #1a1a1a; letter-spacing: -1px; }
.logo span { color: #007bff; }
.menu { display: flex; align-items: center; gap: 30px; }
.nav-link { text-decoration: none; color: #666; font-weight: 500; transition: 0.2s; }
.nav-link.active, .nav-link:hover { color: #007bff; }
.auth-buttons { display: flex; gap: 15px; align-items: center; margin-left: 20px; }
.btn-text { background: none; border: none; color: #444; font-weight: 600; cursor: pointer; }
.btn-primary { background: #007bff; color: white; border: none; padding: 10px 24px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: 0.3s; }
.btn-primary:hover { background: #0056b3; transform: translateY(-2px); }

.user-menu-wrapper { position: relative; margin-left: 20px; padding-left: 20px; border-left: 1px solid #eee; }
.user-profile-btn { display: flex; align-items: center; gap: 10px; background: transparent; border: none; cursor: pointer; padding: 6px 12px; border-radius: 10px; transition: 0.2s; font-family: inherit; }
.user-profile-btn:hover, .user-profile-btn.active { background-color: #f8f9fa; }

.avatar-square { width: 38px; height: 38px; border-radius: 8px; object-fit: cover; border: 1px solid #eaeaea; }
.avatar-square.placeholder { background-color: #007bff; color: white; display: flex; justify-content: center; align-items: center; font-weight: 700; font-size: 1.2rem; border: none; }
.username { font-weight: 600; color: #333; font-size: 0.95rem; }
.chevron { color: #888; transition: transform 0.3s ease; }
.chevron.rotate { transform: rotate(180deg); }

.dropdown-menu { position: absolute; top: calc(100% + 10px); right: 0; background: white; min-width: 220px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); border: 1px solid #f0f0f0; padding: 8px 0; z-index: 1001; animation: slideDown 0.2s ease-out forwards; }
@keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
.dropdown-header { padding: 12px 20px; }
.dropdown-header .role { margin: 0 0 2px 0; font-weight: 600; color: #333; font-size: 0.95rem; }
.dropdown-header .email { margin: 0; color: #888; font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; }

.divider { height: 1px; background: #f0f0f0; margin: 8px 0; }
.dropdown-item { display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px 20px; background: none; border: none; text-align: left; font-size: 0.95rem; color: #444; cursor: pointer; text-decoration: none; transition: 0.2s; font-family: inherit; box-sizing: border-box; }
.dropdown-item:hover { background-color: #f8f9fa; color: #007bff; }
.dropdown-item .icon { font-size: 1.1rem; }
.dropdown-item.text-red { color: #dc3545; }
.dropdown-item.text-red:hover { background-color: #fff5f5; color: #dc3545; }
.dropdown-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 1000; }

@media (max-width: 768px) {
  .logo { font-size: 1.4rem; }
  .nav-link { display: none; }
  .auth-buttons { gap: 10px; margin-left: 0; }
  .user-menu-wrapper { margin-left: 0; padding-left: 0; border-left: none; }
  .username { display: none; }
  .dropdown-menu { right: -10px; }
}
</style>