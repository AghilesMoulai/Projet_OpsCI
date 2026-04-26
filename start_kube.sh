#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Commande manquante: $1" >&2
    exit 1
  fi
}

require_cmd minikube
require_cmd kubectl
require_cmd docker

if [[ ! -f ".env" ]]; then
  echo "Fichier .env introuvable a la racine du projet." >&2
  exit 1
fi

source "$ROOT_DIR/scripts/dotenv.sh"

DATABASE_URL="$(require_dotenv_value DATABASE_URL)"
SECRET_KEY="$(require_dotenv_value SECRET_KEY)"
MINIO_ROOT_USER="$(require_dotenv_value MINIO_ROOT_USER)"
MINIO_ROOT_PASSWORD="$(require_dotenv_value MINIO_ROOT_PASSWORD)"

if ! minikube status >/dev/null 2>&1; then
  echo "Demarrage de Minikube..."
  minikube start --driver=docker
fi

echo "Activation des addons Minikube..."
minikube addons enable ingress
minikube addons enable metrics-server

echo "Build des images dans Docker de Minikube..."
eval "$(minikube docker-env)"
docker build -t cinematheque/backend:latest backend
docker build --build-arg VITE_API_URL=/api -t cinematheque/frontend:latest front-end
docker build -t cinematheque/event-worker:latest event-worker

echo "Creation / mise a jour des secrets..."
kubectl apply -f k8s/namespace.yaml
kubectl create secret generic app-secrets \
  --namespace cinematheque \
  --from-literal=DATABASE_URL="$DATABASE_URL" \
  --from-literal=SECRET_KEY="$SECRET_KEY" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic minio-secrets \
  --namespace cinematheque \
  --from-literal=MINIO_ROOT_USER="$MINIO_ROOT_USER" \
  --from-literal=MINIO_ROOT_PASSWORD="$MINIO_ROOT_PASSWORD" \
  --from-literal=MINIO_ACCESS_KEY="$MINIO_ROOT_USER" \
  --from-literal=MINIO_SECRET_KEY="$MINIO_ROOT_PASSWORD" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "Application des manifests Kubernetes..."
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/minio-pvc.yaml
kubectl apply -f k8s/kafka.yaml
kubectl apply -f k8s/minio.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/event-worker.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml

echo "Redemarrage des deployments..."
kubectl rollout restart deployment/minio -n cinematheque
kubectl rollout restart deployment/kafka -n cinematheque
kubectl rollout restart deployment/backend -n cinematheque
kubectl rollout restart deployment/frontend -n cinematheque
kubectl rollout restart deployment/event-worker -n cinematheque

echo "Attente des rollouts..."
kubectl rollout status deployment/minio -n cinematheque --timeout=180s
kubectl rollout status deployment/kafka -n cinematheque --timeout=180s
kubectl rollout status deployment/backend -n cinematheque --timeout=180s
kubectl rollout status deployment/frontend -n cinematheque --timeout=180s
kubectl rollout status deployment/event-worker -n cinematheque --timeout=180s

echo
echo "Deploiement termine."
echo "Verification:"
echo "  kubectl get pods -n cinematheque"
echo "  kubectl get hpa -n cinematheque"
echo "  kubectl get ingress -n cinematheque"
echo "  kubectl get pvc -n cinematheque"
echo
echo "Acces local:"
echo "  http://$(minikube ip)"
echo
echo "Acces LAN de test:"
echo "  kubectl port-forward -n cinematheque svc/frontend 8081:80 --address 0.0.0.0"
