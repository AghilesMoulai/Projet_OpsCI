<template>
  <div class="admin-page">
    <div class="admin-header">
      <div class="admin-header-inner">
        <div>
          <h1>Administration</h1>
          <p class="admin-sub">Gérez le catalogue de la cinémathèque</p>
        </div>
        <RouterLink to="/admin/films/new" class="btn btn-primary">+ Ajouter un film</RouterLink>
      </div>
    </div>

    <div class="admin-content">
      <div class="stats-row">
        <div class="stat-card">
          <p class="stat-label">Films</p>
          <p class="stat-value">{{ store.films.length }}</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Note moyenne</p>
          <p class="stat-value">★ {{ avgRating }}</p>
        </div>
      </div>

      <input v-model="search" type="text" placeholder="Filtrer les films…" class="filter-input" />

      <div v-if="store.loading" class="loading">Chargement…</div>
      <div v-else class="films-table card">
        <table>
          <thead>
            <tr>
              <th>Titre</th><th>Réalisateur</th><th>Année</th><th>Genre</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="film in filteredFilms" :key="film.id">
              <td class="td-title"><RouterLink :to="`/films/${film.id}`">{{ film.title }}</RouterLink></td>
              <td>{{ film.director }}</td>
              <td>{{ film.year }}</td>
              <td>
                <div class="genre-pills">
                  <span v-for="genre in splitGenres(film.genre)" :key="genre" class="genre-pill">{{ genre }}</span>
                </div>
              </td>
              <td>
                <div class="action-btns">
                  <RouterLink :to="`/admin/films/${film.id}/edit`" class="btn btn-ghost btn-sm">Modifier</RouterLink>
                  <button class="btn btn-danger btn-sm" @click="confirmDelete(film)">Supprimer</button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredFilms.length === 0">
              <td colspan="5" style="text-align:center;color:var(--color-muted);padding:2rem;">Aucun film.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="filmToDelete" class="modal-overlay" @click.self="filmToDelete = null">
      <div class="modal card">
        <h3>Supprimer ce film ?</h3>
        <p>Vous êtes sur le point de supprimer <strong>{{ filmToDelete.title }}</strong>. Cette action est irréversible.</p>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="filmToDelete = null">Annuler</button>
          <button class="btn btn-danger" @click="doDelete">Supprimer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useFilmsStore } from '../stores/films'

const store = useFilmsStore()
const search = ref('')
const filmToDelete = ref(null)

// L'admin travaille sur toute la liste pour pouvoir filtrer et gérer le
// catalogue complet, pas seulement la première page publique.
onMounted(() => store.fetchAllPages())

const filteredFilms = computed(() => {
  const q = search.value.toLowerCase()
  return store.films.filter(f =>
    f.title?.toLowerCase().includes(q)
    || f.director?.toLowerCase().includes(q)
    || f.genre?.toLowerCase().includes(q)
  )
})

const avgRating = computed(() => {
  const rated = store.films.filter(f => f.average_rating)
  if (!rated.length) return '—'
  return (rated.reduce((s, f) => s + parseFloat(f.average_rating), 0) / rated.length).toFixed(1)
})

function confirmDelete(film) { filmToDelete.value = film }
async function doDelete() {
  await store.remove(filmToDelete.value.id)
  filmToDelete.value = null
}

function splitGenres(value) {
  return String(value || '')
    .split(',')
    .map(genre => genre.trim())
    .filter(Boolean)
}
</script>

<style scoped>

.admin-page {
  min-height: calc(100vh - 60px);
}

.admin-header {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: 2rem;
}

.admin-header-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.admin-header h1 {
  font-size: 2rem;
  margin-bottom: 0.2rem;
}

.admin-sub {
  color: var(--color-muted);
  font-size: 14px;
}

.admin-content {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.25rem;
}

.stat-label {
  font-size: 12px;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 500;
  font-family: var(--font-display);
}

.filter-input {
  margin-bottom: 1rem;
}

.films-table {
  padding: 0; overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead th {
  text-align: left;
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--color-border);
}

tbody tr {
  border-bottom: 1px solid var(--color-border);
  transition: background 0.15s;
}

tbody tr:last-child {
  border-bottom: none;
}

tbody tr:hover {
  background: var(--color-surface2);
}

td {
  padding: 12px 16px;
  font-size: 14px;
  vertical-align: middle;
}

.td-title a {
  color: var(--color-text);
  font-weight: 500;
}

.td-title a:hover {
  color: var(--color-accent);
}

.genre-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.genre-pill {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 20px;
  background: rgba(232,201,122,0.1);
  color: var(--color-accent);
}

.action-btns {
  display: flex;
  gap: 6px;
}

.btn-sm {
  padding: 5px 12px;
  font-size: 12px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal {
  width: 100%;
  max-width: 420px;
  margin: 1rem;
}

.modal h3 {
  font-size: 1.2rem;
  margin-bottom: 0.75rem;
}

.modal p {
  color: var(--color-muted);
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

</style>
