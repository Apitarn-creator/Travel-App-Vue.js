<template>
  <nav class="navbar">
    <div class="container nav-content">
      <div class="logo">Travel<span>Better</span></div>
      <div class="menu">
        <a href="#" class="nav-link active">หน้าแรก</a>
        <a href="#" class="nav-link">ค้นหาทริป</a>
        <div class="auth-buttons">
          <button class="btn-text">เข้าสู่ระบบ</button>
          <button class="btn-primary">สมัครสมาชิก</button>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar { background: #ffffff; border-bottom: 1px solid #f0f0f0; position: sticky; top: 0; z-index: 1000; height: 72px; display: flex; align-items: center; }
.nav-content { display: flex; justify-content: space-between; align-items: center; width: 100%; }
.logo { font-size: 1.6rem; font-weight: 800; color: #1a1a1a; letter-spacing: -1px; }
.logo span { color: #007bff; }
.menu { display: flex; align-items: center; gap: 30px; }
.nav-link { text-decoration: none; color: #666; font-weight: 500; transition: 0.2s; }
.nav-link.active, .nav-link:hover { color: #007bff; }
.auth-buttons { display: flex; gap: 15px; align-items: center; margin-left: 20px; }
.btn-text { background: none; border: none; color: #444; font-weight: 600; cursor: pointer; }
.btn-primary { background: #007bff; color: white; border: none; padding: 10px 24px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: 0.3s; }
.btn-primary:hover { background: #0056b3; transform: translateY(-2px); }

/* --- โค้ดสำหรับมือถือ (จอเล็กกว่า 768px) --- */
@media (max-width: 768px) {
  .logo { font-size: 1.4rem; }
  .nav-link { display: none; } /* ซ่อนเมนูข้อความบนมือถือ */
  .auth-buttons { gap: 10px; margin-left: 0; }
  .btn-primary { padding: 8px 16px; font-size: 0.9rem; }
  .btn-text { font-size: 0.9rem; }
}
</style>