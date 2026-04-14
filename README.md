# Projet OpsCI

Application de cinémathèque avec :
- un backend `Node.js / Express / PostgreSQL`
- un front-end `Vue 3 / Vite / Pinia`

Le plus important pour démarrer est juste en dessous.

## Démarrage rapide

Depuis la racine du projet :

### 1. Installer les dépendances

```bash
cd backend
npm install

cd ../front-end
npm install
```

### 2. Créer les fichiers `.env`

```bash
cp backend/.env.example backend/.env
cp front-end/.env.example front-end/.env
```

### 3. Créer la base PostgreSQL

```bash
sudo -u postgres psql
```

Puis dans `psql` :

```sql
CREATE DATABASE cinematheque;
ALTER USER postgres WITH PASSWORD 'password';
\q
```

### 4. Créer les tables

```bash
cat backend/schema.sql | sudo -u postgres psql -d cinematheque
```

### 5. Importer les films de `movies.json`

Depuis la racine du projet :

```bash
node - <<'EOF'
const fs = require('fs')
const path = require('path')
const pool = require('./backend/db')

;(async () => {
  const filePath = path.join(process.cwd(), 'backend', 'movies.json')
  const movies = JSON.parse(fs.readFileSync(filePath, 'utf8'))

  for (const movie of movies) {
    const exists = await pool.query(
      'SELECT id FROM movies WHERE title = $1 LIMIT 1',
      [movie.title]
    )
    if (exists.rows.length > 0) continue

    await pool.query(
      `INSERT INTO movies (title, director, genre, year, image_url, description)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        movie.title,
        movie.director,
        movie.genre,
        movie.year,
        movie.image_url || null,
        movie.description || null,
      ]
    )
  }

  await pool.end()
})()
EOF
```

### 6. Lancer le backend

```bash
cd backend
node index.js
```

Backend :
```text
http://localhost:3000
```

### 7. Lancer le front

Dans un autre terminal :

```bash
cd front-end
npm run dev
```

Front :
```text
http://localhost:5173
```

## Vérification rapide

### Vérifier les tables

```bash
sudo -u postgres psql -d cinematheque -c "\dt"
```

### Vérifier les films importés

```bash
sudo -u postgres psql -d cinematheque -c "SELECT id, title, year FROM movies ORDER BY id;"
```

### Vérifier les utilisateurs

```bash
sudo -u postgres psql -d cinematheque -c "SELECT id, email, role FROM users;"
```

## Créer un compte admin

1. Créer un compte normalement depuis l’application
2. Puis lancer :

```bash
sudo -u postgres psql -d cinematheque
```

Ensuite :

```sql
UPDATE users
SET role = 'admin'
WHERE email = 'votre-email@example.com';
\q
```

Reconnecte-toi ensuite avec ce compte.

## Variables d’environnement

### Backend

Fichier : `backend/.env`

Exemple :

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cinematheque
DB_USER=postgres
DB_PASSWORD=password
SECRET_KEY=change-me-in-production
```

### Front-end

Fichier : `front-end/.env`

Exemple :

```env
VITE_API_URL=http://localhost:3000
```

## Ce que fait le projet

- inscription et connexion
- session JWT
- catalogue de films
- notes et critiques
- panneau admin
- ajout/modification/suppression de films
- upload ou téléchargement d’affiches dans `backend/images`
- filtres de catalogue
- genres dynamiques depuis la base

## Notes utiles

- `backend/schema.sql` sert uniquement à créer les tables
- `backend/movies.json` contient les films à importer dans PostgreSQL
- les films ne sont pas lus directement depuis `movies.json` au runtime
- le dossier `front-end/dist/` est généré automatiquement par `vite build`

## Déploiement

Pour le déploiement, il faut :
- une base PostgreSQL distante
- des variables d’environnement pour la DB
- un `VITE_API_URL` pointant vers le backend public

Le projet est prêt pour ça, car `backend/db.js` lit maintenant :
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

et le front lit :
- `VITE_API_URL`
