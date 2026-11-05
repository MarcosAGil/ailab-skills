#!/bin/bash
# Genera UNA imagen con Nano Banana 2.1 en AILAB (modo edit) y espera el resultado.
# GASTA CRÉDITOS: ejecútalo solo cuando el usuario lo haya pedido en el chat y después de decirle
# cuántas imágenes y cuántos créditos (el presupuesto lo da `prepare`, que no cobra).
#
# Uso:
#   generar_vista.sh <prompt.txt> <carpeta_salida> <imagen_1> [imagen_2 ... imagen_14]
#
# Orden de imágenes (manda en el prompt: "Image 1", "Image 2"...):
#   1      = el render de Blender de esa vista (fija la composición) o la imagen que se corrige.
#   2..n   = vistas ya aprobadas, hojas de personaje, objetos, pose de referencia (fijan el aspecto).
# Variables opcionales: RESOLUCION (1K | 2K | 4K, por defecto 2K), PROPORCION (16:9 por defecto),
#                       AILAB_SKILL (ruta de la skill ailab; por defecto la última instalada).
# Escribe en <carpeta_salida>/tarea.txt el ID de la tarea para poder recuperarla con `status`.
set -u
[ $# -lt 3 ] && { sed -n 2,16p "$0"; exit 2; }
PROMPT="$1"; OUT="$2"; shift 2
RES="${RESOLUCION:-2K}"; AR="${PROPORCION:-16:9}"
S="${AILAB_SKILL:-$(ls -d "$HOME"/.claude/plugins/cache/ailendra-labs/ailab/*/skills/ailab 2>/dev/null | sort -V | tail -1)}"
[ -z "$S" ] && { echo "No encuentro la skill AILAB (ver references/01-requisitos-e-instalacion.md)"; exit 1; }
CLI="node $S/scripts/ailab.mjs"
args=(); for f in "$@"; do [ -f "$f" ] || { echo "No existe: $f"; exit 1; }; args+=(--image_urls "$f"); done
mkdir -p "$OUT"

preparar() { $CLI prepare nano-banana-2-1 --mode edit --prompt "$(cat "$PROMPT")" "${args[@]}" --resolution "$RES" --aspect_ratio "$AR" 2>&1; }
out=$(preparar)
if echo "$out" | grep -q "limitado"; then          # 429: espera lo que diga la CLI y UN solo reintento
  s=$(echo "$out" | grep -oE "Espera [0-9]+" | grep -oE "[0-9]+" | head -1); sleep "${s:-10}"; out=$(preparar)
fi
echo "$out" | grep -E "Estimacion|Saldo"
id=$(echo "$out" | grep -oE "Manifiesto: [0-9a-f-]+" | awk '{print $2}')
[ -z "$id" ] && { echo "$out" | tail -6; echo "No se pudo preparar. Si dice 'limitado', espera y reintenta UNA vez más tarde."; exit 1; }

sub=$($CLI submit "$id" --confirmed --output "$OUT" 2>&1)
echo "$sub" | grep -E "Tarea|Guardado|Coste|rror|limitado|fallo"
tarea=$(echo "$sub" | grep -oE "(encolada|Tarea)[^0-9a-f]*[0-9a-f]{20,}" | grep -oE "[0-9a-f]{20,}" | head -1)
[ -n "$tarea" ] && echo "$tarea" > "$OUT/tarea.txt"

# Si submit devolvió la tarea sin archivo, se recupera con status (no vuelve a cobrar ni crea otra tarea)
if ! ls "$OUT"/*.png >/dev/null 2>&1 && [ -n "$tarea" ]; then
  echo "Esperando el resultado de la tarea $tarea ..."
  $CLI status "$tarea" --output "$OUT" 2>&1 | grep -E "Guardado|fallo|Coste|rror|curso"
fi
ls "$OUT"/*.png >/dev/null 2>&1 && { echo "Imagen:"; ls -1 "$OUT"/*.png; exit 0; }
echo "Sin imagen todavía. NO generes otra: recupera más tarde con:"; echo "  $CLI status ${tarea:-<id>} --output \"$OUT\""
exit 3
