<script setup lang="ts">
import { ref, onMounted } from 'vue'

// ตัวแปรเก็บข้อมูลผู้ใช้
const currentUser = ref<any>(null)

// เมื่อ Navbar โหลดขึ้นมา ให้เช็คว่ามี User ล็อกอินค้างไว้ไหม
onMounted(() => {
  const userString = localStorage.getItem('user')
  if (userString) {
    currentUser.value = JSON.parse(userString)
  }
})

// ฟังก์ชันออกจากระบบ
function handleLogout() {
  localStorage.removeItem('user') // ลบข้อมูลออกจากเบราว์เซอร์
  currentUser.value = null // เคลียร์ค่าในตัวแปร
  window.location.href = '/login' // เด้งไปหน้าล็อกอิน
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

        <div v-else class="user-profile">
          <router-link to="/profile" class="profile-link">
            <img v-if="currentUser.avatarUrl" :src="currentUser.avatarUrl" alt="Avatar" class="avatar-img" />
            <div v-else class="avatar">
              {{ currentUser.username.charAt(0).toUpperCase() }}
            </div>
            <span class="username">สวัสดี, {{ currentUser.username }}</span>
          </router-link>
          
          <button @click="handleLogout" class="btn-logout">ออกจากระบบ</button>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
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

.profile-link { display: flex; align-items: center; gap: 12px; text-decoration: none; cursor: pointer; }
.profile-link:hover .username { color: #007bff; }
.avatar-img { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }

/* สไตล์ใหม่สำหรับ User Profile ตอน Login แล้ว */
.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 20px;
  padding-left: 20px;
  border-left: 1px solid #eee;
}
.avatar {
  width: 36px;
  height: 36px;
  background-color: #007bff;
  color: white;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 700;
  font-size: 1.1rem;
}
.username {
  font-weight: 600;
  color: #333;
}
.btn-logout {
  background: #fff0f0;
  color: #dc3545;
  border: 1px solid #ffdcdc;
  padding: 6px 14px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
  margin-left: 10px;
}
.btn-logout:hover {
  background: #dc3545;
  color: white;
}

/* สำหรับมือถือ */
@media (max-width: 768px) {
  .logo { font-size: 1.4rem; }
  .nav-link { display: none; }
  .auth-buttons { gap: 10px; margin-left: 0; }
  .user-profile { margin-left: 0; padding-left: 0; border-left: none; }
  .username { display: none; } 
}
</style>