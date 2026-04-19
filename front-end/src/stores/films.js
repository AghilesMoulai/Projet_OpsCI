import { defineStore } from 'pinia'
import { ref } from 'vue'
import { filmsAPI } from '../services/api'

export const useFilmsStore = defineStore('films', () => {
  const films   = ref([])
  const current = ref(null)
  const loading = ref(false)
  const error   = ref(null)

  async function fetchAll(params = {}) {
    loading.value = true
    error.value   = null
    try {
      const res = await filmsAPI.getAll(params)
      films.value = res.data
    } catch {
      error.value = 'Impossible de charger les films.'
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id) {
    loading.value = true
    error.value   = null
    try {
      const res = await filmsAPI.getById(id)
      current.value = res.data
    } catch {
      error.value = 'Film introuvable.'
    } finally {
      loading.value = false
    }
  }

  async function create(data) {
    const res = await filmsAPI.create(data)
    films.value.unshift(res.data)
    return res.data
  }

  async function update(id, data) {
    const res = await filmsAPI.update(id, data)
    const idx = films.value.findIndex(f => f.id === id)
    if (idx !== -1) films.value[idx] = res.data
    if (current.value?.id === id) current.value = res.data
    return res.data
  }

  async function remove(id) {
    await filmsAPI.delete(id)
    films.value = films.value.filter(f => f.id !== id)
    if (current.value?.id === id) current.value = null
  }

  return { films, current, loading, error, fetchAll, fetchById, create, update, remove }
})