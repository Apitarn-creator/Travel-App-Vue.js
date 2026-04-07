<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { createTrip } from '../api/tripApi'

const router = useRouter()
const currentUser = ref<any>(null)
const isLoading = ref(false)
const errorMessage = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

// ตัวแปรฟอร์มเก็บข้อมูลทริป
const form = ref({
  title: '',
  description: '',
  tagsInput: '', // รับค่าแท็กเป็นข้อความคั่นด้วยลูกน้ำ
  photos: [] as string[], // เก็บรูป Base64
  latitude: null,
  longitude: null
})

onMounted(() => {
  const userString = localStorage.getItem('user')
  if (userString) {
    currentUser.value = JSON.parse(userString)
  } else {
    alert('กรุณาเข้าสู่ระบบก่อนเขียนทริปครับ')
    router.push('/login')
  }
})

// เปิดหน้าต่างเลือกไฟล์ (อัปโหลดทีละหลายรูปได้)
function triggerFileInput() {
  fileInputRef.value?.click()
}

// แปลงรูปภาพเป็น Base64 และเก็บลง Array
function handleFilesUpload(event: Event) {
  const files = (event.target as HTMLInputElement).files
  if (!files) return

  Array.from(files).forEach(file => {
    if (file.size > 3 * 1024 * 1024) {
      alert(`รูปภาพ ${file.name} มีขนาดใหญ่เกิน 3MB`)
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      form.value.photos.push(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  })
}

// ลบรูปภาพที่เลือกไว้
function removePhoto(index: number) {
  form.value.photos.splice(index, 1)
}

// บันทึกทริป
async function handleSubmit() {
  if (!form.value.title || !form.value.description) {
    errorMessage.value = 'กรุณากรอกหัวข้อและเนื้อหาทริป'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    // แปลงข้อความแท็ก (เช่น "ภูเขา,ทะเล,แคมป์ปิ้ง") เป็น Array
    const tagsArray = form.value.tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)

    // จัดเตรียมข้อมูลส่งไปหลังบ้าน
    const newTrip = {
      title: form.value.title,
      description: form.value.description,
      photos: form.value.photos,
      tags: tagsArray,
      authorId: currentUser.value.id,
      latitude: form.value.latitude,
      longitude: form.value.longitude
    }

    const savedTrip = await createTrip(newTrip)
    
    alert('สร้างทริปสำเร็จ! 🎉')
    // พาสร้างเสร็จ ให้เด้งไปหน้าอ่านทริปที่เพิ่งสร้างเลย
    router.push(`/trip/${savedTrip.id}`)

  } catch (error: any) {
    errorMessage.value = error.message || 'เกิดข้อผิดพลาดในการสร้างทริป'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="create-trip-page">
    <div class="container write-container">
      
      <div class="header">
        <h2>เขียนทริปใหม่ ✍️</h2>
        <p>แบ่งปันประสบการณ์การเดินทางของคุณให้โลกรู้</p>
      </div>

      <div v-if="errorMessage" class="alert error">{{ errorMessage }}</div>

      <form @submit.prevent="handleSubmit" class="trip-form">
        
        <div class="form-group">
          <label>หัวข้อทริป</label>
          <input type="text" v-model="form.title" placeholder="เช่น ตะลุยหิมะฮอกไกโด 5 วัน 4 คืน..." required :disabled="isLoading" class="title-input" />
        </div>

        <div class="form-group">
          <label>เนื้อหาทริป / รีวิว</label>
          <textarea v-model="form.description" placeholder="เล่าเรื่องราวการเดินทางของคุณที่นี่..." required rows="10" :disabled="isLoading"></textarea>
        </div>

        <div class="form-group">
          <label>แท็ก (Tags)</label>
          <input type="text" v-model="form.tagsInput" placeholder="เช่น ญี่ปุ่น, หิมะ, หน้าหนาว (คั่นด้วยเครื่องหมายลูกน้ำ , )" :disabled="isLoading" />
        </div>

        <div class="photo-upload-section">
          <label>รูปภาพบรรยากาศ</label>
          
          <div class="photo-grid" v-if="form.photos.length > 0">
            <div v-for="(photo, index) in form.photos" :key="index" class="photo-preview">
              <img :src="photo" alt="preview" />
              <button type="button" @click="removePhoto(index)" class="btn-remove">✕</button>
            </div>
          </div>

          <input type="file" ref="fileInputRef" @change="handleFilesUpload" accept="image/*" multiple style="display: none;" />
          <button type="button" @click="triggerFileInput" class="btn-upload" :disabled="isLoading">
            + อัปโหลดรูปภาพเพิ่ม
          </button>
        </div>

        <div class="form-actions">
          <button type="button" @click="router.back()" class="btn-cancel" :disabled="isLoading">ยกเลิก</button>
          <button type="submit" class="btn-submit" :disabled="isLoading">
            {{ isLoading ? 'กำลังเผยแพร่...' : 'เผยแพร่ทริป' }}
          </button>
        </div>

      </form>

    </div>
  </div>
</template>

<style scoped>
.create-trip-page { background-color: #f8fafc; min-height: calc(100vh - 72px); padding: 40px 20px; font-family: 'Kanit', sans-serif; }
.write-container { background: white; max-width: 800px; margin: 0 auto; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); border: 1px solid #f0f0f0; }

.header { margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
.header h2 { font-size: 2rem; color: #111; margin: 0 0 5px 0; }
.header p { color: #666; margin: 0; }

.form-group { margin-bottom: 25px; }
.form-group label { display: block; font-weight: 600; margin-bottom: 10px; color: #333; }
.form-group input, .form-group textarea { width: 100%; padding: 14px 16px; border: 1px solid #ddd; border-radius: 10px; font-size: 1rem; font-family: inherit; transition: 0.2s; box-sizing: border-box; }
.form-group input:focus, .form-group textarea:focus { border-color: #007bff; outline: none; box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15); }
.title-input { font-size: 1.2rem !important; font-weight: 600; }
.form-group textarea { resize: vertical; min-height: 200px; line-height: 1.6; }

/* อัปโหลดรูปภาพ */
.photo-upload-section { margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px dashed #cbd5e1; }
.photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 15px; margin-bottom: 15px; }
.photo-preview { position: relative; width: 100%; aspect-ratio: 1; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
.photo-preview img { width: 100%; height: 100%; object-fit: cover; }
.btn-remove { position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.6); color: white; border: none; width: 24px; height: 24px; border-radius: 50%; cursor: pointer; display: flex; justify-content: center; align-items: center; font-size: 0.8rem; }
.btn-remove:hover { background: red; }
.btn-upload { background: white; border: 1px solid #007bff; color: #007bff; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.btn-upload:hover { background: #eff6ff; }

.form-actions { display: flex; justify-content: flex-end; gap: 15px; border-top: 1px solid #eee; padding-top: 25px; }
.btn-cancel { background: #f1f5f9; color: #475569; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.btn-cancel:hover { background: #e2e8f0; }
.btn-submit { background: #007bff; color: white; border: none; padding: 12px 30px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: 0.3s; font-size: 1.05rem; }
.btn-submit:hover:not(:disabled) { background: #0056b3; transform: translateY(-2px); }
.btn-submit:disabled { background: #93c5fd; cursor: not-allowed; }

.alert.error { background-color: #fef2f2; color: #dc2626; padding: 15px; border-radius: 10px; border: 1px solid #fee2e2; margin-bottom: 25px; text-align: center; }

@media (max-width: 640px) {
  .write-container { padding: 20px; }
  .form-actions { flex-direction: column; }
  .btn-submit, .btn-cancel { width: 100%; }
}
</style>