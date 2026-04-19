import axios from 'axios'

// Le backend tourne sur port 3000 (pas de /api prefix)
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

// Injecter le token JWT — le backend attend "Bearer <token>"
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Rediriger vers /login si 401 ou 403
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ─────────────────────────────────────────────
// POST /auth/login  → { token, user: { id, email, role } }
// POST /auth/register → { id, email, role }
// GET  /auth/me     → { id, email, role }
export const authAPI = {
  login:    (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password) => api.post('/auth/register', { email, password }),
  me:       ()                => api.get('/auth/me')
}

// ── Films ─────────────────────────────────────────────
// GET    /movies?genre=&year=&search=
// GET    /movies/genres
// GET    /movies/:id
// GET    /movies/:id/suggestions
// POST   /movies  (admin)
// PUT    /movies/:id (admin)
// DELETE /movies/:id (admin)
export const filmsAPI = {
  getAll:  (params)    => api.get('/movies', { params }),
  getGenres: ()        => api.get('/movies/genres'),
  getById: (id)        => api.get(`/movies/${id}`),
  getSuggestions: (id) => api.get(`/movies/${id}/suggestions`),
  create:  (data)      => api.post('/movies', data),
  update:  (id, data)  => api.put(`/movies/${id}`, data),
  delete:  (id)        => api.delete(`/movies/${id}`)
}

// ── Reviews ───────────────────────────────────────────
// GET    /reviews/:movieId
// POST   /reviews  { movie_id, rating, comment }
// DELETE /reviews/:id (admin)
export const reviewsAPI = {
  getByMovie: (movieId)      => api.get(`/reviews/${movieId}`),
  create:     (data)         => api.post('/reviews', data),
  delete:     (id)           => api.delete(`/reviews/${id}`)
}

export function resolveMediaUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return url
}

export default api
