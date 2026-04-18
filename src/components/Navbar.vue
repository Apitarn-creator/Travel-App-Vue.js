<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { getUnreadCount } from '../api/userApi'

const currentUser = ref<any>(null)
const isDropdownOpen = ref(false)
const unreadCount = ref(0)
const isDark = ref(false)
let pollInterval: any = null

onMounted(() => {
  const userString = localStorage.getItem('user')
  if (userString) {
    currentUser.value = JSON.parse(userString)
    fetchUnread()
    pollInterval = setInterval(fetchUnread, 30000)
  }
  // โหลด theme จาก localStorage
  const saved = localStorage.getItem('theme')
  if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true
    document.documentElement.setAttribute('data-theme', 'dark')
  }
})

onUnmounted(() => { if (pollInterval) clearInterval(pollInterval) })

async function fetchUnread() {
  if (!localStorage.getItem('token')) return
  unreadCount.value = await getUnreadCount()
}

function toggleDark() {
  isDark.value = !isDark.value
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

function handleLogout() {
  localStorage.removeItem('user')
  localStorage.removeItem('token')
  currentUser.value = null
  window.location.href = '/login'
}
</script>

<template>
  <nav class="navbar">
    <div class="nav-content">
      <router-link to="/" class="logo" style="text-decoration: none;">
        Travel<span>Better</span>
      </router-link>
      
      <div class="menu">
        <router-link to="/" class="nav-link active">หน้าแรก</router-link>
        <router-link to="/explore" class="nav-link" style="display:flex;align-items:center;gap:5px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5"/>
          </svg>
          สำรวจ
        </router-link>
        <router-link to="/search" class="nav-link" style="display:flex;align-items:center;gap:5px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          ค้นหา
        </router-link>
        
        <div v-if="!currentUser" class="auth-buttons">
          <router-link to="/login" class="btn-text" style="text-decoration: none;">
            เข้าสู่ระบบ
          </router-link>
          <router-link to="/register" class="btn-primary" style="text-decoration: none;">
            สมัครสมาชิก
          </router-link>
        </div>

        <div v-else class="right-actions">
          <!-- 🌙 Dark mode toggle -->
          <button class="dark-toggle" @click="toggleDark" :title="isDark ? 'โหมดสว่าง' : 'โหมดมืด'">
            <span v-if="isDark">☀️</span>
            <span v-else>🌙</span>
          </button>

          <!-- 🔔 Notification Bell -->
          <router-link to="/notifications" class="bell-btn" title="การแจ้งเตือน" @click="unreadCount = 0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span v-if="unreadCount > 0" class="badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
          </router-link>

          <div class="user-menu-wrapper">
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
          </div><!-- end dropdown-menu -->
          </div><!-- end user-menu-wrapper -->
        </div><!-- end right-actions -->
      </div><!-- end menu -->
    </div><!-- end nav-content -->
  </nav>
</template>

<style scoped>
.navbar {
  background: var(--navbar-bg);
  border-bottom: 1px solid var(--navbar-border);
  position: sticky; top: 0; z-index: 1000;
  height: 72px; display: flex; align-items: center;
  transition: background 0.3s;
}
.nav-content { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 0 40px; }
.logo { font-size: 1.6rem; font-weight: 800; color: var(--text-primary); letter-spacing: -1px; }
.logo span { color: var(--accent); }
.menu { display: flex; align-items: center; gap: 30px; }
.nav-link { text-decoration: none; color: var(--text-secondary); font-weight: 500; transition: 0.2s; }
.nav-link.active, .nav-link:hover { color: var(--accent); }
.auth-buttons { display: flex; gap: 15px; align-items: center; margin-left: 20px; }
.btn-text { background: none; border: none; color: var(--text-secondary); font-weight: 600; cursor: pointer; font-family: inherit; }
.btn-primary { background: var(--accent); color: white; border: none; padding: 10px 24px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: 0.3s; }
.btn-primary:hover { background: var(--accent-hover); transform: translateY(-2px); }
.right-actions { display: flex; align-items: center; gap: 4px; }
.dark-toggle { display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 10px; background: none; border: none; cursor: pointer; font-size: 1.1rem; transition: background 0.2s; }
.dark-toggle:hover { background: var(--bg-tertiary); }
.bell-btn { position: relative; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 10px; color: var(--text-secondary); text-decoration: none; transition: 0.2s; }
.bell-btn:hover { background: var(--bg-tertiary); color: var(--accent); }
.badge { position: absolute; top: 4px; right: 4px; background: #ef4444; color: white; font-size: 0.65rem; font-weight: 700; min-width: 16px; height: 16px; border-radius: 8px; padding: 0 4px; display: flex; align-items: center; justify-content: center; }
.user-menu-wrapper { position: relative; margin-left: 8px; padding-left: 16px; border-left: 1px solid var(--border-color); }
.user-profile-btn { display: flex; align-items: center; gap: 10px; background: transparent; border: none; cursor: pointer; padding: 6px 12px; border-radius: 10px; transition: 0.2s; font-family: inherit; }
.user-profile-btn:hover, .user-profile-btn.active { background: var(--bg-tertiary); }
.avatar-square { width: 38px; height: 38px; border-radius: 8px; object-fit: cover; border: 1px solid var(--border-color); }
.avatar-square.placeholder { background: var(--accent); color: white; display: flex; justify-content: center; align-items: center; font-weight: 700; font-size: 1.2rem; border: none; }
.username { font-weight: 600; color: var(--text-primary); font-size: 0.95rem; }
.chevron { color: var(--text-muted); transition: transform 0.3s ease; }
.chevron.rotate { transform: rotate(180deg); }
.dropdown-menu { position: absolute; top: calc(100% + 10px); right: 0; background: var(--bg-card); min-width: 220px; border-radius: 12px; box-shadow: var(--shadow-lg); border: 1px solid var(--border-color); padding: 8px 0; z-index: 1001; animation: slideDown 0.2s ease-out forwards; }
@keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
.dropdown-header { padding: 12px 20px; }
.dropdown-header .role { margin: 0 0 2px 0; font-weight: 600; color: var(--text-primary); font-size: 0.95rem; }
.dropdown-header .email { margin: 0; color: var(--text-muted); font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; }
.divider { height: 1px; background: var(--border-color); margin: 8px 0; }
.dropdown-item { display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px 20px; background: none; border: none; text-align: left; font-size: 0.95rem; color: var(--text-secondary); cursor: pointer; text-decoration: none; transition: 0.2s; font-family: inherit; box-sizing: border-box; }
.dropdown-item:hover { background: var(--bg-hover); color: var(--accent); }
.dropdown-item .icon { font-size: 1.1rem; }
.dropdown-item.text-red { color: #dc3545; }
.dropdown-item.text-red:hover { background: #fff5f5; color: #dc3545; }
.dropdown-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 1000; }
@media (max-width: 768px) {
  .nav-content { padding: 0 16px; }
  .logo { font-size: 1.4rem; }
  .nav-link { display: none; }
  .auth-buttons { gap: 10px; margin-left: 0; }
  .user-menu-wrapper { margin-left: 0; padding-left: 0; border-left: none; }
  .username { display: none; }
  .dropdown-menu { right: -10px; }
}
</style>
