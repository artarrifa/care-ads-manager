#!/usr/bin/env bash
# ==============================================================================
# CareTech Services - Script de Respaldo Automatizado de Hostinger
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "🚀 Iniciando proceso de respaldo de Hostinger (caretechservices.com)..."

cd "${ROOT_DIR}"
NODE_PATH="${ROOT_DIR}/caretech-games-pwa-deployment-v1/node_modules:${NODE_PATH}" \
  node "${SCRIPT_DIR}/backup-hostinger.js"
