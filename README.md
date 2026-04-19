# Projet OpsCI - Cinémathèque

Application web de cinematheque avec :

- un frontend `Vue 3 / Vite / Pinia`
- un backend `Node.js / Express`
- une base de donnees `PostgreSQL` distante via `Neon`
- un stockage d'images objet via `MinIO`

Le projet est preparé pour un lancement local en Docker avec :

- frontend conteneurisé
- backend conteneurisé
- proxy `Nginx`
- stockage d'images `MinIO`
- base PostgreSQL distante (`Neon` pour ma part car gratuite pour des petites DB)

## Architecture

- `front-end/`
  application cliente Vue
- `backend/`
  API Express, authentification JWT, gestion des films et des avis
- `docker-compose.yml`
  orchestration locale des conteneurs frontend, backend et MinIO
- base PostgreSQL distante
  fournie via `DATABASE_URL`
- `MinIO`
  stockage persistant des affiches de films

Flux de fonctionnement :

- le navigateur charge le frontend
- le navigateur appelle l'API via le proxy Nginx du frontend sur `/api`
- Nginx transfere les requetes API vers le backend
- Nginx transfere les requetes images `/movie-images/...` vers MinIO
- le backend se connecte a PostgreSQL via `DATABASE_URL`
- le backend enregistre les nouvelles affiches dans le bucket `movie-images` de MinIO

## Fonctionnalites

- inscription et connexion utilisateur
- authentification JWT
- recuperation du profil connecté
- catalogue de films
- filtres par genre, année, recherche et note minimale
- avis et notes sur les films
- espace administrateur
- ajout, modification et suppression de films
- upload d'images de films depuis le formulaire admin
- téléchargement d'une image distante puis stockage dans MinIO
- service des images via le proxy Nginx

## Prerequis

Pour le mode Docker :

- Docker
- Docker Compose
- une base PostgreSQL accessible a distance, par exemple `Neon`

Pour le mode developpement local sans Docker :

- Node.js
- npm
- une base PostgreSQL
- une instance `MinIO` lancee localement si tu veux tester l'upload d'images hors Docker

## Variables D'Environnement

### Racine du projet

Le fichier `.env` a la racine est utilise par `docker compose`.

Tu peux partir de [/.env.example](/home/aghiles/Documents/OpsCI/projet/Projet_OpsCI/.env.example).

Exemple :

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
SECRET_KEY=change-me-in-production
FRONTEND_URL=http://localhost:8080
VITE_API_URL=/api
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=change-me
```

Important :

- ne committe jamais les vraies valeurs de `DATABASE_URL`
- ne committe jamais les vraies valeurs de `SECRET_KEY`
- ne committe jamais les vrais identifiants MinIO
- adapte `FRONTEND_URL` et `VITE_API_URL` a l'IP ou au domaine reel en deploiement

### Backend

Le backend peut aussi etre lance sans Docker avec [backend/.env.example](/home/aghiles/Documents/OpsCI/projet/Projet_OpsCI/backend/.env.example).

Il supporte deux modes :

- `DATABASE_URL`
- ou les variables separees `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

Pour le backend, ajoute aussi la configuration MinIO :

```env
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=change-me
MINIO_BUCKET=movie-images
```

Attention :

- en mode Docker Compose, `MINIO_ENDPOINT=minio` fonctionne car les services Docker se résolvent par leur nom
- `MINIO_USE_SSL=false` est adapté à une communication interne entre conteneurs
- en dehors de Docker, adapte `MINIO_ENDPOINT` a l'hote réel de ton service MinIO

### Frontend

Le frontend utilise [front-end/.env.example](/home/aghiles/Documents/OpsCI/projet/Projet_OpsCI/front-end/.env.example).

```env
VITE_API_URL=/api
```

Attention :

- `VITE_API_URL` est injectée au build Vite
- si tu modifies sa valeur en Docker, il faut rebuild le frontend

## Demarrage Rapide Avec Docker

Le mode recommande pour lancer le projet est Docker Compose.

### 1. Creer le fichier `.env` a la racine

Depuis la racine :

```bash
cp .env.example .env
```

Puis renseigne :

- `DATABASE_URL`
- `SECRET_KEY`
- `FRONTEND_URL`
- `VITE_API_URL`
- `MINIO_ROOT_USER`
- `MINIO_ROOT_PASSWORD`

Pour un test local sur la machine hote :

```env
FRONTEND_URL=http://localhost:8080
VITE_API_URL=/api
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=change-me
```

Pour un acces depuis une autre machine du reseau, remplace `localhost` par l'IP ou le domaine du serveur.

Exemple :

```env
FRONTEND_URL=http://192.168.1.50:8080
VITE_API_URL=/api
```

### 2. Construire les images

```bash
docker compose build
```

Si ton utilisateur n'a pas encore acces au daemon Docker :

```bash
sudo docker compose build
```

### 3. Demarrer les conteneurs

```bash
docker compose up
```

Ou en arriere-plan :

```bash
docker compose up -d
```

### 4. Acceder a l'application

- Frontend : `http://localhost:8080`
- Backend : `http://localhost:3000`
- Console MinIO : `http://localhost:9001`

### 5. Arreter les conteneurs

```bash
docker compose down
```

## Proxy Nginx

Le frontend est servi par `Nginx`, qui joue aussi le role de proxy inverse.

Concretement :

- le navigateur parle uniquement a `http://localhost:8080`
- les routes frontend comme `/` ou `/films/1` servent l'application Vue
- les requetes vers `/api/...` sont transferees au backend Express
- les requetes vers `/movie-images/...` sont transferees au stockage MinIO

Exemple de flux :

```text
Navigateur -> http://localhost:8080/api/movies/1
Nginx      -> http://backend:3000/movies/1
```

```text
Navigateur -> http://localhost:8080/movie-images/poster.jpg
Nginx      -> http://minio:9000/movie-images/poster.jpg
```

Pourquoi ce proxy est utile :

- il evite au navigateur d'appeler directement le backend
- il simplifie la configuration du frontend
- il reduit les problemes de CORS
- il centralise l'acces aux API et aux images
- il prepare mieux le projet pour un deploiement Docker puis Kubernetes

Depuis le frontend, les appels utilisent donc :

```text
/api/...
```

et pour les images :

```text
/movie-images/...
```

## Demarrage Sans Docker

Ce mode reste utile pour le developpement.

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm start
```

API disponible sur :

```text
http://localhost:3000
```

### Frontend

Dans un autre terminal :

```bash
cd front-end
npm install
cp .env.example .env
npm run dev
```

Frontend disponible sur :

```text
http://localhost:5173
```

### MinIO

Si tu lances le projet sans Docker, il faut aussi lancer `MinIO` a part.

Exemple attendu en developpement local :

- frontend : `http://localhost:5173`
- backend : `http://localhost:3000`
- MinIO API : `http://localhost:9000`
- console MinIO : `http://localhost:9001`

Dans ce mode, `front-end/nginx.conf` n'est pas utilise tant que le frontend tourne avec `Vite` en mode dev.

## Tests

### Tests applicatifs

#### Backend

```bash
cd backend
npm test
```

Les tests backend couvrent notamment :

- l'inscription
- la connexion
- l'ajout d'avis

#### Frontend

```bash
cd front-end
npm test -- --run
```

Les tests frontend couvrent notamment :

- la resolution des URLs media
- le store d'authentification

## Tests De Securite

La CI GitLab inclut plusieurs controles de securite :

- `npm audit` sur le backend
- `npm audit` sur le frontend
- `semgrep` pour l'analyse statique
- `OWASP ZAP baseline` contre l'application lancee en Docker

Fichier de pipeline :

- [.gitlab-ci.yml](/home/aghiles/Documents/OpsCI/projet/Projet_OpsCI/.gitlab-ci.yml)

Rapport ZAP genere :

- [zap-report.html](/home/aghiles/Documents/OpsCI/projet/Projet_OpsCI/zap-report.html)

Le scan ZAP est execute sur le frontend servi via Nginx, ce qui permet de tester :

- les en-tetes HTTP de securite
- le comportement du proxy
- l'exposition generale de l'application web

## Données Et Catalogue

Le projet utilise `PostgreSQL` via `Neon` comme source de verite.

Les films, utilisateurs et avis sont lus depuis la base.

Le fichier `movies.json` peut servir d'exemple ou de jeu de donnees historique, mais l'application s'appuie sur PostgreSQL au runtime.

## Images

Les affiches de films sont stockees dans `MinIO`, dans le bucket :

```text
movie-images
```

Le backend :

- accepte une image locale en base64 depuis le formulaire admin
- ou telecharge une image distante
- puis l'enregistre dans MinIO
- et sauvegarde ensuite le chemin de l'image en base PostgreSQL

Les images sont ensuite servies au frontend via :

```text
/movie-images/...
```

Avantages de cette approche :

- les images ne dépendent plus du systeme de fichiers du conteneur backend
- le stockage est plus durable
- l'architecture est plus proche d'un environnement de production
- cela facilite une future migration vers Kubernetes ou un stockage compatible S3

## Déploiement

Le projet est prepare pour un deploiement avec :

- un backend conteneurise
- un frontend conteneurise
- un proxy `Nginx`
- un stockage d'objets `MinIO`
- une base PostgreSQL distante

Points importants a retenir :

- `DATABASE_URL` reste un secret backend
- `VITE_API_URL` peut rester a `/api` quand le frontend est place derriere le proxy Nginx
- `FRONTEND_URL` doit correspondre a l'origine autorisee par le backend pour le CORS
- les images sont accessibles via `/movie-images/...`
- avec `createWebHistory()`, Nginx doit rediriger les routes frontend vers `index.html`

En deploiement distant :

- plusieurs utilisateurs peuvent utiliser le meme frontend
- plusieurs clients peuvent appeler le meme backend
- tous les utilisateurs partagent la meme base PostgreSQL si le backend pointe vers la meme `DATABASE_URL`
- les images restent centralisees dans MinIO

## Structure Des Fichiers Docker

- [docker-compose.yml](/home/aghiles/Documents/OpsCI/projet/Projet_OpsCI/docker-compose.yml)
  orchestre frontend, backend et MinIO
- [backend/Dockerfile](/home/aghiles/Documents/OpsCI/projet/Projet_OpsCI/backend/Dockerfile)
  image du backend Node
- [front-end/Dockerfile](/home/aghiles/Documents/OpsCI/projet/Projet_OpsCI/front-end/Dockerfile)
  build Vite puis service Nginx
- [front-end/nginx.conf](/home/aghiles/Documents/OpsCI/projet/Projet_OpsCI/front-end/nginx.conf)
  fallback SPA pour Vue Router et proxy `/api` + `/movie-images`
- [backend/services/objectStorage.js](/home/aghiles/Documents/OpsCI/projet/Projet_OpsCI/backend/services/objectStorage.js)
  integration du stockage MinIO

## Points D'Attention

- ne pas mettre de secrets dans `.env.example`
- ne pas committer les vrais fichiers `.env`
- si tu changes `VITE_API_URL`, rebuild le frontend
- si tu modifies `front-end/nginx.conf`, rebuild le frontend Docker
- si tu modifies la configuration MinIO, relance les conteneurs concernés
- si tu changes `docker-compose.yml`, relance `docker compose up --build`
- si tu lances le frontend sans Docker avec `Vite`, le proxy Nginx n'est pas utilise
- en deploiement reseau, évite `localhost` si l'application doit être accessible depuis d'autres machines

## Auteurs

Projet realise dans le cadre de l'UE OpsCI. Par:

- Aghiles MOULAI <Aghiles.Moulai.pro@gmail.com>

- Hocine BALEH <Hocine_b18@outlook.com>

