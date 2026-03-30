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