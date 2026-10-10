# Seed Audio: cómo promptearlo para audio UGC

Esta guía integra el conocimiento del Audio Prompter (verificado contra la documentación oficial de fal.ai el 10 de agosto de 2026, y contra el catálogo de AILAB) para que la skill genere el audio **sin llamar a ningún agente**. Si algo no está documentado, aquí se dice.

Niveles de confianza: **[D]** documentado, **[H]** heurística razonada, **[?]** hipótesis por validar generando, **[ND]** no documentado.

## 1. Qué es y qué papel juega

Seed Audio genera una **escena acústica integrada**: voz, ambiente, efectos y, si se pide, música, en una sola pasada. No es un mezclador: no da stems, no asigna presets de voz distintos a cada personaje y **no garantiza sincronía por fotograma** **[D]**.

En este workflow el audio se genera **primero** y es el **maestro de tiempo**: su duración real fija la del vídeo. Después entra en Seedance 2.5 como `@Audio1`.

## 2. Contrato de AILAB

Comprueba siempre con `AILAB info seed-audio` por si el catálogo ha cambiado. En la versión del catálogo con la que se escribió esta skill:

| Parámetro CLI | Regla |
|---|---|
| `--prompt` | Obligatorio. Máximo **2.048 caracteres** **[D]** |
| `--audio_urls` | Hasta 3 referencias de audio (cada una hasta 30 s y 10 MB según la documentación oficial) |
| `--image_url` | Una imagen. No se combina con `--audio_urls` **[D]** |
| `--estimated_duration_seconds` | 1 a 160, por defecto 60. Es una **estimación**; el catálogo avisa de que "la duración real la decide el modelo" |
| `--output_format` | `wav` (para vídeo y posproducción), `mp3`, `pcm`, `ogg_opus` |
| `--speed` | 0,5 a 2 (por defecto 1). Cambia el ritmo global |
| `--volume` | 0,5 a 2 (por defecto 1). Ganancia general, no mezcla por capa |
| `--pitch` | Semitonos, entero, de -24 a 24 (por defecto 0) |

**Importante:** la documentación del Audio Prompter habla de un campo `voice` (preset como "mindy") y de `multilingual`. **AILAB no los expone en la CLI** (no aparecen en `info seed-audio`). Consecuencias:

- **La voz se define en el texto del prompt** (línea `Voice (...)` y `[DIAL]`), no con un parámetro.
- No se escribe nunca "Voz mindy" ni `multilingual` como si fueran flags. Si algún día `info` los muestra, se usan.
- Qué voz sale exactamente y si es estable entre generaciones es **[ND]**: se valida escuchando.

## 3. Estructura del prompt (obligatoria)

```text
<X-sec scene brief: lugar, formato, tono y restricciones>.

[AESTHETIC]
- Texture: <textura, clima y tensión>.
- Environment: <lugar, escala, espacio y profundidad>.
- Voice (<Personaje>): <edad, sexo, país/acento, carácter y distancia al micro>.
- Mix: voice dominant; <ambiente> restrained; never covering the voice.
- Palette: <sonidos, música y materiales permitidos>.

[EXECUTION]
[AMBI] <ambiente> -> [DIAL] <Personaje> (<carácter, español de España>): "<guion literal>" -> [EVENT] <acción audible>.
[DIAL] <Personaje> (<carácter, español de España>): "<guion literal>" -> [TRANS] <cierre>.

[ETIQUETA: <idioma/acento>, <voces>, <narrador sí/no>, duración exacta X.Xs]
```

Reglas **[D]**:

- El orden es siempre `brief + [AESTHETIC] + [EXECUTION] + [ETIQUETA]`.
- `[EXECUTION]` es una **cadena de tags independientes** unidos con `->`: `[AMBI]`, `[DIAL]`, `[EVENT]`, `[MUSIC]`, `[TRANS]`. Cada función lleva su tag; no se encierra toda la línea en uno solo.
- El guion va **siempre entre comillas dobles rectas** `" "`. Nunca comillas latinas ni tipográficas.
- No se usan `[Scene:]`, `[sound:]` ni `[music:]`.
- La secuencia es **semántica y sin timestamps** por defecto. Los rangos `[0.0-2.0s]` son un modo avanzado solo para cues concretos (un golpe, una pausa en un instante exacto), consecutivos, y con `Exact timing, total X.Xs`.
- Idioma y acento se **repiten en tres sitios**: línea `Voice`, cada `[DIAL]` y `[ETIQUETA]`.
- Las instrucciones descriptivas pueden ir en inglés; el diálogo se queda en su idioma, con tildes y eñes.
- `Mix` (voz dominante) es obligatorio en la práctica cuando hay ambiente que pueda tapar la voz.
- La duración va en el **brief** (`12-sec ...`) y en `[ETIQUETA]` (`duración exacta 12.0s`).

### Ejemplo validado (solo como referencia de formato)

Es el talking head UGC de 12 s del Audio Prompter. El texto del diálogo está sustituido por uno neutro: sirve solo como referencia de formato.

```text
12-sec outdoor UGC selfie scene on a park path, natural, casual, conversational, no music.

[AESTHETIC]
- Texture: natural open-air acoustic, clean close-mic vocal.
- Environment: tree-lined park path, soft breeze, outdoor ambience.
- Voice (Woman): mujer joven, español de España, acento castellano, tono conversacional fluido.
- Palette: soft footsteps on asphalt, clothing rustle, park atmosphere.

[EXECUTION]
[AMBI] Park ambience, gentle breeze -> [DIAL] Woman (conversational, español de España): "Este modelo es con muchísima diferencia el más realista en cuanto a voz." -> [EVENT] Footsteps on asphalt, subtle breath.
[DIAL] Woman (friendly, persuasive, español de España): "Eso es todo, si quieres aprender más sobre este tema, escríbeme y te lo cuento." -> [TRANS] Speech trail off, footsteps fade into park ambient.

[ETIQUETA: español de España, una sola voz femenina, sin narrador, sin música, duración exacta 12.0s]
```

## 4. Estética: que suene a móvil real

La documentación de Seed **no** trae una guía para emular el micrófono de un móvil, ni la reverberación de sala, ni ruido de viento o de compresión **[ND]**. Lo siguiente es una heurística que combina las piezas documentadas (`Texture`, `Environment`, `Voice`, `Palette`, `Mix`) con las pautas de sonido de móvil de `references/sonido-y-audio.md` de la skill externa `refinar-prompt-ugc` (resumidas en esta sección). **Hay que validarlo escuchando** y anotar el resultado en el registro de fallos.

**Principios**

- **El audio tiene que casar con el lugar del vídeo.** Es la pista final: si la imagen es un baño de azulejo, la voz lleva su reverberación corta y brillante. Por eso el lugar sale del entorno aprobado y se escribe en `Environment`.
- **Voz cercana y algo comprimida**, la de un micrófono de móvil, con respiración audible y roce de ropa. Sin música, sin narrador, sin diseño sonoro **[D de la skill de refinado]**.
- **Voz dominante** y ambiente contenido (`Mix`).
- **Cada sonido puntual tiene causa visible** en el vídeo (un golpe de puerta que luego se va a ver).
- Evita palabras como `studio`, `broadcast`, `podcast-quality`, `cinematic`, `clean` en solitario, que empujan a un sonido de locución pulida. El Audio Prompter avisa de que `reverb`, `echo`, `phone` o `tape` pueden empeorar la calidad en el prompt de **identidad vocal de AILAB** (otro flujo) **[?]**; aquí se prueban sin generalizar.

**Semillas por formato** (todo **[H]**; ver `sonido-y-audio.md` para el detalle)

| Formato | `Environment` / `Palette` de partida |
|---|---|
| Selfie en casa | Room tone cercano de la estancia, roce de ropa, respiración sutil |
| Caminando | Pasos, brisa o tráfico lejano, voz algo más forzada por el movimiento |
| Producto en manos | Manipulación del objeto, golpecitos suaves, room tone |
| Móvil apoyado / trípode | Voz algo más lejana, más sala, estable |
| Coche | Habitáculo cerrado, zumbido de motor y rodadura constantes, voz cercana |
| Ponencia | Voz por megafonía con reverberación de auditorio, sala en silencio atento |
| Entrevista en la calle | Tráfico, pasos y voces lejanas, voz dominante |
| Podcast | Micro de estudio cercano y cálido, sin reverberación de sala, sin ruido de fondo |
| Q&A | Voz cercana y cómoda con el eco de la habitación, sin música |

**Imagen para el contexto acústico.** Se puede adjuntar el **entorno aprobado** (sin la persona) como `--image_url` para que Seed extraiga lugar, materiales y atmósfera **[D]**. Es la opción por defecto **[H]**. Si se usa un clon de voz (`--audio_urls`), no se puede adjuntar imagen: manda el clon y el entorno se describe en texto.

## 5. La voz

- **Sin referencia:** se describe en `Voice (...)`: edad, sexo, país y acento (castellano peninsular), carácter y distancia al micro. Ejemplo: `Voice (Lucía): mujer de unos 28 años, español de España, acento castellano, tono cercano y natural, a un brazo del micro`. Cuanto más concreta la descripción, menos varía entre generaciones, pero **no hay garantía de que la voz se repita idéntica** **[ND]**.
- **Con referencia de audio (clon):** `--audio_urls` con hasta 3 clips autorizados, limpios y de una sola voz (hasta 30 s y 10 MB cada uno), y se citan como `@Audio1` en `Voice (@Audio1)` y en `[DIAL] @Audio1`. Exige **material autorizado**: nunca se clona una voz sin permiso del titular. Con clon se marca `Image_url no`.
- **Misma voz en varias tomas:** hay dos caminos, ambos **[?]**: (a) repetir exactamente la misma línea `Voice`, o (b) usar el primer audio aprobado, recortado a un clip limpio de hasta 30 s, como `--audio_urls` de las tomas siguientes. Se valida escuchando.
- **Voces de AILAB (ElevenLabs).** AILAB tiene flujos propios de diseño y clonado de voz (`voice-prepare`, ver la skill `ailab`). No se sabe si una voz creada así se puede usar dentro de Seed Audio **[ND]**; no se promete.
- **Varios hablantes** (podcast, Q&A, entrevista): el campo de voz de Seed es único; la vía documentada es `--audio_urls` con una referencia por persona. Sin referencias, las voces solo se diferencian por descripción y la identidad no es estable. Se avisa de este riesgo antes de empezar. Alternativa si importa mucho: ElevenLabs Text to Dialogue o un flujo multicapa (otro flujo, fuera de esta skill).

## 6. Idioma: castellano de España

La página oficial describe inglés y chino; el castellano peninsular **no está garantizado** y se trata como **experimental** hasta validarlo **[D]**. Por eso:

- Se repite `español de España` y el acento en los tres sitios.
- Se conservan tildes y eñes.
- Tras generar, se **escucha** (el usuario) y se **transcribe** (la skill) para comprobar que el texto dicho es el guion. Si el acento no es el buscado, se informa al usuario y se le ofrece probar de nuevo o pasar a otro motor.
- No se añade por defecto un aviso de idioma a cada respuesta; solo cuando el resultado falla o el usuario pregunta.

## 7. Límite de 2.048 caracteres y cómo contar

- Cuenta **todo**: brief, secciones, tags, diálogo, puntuación, espacios y saltos de línea. No cuenta `PROMPT:`, las vallas de código ni la línea de ajustes.
- Se guarda el contenido final en `Pruebas intermedias/audio/seed-prompt-vN.txt` (pasa a `Archivos para usar/Texto o prompts/` cuando el usuario aprueba el audio) y se mide con el script, desde la carpeta del proyecto:

```bash
python3 "$UGC_SKILL_DIR/scripts/contar_prompt.py" "Pruebas intermedias/audio/seed-prompt-v1.txt"
```

El script cuenta caracteres Unicode (no bytes) y, además, avisa de comillas no rectas, em dashes, tags prohibidos y secciones que faltan.

**Si no cabe**, por este orden **[D]**:

1. Conservar íntegros el guion literal, su orden y los datos imprescindibles.
2. Quitar redundancias y acortar brief, textura, entorno y paleta.
3. Fusionar beats compatibles y dejar solo instrucciones audibles.
4. **Nunca** truncar, omitir ni parafrasear el guion.
5. Si aun así no cabe, dividir por frases o límites semánticos en `PROMPT 1`, `PROMPT 2`... Cada uno es autónomo, conserva el orden, lleva su duración parcial y mide hasta 2.048.

Un guion dividido da **varios audios**. Hay que unirlos (`ffmpeg -f concat`) y medir el conjunto antes de fijar la duración del vídeo; la unión puede dejar una costura audible **[?]**. Antes de dividir, se le propone al usuario recortar el texto o partirlo en dos tomas de vídeo.

## 8. Duración: estimar, medir, ajustar

Seed Audio **no tiene parámetro de duración exacta**. La duración es un objetivo que hay que verificar **[D]**.

1. **Estimar** antes de generar: `palabras / 3` para el habla, más 0,3 a 0,6 s por pausa marcada, más 0,5 s de arranque y cierre **[?]**. Se redondea hacia arriba a un entero. Ese número va en el brief (`N-sec`) y en `[ETIQUETA]` (`duración exacta N.0s`). La estimación usada para autorizar créditos es independiente: comprobar el límite vigente con info y prepare; en el contrato auditado de este workflow se prepara conservadoramente con 60 s y se informa de reserva y consumo esperado por separado. No cambiar el texto del audio a 60 s por ese motivo.
2. **Generar** en `wav`: `--output_format wav`.
3. **Medir** el audio real (nunca fiarse del número pedido):

```bash
bash "$UGC_SKILL_DIR/scripts/medir_audio.sh" "Pruebas intermedias/audio/audio-bruto-v1.wav" | tee "Pruebas intermedias/audio/medicion-v1.txt"
```

   Da la duración real, la duración entera para el vídeo (hacia arriba) y las pausas (`silencedetect`).
4. **Transcribir** con tiempos por palabra para comprobar el guion y localizar frases (si `whisper` está instalado):

```bash
whisper "Pruebas intermedias/audio/audio-bruto-v1.wav" --language es --model small --word_timestamps True --output_format json --output_dir "Pruebas intermedias/audio/"
# whisper la deja como audio-bruto-v1.json: renómbrala a transcripcion-v1.json
```

   Si no hay `whisper`, se pide al usuario transcripción y tiempos aproximados. **Nunca se inventan tiempos.** El texto literal aprobado manda sobre una transcripción automática.
5. **Fijar la duración del vídeo** = duración real redondeada hacia arriba (entero, de 4 a 30). Con un audio de 9,40 s el vídeo es de 10 s.
6. **Igualar el audio al vídeo** añadiendo silencio al final (nunca recortando voz), para que el audio dure **exactamente** lo mismo que el vídeo:

```bash
bash "$UGC_SKILL_DIR/scripts/ajustar_audio.sh" "Pruebas intermedias/audio/audio-bruto-v1.wav" 10 "Pruebas intermedias/audio/audio-final-10s.wav"
```

   Si el audio supera 30 s o tiene menos de 4 s, se avisa y se decide con el usuario (partir en tomas, o añadir un cierre con conducta).
7. **Si la duración real se desvía mucho de la estimada**, no se recorta el guion: se informa y se propone regenerar (con el brief ajustado o `--speed`, de 0,95 a 1,05 como mucho **[H]**) o aceptar la duración real. Regenerar cuesta créditos: se pregunta.
8. **Al aprobar el usuario el audio** (punto de aprobación 2), se mueven a `Archivos para usar/` el audio final y su prompt; el audio bruto, la medición y la transcripción se quedan en `Pruebas intermedias/audio/`:

```bash
bash "$UGC_SKILL_DIR/scripts/promover.sh" "<proyecto>" audio/audio-final-10s.wav audio/seed-prompt-v1.txt
```

   Después se actualiza `registro.md` (ruta nueva y estado). Las versiones de audio no elegidas se quedan donde están, sin borrar.

## 9. Ajustes por defecto

| Ajuste | Valor | Por qué |
|---|---|---|
| `--output_format` | `wav` | Vídeo y posproducción **[D]** |
| `--speed` | `1` | Solo se toca para corregir ritmo, con cautela |
| `--volume`, `--pitch` | por defecto | No se muestran salvo petición del usuario |
| `--image_url` | entorno aprobado (en `Archivos para usar/`) | Contexto acústico; incompatible con clon **[H]** |
| `--audio_urls` | vacío | Salvo clon o misma voz entre tomas |
| `--estimated_duration_seconds` | 60 para la reserva conservadora del contrato auditado, salvo contrato actual diferente | No fija la duración real del audio ni autoriza un gasto superior al aprobado |

Salida al usuario: el prompt en un único bloque de código, y debajo una línea de ajustes (por ejemplo `Ajustes: wav · speed 1 · image_url entorno-v2.png · audio_urls vacío · estimación 10 s`). Nada más: ni notas ni alternativas ni cierre.

## 10. Ejecutar

Si no hay entorno aprobado separado, omite image_url y describe el lugar en texto. Nunca pases un archivo ausente. Si hay audio_urls, tampoco añadas image_url.

> **Modo solo prompts (sin la skill `ailab`):** salta los comandos `AILAB ...` de esta guía. En su lugar entrega, por cada pieza, el modelo recomendado, los ajustes, las referencias en orden, el prompt exacto y el nombre de archivo donde guardar el resultado (ver `SKILL.md`, sección "Si falta la skill `ailab`").

```bash
AILAB prepare seed-audio \
  --prompt "$(cat "Pruebas intermedias/audio/seed-prompt-v1.txt")" \
  --image_url "./Archivos para usar/entorno-v1.png" \
  --output_format wav --speed 1 --estimated_duration_seconds 60
# se enseña el coste del prepare; con la autorización vigente:
AILAB submit <manifest_id> --confirmed --output "Pruebas intermedias/audio/"
```

**Notas de uso real (probado el 09/10/2026):**

- **El servidor reserva el coste de 60 s aunque pidas menos.** Con `--estimated_duration_seconds 15` el manifiesto autoriza 10 cr, pero el servidor estima 38 y rechaza el envío antes de cobrar ("La estimacion de 38 creditos supera el maximo autorizado de 10"). `--max-credits` no sube ese máximo en `prepare`. Solución que funcionó: preparar con `--estimated_duration_seconds 60` (el manifiesto autoriza 38) y enviar. El **cargo real fue de 10 cr**, el de los 15 s. Se informa al usuario de las dos cifras (reserva y cargo real).
- Con el brief y `[ETIQUETA]` a `15.0s`, una locución de unas 51 palabras más una pausa de 1 s **salió en 15,000 s exactos**, con la frase final completa pero **sin cola de eco** (el audio acaba con sonido, no en silencio). En una segunda prueba a 17 s, con el mismo texto y ritmo "natural", volvió a salir en **17,000 s exactos**, con la frase final completa y la voz **pegada al final del archivo** (el script de medición de `refinar-prompt-ugc` da una cola de silencio de 0,0 s). Cuenta con que el audio acabe en la última palabra, sin cola de eco. Con dos muestras parece que el modelo ajusta la locución a la duración declarada en el brief y en `[ETIQUETA]`, pero se trata como **[?]**: se mide siempre. Si la duración declarada es justa para el texto, el modelo la comprime ("ritmo ágil"); con holgura (17 s para unas 51 palabras más 1 s de pausa) suena natural, pero en las dos pruebas el audio terminó pegado al final.
- Whisper transcribe las cifras como palabras ("siete", "diez"): al comparar con el guion se normalizan los números.
- En macOS no existe `timeout`; `whisper` con el modelo `small` tarda unos segundos en un audio de 15 s.

Es un **modelo caro** según el catálogo: se avisa antes de enviar, se registra en `registro.md` y se renombra el archivo a `audio-bruto-vN.wav` (los resultados se guardan por defecto en `~/Downloads/AILAB/`; `--output "Pruebas intermedias/audio/"` los lleva ya a su sitio).

## 11. Lista de comprobación

**Antes de generar**

1. Motor correcto: escena acústica integrada de hasta 2 min.
2. Prompt contado con el script, hasta 2.048.
3. Guion íntegro, en orden, literal (el aprobado en `Archivos para usar/Texto o prompts/guion.md`), entre comillas dobles rectas.
4. `[AESTHETIC]`, `[EXECUTION]` y `[ETIQUETA]` presentes.
5. `Voice` con edad, sexo, acento castellano, carácter y distancia; acento repetido en `Voice`, cada `[DIAL]` y `[ETIQUETA]`.
6. Voz dominante (`Mix`) y ambiente restringido.
7. Duración creativa en brief y `[ETIQUETA]`; duración de autorización de créditos según el contrato vigente, explicada por separado.
8. `--image_url` o `--audio_urls`, nunca los dos.
9. Sin música ni narrador, salvo que el usuario lo pida.
10. Sin promesas de stems, mezcla independiente ni sincronía por fotograma.

**Después de generar**

11. Duración real medida y duración entera de vídeo fijada.
12. Transcripción comparada con el guion: palabras, orden, nada añadido ni omitido.
13. Pausas medidas; anotadas para la fase 3.
14. El usuario escucha: voz, acento, ambiente, que la voz domine, que case con el lugar.

## 12. Errores típicos

- Pasar de 2.048 caracteres o contar una versión previa.
- Truncar o parafrasear el guion para que quepa.
- Guion fuera de comillas dobles rectas o con comillas latinas.
- Toda la línea de `[EXECUTION]` dentro de un solo tag.
- Timestamps en habla natural sin necesidad.
- `--image_url` y `--audio_urls` a la vez.
- Olvidar el acento en alguno de los tres sitios.
- Dejar el ambiente sin restringir y que tape la voz.
- Fiarse de la duración pedida en lugar de medir el archivo.
- Meter `Voz mindy`, `multilingual` o `voice` como flags de la CLI.
- Confundir los dos `@Audio1`: el del **prompt de Seed** (primera referencia de clon, si existe) y el del **prompt de vídeo** (el audio final de esta fase) son espacios distintos.
