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
export async function updateProfile(id: number, userData: { username: string; avatarUrl?: string }) {
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: userData.username,
        avatarUrl: userData.avatarUrl
      })
    })
  
    if (!response.ok) {
      const errorMessage = await response.text()
      throw new Error(errorMessage)
    }
  
    return await response.json()
  }