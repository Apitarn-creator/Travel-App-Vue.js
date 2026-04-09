const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

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