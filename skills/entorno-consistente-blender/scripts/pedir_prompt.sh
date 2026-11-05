#!/bin/bash
# Pide a Image Prompter (asistente de AILAB) el prompt final para Nano Banana 2.1 a partir de un brief.
# GASTA CRÉDITOS (pocos, se cobra el consumo real; la CLI muestra la estimación antes de enviar).
# Úsalo solo dentro de un encargo que el usuario haya autorizado.
#
# Uso:
#   pedir_prompt.sh <brief.md> <carpeta_vista> <imagen_1> [imagen_2 ...]
#
# - brief.md: el encargo completo (plantilla en assets/plantillas/brief-image-prompter.md), con la
#   lista numerada de imágenes y lo que fija cada una.
# - Se adjuntan las MISMAS imágenes y en el MISMO orden que irán luego a Nano Banana 2.1.
# Guarda la respuesta completa en <carpeta_vista>/respuesta_image_prompter.md. Claude extrae de ahí
# el prompt, lo revisa con la lista de comprobación de references/08-generacion-ailab.md y lo guarda
# como <carpeta_vista>/prompt.txt.
set -u
[ $# -lt 3 ] && { sed -n 2,14p "$0"; exit 2; }
BRIEF="$1"; DIR="$2"; shift 2
S="${AILAB_SKILL:-$(ls -d "$HOME"/.claude/plugins/cache/ailendra-labs/ailab/*/skills/ailab 2>/dev/null | sort -V | tail -1)}"
[ -z "$S" ] && { echo "No encuentro la skill AILAB"; exit 1; }
CLI="node $S/scripts/ailab.mjs"
mkdir -p "$DIR"
args=(); for f in "$@"; do [ -f "$f" ] || { echo "No existe: $f"; exit 1; }; args+=(--image "$f"); done
out=$($CLI assistant-prepare image-prompter --message "$(cat "$BRIEF")" "${args[@]}" 2>&1)
echo "$out" | grep -E "Estimacion|Adjuntos|Maximo"
id=$(echo "$out" | grep -oE "Peticion: [0-9a-f-]+" | awk '{print $2}')
[ -z "$id" ] && { echo "$out" | tail -6; echo "No se pudo preparar la petición a Image Prompter."; exit 1; }
echo "$id" > "$DIR/peticion_image_prompter.txt"
res=$($CLI assistant-submit "$id" --confirmed 2>&1)
printf '%s\n' "$res" > "$DIR/respuesta_image_prompter.md"
echo "Respuesta guardada en $DIR/respuesta_image_prompter.md"
echo "Si quedó a medias, recupérala sin duplicar con: $CLI assistant-status $id"
