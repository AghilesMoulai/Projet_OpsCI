import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI } from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const user  = ref(null)
  const token = ref(localStorage.getItem('token') || null)

  const isAuthenticated = computed(() => !!token.value)
  // Le backend utilise role = "admin" ou "user"
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isUser  = computed(() => user.value?.role === 'user')

  async function login(email, password) {
    const res = await authAPI.login(email, password)
    // Backend renvoie { token, user: { id, email, role } }
    token.value = res.data.token
    user.value  = res.data.user
    localStorage.setItem('token', token.value)
  }

  async function register(email, password) {
    const res = await authAPI.register(email, password)
    return res.data
  }

  async function fetchMe() {
    if (!token.value) return
    try {
      const res = await authAPI.me()
      user.value = res.data
    } catch {
      logout()
    }
  }

  function logout() {
    user.value  = null
    token.value = null
    localStorage.removeItem('token')
  }

  return { user, token, isAuthenticated, isAdmin, isUser, login, register, fetchMe, logout }
})