<template>
  <div class="form-page">
    <div class="form-header">
      <div class="form-header-inner">
        <RouterLink to="/admin" class="back-link">← Retour à l'administration</RouterLink>
        <h1>{{ isEdit ? 'Modifier le film' : 'Ajouter un film' }}</h1>
      </div>
    </div>

    <div class="form-content">
      <form @submit.prevent="handleSubmit" class="film-form card">
        <div class="form-grid">
          <div class="field full">
            <label>Titre *</label>
            <input v-model="form.title" type="text" placeholder="Titre du film" required />
          </div>
          <div class="field">
            <label>Réalisateur *</label>
            <input v-model="form.director" type="text" placeholder="Nom du réalisateur" required />
          </div>
          <div class="field">
            <label>Année *</label>
            <input v-model.number="form.year" type="number" min="1888" :max="new Date().getFullYear()" required />
          </div>
          <div class="field">
            <label>Genres *</label>
            <div class="genre-options">
              <label v-for="g in genres" :key="g" class="genre-choice">
                <input v-model="selectedGenres" type="checkbox" :value="g" />
                <span>{{ g }}</span>
              </label>
            </div>
            <input
              v-model="customGenres"
              type="text"
              placeholder="Ajouter: Animation, Thriller..."
            />
            <small class="field-help">Tu peux cocher plusieurs genres et ajouter des nouveaux séparés par des virgules.</small>
          </div>
          <div class="field full">
            <label>Affiche du film</label>
            <input ref="fileInput" type="file" accept="image/*" @change="handleFileChange" />
            <small class="field-help">Choisis une image locale pour l'enregistrer dans le cloud.</small>
            <label>Ou URL distante</label>
            <input v-model="form.image_url" type="text" placeholder="https://… ou /movie-images/..." @input="clearSelectedFile" />
            <small class="field-help">Si tu mets une URL, le backend télécharge l'image et la stocke aussi dans le cloud `minio/movie-images`.</small>
            <div v-if="previewUrl" class="poster-preview">
              <img :src="previewUrl" alt="Aperçu" @error="previewUrl = ''" />
            </div>
          </div>
          <div class="field full">
            <!-- Champ = description (nom exact de la BDD) -->
            <label>Description</label>
            <textarea v-model="form.description" rows="4" placeholder="Synopsis du film…"></textarea>
          </div>
        </div>

        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

        <div class="form-actions">
          <RouterLink to="/admin" class="btn btn-ghost">Annuler</RouterLink>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            {{ loading ? 'Enregistrement…' : (isEdit ? 'Modifier' : 'Ajouter le film') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFilmsStore } from '../stores/films'
import { filmsAPI, resolveMediaUrl } from '../services/api'

const route  = useRoute()
const router = useRouter()
const store  = useFilmsStore()

const isEdit   = computed(() => !!route.params.id)
const loading  = ref(false)
const errorMsg = ref('')
const fileInput = ref(null)
const selectedFile = ref(null)
const previewUrl = ref('')
const genres = ref([])
const selectedGenres = ref([])
const customGenres = ref('')

// Champs exacts du schéma SQL
const form = ref({ title: '', director: '', year: new Date().getFullYear(), genre: '', image_url: '', description: '' })

onMounted(async () => {
  try {
    const genresRes = await filmsAPI.getGenres()
    genres.value = genresRes.data
  } catch (e) {
    console.error(e)
  }

  if (isEdit.value) {
    await store.fetchById(route.params.id)
    if (store.current) {
      const { title, director, year, genre, image_url, description } = store.current
      form.value = { title, director, year, genre, image_url: image_url || '', description: description || '' }
      previewUrl.value = resolveMediaUrl(image_url || '')

      // En modification, on retransforme la chaîne "Action, Drame" en liste
      // pour cocher automatiquement les bons genres.
      const movieGenres = splitGenres(genre)

      const missingGenres = movieGenres.filter(g => !genres.value.includes(g))
      if (missingGenres.length > 0) {
        genres.value = [...genres.value, ...missingGenres].sort((a, b) => a.localeCompare(b))
      }

      selectedGenres.value = movieGenres
    }
  }
})

function splitGenres(value) {
  // Les nouveaux genres saisis à la main sont séparés par des virgules.
  return String(value || '')
    .split(',')
    .map(genre => genre.trim())
    .filter(Boolean)
}

function resolveGenres() {
  // Fusionne les genres cochés et ceux ajoutés manuellement, sans doublons.
  return [...new Set([
    ...selectedGenres.value,
    ...splitGenres(customGenres.value)
  ])]
}

function clearSelectedFile() {
  selectedFile.value = null
  if (fileInput.value) fileInput.value.value = ''
  previewUrl.value = resolveMediaUrl(form.value.image_url)
}

function handleFileChange(event) {
  const file = event.target.files?.[0]
  selectedFile.value = file || null

  if (file) {
    form.value.image_url = ''
    previewUrl.value = URL.createObjectURL(file)
  } else {
    previewUrl.value = resolveMediaUrl(form.value.image_url)
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error("Impossible de lire le fichier image."))
    reader.readAsDataURL(file)
  })
}

async function handleSubmit() {
  loading.value  = true
  errorMsg.value = ''
  try {
    // Le backend accepte un tableau et le normalise avant l'insertion.
    const movieGenres = resolveGenres()

    if (movieGenres.length === 0) {
      errorMsg.value = 'Au moins un genre est requis.'
      return
    }

    const payload = { ...form.value, genre: movieGenres }

    if (selectedFile.value) {
      payload.image_base64 = await readFileAsDataUrl(selectedFile.value)
      payload.image_name = selectedFile.value.name
      payload.image_url = ''
    }

    if (isEdit.value) {
      await store.update(parseInt(route.params.id), payload)
    } else {
      await store.create(payload)
    }
    router.push('/admin')
  } catch (e) {
    errorMsg.value = e.response?.data?.message || 'Une erreur est survenue.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.form-page {
  min-height: calc(100vh - 60px);
}

.form-header {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: 2rem;
}

.form-header-inner {
  max-width: 760px;
  margin: 0 auto;
}

.back-link {
  display: inline-block;
  color: var(--color-muted);
  font-size: 13px;
  margin-bottom: 0.75rem;
  transition: color 0.2s;
}

.back-link:hover {
  color: var(--color-text);
}

.form-header h1 {
  font-size: 1.8rem;
}

.form-content {
  max-width: 760px;
  margin: 2rem auto;
  padding: 0 2rem;
}

.film-form {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.2rem;
  margin-bottom: 1.5rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field.full {
  grid-column: 1 / -1;
}

.field label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-muted);
}

.genre-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 130px;
  overflow: auto;
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface2);
}

.genre-choice {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: auto;
  padding: 5px 8px;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  color: var(--color-text);
  font-size: 12px;
}

.genre-choice input {
  width: auto;
}

.field-help {
  font-size: 12px;
  color: var(--color-muted);
}

.poster-preview {
  margin-top: 10px;
  width: 120px;
  aspect-ratio: 2/3;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.poster-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(0,0,0,0.3);
  border-top-color: #000;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 600px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  .field.full {
    grid-column: 1;
  }
}

</style>
