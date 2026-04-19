<template>
  <div class="skeleton-card">
    <div class="skeleton-photo shimmer"></div>
    <div class="skeleton-body">
      <div class="skeleton-line long shimmer"></div>
      <div class="skeleton-line medium shimmer"></div>
      <div class="skeleton-tags">
        <div class="skeleton-tag shimmer"></div>
        <div class="skeleton-tag shimmer"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes shimmer {
  0% { background-position: -600px 0; }
  100% { background-position: 600px 0; }
}

.shimmer {
  background: linear-gradient(
    90deg,
    var(--bg-tertiary) 25%,
    var(--bg-secondary) 50%,
    var(--bg-tertiary) 75%
  );
  background-size: 600px 100%;
  animation: shimmer 1.4s infinite linear;
}

.skeleton-card {
  background: var(--bg-card);
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--border-light);
}
.skeleton-photo { height: 200px; width: 100%; }
.skeleton-body { padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.skeleton-line { height: 14px; border-radius: 6px; }
.skeleton-line.long { width: 80%; }
.skeleton-line.medium { width: 55%; }
.skeleton-tags { display: flex; gap: 6px; margin-top: 4px; }
.skeleton-tag { height: 22px; width: 52px; border-radius: 10px; }
</style>
