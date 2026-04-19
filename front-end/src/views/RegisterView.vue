<template>
  <div class="login-page">

    <!-- LEFT -->
    <div class="login-left">
      <div class="film-strip">
        <div v-for="n in 8" :key="n" class="strip-hole"></div>
      </div>

      <div class="left-content">
        <h1>Rejoignez la Cinémathèque</h1>
        <p>Créez un compte pour noter, commenter et découvrir des films cultes.</p>
      </div>

      <div class="film-strip">
        <div v-for="n in 8" :key="n" class="strip-hole"></div>
      </div>
    </div>

    <!-- RIGHT -->
    <div class="login-right">
      <div class="login-card">

        <h2>Inscription</h2>
        <p class="subtitle">Créez votre compte en quelques secondes</p>

        <form @submit.prevent="handleRegister" class="login-form">

          <div class="field">
            <label>Email</label>
            <input 
              v-model="form.email" 
              type="email" 
              placeholder="vous@exemple.com" 
              required 
            />
          </div>

          <div class="field">
            <label>Mot de passe</label>
            <input 
              v-model="form.password" 
              type="password" 
              placeholder="••••••••" 
              required 
            />
          </div>

          <div class="field">
            <label>Confirmer mot de passe</label>
            <input v-model="confirmPassword" type="password" placeholder="••••••••" required />
          </div>

          <!-- Force mot de passe -->
          <div class="password-strength">
            <div :class="['bar', strengthClass]"></div>
            <p>{{ strengthText }}</p>
          </div>

          <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

          <button type="submit" class="btn btn-primary submit-btn" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            {{ loading ? 'Création...' : 'Créer un compte' }}
          </button>
          
        <!-- Switch vers la connexion -->
        <p class="switch-auth">
          Déjà un compte ?
          <router-link to="/login">Se connecter</router-link>
        </p>
        
        </form>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const loading = ref(false)
const errorMsg = ref('')

const form = ref({
  email: '',
  password: ''
})

const confirmPassword = ref('')

const strength = computed(() => {
  const pwd = form.value.password
  if (pwd.length > 10) return 3
  if (pwd.length > 6) return 2
  if (pwd.length > 0) return 1
  return 0
})

const strengthText = computed(() => {
  return ['','Faible','Moyen','Fort'][strength.value]
})

const strengthClass = computed(() => {
  return ['','weak','medium','strong'][strength.value]
})

async function handleRegister() {
  errorMsg.value = ''

  if (form.value.password !== confirmPassword.value) {
    errorMsg.value = "Les mots de passe ne correspondent pas"
    return
  }

  loading.value = true

  try {
    await auth.register(form.value.email, form.value.password)
    router.push('/login')
  } catch (e) {
    errorMsg.value = e.response?.data?.message || "Erreur lors de l'inscription"
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
  gap: 2rem;
}

.login-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem; /* espace entre les champs */
  margin-top: 1.5rem; /* espace entre le titre/sous-titre et le formulaire */
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.password-strength {
  margin-top: 4px;
}

.password-strength p {
  font-size: 12px;
  color: var(--color-muted);
  margin-top: 4px;
}

.bar {
  height: 4px;
  border-radius: 4px;
  transition: all 0.3s ease;
  background: #444;
}

.bar.weak {
  width: 30%;
  background: #ff4d4d;
}

.bar.medium {
  width: 60%;
  background: #ffa500;
}

.bar.strong {
  width: 100%;
  background: #4caf50;
}

/* switch */
.switch-auth {
  margin-top: 1.5rem;
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
</style>