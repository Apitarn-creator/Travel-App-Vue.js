<template>
  <div class="sk-detail">
    <!-- Hero -->
    <div class="sk-hero shimmer"></div>

    <div class="sk-layout">
      <!-- Article -->
      <div class="sk-article">
        <div class="sk-line w80 shimmer"></div>
        <div class="sk-line w60 shimmer"></div>
        <div class="sk-line w90 shimmer"></div>
        <div class="sk-line w70 shimmer"></div>
        <div class="sk-line w85 shimmer"></div>
        <div class="sk-img shimmer"></div>
        <div class="sk-line w75 shimmer"></div>
        <div class="sk-line w55 shimmer"></div>
      </div>
      <!-- Sidebar -->
      <div class="sk-sidebar">
        <div class="sk-card">
          <div class="sk-map shimmer"></div>
          <div class="sk-line w60 shimmer" style="margin-top:10px"></div>
        </div>
        <div class="sk-card">
          <div class="sk-line w40 shimmer"></div>
          <div class="sk-line w70 shimmer" style="margin-top:8px"></div>
          <div class="sk-line w50 shimmer" style="margin-top:8px"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes shimmer {
  0% { background-position: -800px 0; }
  100% { background-position: 800px 0; }
}
.shimmer {
  background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-secondary) 50%, var(--bg-tertiary) 75%);
  background-size: 800px 100%;
  animation: shimmer 1.4s infinite linear;
  border-radius: 8px;
}
.sk-detail { min-height: calc(100vh - 72px); background: var(--bg-secondary); }
.sk-hero { height: 500px; border-radius: 0; }
.sk-layout { max-width: 1100px; margin: 0 auto; padding: 40px 20px; display: grid; grid-template-columns: 1fr 300px; gap: 40px; }
.sk-article { display: flex; flex-direction: column; gap: 14px; }
.sk-line { height: 14px; }
.sk-line.w40 { width: 40%; }
.sk-line.w50 { width: 50%; }
.sk-line.w55 { width: 55%; }
.sk-line.w60 { width: 60%; }
.sk-line.w70 { width: 70%; }
.sk-line.w75 { width: 75%; }
.sk-line.w80 { width: 80%; }
.sk-line.w85 { width: 85%; }
.sk-line.w90 { width: 90%; }
.sk-img { height: 280px; margin: 16px 0; border-radius: 12px; }
.sk-sidebar { display: flex; flex-direction: column; gap: 16px; }
.sk-card { background: var(--bg-card); border-radius: 14px; padding: 16px; border: 1px solid var(--border-light); }
.sk-map { height: 180px; border-radius: 10px; }
</style>
