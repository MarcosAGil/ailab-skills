# Comandos del flujo

Los nombres siguientes corresponden al contrato conocido. Consulta `info` antes
de cada encargo; si cambian, adapta los parámetros documentados sin inventar rutas
de API. Todos los comandos remotos pasan por la instalación hermana de `ailab`.
Los símbolos `<...>` son datos reales del encargo, no argumentos literales.

## Consultas sin generación

```bash
node <ailab-dir>/scripts/ailab.mjs self-test
node <ailab-dir>/scripts/ailab.mjs assistants
node <ailab-dir>/scripts/ailab.mjs info gemini-omni-flash-1-1
node <ailab-dir>/scripts/ailab.mjs info sam-audio
node <ailab-dir>/scripts/ailab.mjs info eleven-audio-isolation
node <ailab-dir>/scripts/ailab.mjs info eleven-voice-changer
node <ailab-dir>/scripts/ailab.mjs voices eleven
node <ailab-dir>/scripts/ailab.mjs balance
```

Usa runtime 2.2.3 o posterior: mide automáticamente el audio de Voice Isolator.
El catálogo del servidor es la autoridad. No pases `--model` al asistente ni
elijas los modelos Lite/Plus de la interfaz web: la CLI
AILAB resuelve su modelo conversacional fijo.

## Video Prompter

Escribe el brief en un archivo UTF-8 y usa `--message-file` para evitar problemas
de quoting. Incluye: formato, diálogo literal, dirección, duración, aspecto y resolución aprobados,
modo reference y la lista numerada con el papel de cada imagen. Pide que entregue
solo el prompt final, con tiempos realizables y sin añadir otros pasos de pago.

```bash
node <ailab-dir>/scripts/ailab.mjs assistant-prepare video-prompter \
  --message-file <brief.txt> \
  --image <composicion> --image <entorno> --image <personaje>
node <ailab-dir>/scripts/ailab.mjs assistant-submit <request_id> --confirmed
```

Prepara antes del plan; envía únicamente dentro de la autorización del flujo.
La lista mostrada es el ejemplo de tres imágenes: ajusta su longitud al material
aprobado sin cambiar el orden entre las dos llamadas.

## Vídeo

```bash
node <ailab-dir>/scripts/ailab.mjs prepare gemini-omni-flash-1-1 \
  --mode reference --aspect_ratio 9:16 --resolution 1080p --duration 10 \
  --image_urls <composicion> --image_urls <entorno> --image_urls <personaje> \
  --prompt <prompt-final-exacto>
node <ailab-dir>/scripts/ailab.mjs submit <manifest_id> --confirmed --output <run>/video
```

Sustituye 10, 9:16 y 1080p por los valores aprobados. Para prompts largos/multilínea, usa un
proceso con un array de argumentos (por ejemplo `spawnSync` de Node leyendo el
archivo UTF-8), sin shell. No inventes `--prompt-file`: no forma parte de este
contrato. Guarda el prompt exacto y utiliza ese texto como argumento `--prompt`.

## Audio

Después de extraer el audio con el helper, usa la MISMA ruta de audio original
para preparar SAM y Voice Isolator:

```bash
node <ailab-dir>/scripts/ailab.mjs prepare sam-audio \
  --audio_url <audio-original.wav> --prompt <prompt-de-separacion>
node <ailab-dir>/scripts/ailab.mjs submit <sam_manifest_id> --confirmed --output <run>/sam

node <ailab-dir>/scripts/ailab.mjs prepare eleven-audio-isolation \
  --audio_url <audio-original.wav>
node <ailab-dir>/scripts/ailab.mjs submit <isolator_manifest_id> --confirmed --output <run>/isolator

node <ailab-dir>/scripts/ailab.mjs prepare eleven-voice-changer \
  --audio_url <voz-aislada-descargada> --voice_id <id-real-aprobado> \
  --duration_seconds <duracion-real-voz-aislada> --remove_background_noise false
node <ailab-dir>/scripts/ailab.mjs submit <changer_manifest_id> --confirmed --output <run>/voice
```

Usa `ffprobe -v error -show_format -show_streams -of json <archivo>` para medir
los resultados. No pases manualmente parámetros `internal` de SAM/Voice Isolator.
La limpieza adicional de Voice Changer queda desactivada porque ya hay una etapa
dedicada de aislamiento; respeta el contrato vigente y el plan aprobado.

La CLI descarga todos los outputs y muestra `Guardado:` (o `Recuperado del servidor:`
al recuperar una tarea sin recibo local). Usa esas rutas reales;
no adivines nombres. En el adaptador `labs-queue-v1` conocido, el orden de SAM es
`target` y después `residual`, pero los valores ausentes se eliminan de la lista:
UN archivo no permite deducir cuál es. Verifica que ambos outputs hayan terminado
y se hayan descargado antes de asignar ese orden; contrasta con escucha/análisis
si la herramienta lo permite. Si el runtime cambia o no hay evidencia suficiente,
marca la identificación pendiente y no declares un ambiente listo para usar.

## Reanudar

```bash
node <ailab-dir>/scripts/ailab.mjs status <task_id-real> --output <carpeta-de-su-etapa>
```

Un mensaje «en curso» no es una nueva generación. Conserva request/manifest/task
IDs en el registro del encargo. No leas el estado privado de AILAB para reconstruir
el flujo: usa las salidas de CLI y el registro propio de esta skill.
