<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../api/userApi' // 👈 เรียกใช้ API ที่เราสร้างไว้

const router = useRouter()

const form = ref({
  email: '',
  password: ''
})

const loading = ref(false)
const errorMessage = ref('')

async function handleLogin() {
  errorMessage.value = ''
  loading.value = true

  try {
    // 1. ส่งข้อมูลไปเช็คที่ Spring Boot
    const userData = await login({
      email: form.value.email,
      password: form.value.password
    })

    // 2. จำข้อมูลผู้ใช้ลงในเบราว์เซอร์ (localStorage)
    localStorage.setItem('user', JSON.stringify(userData))
    
    alert(`ยินดีต้อนรับคุณ ${userData.username} ! 🎒`)
    
    // 3. พาไปหน้าแรก และบังคับให้หน้ารีเฟรช 1 รอบเพื่อให้ Navbar อัปเดต
    window.location.href = '/'

  } catch (error: any) {
    errorMessage.value = error.message || 'เข้าสู่ระบบไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}

// ฟังก์ชันจำลองเมื่อกดปุ่ม Social
function loginWithGoogle() {
  alert('ระบบกำลังเชื่อมต่อกับ Google...')
}

function loginWithFacebook() {
  alert('ระบบกำลังเชื่อมต่อกับ Facebook...')
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h2>เข้าสู่ระบบ 🎒</h2>
        <p>ยินดีต้อนรับกลับมา! พร้อมที่จะไปเที่ยวหรือยัง?</p>
      </div>

      <div v-if="errorMessage" class="error-box">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label>อีเมล</label>
          <input type="email" v-model="form.email" placeholder="example@email.com" required :disabled="loading" />
        </div>

        <div class="form-group">
          <label>รหัสผ่าน</label>
          <input type="password" v-model="form.password" placeholder="กรอกรหัสผ่านของคุณ" required :disabled="loading" />
        </div>

        <button type="submit" class="btn-submit" :disabled="loading">
          {{ loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ' }}
        </button>
      </form>
      
      <div class="divider">
        <span>หรือเข้าสู่ระบบด้วย</span>
      </div>

      <div class="social-login">
        <button type="button" class="btn-social btn-google" @click="loginWithGoogle">
          <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Google
        </button>
        <button type="button" class="btn-social btn-facebook" @click="loginWithFacebook">
          <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#fff"/></svg>
          Facebook
        </button>
      </div>
      
      <div class="login-footer">
        <p>ยังไม่มีบัญชีใช่ไหม? <router-link to="/register" class="register-link">สมัครสมาชิก</router-link></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container { display: flex; justify-content: center; align-items: center; min-height: calc(100vh - 72px); background-color: #fbfcfd; padding: 40px 20px; }
.login-card { background: white; width: 100%; max-width: 400px; border-radius: 20px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #f0f0f0; }
.login-header { text-align: center; margin-bottom: 30px; }
.login-header h2 { font-size: 2rem; color: #1a1a1a; margin-bottom: 10px; }
.login-header p { color: #666; font-size: 1rem; }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; font-weight: 600; margin-bottom: 8px; color: #333; }
.form-group input { width: 100%; padding: 12px 15px; border: 1px solid #ddd; border-radius: 10px; font-size: 1rem; font-family: inherit; transition: all 0.3s; box-sizing: border-box; }
.form-group input:focus { border-color: #007bff; outline: none; box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15); }
.btn-submit { width: 100%; background: #007bff; color: white; border: none; padding: 14px; border-radius: 10px; font-size: 1.1rem; font-weight: 700; cursor: pointer; margin-top: 10px; transition: 0.3s; }
.btn-submit:hover:not(:disabled) { background: #0056b3; transform: translateY(-2px); }
.btn-submit:disabled { background: #a0c4ff; cursor: not-allowed; }

/* 💡 สไตล์กล่องแจ้งเตือน Error */
.error-box {
  background-color: #ffe5e5;
  color: #d63031;
  padding: 12px 15px;
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 0.95rem;
  font-weight: 500;
  text-align: center;
  border: 1px solid #ffcccc;
}

.divider { display: flex; align-items: center; text-align: center; margin: 25px 0; color: #999; }
.divider::before, .divider::after { content: ''; flex: 1; border-bottom: 1px solid #eee; }
.divider span { padding: 0 15px; font-size: 0.9rem; font-weight: 500; }
.social-login { display: flex; gap: 15px; margin-bottom: 20px; }
.btn-social { flex: 1; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 12px; border-radius: 10px; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: 0.3s; font-family: inherit; }
.btn-google { background: white; border: 1px solid #ddd; color: #444; }
.btn-google:hover { background: #f8f9fa; border-color: #ccc; }
.btn-facebook { background: #1877f2; border: 1px solid #1877f2; color: white; }
.btn-facebook:hover { background: #166fe5; }
.login-footer { text-align: center; margin-top: 25px; font-size: 0.95rem; color: #666; }
.register-link { color: #007bff; text-decoration: none; font-weight: 600; }
.register-link:hover { text-decoration: underline; }

@media (max-width: 480px) {
  .login-card { padding: 30px 20px; }
  .login-header h2 { font-size: 1.6rem; }
  .social-login { flex-direction: column; gap: 10px; }
}
</style>