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

Le projet peut aussi etre lance en Kubernetes local avec `Minikube` :

- frontend, backend et `MinIO` deployes dans le cluster
- images Docker construites dans l'environnement Docker de `Minikube`
- `Ingress` local pour exposer l'application
- `HorizontalPodAutoscaler` pour le frontend et le backend
- migration possible des anciennes affiches depuis le `MinIO` Docker historique vers le `MinIO` Kubernetes

## Architecture

- `front-end/`
  application cliente Vue
- `backend/`
  API Express, authentification JWT, gestion des films et des avis
- `docker-compose.yml`
  orchestration locale des conteneurs frontend, backend et MinIO
- `k8s/`
  manifests Kubernetes pour `Minikube`, `Ingress` et autoscaling
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
- pour les tests Kubernetes sans domaine fixe, le CORS backend autorise `localhost` et les adresses privees du reseau local

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
# SOURCE_DATABASE_URL=postgresql://user:password@old-host/old-db?sslmode=require
SECRET_KEY=change-me-in-production
FRONTEND_URL=http://localhost:8080
VITE_API_URL=/api
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=change-me
```

Important :

- ne committe jamais les vraies valeurs de `DATABASE_URL`
- si tu migres depuis une autre base, garde l'ancienne URL dans `SOURCE_DATABASE_URL`
- ne committe jamais les vraies valeurs de `SECRET_KEY`
- ne committe jamais les vrais identifiants MinIO
- adapte `FRONTEND_URL` et `VITE_API_URL` a l'IP ou au domaine reel en deploiement
- URL-encode les mots de passe PostgreSQL si besoin, par exemple `@` devient `%40` et `'` devient `%27`
- pour un projet d'experience sans domaine public, `FRONTEND_URL` peut rester sur `http://localhost:8080` car le backend accepte aussi les acces depuis le reseau local prive

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

## Démarrage Sans Docker

Ce mode reste utile pour le developpement.

### Démarrage Backend

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

### Démarrage Frontend

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

#### Test Backend

```bash
cd backend
npm test
```

Les tests backend couvrent notamment :

- l'inscription
- la connexion
- l'ajout d'avis

#### Test Frontend

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
- pour les tests Kubernetes sans domaine fixe, le backend est volontairement moins restrictif et accepte `localhost` ainsi que les IP privees du LAN (`192.168.x.x`, `10.x.x.x`, `172.16.x.x` a `172.31.x.x`)
- les images sont accessibles via `/movie-images/...`
- avec `createWebHistory()`, Nginx doit rediriger les routes frontend vers `index.html`

En deploiement distant :

- plusieurs utilisateurs peuvent utiliser le meme frontend
- plusieurs clients peuvent appeler le meme backend
- tous les utilisateurs partagent la meme base PostgreSQL si le backend pointe vers la meme `DATABASE_URL`
- les images restent centralisees dans MinIO

## Kubernetes Local Avec Minikube

La version Kubernetes retenue pour le projet est la suivante :

- `frontend`, `backend` et `MinIO` tournent dans `Minikube`
- le backend Kubernetes pointe vers le service `minio`
- le frontend Kubernetes proxyfie `/movie-images/` vers `minio:9000`
- le frontend et le backend disposent chacun d'un `HorizontalPodAutoscaler`

Pourquoi cette architecture :

- elle correspond mieux a un vrai deploiement CI/CD
- elle rend la pipeline GitLab coherente avec les manifests Kubernetes
- elle permet de garder les anciennes affiches en les migrant une fois vers le `MinIO` Kubernetes

### Commandes Importantes

Demarrer `Minikube` :

```bash
minikube start --driver=docker
minikube addons enable ingress
minikube addons enable metrics-server
```

Basculer Docker vers `Minikube` pour builder les images utilisees par Kubernetes :

```bash
eval $(minikube docker-env)
```

Revenir au Docker normal de la machine :

```bash
eval $(minikube docker-env -u)
```

Builder les images pour Kubernetes :

```bash
docker build -t cinematheque/backend:latest backend
docker build --build-arg VITE_API_URL=/api -t cinematheque/frontend:latest front-end
```

Verifier les pods :

```bash
kubectl get pods -n cinematheque
kubectl get svc -n cinematheque
kubectl get ingress -n cinematheque
```

Acceder au site :

```bash
minikube ip
```

Puis ouvrir :

```text
http://IP_DE_MINIKUBE
```

Pour un acces depuis un autre PC du reseau local :

```bash
kubectl port-forward -n cinematheque svc/frontend 8081:80 --address 0.0.0.0
```

Puis ouvrir :

```text
http://IP_LOCALE_DU_PC_HOTE:8081
```

### Deploiement Kubernetes

Le script [script.sh](/home/aghiles/Documents/OpsCI/projet/Projet_OpsCI/script.sh) automatise le deploiement.

Execution :

```bash
./script.sh
```

Le script :

- verifie que `minikube`, `kubectl` et `docker` sont disponibles
- demarre `Minikube` si necessaire
- active `ingress` et `metrics-server`
- bascule Docker vers `Minikube`
- build les images frontend et backend
- applique les manifests Kubernetes, y compris `MinIO`
- cree ou met a jour les secrets a partir du fichier `.env`
- affiche les commandes utiles de verification

### Migration Des Anciennes Images

Si tu veux retrouver dans Kubernetes les anciennes affiches stockees dans ton `MinIO` Docker historique, utilise :

```bash
./migrate_minio.sh
```

Ce script :

- ouvre temporairement un `port-forward` vers le `MinIO` Kubernetes
- utilise `minio/mc`
- copie le bucket `movie-images` du `MinIO` Docker hote vers le `MinIO` Kubernetes

Conditions :

- le `MinIO` Docker historique doit etre lance sur `localhost:9000`
- le `MinIO` Kubernetes doit deja etre deploye
- la base PostgreSQL n'a pas besoin d'etre modifiee si les noms d'objets restent identiques

### Autoscaling

L'autoscaling horizontal est configure dans [k8s/hpa.yaml](/home/aghiles/Documents/OpsCI/projet/Projet_OpsCI/k8s/hpa.yaml).

Verification :

```bash
kubectl get hpa -n cinematheque
kubectl top pods -n cinematheque
kubectl get deploy -n cinematheque
```

Sur ce projet, l'autoscaling a ete valide experimentalement :

- le `backend-hpa` surveille la CPU du deployment `backend`
- seuil cible : `70%`
- plage de replicas : `1` a `5`
- lors d'une charge artificielle sur `/api/movies`, Kubernetes a augmente le nombre de replicas du backend de `1` a `5`

### Revenir A Docker Compose

Quand Docker a ete bascule vers `Minikube`, les commandes `docker` et `docker compose` n'utilisent plus le daemon Docker normal de la machine.

Pour revenir au Docker hote :

```bash
eval $(minikube docker-env -u)
```

Ensuite :

```bash
docker compose up -d --build
```

L'application redevient alors accessible sur :

```text
http://localhost:8080
```

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
