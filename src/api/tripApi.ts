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

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

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
export async function addComment(tripId: number, userId: number, content: string) {
  const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: userId.toString(), content })
  })
  if (!response.ok) throw new Error('ไม่สามารถเพิ่มความเห็นได้')
  return await response.json()
}

// ฟังก์ชันสร้างทริปใหม่
export async function createTrip(tripData: any) {
  const response = await fetch(`${API_BASE_URL}/api/trips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tripData)
  })

  if (!response.ok) {
    const errorMessage = await response.text()
    throw new Error(errorMessage)
  }

  return await response.json()
}

// ดึงทริปที่ตัวเองสร้าง
export async function getTripsByUserId(userId: number) {
  const response = await fetch(`${API_BASE_URL}/api/trips/user/${userId}`)
  if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลทริปได้')
  return await response.json()
}

// ดึงทริปที่เคยไปคอมเมนต์
export async function getCommentedTripsByUserId(userId: number) {
  const response = await fetch(`${API_BASE_URL}/api/trips/user/${userId}/commented`)
  if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลทริปได้')
  return await response.json()
}
