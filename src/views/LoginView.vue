<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login, loginWithGoogleAPI } from '../api/userApi'


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
    const data = await login({
      email: form.value.email,
      password: form.value.password
    })

    // 2. 💡 เก็บ Token (บัตรพนักงาน) และข้อมูลผู้ใช้ลงใน localStorage
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    
    // แจ้งเตือนโดยดึงชื่อจาก data.user
    alert(`ยินดีต้อนรับคุณ ${data.user.username} ! 🎒`)
    
    // 3. พาไปหน้าแรก และบังคับให้หน้ารีเฟรช 1 รอบเพื่อให้ Navbar อัปเดต
    window.location.href = '/'

  } catch (error: any) {
    errorMessage.value = error.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
  } finally {
    loading.value = false
  }
}

// 💡 ฟังก์ชันทำงานเมื่อกด Login with Google สำเร็จ
const handleGoogleLoginSuccess = async (response: any) => {
  try {
    loading.value = true
    errorMessage.value = ''
    
    // 1. รับ Token จาก Google
    const googleToken = response.credential
    
    // 2. โยนไปให้ Spring Boot ตรวจสอบและออก JWT ของระบบเราให้
    const data = await loginWithGoogleAPI(googleToken)
    
    // 3. เก็บ JWT และข้อมูล User ลงเครื่อง (เหมือนระบบล็อกอินปกติเป๊ะ!)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    
    alert(`ยินดีต้อนรับคุณ ${data.user.username} ! 🎒`)
    window.location.href = '/' // กลับหน้าแรก
  } catch (error: any) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}

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
        <div class="social-login">
          <GoogleLogin :callback="handleGoogleLoginSuccess" prompt />
        </div>
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