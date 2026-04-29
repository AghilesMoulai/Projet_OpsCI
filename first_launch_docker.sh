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
trap 'rm -rf "$MC_CONFIG_DIR"' EXIT

echo "Demarrage de MinIO..."
docker compose up -d minio

echo "Attente de MinIO..."
for attempt in {1..30}; do
  if docker run --rm --network host \
    --user "$(id -u):$(id -g)" \
    -v "$MC_CONFIG_DIR:/mc-config" \
    minio/mc:latest --config-dir /mc-config alias set local \
    "http://127.0.0.1:9000" "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null 2>&1; then
    break
  fi

  if [[ "$attempt" -eq 30 ]]; then
    echo "MinIO ne repond pas sur http://127.0.0.1:9000." >&2
    exit 1
  fi

  sleep 2
done

echo "Creation du bucket $MINIO_BUCKET si necessaire..."
docker run --rm --network host \
  --user "$(id -u):$(id -g)" \
  -v "$MC_CONFIG_DIR:/mc-config" \
  minio/mc:latest --config-dir /mc-config mb --ignore-existing "local/$MINIO_BUCKET"

if [[ -d "$EXPORT_DIR/$MINIO_BUCKET" ]]; then
  echo "Import des images depuis minio-export/$MINIO_BUCKET..."
  docker run --rm --network host \
    --user "$(id -u):$(id -g)" \
    -v "$MC_CONFIG_DIR:/mc-config" \
    -v "$EXPORT_DIR:/export" \
    minio/mc:latest --config-dir /mc-config mirror --overwrite \
    "/export/$MINIO_BUCKET" "local/$MINIO_BUCKET"
else
  echo "Aucun dossier minio-export/$MINIO_BUCKET trouve, import MinIO ignore."
fi

echo "Demarrage de l'application..."
docker compose up -d --build

echo "Pret."
echo "Frontend      : http://localhost:8080"
echo "Backend       : http://localhost:3000"
echo "Console MinIO : http://localhost:9001"
