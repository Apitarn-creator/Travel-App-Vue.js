<script setup lang="ts">
import type { Trip } from '../api/tripApi'
defineProps<{ trip: Trip }>()

// ตัด [IMAGE:0], [IMAGE:1], [IMAGE:2] ... ออกจาก description
// แล้วตัดข้อความที่เหลือให้ไม่เกิน 100 ตัวอักษร
function cleanDescription(text: string | null): string {
  if (!text) return ''
  return text
    .replace(/\[IMAGE:\d+\]/g, '')  // ลบ [IMAGE:X] ทุกตัว
    .replace(/\s+/g, ' ')           // ยุบ whitespace ที่เกินมา
    .trim()
}
</script>

<template>
  <div class="card">
    <div class="card-header">
      <img :src="trip.photos[0] || 'https://via.placeholder.com/400x250?text=No+Photo'" :alt="trip.title">
      <div class="tags">
        <span v-for="tag in trip.tags.slice(0, 3)" :key="tag" class="tag-badge">{{ tag }}</span>
      </div>
    </div>
    <div class="card-body">
      <div class="meta">📅 {{ new Date(trip.created_at).toLocaleDateString('th-TH', { month: 'short', year: 'numeric' }) }}</div>
      <h3>{{ trip.title }}</h3>
      <p class="description">{{ cleanDescription(trip.description) }}</p>
      <div class="card-footer">
        <span class="location">📍 {{ trip.latitude ? 'ดูแผนที่' : 'ประเทศไทย' }}</span>
        <button class="btn-detail">อ่านต่อ</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); transition: 0.3s; border: 1px solid #f0f0f0; }
.card:hover { transform: translateY(-8px); box-shadow: 0 12px 30px rgba(0,0,0,0.12); }
.card-header { position: relative; height: 200px; }
.card-header img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
.card:hover .card-header img { transform: scale(1.05); }
.tags { position: absolute; bottom: 12px; left: 12px; display: flex; gap: 6px; }
.tag-badge { background: rgba(255,255,255,0.95); color: #007bff; padding: 4px 10px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
.card-body { padding: 20px; }
.meta { font-size: 0.8rem; color: #888; margin-bottom: 8px; }
.card-body h3 { margin: 0 0 10px 0; font-size: 1.25rem; color: #1a1a1a; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
.description { color: #666; font-size: 0.9rem; line-height: 1.6; margin-bottom: 20px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.card-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f0f0f0; padding-top: 15px; }
.location { color: #007bff; font-weight: 600; font-size: 0.85rem; }
.btn-detail { background: none; border: 1px solid #ddd; padding: 6px 16px; border-radius: 8px; cursor: pointer; color: #555; transition: 0.2s; }
.btn-detail:hover { border-color: #007bff; color: #007bff; }

/* --- โค้ดสำหรับมือถือ (จอเล็กกว่า 768px) --- */
@media (max-width: 768px) {
  .card-header { height: 180px; } /* ลดความสูงรูปภาพลง */
  .card-body { padding: 16px; }
  .card-body h3 { font-size: 1.15rem; }
  .description { font-size: 0.85rem; margin-bottom: 15px; }
}
</style>