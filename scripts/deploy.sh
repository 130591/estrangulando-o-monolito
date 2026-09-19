#!/usr/bin/env bash
#
# TODO: publicar new-service e new-front no GCP, e aplicar a infra.
# TODO: publicar as imagens do legado no Artifact Registry privado do projeto.
#       O legado TEM caminho de deploy, mas so para dentro deste projeto e
#       sempre atras da borda (ver docs/adr/0001).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
