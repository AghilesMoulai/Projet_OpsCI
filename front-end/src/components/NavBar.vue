<template>
  <nav class="navbar">
    <RouterLink to="/" class="logo">🎬 Cinémathèque</RouterLink>

    <div class="nav-links">
      <RouterLink to="/">Catalogue</RouterLink>
      <RouterLink v-if="auth.isAdmin" to="/admin">Admin</RouterLink>
    </div>

    <div class="nav-user">
      <span class="user-info">
        {{ auth.user?.name }}
        <span class="role-badge" :class="auth.isAdmin ? 'dev' : 'user'">
          {{ auth.isAdmin ? 'Développeur' : 'Usager' }}
        </span>
      </span>
      <button class="btn btn-ghost" @click="handleLogout">Déconnexion</button>
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const auth   = useAuthStore()
const router = useRouter()

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 0 2rem;
  height: 60px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo {
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--color-accent);
  font-weight: 700;
  white-space: nowrap;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
  flex: 1;
}

.nav-links a {
  color: var(--color-muted);
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-links a.router-link-active,
.nav-links a:hover {
  color: var(--color-text);
}

.nav-user {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info {
  font-size: 14px;
  color: var(--color-muted);
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-badge {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 20px;
}
.role-badge.dev  { background: rgba(232,201,122,0.15); color: var(--color-accent); }
.role-badge.user { background: rgba(46,204,113,0.12);  color: var(--color-success); }
</style>