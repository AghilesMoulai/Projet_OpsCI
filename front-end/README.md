# Cinémathèque — Frontend (Phase 1)

## Stack
- Vue 3 (Composition API)
- Vue Router 4 (guards par rôle)
- Pinia (state management)
- Axios (appels API)
- Vite (bundler)

## Lancer le projet

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # build production
npm test        # tests (vitest)
```

## Structure

```
src/
├── views/
│   ├── LoginView.vue       # page de connexion (public)
│   ├── HomeView.vue        # catalogue films (usager)
│   ├── FilmDetailView.vue  # fiche film + commentaires + notes
│   ├── AdminView.vue       # dashboard développeur
│   └── FilmFormView.vue    # formulaire ajout/modification film
├── components/
│   └── NavBar.vue
├── stores/
│   ├── auth.js             # Pinia: authentification + rôle
│   └── films.js            # Pinia: catalogue
├── router/
│   └── index.js            # routes + guards
├── services/
│   └── api.js              # Axios + intercepteurs JWT
└── assets/
    └── main.css            # design system global
```

## Rôles

| Rôle        | Accès |
|-------------|-------|
| Usager      | Catalogue, fiche film, commentaires, évaluations |
| Développeur | Tout + admin (ajouter, modifier, supprimer films) |

## Routes

| Path                    | Vue                | Accès       |
|-------------------------|--------------------|-------------|
| `/login`                | LoginView          | Public      |
| `/`                     | HomeView           | Usager+     |
| `/films/:id`            | FilmDetailView     | Usager+     |
| `/admin`                | AdminView          | Dev only    |
| `/admin/films/new`      | FilmFormView       | Dev only    |
| `/admin/films/:id/edit` | FilmFormView       | Dev only    |

## API attendue (backend Phase 2)

- `POST /api/auth/login` → `{ token, user: { id, name, email, role } }`
- `GET  /api/auth/me`
- `GET  /api/films?search=&genre=&sort=`
- `GET  /api/films/:id`
- `POST /api/films` (dev)
- `PUT  /api/films/:id` (dev)
- `DELETE /api/films/:id` (dev)
- `GET  /api/films/:id/comments`
- `POST /api/films/:id/comments`
- `DELETE /api/comments/:id`
- `POST /api/films/:id/ratings`