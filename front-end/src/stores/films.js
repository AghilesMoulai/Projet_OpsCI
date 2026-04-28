import { defineStore } from 'pinia'
import { ref } from 'vue'
import { filmsAPI } from '../services/api'

export const useFilmsStore = defineStore('films', () => {
  const films   = ref([])
  const current = ref(null)
  const loading = ref(false)
  const error   = ref(null)
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  })

  async function fetchAll(params = {}) {
    loading.value = true
    error.value   = null
    try {
      const res = await filmsAPI.getAll(params)

      // Compatibilité avec l'ancien format de réponse, au cas où l'API
      // renverrait encore directement un tableau de films.
      if (Array.isArray(res.data)) {
        films.value = res.data
        pagination.value = {
          page: 1,
          limit: params.limit || res.data.length || 10,
          total: res.data.length,
          totalPages: 1
        }
        return
      }

      films.value = res.data.data || []
      pagination.value = res.data.pagination || {
        page: 1,
        limit: params.limit || 10,
        total: films.value.length,
        totalPages: 1
      }
    } catch {
      error.value = 'Impossible de charger les films.'
    } finally {
      loading.value = false
    }
  }

  async function fetchAllPages(params = {}) {
    loading.value = true
    error.value   = null
    try {
      // L'administration doit afficher tout le catalogue, contrairement à la
      // page publique qui reste paginée pour l'utilisateur.
      const limit = 50
      const firstRes = await filmsAPI.getAll({ ...params, page: 1, limit })
      const firstPayload = firstRes.data

      if (Array.isArray(firstPayload)) {
        films.value = firstPayload
        pagination.value = {
          page: 1,
          limit,
          total: firstPayload.length,
          totalPages: 1
        }
        return
      }

      const allFilms = [...(firstPayload.data || [])]
      const totalPages = firstPayload.pagination?.totalPages || 1

      // On récupère les pages restantes par paquets de 50 pour éviter de
      // dépendre d'une limite arbitraire côté interface admin.
      for (let page = 2; page <= totalPages; page += 1) {
        const res = await filmsAPI.getAll({ ...params, page, limit })
        allFilms.push(...(res.data.data || []))
      }

      films.value = allFilms
      pagination.value = {
        page: 1,
        limit: allFilms.length || limit,
        total: firstPayload.pagination?.total || allFilms.length,
        totalPages: 1
      }
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

  return { films, current, loading, error, pagination, fetchAll, fetchAllPages, fetchById, create, update, remove }
})
