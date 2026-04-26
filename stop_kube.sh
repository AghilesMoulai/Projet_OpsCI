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

echo "Arrêt du cluster Minikube..."
minikube stop

echo "Retour au Docker hote recommandé dans le terminal courant :"
echo '  eval $(minikube docker-env -u)'

echo
echo "Arret terminé."
echo "Vérification possible :"
echo "  minikube status"
