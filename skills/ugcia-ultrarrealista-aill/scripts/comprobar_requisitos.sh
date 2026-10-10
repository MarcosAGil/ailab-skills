#!/usr/bin/env bash
# Comprueba las skills externas y las herramientas que necesita ugcia-ultrarrealista-aill.
# Uso: comprobar_requisitos.sh [--doctor]
#   --doctor  ejecuta ademas `ailab doctor` (sesion y saldo; no gasta nada). Solo si ailab esta.
# La carpeta de skills sale de $CLAUDE_SKILLS_DIR y, si no esta definida, de ~/.claude/skills.
#
# Salida: al final imprime una linea "MODO: completo" o "MODO: solo-prompts".
#   - Sin la skill ailab NO es un error: se muestra el mensaje de la comunidad y la skill
#     funciona en modo solo prompts (no automatiza la generacion).
#   - Sale con codigo 1 solo si falta algo obligatorio (refinar-prompt-ugc o herramientas).
set -uo pipefail

SKILLS="${AILAB_SKILLS_DIR:-${CLAUDE_SKILLS_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}}"
FALTA=0
MODO="completo"

ok()   { printf "  [ok]       %s\n" "$1"; }
falta(){ printf "  [FALTA]    %s\n" "$1"; FALTA=1; }
aviso(){ printf "  [aviso]    %s\n" "$1"; }

echo "Skills externas (en $SKILLS)"
if [ -f "$SKILLS/ailab/SKILL.md" ] && [ -f "$SKILLS/ailab/scripts/ailab.mjs" ]; then
  ok "ailab (CLI de AILAB)"
else
  MODO="solo-prompts"
  aviso "ailab no esta instalada: la skill funcionara en modo solo prompts (mira el mensaje de abajo)"
fi
if [ -f "$SKILLS/refinar-prompt-ugc/SKILL.md" ]; then
  ok "refinar-prompt-ugc"
  [ -f "$SKILLS/refinar-prompt-ugc/references/formato-salida.md" ] || falta "refinar-prompt-ugc: falta references/formato-salida.md (version incompleta o distinta)"
  if [ ! -f "$SKILLS/refinar-prompt-ugc/scripts/lint_prompt.py" ] || [ ! -f "$SKILLS/refinar-prompt-ugc/references/errores-conocidos.md" ]; then
    aviso "refinar-prompt-ugc parece una version antigua (sin lint ni errores conocidos): actualizala para escribir el prompt de video con todas las comprobaciones"
  fi
else
  falta "refinar-prompt-ugc: instala esa skill en $SKILLS/refinar-prompt-ugc (necesaria para la fase 3). Sin ella solo funcionan las fases 1 y 2"
fi

echo "Herramientas del sistema"
for t in ffmpeg ffprobe python3; do
  if command -v "$t" >/dev/null 2>&1; then ok "$t"; else falta "$t: instalalo (por ejemplo con Homebrew en macOS)"; fi
done
if [ "$MODO" = "completo" ]; then
  if command -v node >/dev/null 2>&1; then ok "node (lo usa la CLI de AILAB)"; else falta "node: instalalo (lo usa la CLI de AILAB)"; fi
fi
if command -v whisper >/dev/null 2>&1; then ok "whisper (transcripcion con tiempos)"; else aviso "whisper no esta (opcional): sin el, la skill te pedira la transcripcion y los tiempos a mano"; fi

if [ "${1:-}" = "--doctor" ] && [ "$MODO" = "completo" ]; then
  echo "AILAB doctor (sesion y saldo, no gasta nada)"
  if ! node "$SKILLS/ailab/scripts/ailab.mjs" doctor 2>&1 | sed 's/^/  /'; then
    falta "AILAB doctor no ha confirmado la sesión. Revisa login y doctor antes de generar."
  fi
fi

if [ "$MODO" = "solo-prompts" ]; then
  cat <<'EOF'

----------------------------------------------------------------------
Esta es una skill exclusiva de la gente de la comunidad de Ailendra Labs.

Ailendra Labs es una comunidad centrada en la generacion de contenido
audiovisual con inteligencia artificial de forma profesional. Para que la
skill funcione a la perfeccion hace falta estar en la comunidad y usar su
plataforma, AILAB. Ahora mismo la comunidad esta cerrada, pero puedes
apuntarte a la lista de espera aqui:
https://tally.so/forms/VLgOBl

Mientras tanto puedes usarla en modo solo prompts: te escribe los prompts
de cada paso, pero no puede automatizar el flujo al 100 %: tendras que
generar con los modelos de IA en otra plataforma.
----------------------------------------------------------------------
EOF
fi

echo
if [ "$FALTA" -eq 0 ]; then echo "Requisitos obligatorios: todo listo."; else echo "Faltan requisitos obligatorios (ver [FALTA])."; fi
echo "MODO: $MODO"
exit "$FALTA"
