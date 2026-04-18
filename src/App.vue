<script setup lang="ts">
import { useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue'
const route = useRoute()
</script>

<template>
  <div class="app-container">
    <Navbar />
    <router-view :key="route.fullPath"></router-view>
  </div>
</template>

<style scoped>
</style>