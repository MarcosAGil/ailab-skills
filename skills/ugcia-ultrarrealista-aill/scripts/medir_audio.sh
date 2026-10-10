#!/usr/bin/env bash
# Mide un audio generado: duracion real, duracion entera para el video y pausas.
# Uso: medir_audio.sh <audio> [umbral_dB=-35] [pausa_min_s=0.15]
set -euo pipefail

AUDIO="${1:?uso: medir_audio.sh <audio> [umbral_dB] [pausa_min_s]}"
NOISE="${2:--35}"
MINP="${3:-0.15}"

command -v ffprobe >/dev/null || { echo "falta ffprobe"; exit 1; }

DUR=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$AUDIO")
CEIL=$(python3 -c "import math,sys; print(math.ceil(float(sys.argv[1]) - 1e-9))" "$DUR")

echo "archivo:            $AUDIO"
echo "duracion real (s):  $DUR"
echo "duracion video (s): $CEIL   (entero hacia arriba; Seedance 2.5 admite de 4 a 30)"
python3 - "$DUR" "$CEIL" <<'PY'
import sys
d, c = float(sys.argv[1]), int(sys.argv[2])
cola = c - d
print(f"cola de silencio a anadir (s): {cola:.2f}")
if c < 4:
    print("AVISO: menos de 4 s, por debajo del minimo de Seedance 2.5")
if c > 30:
    print("AVISO: mas de 30 s, por encima del maximo de Seedance 2.5: hay que partir en tomas")
PY

echo
echo "pausas (silencedetect ${NOISE}dB, >= ${MINP}s):"
ffmpeg -hide_banner -nostats -i "$AUDIO" -af "silencedetect=noise=${NOISE}dB:d=${MINP}" -f null - 2>&1 \
  | grep -E "silence_(start|end)" | sed -E 's/^\[Parsed_silencedetect[^]]*\] /  /' || echo "  (ninguna)"
