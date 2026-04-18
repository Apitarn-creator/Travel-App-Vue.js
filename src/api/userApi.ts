const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

// ฟังก์ชันสำหรับส่งข้อมูลสมัครสมาชิก
export async function register(userData: { username: string; email: string; password?: string }) {
  const response = await fetch(`${API_BASE_URL}/api/users/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  })

  // ถ้า Spring Boot ส่ง HTTP Status แบบ Error กลับมา (เช่น อีเมลซ้ำ)
  if (!response.ok) {
    const errorMessage = await response.text()
    throw new Error(errorMessage)
  }

  return await response.json()
}

// ฟังก์ชันสำหรับ Login
export async function login(credentials: { email: string; password?: string }) {
    const response = await fetch(`${API_BASE_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    })
  
    if (!response.ok) {
      const errorMessage = await response.text()
      throw new Error(errorMessage)
    }
  
    return await response.json()
  }

  // ฟังก์ชันสำหรับอัปเดตข้อมูลโปรไฟล์
  export async function updateProfile(id: number, userData: any) {
    const token = localStorage.getItem('token') // 👈 ดึง Token
  
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // 👈 แนบ Token ไปด้วย
      },
      body: JSON.stringify({
        username: userData.username,
        avatarUrl: userData.avatarUrl,
        profile: {
          nickname: userData.nickname,
          bio: userData.bio,
          gender: userData.gender,
          birthdate: userData.birthdate,
          socialLink: userData.socialLink,
          coverUrl: userData.coverUrl
        }
      })
    })
  
    if (!response.ok) {
      const errorMessage = await response.text()
      throw new Error(errorMessage)
    }
    return await response.json()
  }

  // ฟังก์ชันดึงข้อมูลโปรไฟล์ผู้ใช้ 1 คน (ตาม ID)
export async function getUserById(id: number) {
  const response = await fetch(`${API_BASE_URL}/api/users/${id}`)

  if (!response.ok) {
    throw new Error('ไม่พบข้อมูลผู้ใช้งาน')
  }

  return await response.json()
}

export async function getUserByUsername(username: string) {
  const response = await fetch(`${API_BASE_URL}/api/users/username/${username}`)
  if (!response.ok) throw new Error('ไม่พบข้อมูลผู้ใช้')
  return await response.json()
}

// ✅ Toggle Follow / Unfollow
export async function toggleFollow(targetUserId: number) {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_BASE_URL}/api/users/${targetUserId}/follow`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!response.ok) throw new Error('ไม่สามารถ follow ได้')
  return await response.json() // { following: boolean, followingList: string }
}

// ✅ ดึง follower/following count
export async function getFollowStats(userId: number) {
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}/follow-stats`)
  if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลได้')
  return await response.json() // { followers: number, following: number }
}

// ✅ Feed จาก user ที่ follow อยู่
export async function getFollowingFeed() {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_BASE_URL}/api/users/me/feed`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!response.ok) throw new Error('ไม่สามารถดึง feed ได้')
  return await response.json()
}

// ✅ Toggle bookmark trip
export async function toggleBookmark(tripId: number) {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_BASE_URL}/api/users/${tripId}/bookmark`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!response.ok) throw new Error('ไม่สามารถ bookmark ได้')
  return await response.json() // { bookmarked: boolean, bookmarkedTrips: string }
}

// ✅ ดึง trips ที่ bookmark ไว้ (เฉพาะตัวเอง)
export async function getMyBookmarks() {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_BASE_URL}/api/users/me/bookmarks`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!response.ok) throw new Error('ไม่สามารถดึง bookmarks ได้')
  return await response.json()
}

// 💡 เพิ่มฟังก์ชันส่ง Google Token ไปให้ Spring Boot
export async function loginWithGoogleAPI(googleToken: string) {
  const response = await fetch(`${API_BASE_URL}/api/users/google-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: googleToken })
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'ไม่สามารถล็อกอินด้วย Google ได้')
  }
  return await response.json()
}

// 💡 ฟังก์ชันส่ง Facebook Token ไปให้ Spring Boot
export async function loginWithFacebookAPI(facebookToken: string) {
  const response = await fetch(`${API_BASE_URL}/api/users/facebook-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: facebookToken })
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'ไม่สามารถล็อกอินด้วย Facebook ได้')
  }
  return await response.json()
}
// ✅ Notification APIs
export async function getNotifications() {
  const token = localStorage.getItem('token')
  if (!token) return []
  const response = await fetch(`${API_BASE_URL}/api/notifications`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!response.ok) return []
  return await response.json()
}

export async function getUnreadCount() {
  const token = localStorage.getItem('token')
  if (!token) return 0
  const response = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!response.ok) return 0
  const data = await response.json()
  return data.count ?? 0
}

export async function markAllNotificationsRead() {
  const token = localStorage.getItem('token')
  await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  })
}

export async function markNotificationRead(id: number) {
  const token = localStorage.getItem('token')
  await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  })
}
