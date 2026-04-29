<template>
  <div id="app">
    <NavBar v-if="auth.isAuthenticated" />
    <main>
      <RouterView :key="route.fullPath" />
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import NavBar from './components/NavBar.vue'

const auth = useAuthStore()
const route = useRoute()

onMounted(() => auth.fetchMe())
</script>

<style>
#app {
  min-height: 100vh;
}
main {
  padding: 0;
}
</style>