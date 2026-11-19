# Flujo: crear, añadir y actualizar

Niveles de confianza: **[D]** documentado, **[C]** comprobado en `ejemplo-luis.md`, **[H]** decisión razonada, **[?]** hipótesis por validar.

`AILAB` en los comandos es `node <ruta real de ailab.mjs>`: se localiza como dice `ailab.md`, sección 1. Antes de cada modelo se ejecuta `info <modelo>`, que no gasta. Los parámetros que salgan ahí mandan sobre esta guía.

> **Modo solo prompts (sin `ailab`):** se saltan los comandos `AILAB ...`. Por cada pieza se entrega el modelo recomendado, los ajustes, las referencias en orden, el prompt exacto y el nombre de archivo para guardar el resultado en `backup/descartes/` mientras se revisa. Los pasos con `ffmpeg` (recorte, volumen, vídeo negro) sí se hacen.

## Carpeta del personaje

La carpeta se crea **en la ruta de trabajo** (la carpeta donde está trabajando el usuario) y se llama **como el personaje**, tal como lo escribe el usuario: `Luis/`, no `luis/` ni `personaje-1/`. Si no está claro cuál es la ruta de trabajo, se pregunta una vez.

Se lee a la vez por personas y por agentes, así que tiene **pocas carpetas, nombres que se explican solos y nada de ruido**: al entrar se ve lo que se usa, y lo demás está en `backup/`.

```text
<ruta de trabajo>/<Nombre>/
├── LEEME.md                                ficha + guía de uso. Lo primero que se lee
├── Video1_clip-<outfit>.mp4                clip de referencia, uno por outfit (opcional)
├── Escala_<objeto>.png                     hoja de escala, una por objeto (se usa en los dos modos)
├── hojas-y-voz/                            hojas y voz
│   ├── Image1_cara-3x3.png
│   ├── Image2_<outfit>_3paneles.png        una por outfit
│   ├── Video1_voz-pangrama_<T>s.mp4        vídeo negro con la voz (método 1)
│   └── Audio1_voz-pangrama_<T>s.wav        la voz final en WAV: referencia para clonarla en Seed Audio (método 2)
└── backup/                                 nunca se adjunta a un modelo de vídeo
    ├── registro.md                         cada generación, costes, medidas de la voz, tiempos de silencio, decisiones
    ├── fuentes/                            fotos de partida, foto del outfit y su recorte, fotos y hoja de producto,
    │                                       voz original
    ├── prompts/                            el prompt aprobado de cada pieza: prompt_<pieza>.txt
    └── descartes/                          lo que se está revisando y lo rechazado: <pieza>_vN[_motivo].*
```

Reglas de la carpeta:

1. **Raíz = lo que se adjunta por defecto.** Sin clip, la raíz solo tiene `LEEME.md`, `hojas-y-voz/` y `backup/` (y las hojas de escala, si hay objetos).
2. **El prefijo es el handle por defecto** (`Image1`, `Image2`, `Video1`): quien abre la carpeta ve cómo se cita cada archivo. En una escena con más materiales, manda el orden real de subida.
3. **Etiquetas en minúscula, con guiones, en castellano y legibles:** `outfit1-polo-blanco`, no `OUT1` ni `v2final`. El outfit lleva número y una etiqueta corta de lo que es.
4. **Nada aprobado se duplica.** Cada archivo está en un solo sitio. Si hace falta subir copias numeradas, se hacen en una carpeta temporal fuera del personaje.
5. **Todo lo generado empieza en `backup/descartes/`** como `<pieza>_vN.*`. Al aprobarlo se **mueve** a su sitio con su nombre final y su prompt pasa a `backup/prompts/`. Lo rechazado se queda en descartes con el motivo en el nombre (`outfit1-3paneles_v1_cara-mal.png`).
6. **La ficha es `LEEME.md`.** No hay `prompt.md` aparte. Los datos técnicos (medidas de la voz, tiempos de silencio, task_id, costes) van a `backup/registro.md`.
7. Si el usuario prefiere otra estructura, se usa la suya y se anota en `LEEME.md`, sección 1.

Variables de los comandos de esta guía:

```bash
P="<ruta de trabajo>/<Nombre>"; N="<Nombre>"
H="$P/hojas-y-voz"; F="$P/backup/fuentes"; R="$P/backup/prompts"; D="$P/backup/descartes"
```

## Fase 0. Brief y carpeta

1. Recoge nombre, origen (inventado o fotos), outfits, objetos, ruta de voz, idioma y acento.
2. Si parte de **fotos** de una persona real, pregunta una vez si ha dado permiso. Si no, no se sigue con esas fotos.
3. Crea la estructura:

```bash
mkdir -p "$H" "$F" "$R" "$D"
cp "<ruta de esta skill>/plantillas/LEEME-personaje.md" "$P/LEEME.md"
```

4. Copia las fotos a `backup/fuentes/` con nombres claros (`foto-cara.png`, `foto-outfit1.png`). Si vienen en WebP, conviértelas a PNG (`ffmpeg -i foto.webp foto-cara.png`).
5. Crea `backup/registro.md`:

| Fecha | Pieza | Modelo y ajustes | Referencias (en orden) | Prompt | task_id | Coste | Estado |
|---|---|---|---|---|---|---|---|

6. **Plan y coste antes del primer gasto:** piezas, modelo de cada una, número de generaciones y estimación de `info`. Seed Audio y Seedance 2.5 son **modelos caros**: se dice.

## Fase 1. Ficha

1. Rellena la sección 2 de `LEEME.md` ("Quién es") con lo que ha dado el usuario. Pregunta lo que falte, agrupado. Personalidad en 2 o 3 adjetivos; forma de actuar como conducta visible.
2. Lo que no se sepa se deja `(pendiente)`. No se inventa.
3. `estado: borrador` hasta la fase 8.
4. **Puerta:** ficha aprobada.

## Fase 2. Rostro

1. **Personaje inventado:** retrato base (`prompts-imagen.md`, sección 1), `t2i` a 3:4. **Puerta:** identidad aprobada. Se guarda en `backup/fuentes/retrato-base.png`.
2. **Parte de fotos:** se salta el retrato base. Las fotos son la fuente.
3. **Hoja 3x3** (sección 2): una o varias referencias del rostro. Cuantas más, con distintos ángulos y expresiones, mejor. Sale a `$D/cara-3x3_v1.png`.
4. Revisión (sección "Revisión de cada imagen"): identidad, marcas, expresión enfadada, sonrisa con dientes, fondo medido.
5. **Puerta.** Al aprobar: `mv "$D/cara-3x3_vN.png" "$H/Image1_cara-3x3.png"` y su prompt a `$R/prompt_cara-3x3.txt`.

## Fase 3. Cuerpo: una hoja de 3 paneles por outfit

1. Pide la **foto del outfit**, la **altura en cm**, la **complexión** y si tiene **marcas en el cuerpo**. Acuerda la etiqueta del outfit (`outfit1-polo-blanco`).
2. **Recorta la foto del outfit por debajo de la barbilla** y enseña el recorte (sección 3, "Antes de generar"). Es obligatorio si la foto muestra una cara **[C]**. Recorte en `$F/foto-<outfit>_sin-cara.png`.
3. Elige la variante A o B según el cuello de la prenda y rellena la plantilla compacta.
4. **Cuenta los caracteres:** máximo 5.000 **[D]**.
5. Genera con A = `Image1_cara-3x3.png`, B = foto recortada (y C = hoja de un accesorio del cuello para arriba, si lo hay). Sale a `$D/<outfit>-3paneles_vN.png`.
6. **Compara la cara con la 3x3 lado a lado.** Si cambia un rasgo (ojos, vello facial, anchura), no se aprueba: se propone regenerar ajustando `{{FACE_LOCK}}`, y el rasgo se apunta en "Rasgos que más se desvían".
7. **Puerta.** Al aprobar: `$H/Image2_<outfit>_3paneles.png` y `$R/prompt_<outfit>-3paneles.txt`.

Si una prenda sale genérica, reparación de prenda (sección 5) y se rehace la hoja.

## Fase 4. Objetos (si los hay)

Por cada objeto sostenido, puesto o cargado:

1. **Hoja de producto** (sección 6). Pide las fotos y el **tamaño en cm**. No se inventa. Aprobada va a `$F/producto_<objeto>.png`: no se adjunta en escenas, sirve para hacer y rehacer la de escala.
2. **Hoja de escala** (sección 7): A = hoja de 3 paneles, B = hoja de producto. La comparación con el cuerpo la propone la skill y la aprueba el usuario. Aprobada va a la **raíz**: `$P/Escala_<objeto>.png`, porque se usa en los dos modos.
3. **Puerta** en cada una. Ninguna escena con ese objeto se prepara sin su hoja de escala.

## Fase 5. Voz

1. Texto: el **pangrama** del idioma (`voz-pangrama.md`). Modo natural por defecto; rango emocional si el usuario lo quiere.
2. Ruta: **ElevenLabs v4 con etiquetas** por defecto (`voz-elevenlabs.md`) o **Seed Audio** (`voz-seed-audio.md`, sin nombres, `Voice (Man)` / `Voice (Woman)`).
3. Genera (o recoge el audio que traiga el usuario) y guarda el original en `$F/voz-pangrama-<modo>_original.<ext>`.
4. **Medidor:** mide LUFS y pico, sube con ganancia lineal hasta −24 LUFS sin pasar de −1 dBFS de pico, fija la duración a T segundos enteros y guarda el WAV a 48 kHz en `$H/Audio1_voz-pangrama_<T>s.wav`. Enseña los valores antes y después (`volumen-y-video-negro.md`).
5. Apunta las medidas y los tiempos de los silencios en `backup/registro.md`.
6. **Puerta:** el usuario lo escucha y lo aprueba. La skill no puede escuchar. Una voz no elegida va a `backup/descartes/`.

## Fase 6. Vídeo negro

1280 x 720, 24 fps, H.264 + AAC, `T` exactos (`volumen-y-video-negro.md`, sección 4). Se comprueba con `ffprobe` que imagen, audio y archivo dan `T.000000`. Va a `$H/Video1_voz-pangrama_<T>s.mp4`.

Con esto el personaje **ya se puede usar** en escenas (modo A), con los dos métodos de voz. La pista del método 2 se hace por escena, cuando ya hay prompt de vídeo (`seed-audio-en-video.md`), y se guarda en la carpeta de la escena, no en la del personaje.

## Fase 7. Clip de referencia (opcional)

Se pregunta: "¿Quieres el clip de referencia? No hace falta, pero puede mejorar los resultados. Es un vídeo de Seedance 2.5, que es un modelo caro."

Si dice que sí, se sigue `clip-referencia.md`: prompt, orden de subida, ajustes, generación (o la hace el usuario), revisión, **recorte a T exactos** y puerta. El clip aprobado va a la raíz: `$P/Video1_clip-<outfit>.mp4`. La versión sin recortar va a `backup/descartes/`.

## Fase 8. Cierre

1. Completa `LEEME.md` con `plantillas/LEEME-personaje.md` como guía (`usar-en-escena.md`, sección 2): árbol real de la carpeta, tablas de los modos y de las referencias, rasgos en inglés, los dos métodos de voz, duraciones e historial. Sin bloques de ningún modelo. Borra lo que no aplique. `estado: aprobado`.
2. Comprueba que cada ruta que cita `LEEME.md` existe, que la raíz y `hojas-y-voz/` solo tienen lo aprobado y que nada está duplicado.
3. Resume al usuario qué se creó, dónde está y qué queda pendiente, con el árbol de la carpeta.

## Añadir una pieza a un personaje que ya existe

Lee `LEEME.md` y `backup/registro.md` y salta a la fase de la pieza: outfit (fase 3), objeto (fase 4), voz (fases 5 y 6) o clip (fase 7). Mismas puertas y reglas de gasto. Al aprobar la pieza, **actualiza `LEEME.md`**: árbol, tablas, rasgos e historial.

## Actualizar la ficha

1. Pregunta qué cambia y por qué.
2. Edita la sección 2 de `LEEME.md`, añade una fila al historial y revisa las líneas que lo citan (rasgos en inglés, tablas de referencias).
3. Calcula qué queda desfasado con la tabla de `prompts-imagen.md`, sección 4.
4. Propón regenerar solo lo afectado, con su coste. **No se regenera nada sin el sí.** Lo sustituido va a `backup/descartes/`.
