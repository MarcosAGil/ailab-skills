#!/usr/bin/env bash
# Prueba local de los scripts de ugcia-ultrarrealista-aill con datos sinteticos.
# No usa red, no llama a AILAB y no gasta creditos. Todo se hace en una carpeta temporal.
# Uso: bash scripts/autotest.sh
# Sale con codigo 1 si alguna prueba falla.
set -uo pipefail

AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
PASS=0; FAIL=0; SKIP=0

ok()   { printf "  [ok]    %s\n" "$1"; PASS=$((PASS+1)); }
mal()  { printf "  [FALLA] %s\n" "$1"; FAIL=$((FAIL+1)); }
salta(){ printf "  [salta] %s\n" "$1"; SKIP=$((SKIP+1)); }

echo "Prueba local de la skill (sin red, sin gasto)"
echo "Carpeta temporal: $TMP"

# ---------- 1. crear proyecto
echo "1) Crear proyecto"
PROY="$(UGC_AILL_ROOT="$TMP/proyectos" bash "$AQUI/crear_proyecto.sh" "Prueba autotest" 2>/dev/null || true)"
if [ -n "$PROY" ] && [ -d "$PROY/Archivos para usar/Texto o prompts" ] && [ -d "$PROY/Pruebas intermedias/audio" ] \
   && [ -f "$PROY/brief.md" ] && [ -f "$PROY/registro.md" ] && [ -f "$PROY/Archivos para usar/Texto o prompts/guion.md" ]; then
  ok "estructura creada (Archivos para usar, Texto o prompts, Pruebas intermedias, brief.md, registro.md)"
else
  mal "no se creo la estructura del proyecto"
  PROY="$TMP/proyecto-falso"; mkdir -p "$PROY/Archivos para usar/Texto o prompts" "$PROY/Pruebas intermedias/imagenes" "$PROY/Pruebas intermedias/audio"
fi

# ---------- 2. contar prompt de Seed Audio
echo "2) Contar y validar un prompt de Seed Audio"
cat > "$TMP/seed-ok.txt" <<'EOF'
12-sec test scene, a person speaking in a quiet room, natural, no music.

[AESTHETIC]
- Texture: close room tone, clean close-mic vocal.
- Environment: small room, soft reverb.
- Voice (Persona): adulto, español de España, acento castellano, tono natural.
- Mix: voice dominant; room tone restrained.
- Palette: room tone, faint breath.

[EXECUTION]
[AMBI] quiet room -> [DIAL] Persona (natural, español de España): "Esto es una frase de prueba." -> [TRANS] short pause.

[ETIQUETA: español de España, una sola voz, sin narrador, sin música, duración exacta 12.0s]
EOF
printf 'prompt "malo" sin secciones [Scene: x]' > "$TMP/seed-mal.txt"
python3 "$AQUI/contar_prompt.py" "$TMP/seed-ok.txt" >/dev/null 2>&1 && ok "acepta un prompt correcto" || mal "rechaza un prompt correcto"
python3 "$AQUI/contar_prompt.py" "$TMP/seed-mal.txt" >/dev/null 2>&1 && mal "acepta un prompt incorrecto" || ok "rechaza un prompt incorrecto"

# ---------- 3. audio y video (necesitan ffmpeg)
echo "3) Medir y ajustar audio, verificar vídeo"
if command -v ffmpeg >/dev/null 2>&1 && command -v ffprobe >/dev/null 2>&1; then
  ffmpeg -hide_banner -loglevel error -y -f lavfi -i "sine=frequency=300:duration=4.3" -ar 48000 "$TMP/tono.wav"
  SAL="$(bash "$AQUI/medir_audio.sh" "$TMP/tono.wav" 2>/dev/null || true)"
  echo "$SAL" | grep -q "duracion video (s): 5" && ok "medir_audio.sh: 4,3 s -> vídeo de 5 s" || mal "medir_audio.sh no calcula 5 s para un audio de 4,3 s"
  bash "$AQUI/ajustar_audio.sh" "$TMP/tono.wav" 5 "$TMP/tono-5s.wav" >/dev/null 2>&1 && ok "ajustar_audio.sh: iguala a 5 s exactos" || mal "ajustar_audio.sh falla al igualar a 5 s"
  bash "$AQUI/ajustar_audio.sh" "$TMP/tono.wav" 4 "$TMP/tono-4s.wav" >/dev/null 2>&1 && mal "ajustar_audio.sh recorta voz (no debería)" || ok "ajustar_audio.sh se niega a recortar voz"
  ffmpeg -hide_banner -loglevel error -y -f lavfi -i "testsrc=duration=5:size=270x480:rate=24" -f lavfi -i "sine=duration=5" -shortest -pix_fmt yuv420p "$TMP/video.mp4"
  bash "$AQUI/verificar_video.sh" "$TMP/video.mp4" "$TMP/tono-5s.wav" 2>/dev/null | grep -q "OK: duraciones equivalentes" && ok "verificar_video.sh: compara duraciones" || mal "verificar_video.sh no confirma duraciones iguales"
  bash "$AQUI/verificar_video.sh" "$TMP/video.mp4" "$TMP/tono-5s.wav" --reemplazar "$TMP/video-audio.mp4" >/dev/null 2>&1 && [ -s "$TMP/video-audio.mp4" ] && ok "verificar_video.sh: sustituye la pista de audio" || mal "verificar_video.sh no pudo sustituir el audio"
else
  salta "ffmpeg/ffprobe no están instalados: se omiten las pruebas de audio y vídeo"
fi

# ---------- 4. promover archivos aprobados
echo "4) Promover lo aprobado a 'Archivos para usar'"
echo imagen > "$PROY/Pruebas intermedias/imagenes/hoja-cara-v1.png"; echo prompt > "$PROY/Pruebas intermedias/imagenes/hoja-cara-v1.txt"
bash "$AQUI/promover.sh" "$PROY" imagenes/hoja-cara-v1.png >/dev/null 2>&1 \
  && [ -f "$PROY/Archivos para usar/hoja-cara-v1.png" ] && [ -f "$PROY/Archivos para usar/Texto o prompts/hoja-cara-v1.txt" ] \
  && [ ! -f "$PROY/Pruebas intermedias/imagenes/hoja-cara-v1.png" ] \
  && ok "mueve la imagen y su prompt a las carpetas de uso" || mal "promover.sh no movió la imagen y su prompt"
echo otra > "$PROY/Pruebas intermedias/imagenes/hoja-cara-v1.png"
bash "$AQUI/promover.sh" "$PROY" imagenes/hoja-cara-v1.png >/dev/null 2>&1 && mal "promover.sh sobrescribe (no debería)" || ok "no sobrescribe un archivo existente"

# ---------- 5. comprobador de requisitos
echo "5) Comprobar requisitos (con una carpeta de skills vacía)"
SAL="$(CLAUDE_SKILLS_DIR="$TMP/skills-vacia" bash "$AQUI/comprobar_requisitos.sh" 2>/dev/null || true)"
echo "$SAL" | grep -q "MODO: solo-prompts" && ok "sin la skill ailab detecta el modo solo prompts" || mal "no detecta el modo solo prompts"
echo "$SAL" | grep -q "tally.so/forms/VLgOBl" && ok "muestra el mensaje de la comunidad con el enlace" || mal "no muestra el mensaje de la comunidad"
CLAUDE_SKILLS_DIR="$TMP/skills-vacia" bash "$AQUI/comprobar_requisitos.sh" >/dev/null 2>&1 && mal "no marca error sin refinar-prompt-ugc" || ok "marca error si falta refinar-prompt-ugc"

echo
echo "Resultado: $PASS ok, $FAIL fallos, $SKIP omitidas"
if [ "$FAIL" -eq 0 ]; then echo "Todo correcto: los scripts funcionan en este equipo."; else echo "Hay fallos: revisa las líneas [FALLA]."; fi
[ "$FAIL" -eq 0 ]
