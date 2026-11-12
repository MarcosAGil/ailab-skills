# Gemini Omni Flash 1.2

Vídeo con audio de Google servido por Kie. Necesita la skill 2.3.19. El servidor de AILAB repite todas las comprobaciones
y tiene la última palabra; si algo no cuadra, rechaza antes de cobrar.

## 1. Generar (`gemini-omni-flash-1-2`)

Una modalidad por petición con `--mode`:

| Modo | Materiales | Duración |
|---|---|---|
| `t2v` | Solo el prompt | 3 a 15 s |
| `frames` | `--first_frame_url` obligatorio y `--last_frame_url` opcional; nada más | 3 a 15 s; con último frame, 3 a 10 s |
| `reference` | Hasta 6 imágenes (`--image_urls`, repetible) y hasta 2 `--character_ids` | 3 a 15 s |
| `edit` | Un `--video_url` (MP4 o MOV de hasta 15 s), hasta 5 imágenes y hasta 2 `--character_ids` | No se elige: dura lo que el vídeo |

```bash
node <skill-dir>/scripts/ailab.mjs prepare gemini-omni-flash-1-2 --mode reference --image_urls cara.png --prompt "..." --duration 8 --resolution 720p
node <skill-dir>/scripts/ailab.mjs prepare gemini-omni-flash-1-2 --mode edit --video_url clip.mp4 --prompt "..." --resolution 720p
```

- Resoluciones `360p`, `720p`, `1080p` y `4k`. Formato `16:9`, `9:16` o `auto` (sigue la imagen de referencia).
- `--seed` opcional, de 10000 a 99999.
- Imágenes JPG, PNG o WebP de hasta 20 MB. El prompt admite hasta 20.000 caracteres.
- Los Character IDs deben haberse creado con la cuenta del usuario. 1.2 no admite Voice IDs sueltos: la voz va dentro
  de un Character ID.
- Precio: tarifa de Kie x 1,02 por segundo (4,08 cr a 360p, 9,18 a 720p, 10,2 a 1080p y 22,44 a 4K), redondeado al
  crédito superior. Al editar se cobra la duración del vídeo de entrada: la CLI lo mide (cada vídeo al segundo
  superior, como el servidor) y rechaza uno de más de 15 s antes de subir nada. `prepare` da la cifra, que es el máximo
  reservado; se cobra el consumo real y nunca más.

## 2. Extend (`gemini-omni-flash-1-2-extend`)

Añade de 3 a 10 s al final de un vídeo de Gemini Omni Flash 1.2 de la cuenta: generado, editado o ya extendido, a 360p
o 720p y de 15 s o menos.

```bash
node <skill-dir>/scripts/ailab.mjs omni12-videos [--cursor <valor>]
node <skill-dir>/scripts/ailab.mjs prepare gemini-omni-flash-1-2-extend --task_id <task_id> --prompt "..." --duration 5
```

- `omni12-videos` solo lee: lista 20 vídeos por página con `task_id`, tipo, resolución, duración, formato y el precio de
  cada duración posible.
- Se cobran solo los segundos añadidos, a la tarifa de la resolución del vídeo de origen. `prepare` toma esa cifra del
  servidor y es la que se aprueba.
- Hasta 3 imágenes de referencia opcionales (`--image_urls`). No hay resolución, formato ni semilla: los fija el vídeo.

## 3. Character ID y Voice ID (gratis)

```bash
node <skill-dir>/scripts/ailab.mjs prepare gemini-omni-audio --audio_id Kore --name "Voz Clara" --voice_description "..."
node <skill-dir>/scripts/ailab.mjs prepare gemini-omni-character --portrait_url retrato.png --body_url cuerpo.png --descriptions "..." --character_name "Clara" --audio_ids <voice_id>
```

- `gemini-omni-audio` crea un Voice ID desde una de las voces base de Gemini (`--audio_id`, por defecto Puck), un
  nombre y una descripción opcional; `--example_dialogue` admite una frase de hasta 120 caracteres.
- `gemini-omni-character` crea un Character ID desde un retrato obligatorio y una imagen de cuerpo opcional, con una
  descripción y, si se quiere voz propia, un Voice ID creado antes con la misma cuenta.
- No consumen créditos, pero siguen el flujo `prepare` y `submit --confirmed`. El resultado es un archivo de texto con
  el ID; `status <task_id>` lo recupera. Hay un límite de creaciones seguidas: con 429, espera un minuto.
- Los dos IDs sirven también en Gemini Omni Flash 1.1 (`--character_ids` y `--audio_ids`).
