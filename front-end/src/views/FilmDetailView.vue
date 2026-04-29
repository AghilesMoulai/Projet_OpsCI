<template>
  <div class="detail-page" v-if="store.current">
    <div class="detail-hero">
      <div class="hero-bg" :style="store.current.image_url ? `background-image:url(${resolveMediaUrl(store.current.image_url)})` : ''"></div>
      <div class="hero-content">
        <RouterLink to="/" class="back-link">← Catalogue</RouterLink>
        <div class="hero-main">
          <div class="poster-box">
            <img v-if="store.current.image_url" :src="resolveMediaUrl(store.current.image_url)" :alt="store.current.title" />
            <div v-else class="poster-ph">🎬</div>
          </div>
          <div class="film-meta">
            <div class="genre-tags">
              <span v-for="genre in splitGenres(store.current.genre)" :key="genre" class="genre-tag">{{ genre }}</span>
            </div>
            <h1>{{ store.current.title }}</h1>
            <p class="meta-line">
              Réalisé par <strong>{{ store.current.director }}</strong>
              &nbsp;·&nbsp; {{ store.current.year }}
            </p>
            <p class="synopsis">{{ store.current.description }}</p>

            <!-- Note moyenne -->
            <div class="rating-block">
              <p class="rating-label">
                Note moyenne :
                <span class="avg-score">★ {{ store.current.average_rating ?? '—' }}</span>
                <span class="rating-count">({{ store.current.ratings_count ?? 0 }} avis)</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="suggestions-section">
      <div class="suggestions-inner">
        <h2>Films suggérés</h2>

        <div v-if="suggestionsLoading" class="loading">Chargement des suggestions…</div>

        <div v-else-if="suggestions.length" class="suggestions-grid">
          <RouterLink
            v-for="film in suggestions"
            :key="film.id"
            :to="`/films/${film.id}`"
            class="suggestion-card"
          >
            <div class="suggestion-poster">
              <img
                v-if="film.image_url"
                :src="resolveMediaUrl(film.image_url)"
                :alt="film.title"
              />
              <div v-else class="poster-ph">🎬</div>
            </div>

            <div class="suggestion-info">
              <p class="suggestion-title">{{ film.title }}</p>
              <p class="suggestion-meta">{{ film.director }} · {{ film.year }}</p>
              <p class="suggestion-rating">
                ★ {{ film.average_rating ?? '—' }}
                <span>({{ film.ratings_count ?? 0 }} avis)</span>
              </p>
            </div>
          </RouterLink>
        </div>

        <p v-else class="no-comments">Aucune suggestion disponible.</p>
      </div>
    </div>


    <!-- Reviews -->
    <div class="comments-section">
      <div class="comments-inner">
        <h2>Avis ({{ reviews.length }})</h2>

        <!-- Formulaire avis -->
        <form @submit.prevent="submitReview" class="comment-form card">
          <div class="stars-row">
            <span class="stars-label">Votre note :</span>
            <div class="stars">
              <button v-for="s in 5" :key="s" type="button" class="star-btn"
                :class="{ active: hover >= s || form.rating >= s }"
                @mouseenter="hover = s" @mouseleave="hover = 0"
                @click="form.rating = s">★</button>
            </div>
            <span class="rating-val" v-if="form.rating">{{ form.rating }}/5</span>
          </div>
          <textarea v-model="form.comment" placeholder="Partagez votre avis…" rows="3"></textarea>
          <div class="form-footer">
            <button type="submit" class="btn btn-primary" :disabled="!form.rating || submitLoading">
              {{ submitLoading ? 'Publication…' : 'Publier' }}
            </button>
          </div>
          <p v-if="reviewError" class="error-msg">{{ reviewError }}</p>
        </form>

        <!-- Liste des avis -->
        <div v-if="reviewsLoading" class="loading">Chargement…</div>
        <div v-else class="comments-list">
          <div v-for="r in reviews" :key="r.id" class="comment-item card">
            <div class="comment-header">
              <div class="avatar">{{ r.author_email?.[0]?.toUpperCase() ?? '?' }}</div>
              <div>
                <p class="comment-author">{{ r.author_email ?? 'Anonyme' }}</p>
                <p class="comment-date">Note : <span class="inline-stars">{{ '★'.repeat(r.rating) }}{{ '☆'.repeat(5 - r.rating) }}</span></p>
              </div>
              <button v-if="auth.isAdmin" class="delete-btn" @click="deleteReview(r.id)">✕</button>
            </div>
            <p v-if="r.comment" class="comment-text">{{ r.comment }}</p>
          </div>
          <p v-if="reviews.length === 0" class="no-comments">Soyez le premier à donner votre avis !</p>
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="store.loading" class="loading" style="padding:4rem;">Chargement…</div>
  <div v-else class="loading" style="padding:4rem; color: var(--color-muted);">Film introuvable.</div>
</template>

<script setup>
import { ref, onMounted} from 'vue'
import { useRoute, onBeforeRouteUpdate } from 'vue-router'
import { useFilmsStore } from '../stores/films'
import { useAuthStore }  from '../stores/auth'
import { filmsAPI, reviewsAPI, resolveMediaUrl } from '../services/api'

const route  = useRoute()
const store  = useFilmsStore()
const auth   = useAuthStore()

const reviews      = ref([])
const reviewsLoading = ref(false)
const submitLoading  = ref(false)
const reviewError    = ref('')
const hover = ref(0)
const suggestions = ref([])
const suggestionsLoading = ref(false)

const form = ref({ rating: 0, comment: '' })

onMounted(async () => {
  await loadFilmPage(route.params.id)
})

onBeforeRouteUpdate(async (to) => {
  await loadFilmPage(to.params.id)
})


async function loadReviews(movieId) {
  reviewsLoading.value = true
  try {
    const res = await reviewsAPI.getByMovie(movieId)
    reviews.value = res.data
  } finally {
    reviewsLoading.value = false
  }
}

async function loadSuggestions(movieId) {
  suggestionsLoading.value = true
  try {
    const res = await filmsAPI.getSuggestions(movieId)
    suggestions.value = res.data
  } finally {
    suggestionsLoading.value = false
  }
}

async function loadFilmPage(movieId) {
  await store.fetchById(movieId)
  await Promise.all([
    loadReviews(movieId),
    loadSuggestions(movieId)
  ])
}

async function submitReview() {
  if (!form.value.rating) return
  submitLoading.value = true
  reviewError.value = ''
  try {
    const res = await reviewsAPI.create({
      movie_id: parseInt(route.params.id),
      rating:   form.value.rating,
      comment:  form.value.comment || undefined
    })
    reviews.value.unshift(res.data)
    form.value = { rating: 0, comment: '' }
    // Rafraîchir la note moyenne
    await store.fetchById(route.params.id)
  } catch (e) {
    reviewError.value = e.response?.data?.message || 'Erreur lors de la publication.'
  } finally {
    submitLoading.value = false
  }
}

async function deleteReview(id) {
  await reviewsAPI.delete(id)
  reviews.value = reviews.value.filter(r => r.id !== id)
  await store.fetchById(route.params.id)
}

function splitGenres(value) {
  return String(value || '')
    .split(',')
    .map(genre => genre.trim())
    .filter(Boolean)
}
</script>

<style scoped>

.detail-page {
  min-height: calc(100vh - 60px);
}

.detail-hero {
  position: relative;
  background: var(--color-surface);
  padding-bottom: 3rem;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0.08;
  filter: blur(20px);
}

.hero-content {
  position: relative;
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem;
}

.back-link {
  display: inline-block;
  color: var(--color-muted);
  font-size: 13px;
  margin-bottom: 1.5rem;
  transition: color 0.2s;
}

.back-link:hover {
  color: var(--color-text);
}

.hero-main {
  display: flex;
  gap: 2.5rem;
  align-items: flex-start;
}

.poster-box {
  flex-shrink: 0;
  width: 200px;
  aspect-ratio: 2/3;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-surface2);
}

.poster-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.poster-ph {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  opacity: 0.2;
}

.genre-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 0.75rem;
}

.genre-tag {
  font-size: 11px;
  font-weight: 500;
  padding: 3px 10px;
  background: rgba(232,201,122,0.12);
  color: var(--color-accent);
  border-radius: 20px;
}

.film-meta h1 {
  font-size: clamp(1.6rem, 3vw, 2.8rem);
  margin-bottom: 0.5rem;
}

.meta-line {
  font-size: 14px;
  color: var(--color-muted);
  margin-bottom: 1rem;
}

.synopsis {
  font-size: 15px;
  line-height: 1.8;
  color: rgba(240,237,232,0.8);
  margin-bottom: 1.5rem;
  max-width: 600px;
}

.rating-block {
  margin-top: 1rem;
}

.rating-label {
  font-size: 14px;
  color: var(--color-muted);
}

.avg-score {
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--color-accent);
  margin-left: 6px;
}

.rating-count {
  font-size: 12px;
  color: var(--color-muted);
  margin-left: 4px;
}

.comments-section {
  background: var(--color-bg);
}

.comments-inner {
  max-width: 760px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

.comments-inner h2 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
}

.comment-form {
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stars-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stars-label {
  font-size: 13px;
  color: var(--color-muted);
}

.stars {
  display: flex;
  gap: 4px;
}

.star-btn {
  background: none;
  border: none;
  font-size: 1.6rem;
  color: var(--color-border);
  cursor: pointer;
  transition: color 0.15s,
  transform 0.15s;
  padding: 0;
  line-height: 1;
}

.star-btn.active {
  color: var(--color-accent);
}

.star-btn:hover {
  transform: scale(1.15);
}

.rating-val {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-accent);
}

.form-footer {
  display: flex;
  justify-content: flex-end;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comment-item {
  padding: 1rem 1.25rem;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(232,201,122,0.15);
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  font-size: 14px;
  flex-shrink: 0;
}

.comment-author {
  font-weight: 500;
  font-size: 14px;
}

.comment-date {
  font-size: 12px;
  color: var(--color-muted);
}

.inline-stars {
  color: var(--color-accent);
  letter-spacing: 1px;
}

.delete-btn {
  margin-left: auto;
  background: none;
  color: var(--color-muted);
  font-size: 13px;
  padding: 4px 6px;
  border-radius: var(--radius-sm);
  transition: color 0.2s, background 0.2s;
  cursor: pointer;
}

.delete-btn:hover {
  color: #e74c3c;
  background: rgba(192,57,43,0.1);
}

.comment-text {
  font-size: 14px;
  line-height: 1.7;
}

.no-comments {
  text-align: center;
  color: var(--color-muted);
  padding: 2rem;
}

@media (max-width: 640px) {
  .hero-main {
    flex-direction: column;
  }
  .poster-box {
    width: 140px;
  }
}

.suggestions-section {
  background: var(--color-bg);
  border-top: 1px solid var(--color-border);
}

.suggestions-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem;
}

.suggestions-inner h2 {
  font-size: 1.5rem;
  margin-bottom: 1.25rem;
}

.suggestions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.suggestion-card {
  display: block;
  color: inherit;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: transform 0.2s, border-color 0.2s;
}

.suggestion-card:hover {
  transform: translateY(-4px);
  border-color: var(--color-accent);
}

.suggestion-poster {
  aspect-ratio: 2 / 3;
  background: var(--color-surface2);
  overflow: hidden;
}

.suggestion-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.suggestion-info {
  padding: 0.9rem;
}

.suggestion-title {
  font-weight: 600;
  margin-bottom: 0.35rem;
}

.suggestion-meta {
  font-size: 13px;
  color: var(--color-muted);
  margin-bottom: 0.4rem;
}

.suggestion-rating {
  font-size: 13px;
  color: var(--color-accent);
}

.suggestion-rating span {
  color: var(--color-muted);
  margin-left: 4px;
}


</style>
