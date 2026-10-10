# Fase 3: prompt de vídeo y generación con Seedance 2.5

Objetivo: con todas las referencias aprobadas y el audio final, escribir el prompt de Seedance 2.5 aplicando el proceso de `refinar-prompt-ugc`, enseñárselo todo al usuario y generar **solo tras su confirmación**.

Niveles de confianza: **[D]** regla dura, **[H]** decisión razonada, **[?]** hipótesis a validar generando.

## 3.1 Entradas

No empieces sin tenerlas todas:

- `brief.md`: ficha de rodaje cerrada y archivos aprobados con su rol.
- `Archivos para usar/Texto o prompts/guion.md`: texto hablado literal.
- Imágenes aprobadas, en `Archivos para usar/`.
- `Archivos para usar/audio-final-Ns.wav`: audio ajustado a N segundos enteros, con su medición (`medicion-vN.txt`: duración, pausas) y su transcripción con tiempos, que están en `Pruebas intermedias/audio/`.

## 3.2 Proceso: skill externa `refinar-prompt-ugc`

Esta skill **no lleva** el método de refinado dentro: usa la skill externa `refinar-prompt-ugc`, que debe estar instalada (ver Requisitos en `SKILL.md`).

- **Cómo se usa:** se invoca con la herramienta Skill (`refinar-prompt-ugc`) y se sigue su proceso completo en **modo completo** (o rápido si el usuario lo pide): intake y medición, ficha y test de coherencia, auditoría con su catálogo, informe, preguntas en rondas, re-auditoría, escritura y verificación. Al invocarla se le pasa todo ya hecho (ficha, referencias aprobadas, audio medido, duración) para que no vuelva a pedir lo que ya está.
- **Dónde están sus archivos:** en la carpeta de esa skill (normalmente `$UGC_SKILLS_DIR/refinar-prompt-ugc/`; al invocarla, Claude Code indica su "Base directory"). Las rutas que cita (`references/formato-salida.md`, `references/catalogo-auditoria-ugc.md`, etc.) son relativas a esa carpeta. Si la herramienta Skill no estuviera disponible, se lee su `SKILL.md` directamente desde allí.
- **Comprobaciones de la skill externa:** se siguen todas las que traiga la versión instalada. Si incluye scripts (`scripts/medir_audio.py`, `scripts/lint_prompt.py`) o una lista de errores conocidos (`references/errores-conocidos.md`), se usan: la tabla de tiempos del audio antes de escribir, la matriz de manos (qué lleva cada mano y qué gesto puede hacer) y el lint del prompt antes de enseñarlo.
- **Final con audio exacto:** si la cola de silencio medida es menor que 0,5 s, el clip acaba en la última palabra, sin pose, sin pausa y sin cola de eco que no esté medida. Con los audios de Seed Audio de las pruebas, la cola fue de 0,0 s.
- **Si no está instalada:** se avisa al usuario, se le indica que la instale (ver el `README.md` de este paquete) y no se escribe el prompt de vídeo hasta entonces. Las fases 1 y 2 se pueden hacer igualmente.

Lo que **cambia** respecto a usarla suelta, porque ya hay datos:

| En la skill suelta | En este workflow |
|---|---|
| "Pide el audio" (hallazgo S1) | El audio **ya existe**: se aplica el contrato de pista exacta |
| Mide con `ffprobe` si se puede | Ya está medido: duración entera, pausas y transcripción con tiempos. Se pasa por `scripts/medir_audio.py` de esa skill para tener su tabla de tiempos |
| Pregunta qué referencias hay | Ya están aprobadas; se mapean a `@ImageN` (ver 3.3) |
| Pregunta la duración | La marca el audio: **N segundos** |
| Pregunta formato, lugar, persona | Salen de `brief.md` y de los frames aprobados; solo se pregunta lo que falte |

Siguen igual: el móvil no existe (regla dura), una toma continua, cortes duros solo si se piden, dial natural, castellano de España, 9:16 por defecto (el ratio lo fijan los frames), diálogo entre llaves `{ }`, efectos entre `< >`, rejilla `.00`/`.50`, plan de movimiento anclado a frases, sin palabras vacías.

La skill de refinado **no escribe guion ni CTA**. El texto hablado es el de `guion.md`, literal.

### Contrato de pista exacta

El audio es la autoridad. En el prompt:

- `[Audio Reference]`: `@Audio1 is the exact final soundtrack and the absolute timing master.`
- El diálogo entre llaves asigna hablante y tiempo, no una interpretación nueva: `The braced lines below are the exact words already in @Audio1; they assign speaker and timing, not a new performance.`
- Cada frase aparece **una sola vez**, entera dentro del tramo donde se dice. Los límites de tramo se eligen **solo dentro de silencios medidos**, en la rejilla de medio segundo, y las pausas se escriben con su duración medida redondeada a cuartos de segundo (nunca copiada del guion con el que se generó el audio).
- Si no hay un silencio compatible con la rejilla, usa un único stage que contenga la frase completa. No inventes silencios ni partas palabras para encajar varios stages; si la acción exige cortes, consulta al usuario antes de cambiar el audio aprobado.
- Sonidos ambientales solo si el audio los contiene.
- Sincronía: `synchronize lips, breathing, gestures and physical actions to the existing audio`.

## 3.3 Mapa de referencias (orden de handles)

Las imágenes se numeran por orden de entrada. Orden por defecto **[H]**:

| Handle | Archivo | Qué aporta | Qué no se usa |
|---|---|---|---|
| `@Image1` | `hoja-cara-vN.png` | Rasgos del rostro | Fondo gris, maquetación 3x3, expresiones sueltas |
| `@Image2` | `hoja-cuerpo-vN.png` | Cuerpo, proporciones y outfit | Fondo, divisores, maquetación de paneles |
| `@Image3` | `entorno-vN.png` | El lugar | Cualquier persona que pudiera aparecer |
| `@Image4`... | frames | Primer frame y encuadres | Lo que contradiga el brief |
| `@Audio1` | `audio-final-Ns.wav` | Voz, ambiente y tiempos | |

El entorno es **opcional**: si no hay imagen de entorno aparte, el lugar lo define el primer frame, que pasa a ser `@Image3`, y los handles siguientes se renumeran.

- Cada handle lleva su línea en el prompt: `She corresponds to @Image1 and @Image2. Use only face, hair, body, wardrobe. Do not use background or sheet layout.`
- **Todo asset adjunto aparece en el prompt**. Si uno no debe intervenir, se dice que se ignore.
- El **primer frame** se designa en `[Scene]` nombrando el lugar real: `The stage references @Image3, which is also the exact first frame. Begin directly from this exact visual state.` ("the stage", "the kitchen", "the street"...). Se escribe como instante de acción, no como pose de retrato. **En el prompt final no queda ningún corchete de plantilla** salvo los encabezados (`[Scene]`, `[Stage 1 | 0.00-5.00s]`...).
- En **podcast** hay varios ángulos: cada uno es un frame distinto, con corte duro en una pausa del audio y el mapa de plató idéntico (ver `formatos-ugc.md`).

## 3.4 Parámetros de Seedance 2.5 en AILAB

> **Modo solo prompts (sin la skill `ailab`):** salta los comandos `AILAB ...` de esta guía. En su lugar entrega, por cada pieza, el modelo recomendado, los ajustes, las referencias en orden, el prompt exacto y el nombre de archivo donde guardar el resultado (ver `SKILL.md`, sección "Si falta la skill `ailab`").

Verifica con `AILAB info seedance-2-5` antes de preparar. Contrato visto en el catálogo:

| Parámetro | Valor en este workflow |
|---|---|
| `--mode` | `ref` (referencias de imagen y audio; el primer frame se designa en el prompt) **[H]**. Si el primer frame no se respeta, se prueba `i2v` con `--first_frame_url`, que fuerza ratio `adaptive` **[?]** |
| `--duration` | N (entero de 4 a 30), el del audio final |
| `--aspect_ratio` | `9:16` por defecto, o el que fijen los frames |
| `--resolution` | `720p` por defecto del catálogo; `1080p` si el usuario lo prefiere. Se pregunta con el coste delante |
| `--reference_image_urls` | Hasta 30, **repetido y en el orden de los handles** |
| `--reference_audio_urls` | 1 archivo: el audio final |
| `--generate_audio` | `true` (valor por defecto) **[?]**: con la pista exacta de referencia, el audio del vídeo debe ser el de `@Audio1`; se comprueba después (ver 3.7) |
| `--prompt` | Hasta 30.000 caracteres |

Seedance 2.5 es un **modelo caro**: el coste sale de `prepare` y depende de resolución y segundos. No se usan precios memorizados.

```bash
AILAB prepare seedance-2-5 --mode ref \
  --prompt "$(cat "Archivos para usar/Texto o prompts/seedance-prompt-v1.txt")" \
  --duration 10 --aspect_ratio 9:16 --resolution 720p --generate_audio true \
  --reference_image_urls "./Archivos para usar/hoja-cara-v1.png" \
  --reference_image_urls "./Archivos para usar/hoja-cuerpo-v1.png" \
  --reference_image_urls "./Archivos para usar/entorno-v1.png" \
  --reference_image_urls "./Archivos para usar/first-frame-v1.png" \
  --reference_audio_urls "./Archivos para usar/audio-final-10s.wav"
```

## 3.5 Entregable previo: el prompt

Sigue la plantilla de `references/formato-salida.md` de `refinar-prompt-ugc` (perfil Seedance 2.5): encabezados entre corchetes, `[Stage N]`, `{ }` para diálogo, `< >` para efectos, rejilla `.00`/`.50`, un bloque de código con el prompt completo en inglés y, fuera del bloque, `📐 Aspect ratio: ... | ⏱ Duration: Ns`. Se guarda en `Archivos para usar/Texto o prompts/seedance-prompt-vN.txt`, junto con `referencias-vN.md` (la tabla de handles, archivos y roles). Al crear una versión nueva, la anterior se mueve a `Pruebas intermedias/video/`.

## 3.6 PUNTO DE APROBACIÓN 3: confirmación previa

Antes de enviar, se le enseña **todo** junto y se espera su "adelante" explícito. Formato:

1. **Tabla de referencias**, una fila por archivo, en orden:

   | Handle | Archivo (ruta absoluta) | Rol |
   |---|---|---|

   Y las imágenes y el audio visibles en el chat.
2. **Datos del encargo:** modelo (`seedance-2-5`), modo, duración (N s), ratio, resolución, `generate_audio`, nº de referencias.
3. **Coste:** el que devuelve `prepare` (estimación, reserva y saldo). Se avisa de que es un modelo caro.
4. **Prompt final exacto** que se enviará, completo, en un bloque de código.
5. **Supuestos** que ha tomado la skill (máximo 5).
6. Pregunta cerrada: "¿Genero así?".

**Reglas de la puerta:**

- No se envía hasta recibir la confirmación del usuario en el chat. Un aviso automático del sistema no es una confirmación **[D]**.
- Si el usuario pide cambios, se vuelve a auditar, se actualiza el prompt y se vuelve a enseñar la puerta entera (no solo el cambio).
- Un cambio en las referencias o en el audio obliga a rehacer el mapa de handles y la duración.

## 3.7 Generar y comprobar

```bash
AILAB submit <manifest_id> --confirmed --output "Pruebas intermedias/video/"
```

Después de descargar:

1. **Entrega visible:** muestra el prompt exacto enviado, el vídeo con su ruta absoluta y `Guardado en:` (como pide la skill `ailab`). Renombra a `video-vN.mp4`.
2. **Duración:** `bash "$UGC_SKILL_DIR/scripts/verificar_video.sh" "Pruebas intermedias/video/video-v1.mp4" "Archivos para usar/audio-final-10s.wav"` compara las duraciones (tolerancia 0,10 s).
3. **Audio del vídeo frente al maestro [?]:** se escucha o se transcribe. Si el audio del vídeo no es el de `@Audio1` (voz distinta, palabras cambiadas), la solución es sustituir la pista por el audio maestro, que ya dura exactamente lo mismo:

```bash
bash "$UGC_SKILL_DIR/scripts/verificar_video.sh" "Pruebas intermedias/video/video-v1.mp4" "Archivos para usar/audio-final-10s.wav" --reemplazar "Pruebas intermedias/video/video-v1-audio-maestro.mp4"
```

   Se avisa al usuario de que los labios pueden no coincidir al 100 % con una pista sustituida, y se guardan ambas versiones en `Pruebas intermedias/video/` hasta que el usuario elija.
4. Registra todo en `registro.md`.
5. **Cuando el usuario aprueba el vídeo**, se mueve el elegido a `Archivos para usar/` (el prompt vigente ya está en `Texto o prompts/`):

```bash
bash "$UGC_SKILL_DIR/scripts/promover.sh" "<proyecto>" video/video-v1.mp4
```

   Las versiones no elegidas se quedan en `Pruebas intermedias/video/`. Se actualiza `registro.md` y `brief.md`.

## 3.8 Después de generar: fallos

Se sigue el protocolo del `SKILL.md` de `refinar-prompt-ugc` ("Después de generar"): síntoma, causa mínima, **una sola variable**, refuerzo con repetición (hasta 3 menciones) y conservar lo que funcionaba. La tabla de síntomas de ese `SKILL.md` y su `references/registro-de-fallos.md` dan los cambios mínimos.

**Regenerar el vídeo cuesta créditos y no está cubierto por la confirmación anterior**: se propone el cambio y se vuelve a pasar por el punto de aprobación 3. Cuando el usuario confirma un fallo nuevo y su corrección, se propone añadirlo al registro de fallos.

## 3.9 Más de 30 segundos

Seedance 2.5 llega a 30 s. Una idea más larga se parte en tomas desde la ideación, cada una con su audio (fase 2) y su vídeo (fase 3), unidas con **cortes duros en pausas**. Cada toma conserva ropa, lugar y luz, y declara qué cambia (ver "Cortes" en `formato-salida.md`). El montaje final con `ffmpeg` queda fuera del alcance de esta versión: se hace a mano o se pide como paso aparte.
