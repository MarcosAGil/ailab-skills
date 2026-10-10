#!/usr/bin/env bash
# Compara un video generado con el audio maestro y, si se pide, sustituye su pista de audio.
# Uso: verificar_video.sh <video.mp4> <audio_maestro.wav> [--reemplazar <salida.mp4>]
set -euo pipefail

VIDEO="${1:?uso: verificar_video.sh <video> <audio_maestro> [--reemplazar <salida>]}"
AUDIO="${2:?falta audio maestro}"

dur() { ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$1"; }

VD=$(dur "$VIDEO")
AD=$(dur "$AUDIO")
HAS_A=$(ffprobe -v error -select_streams a -show_entries stream=codec_name -of default=nw=1:nk=1 "$VIDEO" | head -n1 || true)

echo "video:        ${VD}s  (audio incluido: ${HAS_A:-no})"
echo "audio maestro: ${AD}s"
python3 - "$VD" "$AD" "${3:-}" <<'PY'
import math, sys
v, a = float(sys.argv[1]), float(sys.argv[2])
if not math.isfinite(v) or not math.isfinite(a) or min(v,a) <= 0:
    sys.exit("ERROR: no se han podido verificar las duraciones.")
dif = v - a
print(f"diferencia video - audio: {dif:+.3f}s")
if abs(dif) <= 0.10:
    print("OK: duraciones equivalentes (tolerancia 0,10 s)")
else:
    print("AVISO: las duraciones no coinciden; revisa antes de reemplazar el audio")
    if sys.argv[3] == "--reemplazar":
        sys.exit("ERROR: no se sustituye el audio con duraciones distintas; no recortes voz.")
PY

if [ "${3:-}" = "--reemplazar" ]; then
  OUT="${4:?falta ruta de salida}"
  if [ -e "$OUT" ] || [ -L "$OUT" ]; then echo "ERROR: la salida ya existe; usa una versión nueva: $OUT" >&2; exit 1; fi
  ffmpeg -hide_banner -loglevel error -n -i "$VIDEO" -i "$AUDIO" \
    -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k "$OUT"
  echo "video con el audio maestro: $OUT ($(dur "$OUT")s)"
fi
