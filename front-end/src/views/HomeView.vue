<template>
  <div class="home">
    <div class="search-header">
      <div class="search-inner">
        <h1>Catalogue</h1>
        <div class="search-row">
          <input v-model="search" type="text" placeholder="Rechercher un film..."
            class="search-input" @input="onSearch" />
          <select v-model="filterGenre" @change="onSearch">
            <option value="">Tous les genres</option>
            <option v-for="g in genres" :key="g" :value="g">{{ g }}</option>
          </select>
          <input v-model="filterYear" type="number" placeholder="Année" min="1888"
            style="width:120px" @input="onSearch" />
          <select v-model="filterRating" @change="onSearch">
            <option value="">Toutes les notes</option>
            <option value="4">4+ / 5</option>
            <option value="3">3+ / 5</option>
            <option value="2">2+ / 5</option>
          </select>
          <select v-model="pageSize" @change="onPageSizeChange">
            <option :value="10">10 films</option>
            <option :value="20">20 films</option>
            <option :value="50">50 films</option>
          </select>
        </div>
        <p class="results-summary">
          {{ store.pagination.total }} film(s) trouvé(s) · page {{ store.pagination.page }} / {{ store.pagination.totalPages }}
        </p>
      </div>
    </div>

    <div v-if="store.loading" class="loading">Chargement des films…</div>
    <div v-else-if="store.error" class="error-banner">{{ store.error }}</div>

    <div v-else class="films-grid">
      <RouterLink v-for="film in store.films" :key="film.id"
        :to="`/films/${film.id}`" class="film-card">
        <div class="film-poster">
          <img v-if="film.image_url" :src="resolveMediaUrl(film.image_url)" :alt="film.title" loading="lazy" />
          <div v-else class="poster-placeholder">🎬</div>
          <div class="film-overlay">
            <span class="film-year">{{ film.year }}</span>
            <span class="film-rating" v-if="film.average_rating">
              ★ {{ film.average_rating }}
            </span>
          </div>
        </div>
        <div class="film-info">
          <p class="film-title">{{ film.title }}</p>
          <p class="film-director">{{ film.director }}</p>
          <p class="film-review-preview">
            <span class="inline-rating">★ {{ film.average_rating ?? '—' }}</span>
            <span class="review-count">({{ film.ratings_count ?? 0 }} avis)</span>
          </p>
          <div class="film-genres">
            <span v-for="genre in splitGenres(film.genre)" :key="genre" class="film-genre">{{ genre }}</span>
          </div>
        </div>
      </RouterLink>
      <p v-if="store.films.length === 0" class="no-results">Aucun film trouvé.</p>
    </div>

    <nav v-if="store.pagination.totalPages > 1" class="pagination" aria-label="Pagination des films">
      <button class="page-btn" :disabled="store.pagination.page === 1" @click="goToPage(store.pagination.page - 1)">
        Précédent
      </button>
      <button
        v-for="pageNumber in pageNumbers"
        :key="pageNumber"
        class="page-btn page-number"
        :class="{ active: pageNumber === store.pagination.page }"
        :aria-current="pageNumber === store.pagination.page ? 'page' : undefined"
        @click="goToPage(pageNumber)"
      >
        {{ pageNumber }}
      </button>
      <button
        class="page-btn"
        :disabled="store.pagination.page === store.pagination.totalPages"
        @click="goToPage(store.pagination.page + 1)"
      >
        Suivant
      </button>
    </nav>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useFilmsStore } from '../stores/films'
import { filmsAPI, resolveMediaUrl } from '../services/api'

const store = useFilmsStore()
const search = ref('')
const filterGenre = ref('')
const filterYear = ref('')
const filterRating = ref('')
const pageSize = ref(10)
const genres = ref([])

const pageNumbers = computed(() => {
  // On affiche uniquement quelques pages autour de la page courante pour
  // garder une pagination lisible même avec beaucoup de films.
  const totalPages = store.pagination.totalPages
  const currentPage = store.pagination.page
  const start = Math.max(1, currentPage - 2)
  const end = Math.min(totalPages, currentPage + 2)

  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
})

function fetchMovies(page = store.pagination.page) {
  // Tous les filtres sont envoyés au backend pour que la pagination reste
  // cohérente avec le nombre réel de résultats.
  return store.fetchAll({
    search: search.value || undefined,
    genre:  filterGenre.value || undefined,
    year:   filterYear.value || undefined,
    minRating: filterRating.value || undefined,
    limit: pageSize.value,
    page
  })
}

function onSearch() {
  // Un changement de filtre peut réduire le nombre de pages, on repart donc
  // toujours de la première page.
  fetchMovies(1)
}

function onPageSizeChange() {
  fetchMovies(1)
}

function goToPage(page) {
  if (page < 1 || page > store.pagination.totalPages || page === store.pagination.page) return
  fetchMovies(page)
}

function splitGenres(value) {
  return String(value || '')
    .split(',')
    .map(genre => genre.trim())
    .filter(Boolean)
}

onMounted(async () => {
  const [filmsRes, genresRes] = await Promise.allSettled([
    fetchMovies(1),
    filmsAPI.getGenres()
  ])

  if (genresRes.status === 'fulfilled') {
    genres.value = genresRes.value.data
  }

  if (filmsRes.status === 'rejected') {
    console.error(filmsRes.reason)
  }
})
</script>

<style scoped>
.home {
  min-height: calc(100vh - 60px);
}

.search-header {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: 2rem;
}

.search-inner {
  max-width: 1100px;
  margin: 0 auto;
}

.search-inner h1 {
  font-size: 2rem;
  margin-bottom: 1.2rem;
}

.search-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.results-summary {
  margin-top: 0.9rem;
  color: var(--color-muted);
  font-size: 13px;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

select {
  width: 180px;
}

.films-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
  padding: 2rem;
  max-width: 1100px;
  margin: 0 auto;
}

.film-card {
  display: block;
  text-decoration: none;
  color: inherit;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: transform 0.2s, border-color 0.2s;
}

.film-card:hover {
  transform: translateY(-4px);
  border-color: var(--color-accent);
}

.film-poster {
  position: relative;
  aspect-ratio: 2/3;
  background: var(--color-surface2);
  overflow: hidden;
}

.film-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.poster-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 3rem;
  opacity: 0.3;
}

.film-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px 10px;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.film-year {
  font-size: 12px;
  color: rgba(255,255,255,0.7);
}

.film-rating {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-accent);
}

.film-info {
  padding: 12px;
}

.film-title {
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.film-director {
  font-size: 12px;
  color: var(--color-muted);
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.film-review-preview {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  margin-bottom: 8px;
}

.inline-rating {
  color: var(--color-accent);
  font-weight: 500;
}

.review-count {
  color: var(--color-muted);
}

.film-genres {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.film-genre {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  background: rgba(232,201,122,0.12);
  color: var(--color-accent);
  border-radius: 20px;
}

.no-results {
  grid-column: 1/-1;
  text-align: center;
  padding: 3rem;
  color: var(--color-muted);
}

.error-banner {
  margin: 2rem;
  padding: 1rem 1.5rem;
  background: rgba(192,57,43,0.15);
  border: 1px solid var(--color-accent2);
  border-radius: var(--radius-md);
  color: #e74c3c;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 0 2rem 2.5rem;
}

.page-btn {
  min-width: 42px;
  height: 38px;
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 13px;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.page-btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.page-number.active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-bg);
  font-weight: 600;
}

</style>
