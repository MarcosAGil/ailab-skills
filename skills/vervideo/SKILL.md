---
name: vervideo
description: >
  Analiza cualquier video (URL publica o archivo local) via OpenRouter, en dos
  modos. Completo: envia el video entero a Gemini 3.6 Flash para una
  descripcion narrativa exhaustiva (estetica, transcripcion, sonido,
  plano a plano), preguntando antes en que centrarse (estetica, personajes,
  camara, audio o general). Mini: extrae frames por cambio de escena +
  microscopea el hook de 0-10s + transcribe el audio con
  openai/whisper-large-v3-turbo via OpenRouter, y genera un report.md
  estructurado (TL;DR, momentos clave, hook, perfil editorial, citas,
  entidades, conceptos). Trigger: cuando el usuario escriba /vervideo completo
  seguido de una fuente, o /vervideo mini seguido de una fuente; pase una URL
  o ruta local de video y pida analizarlo/describirlo/transcribirlo; o escriba
  /vervideo seguido de una fuente sin
  modo (en ese caso pregunta que modo quiere antes de procesar).
---

# vervideo

Analiza un video (URL de YouTube/TikTok/Instagram/Vimeo/X/etc via yt-dlp, o
archivo local) a traves de OpenRouter, en dos modos con presupuestos y
objetivos distintos.

## Cuando usarla

- El usuario pasa una URL o ruta local de video y pide describirlo, transcribirlo,
  analizarlo o saber que aparece/se dice/se oye en el.
- Necesita el guion, los efectos de sonido, o un desglose plano a plano de un
  video que ya existe pero no tiene el material original a mano.
- Quiere un post-mortem tipo editor (cortes/min, duracion de plano, patron
  del hook) de un video propio o de la competencia.

## Cuando NO usarla

- Post-mortem de METRICAS de un reel YA PUBLICADO (retencion, comparacion con
  el KB de formulas) -> usa `analizar-reel`.
- Guardar un reel viral de la competencia en la base de Outliers de Notion ->
  usa `outlier-add` (usa `claude-video-vision` internamente, con su propio
  formato de captura).
- Solo necesita ver el video una vez, sin descripcion textual exhaustiva ->
  las herramientas de `claude-video-vision` son mas baratas para una consulta
  puntual.

## Paso 0: dependencias y API key

Necesita `ffmpeg`, `ffprobe` y `yt-dlp` en el PATH (ya instalados via
Homebrew en este equipo) y `OPENROUTER_API_KEY` en
`~/.config/openrouter/.env`. Antes de ejecutar nada, comprueba si la key
existe:

```bash
test -f ~/.config/openrouter/.env && grep -q OPENROUTER_API_KEY ~/.config/openrouter/.env && echo OK || echo FALTA
```

Si falta:
1. Indica al usuario que obtenga su API key en https://openrouter.ai/keys y
   que la configure personalmente desde su terminal. Nunca debe pegarla en el chat.
2. Debe guardarla SOLO en el archivo de config, nunca hardcodeada en un script
   ni impresa de vuelta en el chat:
   ```bash
   mkdir -p ~/.config/openrouter
   umask 077
   printf 'OPENROUTER_API_KEY=%s\n' "LA_CLAVE" > ~/.config/openrouter/.env
   chmod 600 ~/.config/openrouter/.env
   ```
3. Si la clave llega pegada en texto plano en el chat, avisa al usuario de que
   ha quedado expuesta en el historial de la conversacion y que puede
   rotarla en el dashboard de OpenRouter si le preocupa.

Si falta `ffmpeg`/`ffprobe`/`yt-dlp`, dilo explicitamente (`brew install
ffmpeg yt-dlp`) — los scripts tambien lo comprueban y cortan con el mismo
mensaje.

## Paso 1: elegir modo y fuente

`/vervideo completo <fuente> [pregunta]` o `/vervideo mini <fuente> [pregunta]`.

Si el usuario escribe `/vervideo <fuente>` sin modo, pregunta antes de procesar:

> **Completo** — Gemini 3.6 ve el video entero de una vez. Mejor para
> descripcion narrativa rica (estetica, plano a plano, sonido). Mas caro,
> una sola llamada.
> **Mini** — frames por cambio de escena + transcripcion. Mejor para
> analisis tipo editor (pacing, hook, momentos citables) con reporte
> estructurado. Mas barato, mas rapido.

`<fuente>` puede ser:
- Una **URL publica** (YouTube, TikTok, Instagram, Vimeo, X, y "cientos mas"
  via yt-dlp). Se descarga a un directorio temporal, nunca queda en el
  repositorio de trabajo. Si el contenido requiere login (Stories privados,
  video bloqueado por region) fallara — no reintentes en bucle, dile a
  usuario que ese contenido no es accesible sin sesion.
- Una **ruta local** (`.mp4`, `.mov`, `.mkv`, `.webm`...). No se descarga
  nada, se procesa donde esta.

---

## MODO COMPLETO

Envia el video entero (comprimido si hace falta) a `google/gemini-3.6-flash`
via OpenRouter en una sola llamada, y Gemini devuelve el analisis narrativo
completo en Markdown.

### Paso 1.5 — preguntar el enfoque

**Antes de ejecutar el script**, pregunta al usuario en
que quiere que se centre el analisis (a menos que ya lo haya dicho en el
mensaje, ej. "analiza la estetica de este video"):

> **Pregunta:** "En que quieres que se centre el analisis?"
> - **Estetica** — paleta, luz, grano, tratamiento de color
> - **Personajes** — fisico, vestuario, expresion, actuacion
> - **Camara** — planos, angulos, movimientos, raccord
> - **Audio** — musica, diseno sonoro, entonacion
> - **General** — las 5 secciones equilibradas, sin priorizar ninguna

Si el usuario pide otra cosa que no encaja en esas 5 categorias (ej. "el ritmo de
montaje", "los productos que aparecen"), usa `--focus otro --focus-detalle
"<lo que pidio>"`.

### Paso 2 — ejecutar

```bash
python3 ~/.claude/skills/vervideo/scripts/completo.py "<fuente>" \
    --focus <estetica|personajes|camara|audio|general|otro> \
    [--focus-detalle "texto libre si --focus otro"]
```

En Codex, sustituye `~/.claude/skills/` por `~/.codex/skills/`.

El script:
- Si `<fuente>` es una URL, la descarga con `yt-dlp` a un temporal.
- Comprueba el tamano y comprime automaticamente con `ffmpeg` (bitrate segun
  duracion) si no cabe en el limite practico de envio, sin tocar el original.
- Envia el video en base64 a Gemini 3.6 Flash con el prompt de descripcion
  ultra detallada, ponderado segun el `--focus` elegido: la seccion elegida
  se pide mas extensa y las demas pueden ser mas breves.
- Guarda el resultado en Markdown junto al video (o en el directorio actual
  si la fuente era una URL), como `<nombre>.analisis.md`.
- Imprime en stderr el uso de tokens y el coste aproximado en dolares.

Si ffmpeg no esta instalado o la API devuelve error (clave invalida, sin
creditos, modelo no disponible), el script corta con el mensaje tal cual —
no lo intentes interpretar ni reintentar en bucle sin decirle al usuario que
esta pasando.

### Paso 3 — entregar el resultado

1. Dale al usuario un resumen breve en el chat (2-3 lineas: de que va el
   video, cuantos planos, si tiene voz/musica).
2. Adjunta o enlaza el archivo completo con la herramienta disponible en el
   cliente; no lo pegues entero en el chat salvo que lo pida.
3. Menciona el coste aproximado que imprimio el script.

---

## MODO MINI

Extrae frames por cada cambio de escena detectado (mas una pasada densa de
los primeros 10s), transcribe el audio con `openai/whisper-large-v3-turbo`
via el endpoint `/audio/transcriptions` de OpenRouter, y genera un
`report.md` estructurado con marcadores pendientes que el agente rellena tras
leer los frames.

### Presupuesto de frames

Segun duracion del video (nunca mas de 100 frames en total):
- ≤30s → hasta 30 frames
- 30s-1min → hasta 40
- 1-3min → hasta 60
- 3-10min → hasta 80
- \>10min → 100, escaneo disperso (se avisa en el reporte)

Si un video detecta muy pocos o ningun cambio de escena (plano fijo largo),
el script cae a muestreo uniforme.

### Paso 2 — ejecutar

```bash
python3 ~/.claude/skills/vervideo/scripts/mini.py "<fuente>" --intent "<por que se ve esto>"
```

En Codex, sustituye `~/.claude/skills/` por `~/.codex/skills/`.

La pregunta o interes del usuario ES el intent — pasala siempre que tengas
alguna senal (la pregunta que hizo, un objetivo declarado). Sin intent, el
script funciona igual pero el TL;DR del reporte queda menos enfocado.

Flags opcionales:
- `--out-dir DIR` — mantener los archivos de trabajo en un sitio concreto.
- `--max-frames N` — bajar el tope de frames (presupuesto mas ajustado).
- `--resolution W` — ancho del frame en px (default 512; sube a 1024 solo si
  hace falta leer texto en pantalla).
- `--language es` — forzar idioma de transcripcion (por defecto autodetecta).
- `--no-whisper` — no transcribir, solo frames (si no hay key o no hace
  falta texto).

El script imprime un JSON con: `workdir`, `report_path`, `duration_s`,
`scene_frames` (lista de `{t, path, label}`), `hook_frames` (idem, densidad
alta 0-10s), `pacing` (`cuts`, `cuts_per_min`, `mean_shot_length_s`),
`sparse_warning`, `has_transcript`.

### Paso 3 — leer los frames

Lee cada frame de `scene_frames` y `hook_frames` con la herramienta visual
disponible. Hazlo por lotes razonables y en paralelo cuando el cliente lo permita.
Estan en orden cronologico con su `label` (`mm:ss.ss`) para alinearlos con la
transcripcion del `report.md`.

### Paso 4 — responder y rellenar el reporte

Con frames + transcripcion + `report.md` como evidencia:

1. Responde primero al usuario en el chat, citando timestamps.
2. Rellena cada marcador `<!-- pending agent fill: ... -->` del
   `report.md`, en orden: TL;DR, momentos clave, hook microscope
   (frame a frame: cambio visual x lo que se dice, identifica el patron de
   hook), perfil editorial, momentos citables, entidades, conceptos.
3. No dejes marcadores sin rellenar — un reporte a medias no sirve como
   artefacto de referencia.

### Paso 5 — entregar

1. Resumen breve en el chat.
2. Adjunta o enlaza `report.md` con la herramienta disponible en el cliente.
3. Si el video era largo (`sparse_warning: true`), ofrece re-ejecutar sobre
   un tramo concreto en vez de fiarte del escaneo disperso.

Este modo **no** guarda nada automaticamente en un vault, memoria persistente
o base de conocimiento. Si el analisis merece conservarse, pide autorizacion
antes de copiarlo fuera de su directorio de trabajo.

---

## Transcripcion (modo mini)

Un unico backend: `openai/whisper-large-v3-turbo` via
`POST https://openrouter.ai/api/v1/audio/transcriptions`, con el audio
mandado como JSON base64 (`input_audio.data` + `format: wav`) y
`response_format: verbose_json` para timestamps por segmento y palabra.
Misma `OPENROUTER_API_KEY` que el modo completo — no hace falta ninguna
clave adicional de Groq/OpenAI.

Si la transcripcion falla (clave invalida, sin creditos, audio raro), el
script avisa por stderr y continua solo con frames — no cortes el analisis
por eso, dile al usuario que el reporte va sin transcripcion.

## Notas

- Modelo del modo completo fijado en `google/gemini-3.6-flash` (variable
  `MODEL` en `completo.py`). Si OpenRouter lo renombra o descontinua, cambia
  esa linea.
- Modelo de transcripcion fijado en `openai/whisper-large-v3-turbo`
  (variable `MODEL` en `transcribe.py`).
- Gemini no procesa el video a la resolucion temporal real (24-30fps), lo
  muestrea internamente — el modo mini (frames explicitos por cambio de
  escena) da timestamps mas fiables cuando eso importa.
- No inventes datos si el analisis no responde algo: dilo tal cual, no
  rellenes huecos.

## Seguridad y permisos

- Descarga con `yt-dlp` solo contenido publico — no inicia sesion en
  ninguna plataforma, sin cookies ni cuentas.
- El modo completo manda el video entero (base64) a OpenRouter →
  `google/gemini-3.6-flash`.
- El modo mini NO manda el video entero a ningun sitio: solo manda a
  OpenRouter los frames extraidos (que el agente lee con las herramientas del
  cliente) y el audio
  extraido (a `openai/whisper-large-v3-turbo`, solo si no se usa
  `--no-whisper`).
- Los archivos de trabajo (video descargado, frames, audio) quedan en un
  directorio temporal o en `--out-dir`; borralos cuando termines si el usuario
  no va a hacer preguntas de seguimiento.
- La API key vive solo en `~/.config/openrouter/.env` (permisos 600) o en
  la variable de entorno `OPENROUTER_API_KEY`. Nunca se imprime en stdout,
  stderr, ni se escribe en el reporte.

**Scripts:** `scripts/common.py` (utilidades compartidas: API key, descarga
de fuente, duracion), `scripts/completo.py` (modo completo), `scripts/mini.py`
(orquestador modo mini), `scripts/frames.py` (deteccion de cambio de escena,
extraccion de frames, hook microscope, extraccion de audio, metricas de
pacing), `scripts/transcribe.py` (cliente STT de OpenRouter),
`scripts/report.py` (generador del `report.md`).
