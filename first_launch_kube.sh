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

require_cmd docker
require_cmd kubectl

if [[ ! -f ".env" ]]; then
  echo "Fichier .env introuvable a la racine du projet." >&2
  echo "Cree-le avec: cp .env.example .env" >&2
  exit 1
fi

source "$ROOT_DIR/scripts/dotenv.sh"

MINIO_ROOT_USER="$(require_dotenv_value MINIO_ROOT_USER)"
MINIO_ROOT_PASSWORD="$(require_dotenv_value MINIO_ROOT_PASSWORD)"
MINIO_BUCKET="$(dotenv_get MINIO_BUCKET .env || true)"
MINIO_BUCKET="${MINIO_BUCKET:-movie-images}"
EXPORT_DIR="$ROOT_DIR/minio-export"
MC_CONFIG_DIR="$(mktemp -d)"
PF_LOG="/tmp/cinematheque-minio-import-port-forward.log"

cleanup() {
  if [[ -n "${PF_PID:-}" ]]; then
    kill "$PF_PID" >/dev/null 2>&1 || true
  fi
  rm -rf "$MC_CONFIG_DIR"
}
trap cleanup EXIT

echo "Verification du service MinIO Kubernetes..."
kubectl get svc minio -n cinematheque >/dev/null

echo "Port-forward temporaire du MinIO Kubernetes sur http://127.0.0.1:9002..."
kubectl port-forward -n cinematheque svc/minio 9002:9000 >"$PF_LOG" 2>&1 &
PF_PID=$!

echo "Attente du port-forward..."
for attempt in {1..30}; do
  if docker run --rm --network host \
    --user "$(id -u):$(id -g)" \
    -v "$MC_CONFIG_DIR:/mc-config" \
    minio/mc:latest --config-dir /mc-config alias set kube \
    "http://127.0.0.1:9002" "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null 2>&1; then
    break
  fi

  if [[ "$attempt" -eq 30 ]]; then
    echo "MinIO Kubernetes ne repond pas via le port-forward." >&2
    echo "Log: $PF_LOG" >&2
    exit 1
  fi

  sleep 2
done

echo "Creation du bucket $MINIO_BUCKET si necessaire..."
docker run --rm --network host \
  --user "$(id -u):$(id -g)" \
  -v "$MC_CONFIG_DIR:/mc-config" \
  minio/mc:latest --config-dir /mc-config mb --ignore-existing "kube/$MINIO_BUCKET"

if [[ -d "$EXPORT_DIR/$MINIO_BUCKET" ]]; then
  echo "Import des images vers le MinIO Kubernetes..."
  docker run --rm --network host \
    --user "$(id -u):$(id -g)" \
    -v "$MC_CONFIG_DIR:/mc-config" \
    -v "$EXPORT_DIR:/export" \
    minio/mc:latest --config-dir /mc-config mirror --overwrite \
    "/export/$MINIO_BUCKET" "kube/$MINIO_BUCKET"
else
  echo "Aucun dossier minio-export/$MINIO_BUCKET trouve, import MinIO ignore."
fi

echo "Import Kubernetes termine."
