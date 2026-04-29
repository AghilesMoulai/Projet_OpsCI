# Feuille de route - Rapport OpsCI

## Objectif

Préparer les éléments (commandes + captures d'écran) pour le rapport final du projet OpsCI.

---

## Étape 1 : Docker & Docker Compose

### 1.1 Commandes à exécuter

```bash
# Lancer les conteneurs
docker compose up -d --build

# Vérifier les conteneurs actifs
docker compose ps

# Voir les logs applicatifs
docker compose logs -f backend
docker compose logs -f event-worker
```

### 1.2 Captures à faire

- [ ] Capture de `docker compose ps`
- [ ] Capture des logs du backend
- [ ] Capture des logs Kafka côté `event-worker`

---

## Étape 2 : Kubernetes (K8s)

### 2.1 Commandes à exécuter

```bash
# Lancer le déploiement complet
./start_kube.sh

# Vérifier les pods
kubectl get pods -n cinematheque

# Vérifier les services
kubectl get svc -n cinematheque

# Voir toutes les ressources
kubectl get all -n cinematheque

# Vérifier l'autoscaling
kubectl get hpa -n cinematheque

# Logs des deployments principaux
kubectl logs -n cinematheque deployment/backend -f
kubectl logs -n cinematheque deployment/event-worker -f
kubectl logs -n cinematheque deployment/kafka -f

# Description d'un deployment
kubectl describe deployment backend -n cinematheque
```

### 2.2 Captures à faire

- [ ] Capture de `kubectl get pods -n cinematheque`
- [ ] Capture de `kubectl get svc -n cinematheque`
- [ ] Capture de `kubectl get all -n cinematheque`
- [ ] Capture de `kubectl get hpa -n cinematheque`
- [ ] Capture de `kubectl describe deployment backend -n cinematheque`

Pods attendus :

```text
frontend-...
backend-...
minio-...
kafka-...
event-worker-...
```

Remarque : les suffixes des pods changent automatiquement à chaque rollout.

---

## Étape 3 : GitLab CI/CD

### 3.1 Éléments à documenter

- [ ] Afficher le fichier `.gitlab-ci.yml` dans le rapport
- [ ] Capture d'écran du pipeline GitLab (interface web)
- [ ] Capture des jobs réussis

### 3.2 Commandes de test

```bash
# Déclencher le pipeline
git push lab deployment
```

---

## Étape 4 : Base de données PostgreSQL externe

PostgreSQL n'est pas déployé dans Minikube. Il n'y a donc pas de pod `postgres`.

Le backend se connecte à la base via la variable `DATABASE_URL`, stockée dans le secret Kubernetes `app-secrets`.

### 4.1 Commandes à exécuter

```bash
# Vérifier que le secret existe
kubectl get secret app-secrets -n cinematheque

# Vérifier que le backend reçoit bien ses variables d'environnement
kubectl describe deployment backend -n cinematheque

# Vérifier les logs backend liés à la connexion base/API
kubectl logs -n cinematheque deployment/backend -f
```

### 4.2 Captures à faire

- [ ] Capture de `kubectl get secret app-secrets -n cinematheque`
- [ ] Capture de `kubectl describe deployment backend -n cinematheque`
- [ ] Capture des logs backend
- [ ] Capture Neon/PostgreSQL externe si disponible

---

## Étape 5 : MinIO (Stockage objet)

### 5.1 Commandes à exécuter

```bash
# Port forwarding pour MinIO
kubectl port-forward -n cinematheque svc/minio 9000:9000

# Logs MinIO
kubectl logs -n cinematheque deployment/minio -f
```

### 5.2 Captures à faire

- [ ] Capture de l'interface MinIO (<http://localhost:9000>)
- [ ] Capture des buckets créés
- [ ] Capture du bucket `movie-images`

---

## Étape 6 : Application Frontend

### 6.1 Captures à faire

- [ ] Page catalogue (HomeView) avec pagination
- [ ] Page catalogue avec badges multi-genres
- [ ] Page de connexion (LoginView)
- [ ] Page d'inscription (RegisterView)
- [ ] Page détail film (FilmDetailView) avec avis et suggestions
- [ ] Page admin (AdminView) - si connecté en tant qu'admin
- [ ] Formulaire film (FilmFormView) avec sélection de plusieurs genres

---

## Étape 7 : API Backend

### 7.1 Commandes de test

```bash
# Tester l'API
curl http://localhost:3000/health
curl "http://localhost:3000/api/movies?page=1&limit=10"

# Depuis Kubernetes avec port-forward frontend
kubectl port-forward -n cinematheque svc/frontend 8081:80
curl "http://localhost:8081/api/movies?page=1&limit=10"
```

### 7.2 Captures à faire

- [ ] Capture de la réponse JSON de l'API
- [ ] Capture de la réponse paginée avec le bloc `pagination`

---

## Étape 8 : Kafka / Redpanda

### 8.1 Commandes à exécuter

```bash
# Docker Compose
docker compose logs -f event-worker
docker compose logs -f kafka

# Kubernetes
kubectl logs -n cinematheque deployment/event-worker -f
kubectl logs -n cinematheque deployment/kafka -f
```

### 8.2 Captures à faire

- [ ] Capture des logs `event-worker` avec un événement `user.logged_in`
- [ ] Capture des logs `event-worker` avec un événement `movie.created` ou `review.created`
- [ ] Capture des logs du broker `kafka` / Redpanda

---

## Étape 9 : Vérification finale

- [ ] Toutes les captures sont faites
- [ ] Toutes les commandes sont documentées
- [ ] Le rapport est structuré selon l'exemple

---

## Résumé des captures

| # | Capture | Commande关联 |
| --- | --------- | -------------- |
| 1 | docker compose ps | Étape 1 |
| 2 | logs backend / event-worker | Étape 1 |
| 3 | kubectl get pods -n cinematheque | Étape 2 |
| 4 | kubectl get svc -n cinematheque | Étape 2 |
| 5 | Pipeline GitLab | Étape 3 |
| 6 | Secret DATABASE_URL / base externe | Étape 4 |
| 7 | Interface MinIO | Étape 5 |
| 8 | Pages frontend | Étape 6 |
| 9 | Réponses API | Étape 7 |
| 10 | Logs Kafka event-worker | Étape 8 |

---

## Notes

- Faire les captures dans l'ordre
- Utiliser `Ctrl+Shift+S` pour sauvegarder en PNG
- Nommer les fichiers de manière claire (ex: `kubectl_get_pods.png`)
- Ne pas utiliser de nom complet de pod avec suffixe fixe dans le rapport.
- Il n'y a pas de pod PostgreSQL : la base est externe et accessible via `DATABASE_URL`.
