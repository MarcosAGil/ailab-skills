#!/usr/bin/env bash
# Crea la estructura de carpetas de un proyecto UGC.
# Uso: crear_proyecto.sh <slug> [raiz]
# Raiz por defecto: $UGC_AILL_ROOT si esta definida, y si no ~/Desktop/AILAB (carpeta AILAB en el Escritorio)
#
# Estructura:
#   <proyecto>/
#     Archivos para usar/            lo que se usa de verdad: imagenes, audio y video finales
#       Texto o prompts/             todos los prompts (y el guion) de lo que se usa
#     Pruebas intermedias/           todo lo demas: versiones descartadas, mediciones, fuentes
#       fuentes/  imagenes/  audio/  video/
#     brief.md  registro.md
set -euo pipefail

SLUG_IN="${1:?uso: crear_proyecto.sh <slug> [raiz]}"
ROOT="${2:-${UGC_AILL_ROOT:-$HOME/Desktop/AILAB}}"

# kebab-case sin tildes
SLUG=$(python3 - "$SLUG_IN" <<'PY'
import re, sys, unicodedata
s = unicodedata.normalize("NFKD", sys.argv[1]).encode("ascii", "ignore").decode()
s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
print(s or "proyecto")
PY
)
FECHA=$(date +%Y-%m-%d)
DIR="$ROOT/$FECHA-$SLUG"

if [ -e "$DIR" ]; then
  echo "ERROR: ya existe $DIR" >&2
  exit 1
fi

mkdir -p "$DIR/Archivos para usar/Texto o prompts" \
         "$DIR/Pruebas intermedias/fuentes" "$DIR/Pruebas intermedias/imagenes" \
         "$DIR/Pruebas intermedias/audio" "$DIR/Pruebas intermedias/video"

cat > "$DIR/brief.md" <<EOF
---
type: proyecto-ugc
status: fase-1
updated: $FECHA
---

Estado: Fase 1 | Aprobacion 1 (imagenes): pendiente | Aprobacion 2 (audio): pendiente | Aprobacion 3 (confirmacion final): pendiente

# $SLUG_IN

## Ficha de rodaje

(pendiente)

## Archivos aprobados (en "Archivos para usar")

(pendiente)

## Supuestos

(pendiente)
EOF

cat > "$DIR/Archivos para usar/Texto o prompts/guion.md" <<EOF
---
type: guion-ugc
status: pendiente
updated: $FECHA
---

(pendiente: texto hablado literal aprobado por el usuario)
EOF

cat > "$DIR/registro.md" <<EOF
---
type: registro-ugc
updated: $FECHA
---

| Fecha | Fase | Modelo | Modo y parametros clave | Id (manifest/task) | Creditos | Archivo (ruta desde el proyecto) | Estado |
|---|---|---|---|---|---|---|---|
EOF

echo "$DIR"
