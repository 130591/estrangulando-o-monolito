#!/usr/bin/env bash
#
# TODO: buildar as imagens dos apps e prepara-las para publicacao.
#
# -e  aborta no primeiro erro
# -u  variavel nao definida vira erro
# -o pipefail  erro no meio de um pipe nao e engolido pelo ultimo comando
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
