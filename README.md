# Projet OpsCI - Cinematheque

Application web de cinematheque avec :

- un frontend `Vue 3 / Vite / Pinia`
- un backend `Node.js / Express`
- une base de donnees `PostgreSQL`

Le projet est maintenant prepare pour un lancement local en Docker avec une base distante, par exemple `Neon`.

## Architecture

- `front-end/`
  application cliente Vue
- `backend/`
  API Express, authentification JWT, gestion des films et des avis
- `docker-compose.yml`
  orchestration locale des conteneurs frontend et backend
- base PostgreSQL distante
  fournie via `DATABASE_URL`

Flux de fonctionnement :

- le navigateur charge le frontend
- le navigateur appelle l'API via le proxy Nginx du frontend sur `/api`
- Nginx transfere ensuite les requetes API et images vers le backend
- le backend se connecte a PostgreSQL via `DATABASE_URL`

## Fonctionnalites

- inscription et connexion utilisateur
- authentification JWT
- recuperation du profil connecte
- catalogue de films
- filtres par genre, annee, recherche et note minimale
- avis et notes sur les films
- espace administrateur
- ajout, modification et suppression de films
- service des images depuis le backend

## Prerequis

Pour le mode Docker :

- Docker
- Docker Compose
- une base PostgreSQL accessible a distance

Pour le mode developpement local sans Docker :

- Node.js
- npm
- une base PostgreSQL

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
```

Important :

- ne committe jamais les vraies valeurs de `DATABASE_URL`
- ne committe jamais les vraies valeurs de `SECRET_KEY`
- adapte `FRONTEND_URL` et `VITE_API_URL` a l'IP ou au domaine reel en deploiement

### Backend

Le backend peut aussi etre lance sans Docker avec [backend/.env.example](/home/aghiles/Documents/OpsCI/projet/Projet_OpsCI/backend/.env.example).

Il supporte deux modes :

- `DATABASE_URL`
- ou les variables separees `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

### Frontend

Le frontend utilise [front-end/.env.example](/home/aghiles/Documents/OpsCI/projet/Projet_OpsCI/front-end/.env.example).

```env
VITE_API_URL=/api
```

Attention :

- `VITE_API_URL` est injectee au build Vite
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

Pour un test local sur la machine hote :

```env
FRONTEND_URL=http://localhost:8080
VITE_API_URL=/api
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

## Proxy Nginx

Le frontend est servi par `Nginx`, qui joue aussi le role de proxy inverse.

Concretement :

- le navigateur parle uniquement a `http://localhost:8080`
- les routes frontend comme `/` ou `/films/1` servent l'application Vue
- les requetes vers `/api/...` sont transferees au backend Express
- les requetes vers `/images/...` sont aussi transferees au backend

Exemple de flux :

```text
Navigateur -> http://localhost:8080/api/movies/1
Nginx      -> http://backend:3000/movies/1
```

Pourquoi ce proxy est utile :

- il evite au navigateur d'appeler directement `localhost:3000`
- il simplifie la configuration du frontend
- il reduit les problemes de CORS
- il prepare mieux le projet pour un deploiement Docker puis Kubernetes

Depuis le frontend, les appels API utilisent donc :

```text
/api/...
```

et les images :

```text
/images/...
```

### 5. Arreter les conteneurs

```bash
docker compose down
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

## Tests

### Backend

```bash
cd backend
npm test
```

### Frontend

```bash
cd front-end
npm test
```

## Donnees Et Catalogue

Le catalogue initial est base sur :

- [backend/movies.json](/home/aghiles/Documents/OpsCI/projet/Projet_OpsCI/backend/movies.json)
- le dossier [backend/images](/home/aghiles/Documents/OpsCI/projet/Projet_OpsCI/backend/images)

Les donnees ne sont pas lues depuis `movies.json` au runtime :

- les films doivent etre presents en base PostgreSQL
- `movies.json` sert surtout de source initiale

## Images

Le backend sert les images via :

```text
/images/...
```

Point important :

- les images deja presentes dans `backend/images` sont embarquees dans l'image Docker backend
- si de nouvelles images sont ajoutees en production directement dans le conteneur, elles peuvent etre perdues lors d'un redeploiement

Pour une solution plus robuste a terme, il faudra soit :

- monter un volume
- soit utiliser un stockage externe

## Deploiement

Le projet est prepare pour un deploiement avec :

- un backend conteneurise
- un frontend conteneurise
- une base PostgreSQL distante

Points importants a retenir :

- `DATABASE_URL` reste un secret backend
- `VITE_API_URL` peut rester a `/api` quand le frontend est place derriere le proxy Nginx
- `FRONTEND_URL` doit correspondre a l'origine autorisee par le backend pour le CORS
- avec `createWebHistory()`, Nginx doit rediriger les routes vers `index.html`

En deploiement distant :

- plusieurs utilisateurs peuvent utiliser le meme frontend
- plusieurs clients peuvent appeler le meme backend
- tous les utilisateurs partagent la meme base de donnees si le backend pointe vers la meme `DATABASE_URL`

## Structure Des Fichiers Docker

- [docker-compose.yml](/home/aghiles/Documents/OpsCI/projet/Projet_OpsCI/docker-compose.yml)
  orchestre frontend et backend
- [backend/Dockerfile](/home/aghiles/Documents/OpsCI/projet/Projet_OpsCI/backend/Dockerfile)
  image du backend Node
- [front-end/Dockerfile](/home/aghiles/Documents/OpsCI/projet/Projet_OpsCI/front-end/Dockerfile)
  build Vite puis service Nginx
- [front-end/nginx.conf](/home/aghiles/Documents/OpsCI/projet/Projet_OpsCI/front-end/nginx.conf)
  fallback SPA pour Vue Router et proxy `/api` + `/images`

## Points D'Attention

- ne pas mettre de secrets dans `.env.example`
- ne pas committer les vrais fichiers `.env`
- si tu changes `VITE_API_URL`, rebuild le frontend
- si tu changes `docker-compose.yml`, relance `docker compose up --build`
- en deploiement reseau, evite `localhost` si l'application doit etre accessible depuis d'autres machines

## Auteurs

Projet realise dans le cadre d'OpsCI.
