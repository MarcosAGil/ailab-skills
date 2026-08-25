---
name: vervideo
description: >
  Analiza un vídeo local con Gemini vía OpenRouter y devuelve una descripción
  detallada de su estética, transcripción, música, sonido, escenas y narrativa.
  Úsala cuando el usuario pida describir, transcribir o revisar exhaustivamente
  un archivo de vídeo existente.
---

# Ver vídeo

Convierte el contenido visual y sonoro de un vídeo local en un informe Markdown
detallado, sin modificar el archivo original.

## Cuándo usarla

- El usuario proporciona un `.mp4`, `.mov`, `.webm`, `.mpeg` o `.m4v` y pide
  describirlo, transcribirlo o analizarlo plano a plano.
- Se necesita documentar el montaje, las voces, la música, los efectos de sonido
  o los textos visibles de un vídeo existente.

No la uses para evaluar métricas de una publicación ni para generar o editar
vídeo.

## Seguridad y autorización

El análisis envía el vídeo seleccionado a OpenRouter para procesarlo con Gemini y
puede consumir saldo de la API key del usuario. Antes del primer envío, muestra
el proveedor, el modelo, la ruta y el tamaño del archivo, y obtén confirmación si
el usuario todavía no ha autorizado expresamente analizar ese archivo mediante
este servicio. No leas, imprimas ni pidas que se pegue la API key en el chat.

## Configuración

El script lee `OPENROUTER_API_KEY` desde el entorno o desde
`~/.config/openrouter/.env`. El archivo debe contener:

```text
OPENROUTER_API_KEY=clave_del_usuario
```

Debe crearlo el usuario personalmente fuera de la conversación y protegerlo con
permisos `600`. Nunca copies ese archivo dentro de la skill, un repositorio, un
ZIP o el directorio de salida.

## Ejecución

En Claude Code:

```bash
python3 ~/.claude/skills/vervideo/scripts/vervideo.py "<ruta_del_video>"
```

En Codex:

```bash
python3 ~/.codex/skills/vervideo/scripts/vervideo.py "<ruta_del_video>"
```

Se puede pasar una segunda ruta para elegir el Markdown de salida. Sin ella, el
resultado se guarda junto al vídeo como `<nombre>.analisis.md`.

El script comprime automáticamente los archivos que superan su límite práctico
de envío. Esa operación requiere `ffmpeg` y `ffprobe`. Si el proveedor devuelve
un error, informa del mensaje exacto y no reintentes en bucle ni cambies de
proveedor sin autorización.

## Entrega

Lee el Markdown generado y devuelve:

1. Un resumen breve del contenido, número aproximado de planos y presencia de
   voz o música.
2. Un enlace o adjunto al informe completo, según permita el entorno.
3. La ruta exacta del archivo y el coste aproximado comunicado por el script.

No inventes detalles que el análisis marque como ambiguos o no visibles.
