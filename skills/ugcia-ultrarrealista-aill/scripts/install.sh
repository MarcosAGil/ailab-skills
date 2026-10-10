#!/usr/bin/env bash
# Instala la skill ugcia-ultrarrealista-aill en la carpeta de skills de Claude Code.
# Uso: bash scripts/install.sh [--forzar]
#   --forzar  si ya hay una version instalada, la guarda como copia .bak-FECHA y la sustituye
# Destino: $CLAUDE_SKILLS_DIR si esta definida y, si no, ~/.claude/skills
# No instala las skills externas (ailab y refinar-prompt-ugc): solo comprueba que esten.
# Sin ailab la skill se instala igualmente y funciona en modo solo prompts.
set -euo pipefail

NOMBRE="ugcia-ultrarrealista-aill"
AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET=claude; FORCE=false
while [ "$#" -gt 0 ]; do
  case "$1" in
    --target) TARGET="${2:?falta claude o codex}"; shift 2 ;;
    --forzar) FORCE=true; shift ;;
    *) echo "Uso: install.sh [--target claude|codex] [--forzar]" >&2; exit 1 ;;
  esac
done
case "$TARGET" in
  claude) DEST_ROOT="${AILAB_SKILLS_DIR:-${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}}" ;;
  codex) DEST_ROOT="${AILAB_SKILLS_DIR:-$HOME/.codex/skills}" ;;
  *) echo "ERROR: --target debe ser claude o codex" >&2; exit 1 ;;
esac
DEST="$DEST_ROOT/$NOMBRE"

if [ ! -f "$AQUI/SKILL.md" ]; then
  echo "ERROR: no encuentro SKILL.md en $AQUI. Ejecuta el script desde la carpeta descomprimida del paquete." >&2
  exit 1
fi

mkdir -p "$DEST_ROOT"

if [ "$AQUI" = "$DEST" ]; then
  echo "El paquete ya esta en $DEST. Solo compruebo requisitos."
else
  if [ -e "$DEST" ]; then
    if [ "$FORCE" = true ]; then
      COPIA="$DEST.bak-$(date +%Y%m%d-%H%M%S)"
      mv "$DEST" "$COPIA"
      echo "Version anterior guardada en $COPIA"
    else
      echo "ERROR: ya existe $DEST. Usa --forzar para guardar la anterior como copia y reinstalar." >&2
      exit 1
    fi
  fi
  cp -R "$AQUI" "$DEST"
  chmod +x "$DEST"/scripts/*.sh "$DEST"/scripts/*.py 2>/dev/null || true
  echo "Instalada en $DEST"
fi

echo
AILAB_SKILLS_DIR="$DEST_ROOT" bash "$DEST/scripts/comprobar_requisitos.sh" || {
  echo
  echo "La skill esta instalada, pero faltan requisitos. Mira el README.md, seccion 'Requisitos'."
  exit 1
}
echo
echo "Abre una sesión nueva en $TARGET e invoca la skill $NOMBRE."
