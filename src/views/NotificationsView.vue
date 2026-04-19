<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../api/userApi'

const router = useRouter()
const notifications = ref<any[]>([])
const isLoading = ref(true)

onMounted(async () => {
  if (!localStorage.getItem('token')) { router.push('/login'); return }
  try {
    notifications.value = await getNotifications()
  } finally {
    isLoading.value = false
  }
})

const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length)

async function handleMarkAllRead() {
  await markAllNotificationsRead()
  notifications.value.forEach(n => n.isRead = true)
}

async function handleClick(n: any) {
  if (!n.isRead) {
    n.isRead = true
    await markNotificationRead(n.id)
  }
  // navigate ไปยังหน้าที่เกี่ยวข้อง
  if (n.type === 'FOLLOW') {
    router.push(`/@${n.actor.username}`)
  } else if (n.tripId) {
    router.push(`/trip/${n.tripId}`)
  }
}

function getIcon(type: string) {
  if (type === 'LIKE') return '❤️'
  if (type === 'COMMENT') return '💬'
  if (type === 'FOLLOW') return '👤'
  return '🔔'
}

function getMessage(n: any) {
  const name = n.actor?.profile?.nickname || n.actor?.username || 'ผู้ใช้งาน'
  if (n.type === 'LIKE') return `${name} กดถูกใจทริป "${n.tripTitle}"`
  if (n.type === 'COMMENT') return `${name} แสดงความคิดเห็นในทริป "${n.tripTitle}"`
  if (n.type === 'FOLLOW') return `${name} เริ่มติดตามคุณแล้ว`
  return 'มีการแจ้งเตือนใหม่'
}

function formatTime(dateStr: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return 'เมื่อกี้'
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`
  if (diff < 604800) return `${Math.floor(diff / 86400)} วันที่แล้ว`
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
}
</script>

<template>
  <div class="notif-page">
    <div class="notif-container">

      <!-- Header -->
      <div class="notif-header">
        <div class="notif-title-row">
          <h1>การแจ้งเตือน</h1>
          <span v-if="unreadCount > 0" class="unread-pill">{{ unreadCount }} ใหม่</span>
        </div>
        <button v-if="unreadCount > 0" class="btn-read-all" @click="handleMarkAllRead">
          อ่านทั้งหมด
        </button>
      </div>

      <!-- Loading skeleton -->
      <div v-if="isLoading" class="sk-notif-list">
        <div v-for="i in 5" :key="i" class="sk-notif-item">
          <div class="sk-avatar shimmer"></div>
          <div class="sk-content">
            <div class="sk-line long shimmer"></div>
            <div class="sk-line short shimmer"></div>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="notifications.length === 0" class="notif-empty">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <p>ยังไม่มีการแจ้งเตือน</p>
        <p class="sub">เมื่อมีคนถูกใจ คอมเมนต์ หรือติดตามคุณ จะแสดงที่นี่</p>
      </div>

      <!-- List -->
      <div v-else class="notif-list">
        <div
          v-for="n in notifications"
          :key="n.id"
          class="notif-item"
          :class="{ unread: !n.isRead }"
          @click="handleClick(n)"
        >
          <!-- Avatar -->
          <div class="notif-avatar">
            <img v-if="n.actor?.avatarUrl" :src="n.actor.avatarUrl" :alt="n.actor?.username" />
            <div v-else class="avatar-placeholder">
              {{ n.actor?.username?.charAt(0).toUpperCase() || '?' }}
            </div>
            <span class="notif-type-icon">{{ getIcon(n.type) }}</span>
          </div>

          <!-- Content -->
          <div class="notif-content">
            <p class="notif-message">{{ getMessage(n) }}</p>
            <span class="notif-time">{{ formatTime(n.createdAt) }}</span>
          </div>

          <!-- Unread dot -->
          <div v-if="!n.isRead" class="unread-dot"></div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.notif-page { min-height: calc(100vh - 72px); background: var(--bg-secondary); padding: 32px 20px; }
.notif-container { max-width: 640px; margin: 0 auto; }

.notif-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.notif-title-row { display: flex; align-items: center; gap: 10px; }
.notif-title-row h1 { font-size: 1.6rem; font-weight: 700; color: var(--text-primary); margin: 0; }
.unread-pill { background: #ef4444; color: white; font-size: 0.75rem; font-weight: 700; padding: 3px 10px; border-radius: 12px; }
.btn-read-all { background: none; border: 1px solid var(--border-color); color: var(--text-secondary); padding: 7px 14px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: 0.2s; font-family: inherit; }
.btn-read-all:hover { border-color: #007bff; color: #007bff; }

.notif-loading { display: flex; justify-content: center; padding: 60px; }
.spinner { width: 32px; height: 32px; border: 3px solid var(--border-color); border-top-color: #007bff; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Skeleton */
@keyframes shimmer {
  0% { background-position: -600px 0; }
  100% { background-position: 600px 0; }
}
.shimmer {
  background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-secondary) 50%, var(--bg-tertiary) 75%);
  background-size: 600px 100%;
  animation: shimmer 1.4s infinite linear;
  border-radius: 8px;
}
.sk-notif-list { background: var(--bg-card); border-radius: 16px; overflow: hidden; border: 1px solid var(--border-light); }
.sk-notif-item { display: flex; align-items: center; gap: 14px; padding: 16px 20px; border-bottom: 1px solid var(--border-light); }
.sk-notif-item:last-child { border-bottom: none; }
.sk-avatar { width: 46px; height: 46px; border-radius: 50%; flex-shrink: 0; }
.sk-content { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.sk-line { height: 12px; }
.sk-line.long { width: 75%; }
.sk-line.short { width: 35%; }

.notif-empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px 20px; text-align: center; color: var(--text-muted); }
.notif-empty p { margin: 0; font-size: 1rem; font-weight: 500; }
.notif-empty .sub { font-size: 0.85rem; font-weight: 400; }

.notif-list { background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border-light); overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }

.notif-item {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 20px; cursor: pointer;
  border-bottom: 1px solid #f9fafb; transition: background 0.15s;
  position: relative;
}
.notif-item:last-child { border-bottom: none; }
.notif-item:hover { background: #f9fafb; }
.notif-item.unread { background: #eff6ff; }
.notif-item.unread:hover { background: #dbeafe; }

.notif-avatar { position: relative; flex-shrink: 0; }
.notif-avatar img, .avatar-placeholder {
  width: 46px; height: 46px; border-radius: 50%; object-fit: cover;
}
.avatar-placeholder {
  background: #3b82f6; color: white;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 1.1rem;
}
.notif-type-icon {
  position: absolute; bottom: -2px; right: -2px;
  font-size: 14px; background: var(--bg-card); border-radius: 50%;
  width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
}

.notif-content { flex: 1; min-width: 0; }
.notif-message { margin: 0 0 4px; font-size: 0.9rem; color: var(--text-primary); line-height: 1.4; }
.notif-time { font-size: 0.78rem; color: var(--text-muted); }

.unread-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #3b82f6; flex-shrink: 0;
}
</style>
