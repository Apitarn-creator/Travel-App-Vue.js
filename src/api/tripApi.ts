export interface Trip {
    id: number; // เปลี่ยนเป็น number ตาม bigint
    title: string;
    description: string | null;
    photos: string[]; // เป็น Array ของ URL รูปภาพ
    tags: string[];   // เป็น Array ของข้อความ
    latitude: number | null;
    longitude: number | null;
    author_id: number | null;
    created_at: string;
  }

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

  export async function getAllTrips(keyword?: string): Promise<Trip[]> {
    // สร้าง URL โดยตรวจสอบว่ามีการค้นหาหรือไม่
    const url = keyword 
      ? `${API_BASE_URL}/api/trips?search=${keyword}` 
      : `${API_BASE_URL}/api/trips`
      
    const response = await fetch(url)
    if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลทริปได้')
    return await response.json()
  } 

  export async function getTripById(id: number) {
    const response = await fetch(`${API_BASE_URL}/api/trips/${id}`)
    
    if (!response.ok) {
      throw new Error('ไม่พบข้อมูลทริป')
    }
    
    return await response.json()
  }

  // ดึงคอมเมนต์ทั้งหมดของทริป
export async function getCommentsByTripId(tripId: number) {
  const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}/comments`)
  return await response.json()
}

// ส่งคอมเมนต์ใหม่
// ✅ [Security Fix #4] ลบ userId ออกจาก body แล้ว — server จะอ่าน userId จาก JWT token เอง
export async function addComment(tripId: number, content: string) {
  const token = localStorage.getItem('token')

  const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}/comments`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ content }) // ✅ ส่งแค่ content ไม่ต้องส่ง userId แล้ว
  })
  if (!response.ok) throw new Error('ไม่สามารถเพิ่มความเห็นได้')
  return await response.json()
}

// ฟังก์ชันสร้างทริปใหม่
export async function createTrip(tripData: any) {
  const token = localStorage.getItem('token') // 👈 ดึง Token ออกมา

  const response = await fetch(`${API_BASE_URL}/api/trips`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // 👈 แนบ Token ไปด้วย
    },
    body: JSON.stringify(tripData)
  })

  if (!response.ok) {
    const errorMessage = await response.text()
    throw new Error(errorMessage)
  }
  return await response.json()
}

// ดึงทริปที่ตัวเองสร้าง (public profile ก็ดูได้ — ส่ง token ถ้ามี)
export async function getTripsByUserId(userId: number) {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const response = await fetch(`${API_BASE_URL}/api/trips/user/${userId}`, { headers })
  if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลทริปได้')
  return await response.json()
}

// ดึงทริปที่เคยไปคอมเมนต์
export async function getCommentedTripsByUserId(userId: number) {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const response = await fetch(`${API_BASE_URL}/api/trips/user/${userId}/commented`, { headers })
  if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลทริปได้')
  return await response.json()
}

// ✅ กด Like / Unlike
export async function toggleLike(tripId: number) {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}/like`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!response.ok) throw new Error('ไม่สามารถกด like ได้')
  return await response.json() // { likes: number, liked: boolean }
}
