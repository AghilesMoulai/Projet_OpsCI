# Rapport - Projet OpsCI : Cinematheque

## Introduction

Ce projet consiste a mettre en place une application web complete de gestion de cinematheque. L'objectif est de couvrir a la fois le developpement applicatif, la conteneurisation, le deploiement Kubernetes local et plusieurs pratiques OpsCI : tests, CI/CD, securite, stockage objet, autoscaling et gestion evenementielle avec Kafka.

L'application permet de consulter un catalogue de films, de filtrer les resultats, de gerer les films en mode administrateur, de publier des avis et de stocker les affiches dans MinIO. Une couche Kafka, basee sur Redpanda, permet aussi de publier et consommer des evenements metier.

---

## 1. Architecture generale

### 1.1 Composants applicatifs

L'application repose sur une architecture client-serveur :

- `front-end/` : application Vue 3 / Vite / Pinia servie par Nginx.
- `backend/` : API Express / Node.js.
- `PostgreSQL` : base de donnees relationnelle externe au cluster, accessible via `DATABASE_URL`.
- `MinIO` : stockage objet compatible S3 pour les affiches de films.
- `Kafka / Redpanda` : broker evenementiel compatible Kafka.
- `event-worker/` : consommateur Kafka qui lit les evenements metier.

Le flux principal est le suivant :

```text
Navigateur
  -> Frontend Vue / Nginx
  -> Backend Express
  -> PostgreSQL externe via DATABASE_URL
  -> MinIO pour les affiches
  -> Kafka / Redpanda pour les evenements
  -> event-worker pour la consommation
```

### 1.2 Choix d'architecture

L'architecture client-serveur a ete retenue car elle separe clairement l'interface utilisateur et l'API. Le backend est organise en couches simples :

- `routes/` pour declarer les endpoints HTTP.
- `controllers/` pour la logique metier.
- `services/` pour les services techniques comme Kafka et MinIO.
- `middleware/` pour l'authentification et les droits admin.
- `db.js` pour l'acces PostgreSQL.

Cette organisation reste legere, mais elle facilite les tests, l'evolution du projet et la comprehension du code.

---

## 2. Backend et API

### 2.1 Technologie retenue

Le backend utilise `Node.js` avec `Express`. Ce choix est coherent avec le frontend JavaScript et permet de partager le meme langage sur la partie client et serveur.

Les dependances principales sont :

- `express` pour l'API HTTP.
- `pg` pour PostgreSQL.
- `jsonwebtoken` pour les tokens JWT.
- `bcrypt` pour le hashage des mots de passe.
- `minio` pour le stockage des affiches.
- `kafkajs` pour la publication Kafka.

### 2.2 Base de donnees PostgreSQL

PostgreSQL n'est pas deploye comme pod Kubernetes dans ce projet. La base de donnees est externe au cluster Minikube et le backend s'y connecte avec la variable :

```text
DATABASE_URL
```

En Kubernetes, cette valeur est fournie au backend par le secret :

```text
app-secrets
```

Il est donc normal que la commande suivante ne montre aucun pod PostgreSQL :

```bash
kubectl get pods -n cinematheque
```

Les pods attendus sont ceux des composants applicatifs :

```text
frontend-...
backend-...
minio-...
kafka-...
event-worker-...
```

### 2.3 Endpoints principaux

Les routes principales sont :

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/movies
GET    /api/movies/genres
GET    /api/movies/:id
GET    /api/movies/:id/suggestions
POST   /api/movies
PUT    /api/movies/:id
DELETE /api/movies/:id

GET    /api/reviews/:movieId
POST   /api/reviews
DELETE /api/reviews/:id
```

Les routes d'administration (`POST`, `PUT`, `DELETE` sur les films et suppression d'avis) sont protegees par JWT et par le middleware admin.

### 2.4 Pagination et filtres

L'endpoint `GET /api/movies` gere la pagination et les filtres :

```text
/api/movies?page=1&limit=10&genre=Action&search=avatar&minRating=4
```

La reponse contient les films et les metadonnees de pagination :

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

Les limites autorisees sont `10`, `20` et `50`.

### 2.5 Genres multiples

Un film peut avoir plusieurs genres. Cote formulaire, l'administrateur peut :

- cocher plusieurs genres existants ;
- ajouter de nouveaux genres separes par des virgules.

Cote backend, les genres sont normalises avant insertion. Par exemple :

```text
Science-fiction, Action, Aventure
```

Les filtres et la liste des genres prennent en compte ce format multi-genres.

### 2.6 Suggestions de films

Les suggestions utilisent deux criteres :

- le nombre de genres en commun ;
- la proximite du titre.

Cela permet par exemple de rapprocher :

```text
Avatar
Avatar: La voie de l'eau
```

Les suggestions restent limitees a 4 films pour garder une interface lisible.

---

## 3. Frontend

### 3.1 Technologie retenue

Le frontend utilise `Vue 3`, `Vite` et `Pinia`.

Les vues principales sont :

- `HomeView.vue` : catalogue public avec pagination, filtres et badges de genres.
- `FilmDetailView.vue` : detail d'un film, avis et suggestions.
- `LoginView.vue` / `RegisterView.vue` : authentification.
- `AdminView.vue` : interface d'administration.
- `FilmFormView.vue` : ajout et modification d'un film.

### 3.2 Catalogue

Le catalogue affiche les films sous forme de cartes. Il propose :

- recherche par titre ;
- filtre par genre ;
- filtre par annee ;
- filtre par note minimale ;
- choix du nombre de films par page (`10`, `20`, `50`) ;
- pagination numerotee (`Precedent`, pages, `Suivant`).

Les genres multiples sont affiches sous forme de badges separes.

### 3.3 Administration

L'interface admin permet :

- d'ajouter un film ;
- de modifier un film ;
- de supprimer un film ;
- de rechercher dans le catalogue admin ;
- de visualiser les genres sous forme de badges.

Contrairement au catalogue public, l'admin recupere toutes les pages de films par lots de 50 afin de pouvoir gerer tout le catalogue.

---

## 4. Stockage des images avec MinIO

Les affiches de films sont stockees dans MinIO, dans le bucket :

```text
movie-images
```

Le backend accepte :

- une URL distante ;
- une image locale envoyee en base64 depuis le formulaire.

Dans les deux cas, l'image est stockee dans MinIO et l'URL finale est sauvegardee en base.

En Kubernetes, MinIO utilise :

- `Deployment` : `minio`
- `Service` : `minio`
- `PVC` : `minio-data`
- namespace : `cinematheque`

Commandes de verification :

```bash
kubectl get pods -n cinematheque
kubectl get pvc -n cinematheque
kubectl logs -n cinematheque deployment/minio -f
```

---

## 5. Gestion evenementielle avec Kafka

### 5.1 Composants

La couche evenementielle utilise Redpanda, une implementation compatible Kafka.

Composants :

- `Deployment` : `kafka`
- `Service` : `kafka`
- `Deployment` : `event-worker`
- namespace : `cinematheque`

Le backend publie les evenements via `backend/services/eventBus.js`. Le worker les consomme dans `event-worker/index.js`.

### 5.2 Evenements publies

Evenements actuellement publies :

```text
user.registered
user.logged_in
movie.created
movie.updated
movie.deleted
review.created
review.deleted
```

Les evenements sont publies en mode "best effort" : si Kafka est indisponible, l'action principale de l'utilisateur ne doit pas echouer.

### 5.3 Logs Kafka

En Docker Compose :

```bash
docker compose logs -f event-worker
docker compose logs -f kafka
```

En Kubernetes :

```bash
kubectl logs -n cinematheque deployment/event-worker -f
kubectl logs -n cinematheque deployment/kafka -f
```

Les logs applicatifs des evenements sont principalement visibles dans `event-worker`.

---

## 6. Kubernetes local avec Minikube

### 6.1 Namespace et ressources

Toutes les ressources Kubernetes applicatives sont deployees dans le namespace :

```text
cinematheque
```

Ressources principales :

| Type | Nom |
| --- | --- |
| Namespace | `cinematheque` |
| Deployment | `frontend` |
| Deployment | `backend` |
| Deployment | `minio` |
| Deployment | `kafka` |
| Deployment | `event-worker` |
| Service | `frontend` |
| Service | `backend` |
| Service | `minio` |
| Service | `kafka` |
| Ingress | `cinematheque` |
| ConfigMap | `cinematheque-config` |
| Secret | `app-secrets` |
| Secret | `minio-secrets` |
| PVC | `minio-data` |
| HPA | `backend-hpa` |
| HPA | `frontend-hpa` |

Il n'y a pas de `Deployment`, de `Service` ou de pod `postgres` dans ce cluster. PostgreSQL est externe et seulement reference par `DATABASE_URL`.

Les pods generes par Kubernetes ont des suffixes automatiques. Ils commencent donc par :

```text
frontend-...
backend-...
minio-...
kafka-...
event-worker-...
```

Il ne faut pas documenter un nom complet de pod avec suffixe fixe, car il change a chaque rollout.

### 6.2 Script de lancement

Le deploiement local est automatise par :

```bash
./start_kube.sh
```

Prerequis :

- `Docker`
- `Minikube`
- `kubectl`
- un fichier `.env` cree a partir de `.env.example`

Le script :

- demarre Minikube si necessaire ;
- active `ingress` et `metrics-server` ;
- build les images dans le Docker de Minikube ;
- cree ou met a jour les secrets ;
- applique les manifests Kubernetes ;
- redemarre les deployments ;
- attend les rollouts.

### 6.3 Verification Kubernetes

Commandes utiles :

```bash
kubectl get pods -n cinematheque
kubectl get svc -n cinematheque
kubectl get ingress -n cinematheque
kubectl get hpa -n cinematheque
kubectl get pvc -n cinematheque
```

Verification des rollouts :

```bash
kubectl rollout status deployment/frontend -n cinematheque
kubectl rollout status deployment/backend -n cinematheque
kubectl rollout status deployment/minio -n cinematheque
kubectl rollout status deployment/kafka -n cinematheque
kubectl rollout status deployment/event-worker -n cinematheque
```

Acces local :

```bash
minikube ip
```

Puis ouvrir :

```text
http://IP_DE_MINIKUBE
```

Acces par port-forward :

```bash
kubectl port-forward -n cinematheque svc/frontend 8081:80 --address 0.0.0.0
```

Puis ouvrir :

```text
http://IP_DE_LA_MACHINE:8081
```

---

## 7. Docker Compose

Le projet peut aussi etre lance en Docker Compose.

Services principaux :

- `frontend`
- `backend`
- `minio`
- `kafka`
- `event-worker`

Commande :

```bash
docker compose up --build
```

Verification :

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f event-worker
```

---

## 8. Tests

### 8.1 Tests backend

Le backend utilise Jest.

Commande :

```bash
cd backend
npm test
```

Les tests couvrent notamment :

- inscription ;
- connexion ;
- ajout d'avis ;
- ajout de film ;
- pagination des films ;
- normalisation des genres multiples ;
- publication des evenements Kafka via mocks.

### 8.2 Tests frontend

Le frontend utilise Vitest.

Commande :

```bash
cd front-end
npm test -- --run
```

Build de verification :

```bash
cd front-end
npm run build
```

---

## 9. CI/CD et securite

Le projet contient une configuration GitLab CI/CD. La pipeline est orientee autour des etapes suivantes :

- tests backend ;
- tests frontend ;
- build des images Docker ;
- controles de securite ;
- deploiement Kubernetes local via runner local.

La securite applicative repose notamment sur :

- authentification JWT ;
- hashage des mots de passe avec `bcrypt` ;
- middleware admin pour les routes sensibles ;
- secrets Kubernetes pour `DATABASE_URL`, `SECRET_KEY` et les identifiants MinIO ;
- separation entre `ConfigMap` et `Secret`.

---

## 10. Captures d'ecran recommandees

Pour illustrer le rapport, les captures les plus pertinentes sont :

1. Catalogue avec pagination visible.
2. Catalogue avec plusieurs badges de genres.
3. Formulaire admin avec selection de plusieurs genres.
4. Page detail d'un film avec avis et suggestions.
5. Logs `event-worker` montrant les evenements Kafka.
6. `kubectl get pods -n cinematheque`.
7. `kubectl get svc -n cinematheque`.
8. `kubectl get hpa -n cinematheque`.
9. Console MinIO avec le bucket `movie-images`.
10. Resultat des tests backend/frontend.

---

## Conclusion

Le projet final met en place une application web complete et deployable localement avec Docker Compose ou Kubernetes via Minikube. Il integre une API Express, un frontend Vue, une base PostgreSQL, un stockage objet MinIO, une couche evenementielle Kafka/Redpanda, des tests automatises et des manifests Kubernetes.

Les fonctionnalites recentes comme la pagination, les genres multiples, les suggestions basees sur les titres et genres, ainsi que les evenements Kafka, rapprochent l'application d'un fonctionnement plus realiste et plus maintenable.
