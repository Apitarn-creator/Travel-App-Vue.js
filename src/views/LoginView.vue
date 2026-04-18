<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login, loginWithGoogleAPI, loginWithFacebookAPI } from '../api/userApi'
import { googleOneTap } from 'vue3-google-login'
import Button from 'primevue/button';


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

    const googleToken = response.credential

    if (!googleToken || typeof googleToken !== 'string') {
      errorMessage.value = 'ไม่ได้รับ Token จาก Google กรุณาลองใหม่'
      loading.value = false
      return
    }
    
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

// 💡 ฟังก์ชันทำงานเมื่อกดปุ่ม Facebook
// 💡 1. แยกฟังก์ชัน async ออกมาไว้ข้างนอก
const processFacebookLogin = async (fbToken: string) => {
  try {
    const data = await loginWithFacebookAPI(fbToken)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    alert(`ยินดีต้อนรับคุณ ${data.user.username} ! 🎒`)
    window.location.href = '/'
  } catch (error: any) {
    errorMessage.value = error.message
    loading.value = false
  }
}

// 💡 2. แก้ฟังก์ชันคลิกปุ่ม Facebook (ตัดคำว่า async ออกแล้ว!)
const handleFacebookLogin = () => {
  loading.value = true
  errorMessage.value = ''
  const FB = (window as any).FB

  if (!FB) {
    errorMessage.value = 'ระบบ Facebook ยังไม่พร้อมใช้งาน กรุณารีเฟรชหน้าเว็บ'
    loading.value = false
    return
  }

  // 💡 เอาคำว่า async ออก ใช้ (response: any) ธรรมดา
  FB.login((response: any) => {
    if (response.authResponse) {
      // โยน Token ไปให้ฟังก์ชันด้านบนจัดการต่อ
      processFacebookLogin(response.authResponse.accessToken)
    } else {
      loading.value = false
    }
  }, { scope: 'public_profile,email' })
}

// ✅ ใช้ googleOneTap() แทน <GoogleLogin> component
// เพราะ googleOneTap ส่ง credential (ID Token) กลับมาตรงๆ ไม่ใช่ code หรือ access_token
const handleGoogleButtonClick = async () => {
  try {
    loading.value = true
    errorMessage.value = ''

    const response = await googleOneTap()
    await handleGoogleLoginSuccess(response)

  } catch (error: any) {
    errorMessage.value = error?.message || 'ยกเลิกการเข้าสู่ระบบด้วย Google'
    loading.value = false
  }
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

      <div class="social-login-group">
          
        <!-- ✅ ใช้ปุ่มธรรมดา + googleOneTap() แทน <GoogleLogin> component -->
        <Button 
          label="Google" 
          icon="pi pi-google"
          @click="handleGoogleButtonClick"
          :disabled="loading"
          style="background-color: #ffffff; color: #3c4043; border: 1px solid #dadce0; padding: 10px; font-weight: 600; border-radius: 12px; flex: 1;"
        />

        <Button 
          label="Facebook" 
          icon="pi pi-facebook" 
          @click.prevent="handleFacebookLogin" 
          style="background-color: #1877f2; border: none; padding: 10px; font-weight: 600; border-radius: 12px; flex: 1;"
        />
        
      </div>

      
      
      <div class="login-footer">
        <p>ยังไม่มีบัญชีใช่ไหม? <router-link to="/register" class="register-link">สมัครสมาชิก</router-link></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container { display: flex; justify-content: center; align-items: center; min-height: calc(100vh - 72px); background-color: #fbfcfd; padding: 40px 20px; }
.login-card { background: var(--bg-card); width: 100%; max-width: 400px; border-radius: 20px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid var(--border-light); }
.login-header { text-align: center; margin-bottom: 30px; }
.login-header h2 { font-size: 2rem; color: var(--text-primary); margin-bottom: 10px; }
.login-header p { color: var(--text-secondary); font-size: 1rem; }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; font-weight: 600; margin-bottom: 8px; color: var(--text-primary); }
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
.btn-google { background: var(--bg-card); border: 1px solid #ddd; color: #444; }
.btn-google:hover { background: var(--bg-secondary); border-color: #ccc; }
.btn-facebook { background: #1877f2; border: 1px solid #1877f2; color: white; }
.btn-facebook:hover { background: #166fe5; }
.login-footer { text-align: center; margin-top: 25px; font-size: 0.95rem; color: var(--text-secondary); }
.register-link { color: #007bff; text-decoration: none; font-weight: 600; }
.register-link:hover { text-decoration: underline; }

@media (max-width: 480px) {
  .login-card { padding: 30px 20px; }
  .login-header h2 { font-size: 1.6rem; }
  .social-login { flex-direction: column; gap: 10px; }
}
/* 💡 จัดหน้าตาปุ่ม Social Login */
.social-login-group {
  display: flex;
  flex-direction: row; /* 👈 เปลี่ยนตรงนี้ให้เป็น row เพื่อให้อยู่บรรทัดเดียวกัน */
  gap: 15px; /* ระยะห่างระหว่างปุ่ม 2 อัน */
  margin-top: 20px;
  border-top: 1px solid #eee;
  padding-top: 25px;
}

.btn-social {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

.social-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

/* สไตล์เฉพาะปุ่ม Google */
.btn-google {
  background-color: #ffffff;
  color: #3c4043;
  border: 1px solid #dadce0;
}
.btn-google:hover {
  background-color: #f8f9fa;
  box-shadow: 0 4px 10px rgba(0,0,0,0.08);
  transform: translateY(-2px);
}

/* สไตล์เฉพาะปุ่ม Facebook */
.btn-facebook {
  background-color: #1877f2;
  color: #ffffff;
  border: none;
}
.btn-facebook:hover {
  background-color: #166fe5;
  box-shadow: 0 4px 10px rgba(24, 119, 242, 0.3);
  transform: translateY(-2px);
}
</style>