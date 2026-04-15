<template>
  <div class="login-page">
    
    <!-- LEFT -->
    <div class="login-left">
      <div class="film-strip">
        <div v-for="n in 8" :key="n" class="strip-hole"></div>
      </div>

      <div class="left-content">
        <h1>Cinémathèque</h1>
        <p>Explorez, commentez et évaluez les plus grands films du cinéma mondial.</p>
      </div>

      <div class="film-strip">
        <div v-for="n in 8" :key="n" class="strip-hole"></div>
      </div>
    </div>

    <!-- RIGHT -->
    <div class="login-right">
      <div class="login-card">

        <h2>Connexion</h2>
        <p class="subtitle">Entrez vos identifiants pour accéder à la plateforme</p>

        <form @submit.prevent="handleLogin" class="login-form">

          <div class="field">
            <label>Email</label>
            <input
              v-model="form.email"
              type="email"
              placeholder="vous@exemple.com"
              autocomplete="email"
              required
            />
          </div>

          <div class="field">
            <label>Mot de passe</label>
            <input
              v-model="form.password"
              type="password"
              placeholder="••••••••"
              autocomplete="current-password"
              required
            />
          </div>

          <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

          <button type="submit" class="btn btn-primary submit-btn" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            {{ loading ? 'Connexion...' : 'Se connecter' }}
          </button>

          <!-- LIEN REGISTER -->
          <p class="switch-auth">
            Pas encore de compte ?
            <router-link to="/register">S’inscrire</router-link>
          </p>

          <!-- Demo -->
        <div class="demo-accounts">
          <p class="demo-title">Comptes de démo</p>
          <div class="demo-btns">
            <button class="demo-btn" @click="fillDemo('user')">
              <span class="role-dot user"></span> Usager
            </button>
            <button class="demo-btn" @click="fillDemo('dev')">
              <span class="role-dot dev"></span> Développeur
            </button>
          </div>
        </div>

        </form>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth     = useAuthStore()
const router   = useRouter()
const route    = useRoute()

const loading  = ref(false)
const errorMsg = ref('')

const form = ref({
  email: '',
  password: ''
})

function fillDemo(role) {
  form.value.email    = role === 'dev' ? 'admin@cinema.fr' : 'user@cinema.fr'
  form.value.password = 'password123'
}

async function handleLogin() {
  loading.value  = true
  errorMsg.value = ''

  try {
    await auth.login(form.value.email, form.value.password)

    const redirect = route.query.redirect || (auth.isAdmin ? '/admin' : '/')
    router.push(redirect)

  } catch (e) {
    errorMsg.value = e.response?.data?.message || 'Email ou mot de passe incorrect.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>

.login-page {
  display: flex;
  min-height: 100vh;
}

/* LEFT */
.login-left {
  flex: 1;
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.left-content {
  padding: 3rem;
}

.left-content h1 {
  font-size: clamp(2.5rem, 5vw, 4rem);
  color: var(--color-accent);
}

.left-content p {
  color: var(--color-muted);
  margin-top: 1rem;
}

.film-strip {
  display: flex;
  height: 36px;
  background: #111;
  align-items: center;
}

.strip-hole {
  width: 20px;
  height: 14px;
  background: var(--color-bg);
  margin: 0 12px;
}

/* RIGHT */
.login-right {
  flex: 0 0 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--color-bg);
}

.login-card {
  width: 100%;
  max-width: 380px;
}

.login-card h2 {
    font-size: 1.8rem;
    margin-bottom: 0.4rem;
}

.subtitle {
  color: var(--color-muted);
  font-size: 14px;
  margin-bottom: 2rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-muted);
}

.error-msg {
  color: red;
  font-size: 13px;
}

/* button */
.submit-btn {
  width: 100%;
  padding: 12px;
  justify-content: center;
  font-size: 15px;
  margin-top: 0.5rem;
}

/* register link */
.switch-auth {
  margin-top: 1rem;
  text-align: center;
  font-size: 14px;
  color: var(--color-muted);
}

.switch-auth a {
  color: var(--color-accent);
  text-decoration: none;
  font-weight: 500;
}

.switch-auth a:hover {
  text-decoration: underline;
}

/* demo */
.demo-accounts {
  width: 100%;
  padding: 12px;
  justify-content: center;
  font-size: 15px;
  margin-top: 0.5rem;
}

.demo-btns {
  display: flex;
  gap: 10px;
}

.demo-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  font-size: 15px;
  margin-top: 0.5rem;
  color: var(--color-muted);
  background-color: var(--color-surface);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.role-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.role-dot.user { background: green; }
.role-dot.dev  { background: orange; }
</style>