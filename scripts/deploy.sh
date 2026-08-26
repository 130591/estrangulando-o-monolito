#!/usr/bin/env bash
#
# TODO: publicar new-service e new-front no GCP, e aplicar a infra.
# TODO: o legado nao pode ter caminho de deploy (ver docs/adr/0001).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
