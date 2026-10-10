#!/usr/bin/env bash
# Deja un audio con una duracion ENTERA exacta anadiendo silencio al final.
# Nunca recorta voz: si el audio dura mas que N, falla.
# Uso: ajustar_audio.sh <audio_entrada> <N_segundos> <audio_salida.wav>
set -euo pipefail

IN="${1:?uso: ajustar_audio.sh <entrada> <N> <salida.wav>}"
N="${2:?falta N (segundos enteros)}"
OUT="${3:?falta salida}"
if [ -e "$OUT" ] || [ -L "$OUT" ]; then echo "ERROR: la salida ya existe; usa una versión nueva: $OUT" >&2; exit 1; fi

command -v ffmpeg >/dev/null || { echo "falta ffmpeg"; exit 1; }

DUR=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$IN")
python3 - "$DUR" "$N" <<'PY'
import math, sys
d, n = float(sys.argv[1]), float(sys.argv[2])
if not math.isfinite(d) or d <= 0 or not math.isfinite(n) or not n.is_integer() or not 4 <= n <= 30:
    sys.exit("ERROR: usa una duración entera de 4 a 30 s y un audio válido.")
if d > n + 1e-6:
    sys.exit(f"ERROR: el audio dura {d:.3f}s y N={n:g}s lo recortaria. Sube N o regenera el audio.")
PY

ffmpeg -hide_banner -loglevel error -n -i "$IN" \
  -af "apad=whole_dur=${N}" -t "$N" -ar 48000 -c:a pcm_s16le "$OUT"

OUTDUR=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$OUT")
echo "entrada: ${DUR}s -> salida: ${OUTDUR}s (objetivo ${N}s)"
python3 - "$OUTDUR" "$N" <<'PY'
import sys
o, n = float(sys.argv[1]), float(sys.argv[2])
if abs(o - n) > 0.03:
    sys.exit(f"ERROR: la salida dura {o:.3f}s y se pedian {n:g}s")
print("OK: duracion exacta")
PY
