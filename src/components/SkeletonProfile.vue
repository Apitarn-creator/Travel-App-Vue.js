<template>
  <div class="sk-profile">
    <div class="sk-cover shimmer"></div>
    <div class="sk-info-card">
      <div class="sk-avatar shimmer"></div>
      <div class="sk-name shimmer"></div>
      <div class="sk-username shimmer"></div>
      <div class="sk-stats">
        <div class="sk-stat shimmer"></div>
        <div class="sk-stat shimmer"></div>
        <div class="sk-stat shimmer"></div>
      </div>
    </div>
    <div class="sk-grid">
      <div v-for="i in 4" :key="i" class="sk-post-card">
        <div class="sk-post-img shimmer"></div>
        <div class="sk-post-body">
          <div class="sk-line w70 shimmer"></div>
          <div class="sk-line w50 shimmer"></div>
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
.sk-profile { min-height: calc(100vh - 72px); background: var(--bg-secondary); }
.sk-cover { height: 320px; border-radius: 0; }
.sk-info-card { max-width: 900px; margin: -60px auto 0; background: var(--bg-card); border-radius: 16px; padding: 32px; display: flex; flex-direction: column; align-items: center; gap: 12px; border: 1px solid var(--border-light); }
.sk-avatar { width: 100px; height: 100px; border-radius: 50%; margin-top: -60px; }
.sk-name { width: 180px; height: 20px; }
.sk-username { width: 120px; height: 14px; }
.sk-stats { display: flex; gap: 32px; margin-top: 8px; }
.sk-stat { width: 60px; height: 40px; border-radius: 8px; }
.sk-grid { max-width: 900px; margin: 24px auto; padding: 0 20px; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
.sk-post-card { background: var(--bg-card); border-radius: 12px; overflow: hidden; border: 1px solid var(--border-light); }
.sk-post-img { height: 140px; border-radius: 0; }
.sk-post-body { padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.sk-line { height: 12px; border-radius: 6px; }
.sk-line.w70 { width: 70%; }
.sk-line.w50 { width: 50%; }
</style>
