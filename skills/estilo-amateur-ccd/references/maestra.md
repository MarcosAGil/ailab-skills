# Estilo amateur CCD de los 2000 (refinar prompt)

## Propósito

Coge un prompt de vídeo que ya existe y lo lleva a la dirección estética de Ailendra Labs: cámara orgánica y amateur de compacta digital CCD de los 2000, que bota, llega tarde y no es perfecta, con dirección total de cada persona en plano. No crea prompts de cero: refina, completa y corrige hasta el nivel de detalle máximo, y lo entrega en el formato de Seedance 2.5 listo para pegar en AILAB.

**Objetivo de calidad.** El prompt entregado debe ser el mejor posible dentro del estilo: sin ambigüedades que el modelo tenga que adivinar, sin contradicciones entre el texto, las referencias, la física y el reloj, y sin los errores de prompting que más se repiten (sección "Comprobaciones de calidad").

### Núcleo del estilo (no se toca)

Lo que define esta estética y no cambia con ninguna mejora de calidad, salvo validación expresa de la comunidad con generaciones reales:

- Compacta digital de principios de los 2000 en modo vídeo, con grano grueso, luz de cámara dura y constante, color CCD crudo y piel con poros.
- Cámara en mano de un operador con cuerpo y reflejos limitados: bote, deriva, horizonte torcido, correcciones tardías, nunca estabilizada ni quieta.
- La acción va por delante y la cámara llega tarde y aterriza mal. Movimientos simples a velocidad de mano, sin zoom ni whip ni efectos. Acercarse es andar.
- Eventos de lente (autofoco que busca, adaptación de exposición, flare) contados, con causa y en silencio.
- Dirección total de cada persona: mirada, manos, gestos anclados a palabras, oyentes activos, reacciones en escalera, extras con ruta de salida, microvida.
- Sonido del micro integrado de la compacta y corte seco en el final exacto, sin pose.

Las mejoras de la vuelta del 2026-10-28 tocan solo la **precisión del prompt** (ambigüedades, contradicciones, referencias, geometría, reloj, formato). Nunca el look, el movimiento ni la actuación.

## Cuándo usarla

- El usuario pasa un prompt de vídeo y pide refinarlo, "pasarlo a CCD", "estética 2000", "cámara amateur", "cámara orgánica", "que parezca grabado con una cámara vieja" o "déjalo al nivel de los ejemplos".
- El usuario pasa un prompt que ya está en esta estética y pide pulirlo, corregir un fallo visto en la generación o subir el nivel de detalle.
- Un prompt generado por el Video Prompter o por `seedance-25-ailendra-labs` tiene que salir con esta estética.

## Cuándo NO usarla

- No hay prompt de partida, solo una idea: primero se crea el prompt (Video Prompter o `seedance-25-ailendra-labs`) y después se refina aquí.
- Ediciones conservadoras de un vídeo existente (formato `[Edit Goal]`, sustitución de presentador o voz), extensiones y Person Swap / Object Swap de Genjutsu: tienen plantillas bloqueadas propias.
- Motion graphics, animación, producto en estudio sin cámara humana, o piezas que piden explícitamente cámara cinematográfica pulida.

## Inputs requeridos

- El prompt a refinar (obligatorio).
- La lista de assets adjuntos con su tipo y orden, si el prompt no la deja clara.
- Si hay audio exacto: la transcripción y, si es posible, los tiempos de cada frase. Si el usuario adjunta el archivo de audio, se mide y se transcribe en local (ver "MCPs y tools").
- Opcional: fallos vistos en generaciones anteriores del mismo prompt (se convierten en bloqueos reforzados).

## MCPs y tools necesarios

- Ninguno obligatorio.
- Si hay archivo de audio local: `ffprobe` para la duración, `ffmpeg -af silencedetect=noise=-35dB:d=0.15` para localizar pausas y `whisper <archivo> --model small --language es --word_timestamps True --output_format json` para la transcripción con tiempos por palabra. Whisper se equivoca con términos como "IA" (lo transcribe como "ella"): el texto literal manda sobre la transcripción automática.
- `Read`, solo si hace falta profundizar, sobre las bases del Video Prompter listadas en `related_assets`. La guía de Seedance 2.5 es la autoridad de formato.

---

## Principios rectores

1. **La acción va por delante de la cámara.** El sujeto no espera a la cámara. La cámara reacciona, llega tarde, aterriza mal y corrige. Esta es la firma de la estética.
2. **La cámara es una persona.** Quien filma tiene cuerpo, una mano, una altura, un ritmo de paso y reflejos limitados. Toda imperfección sale de ahí.
3. **Todo ocurre a la vez.** Acción, labios, reacción de cámara, props y comportamiento de la lente suceden en el mismo instante. Se escriben juntos, nunca como eventos en fila.
4. **Nada queda a interpretación.** Cada persona visible tiene, en cada stage: dónde mira, qué hacen sus manos, qué hace su cuerpo y qué no hace. Si el modelo tiene que adivinar algo, el prompt no está terminado.
5. **Todo tiene causa.** Cada movimiento de cámara, gesto, evento de lente o sonido tiene un disparador visible o audible.
6. **Refinar no es reinventar.** Se conservan historia, orden de acciones, diálogo literal, identidades, roles de las referencias y duración. Se añade dirección donde falta y se corrige lo que contradice la estética.
7. **El formato de Seedance 2.5 manda sobre la forma.** La estética decide qué se dice; la guía de Seedance 2.5 decide cómo se escribe. Un prompt con buena dirección pero con la sintaxis equivocada (diálogo entre comillas, idioma sin declarar) falla.

---

## Contrato de formato Seedance 2.5 (AILAB)

Modelo por defecto: **Seedance 2.5 en AILAB**. Si el usuario indica otro modelo, la dirección estética se mantiene pero la estructura y la sintaxis siguen la guía de ese modelo en la carpeta del Video Prompter.

### Familia y estructura

- La tarea típica de esta skill es **multi-referencia con stages**: fichas de personaje, localización o primer frame, a veces audio, y dos o más cambios de estado. Si es una sola acción corta sin referencias, es la familia **simple**, con la misma sintaxis y sin stages.
- Encabezados en corchetes, en este orden: `[Generation Goal]`, `[Characters]`, `[Props]`, `[Scene]`, `[Audio Reference]`, `[Visual Style]`, `[Camera]`, `[Stage N]`, `[Maintain Consistency]` y `[Audio]` (este último solo si el audio se genera). Se omiten los que no aplican.
- Cada `[Stage N]` tiene **un único evento principal** con `Initial state:` (solo el primero), `Continue from the previous stage:` (los siguientes), `Primary event:` y `End state:`. El estado final de un stage es el inicial del siguiente.

### Delimitadores obligatorios

| Contenido | Sintaxis | Ejemplo |
|---|---|---|
| Diálogo | `{ }` | `{Nadie te cuenta}` |
| Efectos de sonido y ambiente | `< >` | `<Bare feet pad softly on terracotta tiles>` |
| Música | `( )` | `(Soft piano plays in the background)` |
| Subtítulos | `【 】` | `【Capítulo uno】` |

- Una frase completa y audible dentro de cada delimitador. No se mezclan categorías dentro del mismo delimitador.
- **Nunca se escribe diálogo entre comillas normales.** Tampoco se citan entre comillas palabras sueltas del diálogo para anclar gestos: el modelo puede leerlas como texto hablado.
- Los nombres de personajes y props **no** van entre `< >` (se reservan para sonido). Se escriben en texto plano: `Clara corresponds to @Image3.`
- Esta estética no lleva música ni subtítulos salvo que el input los pida o la música exista en el audio exacto. En ese caso: `(...)` para describirla y sincronizar. Si no: `No music. No subtitles.` en `[Maintain Consistency]`.

### Diálogo

1. **Idioma declarado antes de la primera línea de cada hablante**, con variedad regional, forma de decirlo y hablante:
   `Dialogue language: Spanish (Spain). Clara says in soft, natural Castilian Spanish, quiet and faintly amused: {Nadie te cuenta}`
   Si el diálogo está en español y no se especifica variedad, se declara castellano de España. Si se conoce una variedad (andaluz, canario, rioplatense...), se declara con el hablante.
2. **Fragmentos siguientes del mismo hablante:** `Clara continues in the same Castilian Spanish: {...}`. Si no hay pausa entre fragmentos: `Clara continues without a pause: {...}`.
3. **Fragmentar por pausas naturales.** Con audio exacto, los fragmentos siguen las pausas medidas en el audio. Un fragmento es una frase o un sintagma audible, nunca una palabra suelta salvo que sea toda la intervención.
4. **Cada fragmento aparece una sola vez en todo el prompt**, dentro del stage donde se dice. No se repite en `[Audio Reference]`, `[Maintain Consistency]` ni `[Audio]`: ahí se referencia ("the braced lines in the stages, each spoken exactly once, in order").
5. **Texto literal.** Lo que va entre llaves se copia exacto del input: ortografía, tildes, abreviaturas ("IA", "na' más", "preparao"). Con audio exacto, debe coincidir con lo que se oye.
6. **Quien no habla:** `The woman in the lilac shirt never speaks.` En `[Maintain Consistency]`: `Clara's lips move only on her braced lines; Daniel's only on his. Nobody else speaks.`
7. **Con audio exacto, las llaves no crean una interpretación nueva:** `The braced lines below are the exact words already in @Audio1; they assign speaker and timing, not a new performance.`

### Anclajes a palabras

- El gesto o el movimiento de cámara ligado a un fragmento se escribe **inmediatamente después** de ese fragmento, refiriéndose a él sin repetirlo:
  - `On this phrase, ...`
  - `On the last word of this phrase, ...` / `On its last two words, ...`
  - `As she begins this phrase, ...`
  - `Right after this phrase, ...`
- Si un gesto tiene que caer en una palabra en mitad de la frase, hay dos opciones: partir la frase en dos fragmentos consecutivos (`continues without a pause`) o referirse a la posición de la palabra (`the stress lands on the second word`). Nunca se cita la palabra entre comillas.

### Referencias y parámetros

- Handles compactos: `@Image1`, `@Video1`, `@Audio1`. Una línea por material, con alias vinculado en la misma línea: `Clara corresponds to @Image3. Use only ... Do not use ...`
- Cierre de `[Characters]`: `Do not interchange their appearances, clothing, actions, positions or dialogue.`
- Fuera del bloque: `📐 Aspect ratio: ... | ⏱ Duration: Ns`. Duración entera entre 4 y 30 s. Sin resolución ni fps.
- **Primer frame:** según la guía de Seedance 2.5, con primer frame el ratio lo fija esa imagen y no es configurable. La línea de parámetros indica el ratio de la imagen (`📐 Aspect ratio: 4:3, lo fija @Image1 como primer frame`). Si el input pedía otro ratio, se avisa en "Supuestos": para cambiarlo hay que preparar el primer frame en ese ratio.

---

## Procedimiento

### Paso 0. Diagnóstico del prompt de entrada

Extrae en silencio este inventario:

- Duración, ratio y si hay primer frame.
- Assets: tipo, orden y rol de cada uno.
- Audio: exacto, guía libre o ninguno. Si es exacto, qué contiene (solo lo que el input o el usuario digan, más lo que se mida en el archivo).
- Personas: principal, secundarios, extras de fondo y quién filma.
- Diálogo: cada línea literal, su hablante, su idioma y su variedad.
- Props y localización.
- Acciones en orden.
- Movimientos de cámara pedidos.

Después marca cuatro listas:

- **Huecos:** todo lo que el modelo tendría que adivinar (quién filma, dónde mira cada uno, qué hace el que no habla, qué mano sostiene cada cosa, cómo aterriza cada movimiento, qué fragmento dispara cada gesto, cuántos eventos de lente, cómo suena, cómo acaba).
- **Contradicciones con la estética:** gimbal, dolly, dron, órbita, slider, zoom, slow motion, speed ramp, grade cinematográfico, bokeh de retrato, música, SFX de diseño, piel perfecta.
- **Errores de formato Seedance 2.5:** diálogo entre comillas, idioma sin declarar, hablante sin asignar, SFX agrupados al final, handles con espacios, alias sin `@`, timestamps fuera de la rejilla, ratio que choca con el primer frame.
- **Contaminación:** restos de iteraciones ("than before", "again", "same as before"), números de escena, @tags o personajes que no aparecen, nombres de archivo.
- **Contradicciones internas:** timeline que no encaja con el audio real, movimientos de cámara imposibles ("tracks backward" mientras el sujeto se aleja), acciones que contradicen el primer frame.
- **Errores de calidad (Q):** se pasan las comprobaciones Q1 a Q20 (sección "Comprobaciones de calidad") contra el input y contra cada referencia. Con un borrador del Video Prompter o de otro agente (lo habitual), primero Q11 (mirada), Q15 (vocabulario que contradice lo que el movimiento "no es"), Q17 (elementos y sonidos inventados), Q19 (formato) y Q20 (la palabra "cut"), y se compara el borrador con la idea original del usuario: lo que el borrador añadió y la idea no pidió se marca.
- **Ambigüedad y absolutos:** se pasa el detector de lenguaje ambiguo de `refinar-prompt` (adjetivos sin conducta, verbos sin trayecto, alternativas, rangos, cuantificadores vagos, velocidad sin duración, modales, referencias implícitas, restos de iteración) y cada absoluto ("only", "never", "always", "exactly", "whole") se comprueba contra el resto del prompt (Q14).

Antes de escribir, una **prueba de física y reloj**, en silencio: distancias con zancadas de 1,3 a 1,5 m (Q9); cobertura de la cámara, o sea qué puede mantener en cuadro el operador desde donde está y a la velocidad a la que se mueve el sujeto (Q8); lados desde la cámara (Q10); tiempo de cada stage con la tabla de tiempos de `refinar-prompt` (Q12, Paso 2); y qué sonidos llegarían de verdad al micro de la compacta a esa distancia (Q17). Si algo no cuadra, se corrige con lo mínimo y se lista en "Supuestos".

**Preguntar solo si:** hay audio exacto sin transcripción ni archivo que se pueda medir, o hay audio exacto con varias personas y no se sabe quién dice cada línea. Todo lo demás se decide y, si es material, se lista en "Supuestos" al entregar.

### Paso 1. Referencias

- Convierte cualquier sintaxis a handles compactos: `@[Image 1](image_1)` → `@Image1`; `<<<image_1>>>` → `@Image1`; "first image", "provided video", nombres de archivo, rutas o URLs → handle canónico. Se numeran por tipo real de adjunto y por orden dentro de ese tipo.
- Los elements con UUID (`<<<79c14282-...>>>`) se sustituyen por un nombre vinculado a las imágenes que lo definen: `Hugo corresponds to @Image2, @Image3 and @Image4. His wardrobe comes from @Image5.`
- Una línea por material con qué usa y qué no usa.
- Varias vistas de la misma persona: `All views in @Image2 are the same single man.`
- Fichas de personaje: `Do not use the grey studio background or the sheet layout.`
- **Primer frame frente a localización:**
  - Primer frame, en `[Scene]`: `[Location] references @ImageN, which is also the exact first frame. Begin directly from this exact visual state.`
  - Solo localización o estética: `Do not use @ImageN as a first frame.`
- Si la imagen de localización ya tiene el look CCD: `Preserve the raw consumer-camera image character of @ImageN.`
- Props con pantalla (móviles, portátiles): se define solo la carcasa; `Its reference display is never used.`
- Audio: se declara siempre si es exacto o guía libre (Paso 10). Vídeo negro que solo aporta audio: `@Video1 is a blank black video carrying only the audio track. Use ONLY its audio. Ignore its black visual content entirely.`
- Todo asset adjunto aparece en el prompt. Si uno no debe intervenir, se dice que se ignore.
- Si el orden de los adjuntos en el chat no coincide con el mapping del prompt de entrada, se mantiene el del prompt y se avisa en "Supuestos".
- **Estado de cada imagen frente al arco (Q1).** Se abre cada imagen y se comprueba que su estado (pose, vacío, personas, props, texto, lo que falta) encaja con lo que el texto cuenta. Si no, se escribe qué se toma y qué no (`@ImageN defines only [...]. Do not use [pose, estado, personas]`) y lo que falta se declara como `the only addition` en `[Scene]`. Si lo que falta es protagonista, se avisa en "Supuestos" y se recomienda editar la imagen antes de generar.
- **Jerarquía entre primer frame y ficha (Q6).** Si el primer frame y la ficha difieren en un detalle visible (ropa, mano, cruz o logotipo en la espalda), se dice quién manda: el primer frame en el estado de 0.00 y la ficha en todo lo que el frame no muestra.
- **Ficha con paneles sin cabeza o con zonas borrosas (Q5).** Se usa el cuerpo de unos paneles con la cabeza o el yelmo de otros y se excluye la zona difuminada: `Do not use the blurred areas.` Todas las vistas son un único diseño.
- **Modo del modelo (Q2).** Con primer frame más fichas, localización o audio, se comprueba que el modelo y su modo admiten ese conjunto (`ailab info <modelo>`, solo lectura). En Seedance 2.5 Lite, `i2v` y `ref` no se combinan: se entrega la versión principal (`ref`, con el primer frame declarado en texto, que puede no coincidir al píxel) y una variante `i2v` con el vestuario descrito en texto, y se dice en "Supuestos".
- **Texto y símbolos en una imagen (Q4, Q18).** Carteles, pantallas, matrículas, etiquetas y cuadrículas se declaran (`text stays as in @ImageN`, `tiny, unreadable`) o se excluyen. Una negativa del prompt nunca puede chocar con lo que la imagen contiene (`no text` con carteles visibles).

### Paso 2. Duración, stages y rejilla temporal

- La duración total es un número entero de segundos entre 4 y 30. Si el audio exacto dura, por ejemplo, 8,06 s, se elige 8 s.
- Con dos o más cambios de estado se usan stages. Cada stage tiene un evento principal.
- **Rango temporal en el stage** (`[Stage 2 | 3.50-5.50s]`, con guion simple como en la guía de Seedance 2.5) solo cuando la sincronía importa: audio exacto con tiempos conocidos, entradas o salidas críticas, un movimiento de cámara clave. Sin sincronía crítica, stages sin tiempos y como mucho 1 a 3 beats con timestamp.
- Todo timestamp escrito cae en `.00` o `.50`. Cada rango dura como mínimo 1,00 s. Los rangos son consecutivos, sin huecos ni solapes, y el último termina exactamente en la duración total.
- **Los eventos finos no llevan timestamp propio.** Van dentro del stage, anclados a un fragmento de diálogo (ver "Anclajes a palabras"), a una acción (`As she turns back`, `As she crosses the threshold`), a un aterrizaje (`The instant the camera lands`) o a un evento del audio (`At the exact lighter click in @Audio1`).
- Las duraciones descriptivas sí se permiten porque no son límites de la timeline: `about half a second`, `for about a second`.
- Si el input trae momentos finos (0.4 s, 5.20 s, 10.63 s), se fusionan en stages de la rejilla conservando el orden de todos los eventos.
- **Con audio exacto:** primero se miden sus pausas y la posición de cada frase (Inputs requeridos). Los límites de los stages se colocan en las pausas reales, redondeados a `.00` o `.50`. Si el timeline del input no coincide con el audio, manda el audio y se avisa en "Supuestos".
- **Con audio exacto sin tiempos ni archivo:** stages sin tiempos y final anclado: `Hard cut exactly with the end of @Audio1.`
- **Ocupación por stage (Q12).** Se calcula como en `refinar-prompt` (Eje 7): tiempo que necesitan sus acciones / duración del stage. Correcto entre 0,7 y 1,0; aceptable entre 0,5 y 0,7 si cada pausa tiene conducta; por encima de 1,0 es RÁPIDO (el modelo acelera u omite acciones) y por debajo de 0,5 es LENTO (rellena o ralentiza). Reglas de esta estética:
  - Lo que ocurre a la vez cuenta una vez (acción, labios, microvida y comportamiento de la lente).
  - El autofoco que busca y la adaptación de exposición son concurrentes: no suman.
  - El aterrizaje imperfecto de la cámara y la corrección de recuperación (0,5 a 1,0 s) suman si ocurren después de la acción.
  - Una frase hablada ocupa 2,5 a 3,5 palabras por segundo en castellano (2,5 a 3,0 en inglés). Dos frases largas más un movimiento de cámara con aterrizaje rara vez caben en menos de 4 s.
  - Con audio exacto manda la medición.
  - Si un stage pasa de 1,0, se alarga quitando tiempo a otro, se quita una acción o se divide. Se decide y se lista en "Supuestos". Si lo que cambia es la duración total o el diálogo, se enseña la línea y se pide OK (ver Casos edge).

### Paso 3. Estética: compacta CCD de los 2000

El aparato es siempre una **compacta digital point-and-shoot de principios de los 2000 grabando en modo vídeo**. Nunca un móvil moderno, salvo que un móvil aparezca como prop dentro de la escena.

Bloque base para `[Visual Style]` (adaptar a la localización, no pegar a ciegas):

```text
The whole clip is recorded on an early-2000s compact digital point-and-shoot camera in its video mode: candid, amateur, unpolished, a clip straight off an old camera's memory card. Raw CCD colour, slightly imperfect white balance, modest dynamic range, mild highlight clipping and slightly milky highlights, deep textured shadows, soft digital texture. Strong, coarse, visible digital grain across the whole frame at all times, heavier in the shadows and darker areas, still clearly present in bright areas. A hard near-axis on-camera light is on continuously for the whole take, first frame to last, never firing and never changing: whatever it reaches (white surfaces, pale fabric, skin) runs slightly hot with slightly blown highlights; whatever it does not reach stays darker. Skin is never smooth: visible pores, fine texture, small unevenness, tiny marks and a natural sheen where the on-camera light hits. No smoothing, no retouching, no waxy or plastic skin, no beauty filter. This is the single most important thing about how people look. No colour grade, no cinematic look.
```

Reglas de adaptación:

- **Interior en sombra:** la luz de cámara domina y quema un poco lo que alcanza.
- **Exterior de día:** `Daylight is far brighter than it, so the same constant light reads as weak fill.` Fondo `slightly hazy and milky`.
- **Profundidad de campo:** una compacta tiene sensor pequeño y mucha profundidad de campo. No se pide bokeh cremoso de retrato ni poca profundidad cinematográfica. El desenfoque solo aparece por AF hunts, por objetos muy cerca de la lente o por fondos muy lejanos (`small and completely out of focus`).
- **Perspectiva:** `mild wide consumer-camera perspective`. Sin grados de FOV, sin milímetros, sin marcas de lentes, sin "anamorphic".
- Se eliminan del input: grade, look de película, LUTs, "cinematic", "film grain" como textura de cine (se sustituye por grano digital del sensor).

### Paso 4. Operador

Se decide siempre quién filma. Nunca queda implícito. Va en `[Camera]`.

**Por defecto, operador anónimo:**

```text
The camera is a viewpoint only, held in one hand at chest height by an ordinary amateur who is [walking / standing]. The operator is never seen and never speaks. The operator does not have the reflexes to keep the subject centred: the camera reacts rather than anticipates, always a beat behind the action.
```

**Operador que es un personaje de la escena** (si el input lo pide o la historia lo necesita, como Lucía en el ejemplo B):

- Se nombra y se vincula a su referencia: `[Name], who corresponds to @ImageN, is the sole camera operator throughout. There is no separate operator.`
- Durante la cobertura normal es invisible, detrás del punto de vista.
- Solo aparece con un giro motivado hacia sí mismo (por ejemplo, cuando dicen su nombre), con distancia en cm, ángulo, perspectiva, una sola expresión y sin pausa (Paso 8).
- `The recording device itself is never seen.`

**Vocabulario de la imperfección** (se eligen de 5 a 8 según el operador):

step-driven bounce, lateral sway, breathing drift, wrist drift, small unplanned canted tilts, horizon error (never level for long), a faint body/strap rattle, tiny accidental de-framing, loose headroom, slightly late micro-corrections, settles imperfectly.

Cierre obligatorio: `Never polished, never stabilised, never pre-planned. The frame is never still at any point.`

**La intensidad depende del cuerpo del operador:**

| Estado del operador | Cómo se mueve la imagen |
|---|---|
| Camina deprisa | El momento más fuerte: bote de paso marcado, la perspectiva cambia rápido |
| Camina normal | Bote de paso, caídas, correcciones constantes |
| De pie | Deriva de respiración y de muñeca, microcorrecciones |
| Se para tras caminar | El bote se apaga en dos pequeñas oscilaciones y queda la deriva normal |

Siempre se escribe la transición: `As the camera reaches him, the stronger walking shake naturally reduces into ordinary handheld drift.`

### Paso 5. Mapa de cámara

Cada movimiento de cámara del clip se escribe con cinco piezas:

1. **Disparador:** un fragmento de diálogo, un nombre, un giro de mirada del personaje, un desplazamiento del sujeto, un sonido, una intrusión en el borde del encuadre o el final de un gesto.
2. **Arranque tardío:** `begins fractionally late`, `a beat too late`, `The camera pans after her a beat too late` (en prompts nuevos, "pans" y no "swings": el punto 5 declara que el movimiento "no es" un swing, y el texto no puede contradecirlo; los ejemplos validados B y D conservan su redacción original).
3. **Trayecto:** siempre `plain` y a velocidad de mano (`a plain reactive pan right`, `a small handheld tilt`, `a plain hand movement at ordinary hand speed`), con el temblor continuando durante el movimiento.
4. **Aterrizaje imperfecto:** el sujeto queda cortado por el borde (`clips the edge, half her face and shoulder cut off`), descentrado, con headroom suelto, o la cámara lo encuentra ya haciendo otra cosa (`finds him already walking, forcing a visible catch-up correction`).
5. **Lo que NO es:** `not a whip, not a swing, not sped up, no smear, no snap, no sound attached to the movement`.

Si el movimiento está sincronizado con un fragmento de diálogo, se escribe dentro del `Primary event`, justo después del fragmento. Si no, en la línea `Camera:` del stage.

Patrones clave:

- **Primero mira el personaje, luego llega la cámara.** El giro de ojos y cabeza hacia alguien fuera de campo va antes del paneo.
- **Si la frase de quien entra es muy corta** (menos de un segundo), la cámara no puede reaccionar a su voz y llegar a tiempo. El disparador tiene que ser físico y anterior: su hombro o su cabeza entrando por el borde, fuera de foco.
- **Acercarse es andar, nunca zoom:** `It resembles a fast push-in but is entirely physical movement, NEVER a zoom. The subject grows larger because distance closes physically.`
- **Seguir es ir detrás:** `It follows behind and slightly to one side with restrained walking bounce.`
- **Mantener una reacción visible:** `one small lateral adjustment around [A] to keep [B]'s reaction visible.`
- **Tilt o paneo corto que vuelve:** `a small tilt toward [X] and straight back; she stays in frame throughout; no hold on [X].`
- **Cruzar un umbral:** `The operator follows her out through the doorway and ends one step outside.`
- **No abandonar al sujeto** antes de un punto definido: `The camera never leaves her before she is outside.`
- **Cobertura (Q8).** Antes de prometer que la cámara mantiene algo en cuadro, se comprueba que el operador puede hacerlo desde donde está: distancia y ángulo respecto al sujeto, obstáculos entre ambos (puertas, columnas, el pilar de un coche), velocidad del sujeto frente a la del operador (caminando, unos 1,3 m por segundo: a esa velocidad los dos se mueven a la par y el "llegar tarde" se mide en fracciones de segundo, no en metros) y qué entra por delante que cambie la luz (una sombra, un umbral, un túnel). Lo que el aparato no puede filmar desde esa posición no se promete: se cierra el movimiento antes, se cambia la ruta o se avisa en "Supuestos".
- **Encuadre de encuentros cercanos** siempre medido: distancia (cm o m), altura respecto a los ojos, ángulo, línea de corte del cuerpo, qué nunca entra en plano (`nothing below his collar is in frame`) y qué toca los bordes (`his hair presses toward the frame edge`).

Movimientos permitidos: paneo reactivo simple, tilt pequeño y vuelta, acercamiento andando, seguimiento andando, corrección de recuperación, ajuste lateral de un paso, cruce de umbral, giro hacia el operador (solo si es un personaje) y plano sostenido con deriva.

Movimientos prohibidos (se listan en `[Camera]` como `Not used anywhere:`): zoom óptico o digital, crash zoom, punch-in, whip pan como efecto, smear, snap, gimbal, estabilización, dolly, grúa, dron, órbita, arco, slider, dolly zoom, rack focus deliberado, slow motion, speed ramp, transiciones y cualquier sonido asociado al movimiento.

Planificación interna (no se escribe en el prompt): repartir los eventos por stage con un único pico de densidad y stages tranquilos alrededor.

### Paso 6. Eventos de lente

Son comportamientos de la compacta, no efectos. Cada uno lleva causa, duración y número. Se describen en la línea `In-lens:` del stage donde ocurren y se resumen una vez en `[Camera]` como presupuesto.

- **AF hunt-and-lock:** solo al aterrizar sobre un sujeto a otra distancia o cuando el sujeto vuelve a entrar en plano. `The autofocus hunts and catches her for about a second: a soft breathing of sharpness across her face and the door. Silent, in-lens only.` En los ejemplos validados, el máximo visto es 3 en 7 s.
- **Adaptación de exposición (AE):** es medición de la cámara, nunca un cambio de luz:
  `The camera's automatic exposure adapts: the highlights recover and hold detail, the contrast re-seats, the darker area sinks into shadow because the camera no longer meters for it. It reads unmistakably as the camera metering, never as a light dimming, a lamp going down, a fade or the world getting darker. It is a slow gradual roll across many frames, never a jump or a snap, and completely silent.`
- **Competencia de foco:** un objeto en primer plano cerca de la lente le disputa el foco a una cara y `focus breathes softly back to [X]'s eyes`.
- **Flare:** como máximo uno, al girar hacia un sol bajo o una fuente muy brillante. `a soft milky wash and a faint bloom in one corner, small and unforced; it does not fill the frame and passes off as the frame settles.`
- Presupuesto en `[Camera]`: `In-lens budget: exactly [N] autofocus hunts ([on whom]), [N] automatic-exposure adaptations and [N] subtle flare, each silent and described in its stage. Nothing else.`
- **El presupuesto cuadra con los stages (Q13).** El número de autofocos, adaptaciones de exposición y destellos que se describen en los stages es exactamente el del presupuesto. Cada evento tiene su causa visible: un autofoco que busca solo si cambia la distancia del sujeto o si este vuelve a entrar en plano, una adaptación de exposición solo con un cambio de luz medida, un flare solo con una fuente fuerte. Un evento sin causa sobra; un evento descrito que no está en el presupuesto, o al revés, es una contradicción.
- Cuando hay AE, en `[Maintain Consistency]`: `★ NO LIGHT IN THIS SCENE EVER CHANGES. ★ No light source brightens, dims, changes, switches on or switches off at any point. No flash firing, no flash pop, no white frame, no photograph being taken.`

### Paso 7. Personaje principal

Para cada persona que habla o conduce la acción:

1. **Arranca a mitad de acción:** `already mid-step`, `already mid-conversation`, `The take opens already moving`. Nunca hay arranque en frío. Si hay primer frame, se parte de la pose exacta de la imagen y desde ahí se mueve.
2. **Política con la lente**, declarada en su línea de `[Characters]`:
   - nunca: `never addresses the camera`;
   - casual: `her eyes come to the lens casually and slide off again; she never holds eye contact for long`;
   - directa: mira a la lente en un momento concreto y con una acción concreta.
3. **Plan de mirada por stage:** a quién o a qué mira, y los giros de ojos y cabeza que motivan la cámara. `Her eyes reach the lens a fraction before her head turns to follow.`
4. **Manos:** la mano con la que habla y la otra (`her right hand is her talking hand; her left hand hangs and swings naturally`). `The hands never swap roles.` Cada prop con su mano, en MAYÚSCULAS cuando es crítico (`RIGHT hand`, `LEFT hand`).
5. **Gestos anclados a fragmentos de diálogo.** Uno por fragmento clave, nunca uno por palabra. Cada gesto va justo después de su fragmento y lleva:
   - el anclaje: `On this phrase` / `On the last word of this phrase` / `As she begins this phrase`;
   - la mano;
   - la forma: orientación de la palma y configuración de los dedos;
   - el recorrido: de dónde a dónde y a qué altura;
   - el tamaño: `small, offhand, barely a gesture at all`;
   - el significado: `as if personally claiming that taste`, `she means exactly this, the world she is standing in`;
   - en qué se diferencia de los otros gestos: `lower and smaller than the sweep in Stage 1`;
   - la lectura errónea más probable, bloqueada: `She does NOT point with her index finger, does NOT jab, and does NOT bring the hand back toward herself.`
   Tras cada gesto, la mano se recupera de forma natural.
6. **Énfasis:** se transmite con una respiración, una mirada o las cejas, nunca frenando la frase. Para una palabra concreta: `the stress lands on the second word`.
7. **Pausas con contenido:** cada pausa del audio o del diálogo se llena con conducta (`her eyes slide off toward the sea and she takes a small breath through the nose`). Si no ocurre nada en la pausa, sobra.
8. **Microvida continua**, en la línea `Performance:`: parpadeo natural, pequeñas respiraciones, cejas y boca vivas entre palabras, un cambio de peso, pelo y ropa respondiendo al movimiento. `She is never completely still in any frame.` Entre 2 y 4 señales por cambio emocional; no se lista cada músculo.
9. **No actúa para la cámara:** `Her body keeps its own rhythm; the camera follows her, she does not adjust for it.` `No polished commercial acting.`
10. **Física:** todo movimiento tiene principio, desarrollo y final visibles. `She reaches the doorway by walking there and goes through it by walking through it. Nothing is already done, nothing appears mid-motion.`
11. **Dramaturgia (opcional, escenas con conflicto):** decide en silencio objetivo, obstáculo y táctica con la lógica de ActingLabs, pero en el prompt solo se escribe conducta visible. Nada de etiquetas emocionales sueltas sin una conducta que las muestre.

### Paso 8. Personajes secundarios

Nadie está de relleno. Toda persona visible tiene, en cada stage en que aparece, mirada, manos, cuerpo y lo que no hace (línea `Background:` o dentro del `Primary event` si es quien actúa). Se asigna a cada secundario uno de estos cinco papeles:

**1. Oyente activo** (Andrés, ejemplo A)
- `silent but active the entire time: listening, [business], nodding, tracking [speaker] with his eyes, reacting naturally`.
- Una tarea física con su ciclo completo y sus tiempos: `raises the cigarette in his right hand, takes a single natural drag while still listening, lowers the hand again, holds the smoke for about half a second, then exhales while continuing to listen and lightly nod`.
- Los pasos de la tarea caen sobre fragmentos de quien habla.
- Gestos de escucha con tamaño: `small receptive nods`, `a small understanding nod`.
- Bloqueo siempre: `Do not freeze [Name] while [Speaker] speaks.`

**2. Reacción en escalera** (Andrés, ejemplo B)
- Estados encadenados, nunca un salto: `remains guarded for a moment, then his eyebrows lift slightly, his attention sharpens and he leans subtly toward the phone`.
- El último peldaño enlaza con su línea o con un sonido del audio: `At the exact chuckle in @Audio1, he gives a small genuine incredulous laugh that flows directly into his line.`
- Dos verdades a la vez: `amused and genuinely curious but still carrying paternal authority`.

**3. El que ya está ahí** (Hugo, ejemplo C; Daniel, ejemplo D)
- `already in the frame the instant the camera lands`, `He does not arrive.`
- Encuadre medido (distancia, línea de corte, qué nunca entra).
- De dónde viene y adónde va: `comes from the right side of the terrace and goes after her to the left`.
- `pauses for a second in passing just to say something and then keeps going`, `no dead air, he speaks almost immediately`.
- Una expresión, un gesto pequeño como mucho, y la ropa respondiendo al entorno (`his collar and the loose tail of his tie move in the wind`).

**4. Operador que es un personaje** (Lucía, ejemplo B)
- Aparece solo con un disparador motivado (su nombre).
- `approximately 25 to 35 cm from lens, viewpoint slightly below her eye line and angled gently upward, mild wide consumer-camera perspective, imperfect centering`.
- AF sobre sus ojos.
- UNA sola expresión: `one tiny closed-mouth smile and ONE quick knowing wink directly into lens`.
- `No dialogue, no pose, no hold. As soon as the wink completes, the camera immediately turns away.`

**5. Extra de fondo** (la chica de lila, ejemplos C y D)
- Una sola acción con motivo: `turns her head to the left, as if someone off-frame has called her name` o `realises she is in the shot`.
- Momento y ruta de salida fijados: `walks to frame right along the parapet and disappears behind the tall stone column; by the end of this stage the terrace is empty; she does not come back`.
- Lo que nunca hace: `never speaks, never waves, never smiles at the camera`.
- Una respuesta al entorno mientras está en plano, si la hay (`her hair keeps moving in the wind`).

Además:
- **Vida de fondo dirigida:** `two or three seagulls drift across, small and completely out of focus`.
- **Grupos:** las reacciones van escalonadas, nunca a la vez ni iguales.
- **Recuento de personas siempre explícito** en `[Characters]`: `Exactly three visible people: ...`. El operador anónimo se declara aparte como nunca visible.

### Paso 9. Props y manos

- `[Props]`: cada prop con referencia, en su propia línea y con dueño: `The lighter corresponds to @Image6 and belongs only to Daniel. Exactly one.` Props sin referencia: descritos en una línea con dueño y cantidad.
- Ciclos de vida con flechas y reparto de manos, en `[Maintain Consistency]`:
  - `unlit cigarette removed → placed in mouth → ignited once → brief inhale → later held in LEFT hand`;
  - `hand enters → grips phone → phone emerges → settles in his right hand`;
  - `Final hand ownership: Daniel LEFT hand = lit cigarette + Andrés's RIGHT shoulder. Daniel RIGHT hand = iPhone.`
- El contacto y el cambio de estado también van inline en el stage donde ocurren (regla de Seedance 2.5: las restricciones críticas aparecen donde surge el riesgo).
- Detalles de verosimilitud: `The cigarette angles outward, away from Andrés.`
- Pantallas ocultas con frases cortas y rotundas: `Andrés can see the display. The recording camera cannot.`
- Los estados son irreversibles: lo encendido sigue encendido, lo roto no vuelve.
- Si no hay props: `Clara holds nothing in either hand at any point.`

### Paso 10. Sonido y voz

**Con audio exacto** (`[Audio Reference]`, contrato de pista exacta):

```text
@Audio1 is the sole authority for the exact [N]-second audio track: spoken dialogue, voices, accents, pauses, vocal delivery, [texture and ambience known from the input or measured]. Do not regenerate, rewrite, paraphrase, shorten, extend or replace the dialogue. Do not create a second voice, music, narration or new sound effects. The braced lines in the stages below are the exact words already in @Audio1; they assign speaker and timing, not a new performance. Synchronize lips, breathing, gestures and physical actions to the existing audio.
```

- Solo se describe lo que contiene el audio si el input, el usuario o la medición lo confirman. Nunca se inventa su contenido.
- Aun así, cada fragmento de diálogo va entre llaves en su stage, con idioma, variedad y hablante declarados: refuerza el idioma y el reparto de voces.
- Sonidos puntuales que existen en el audio: `< >` inline en el stage donde se ven sus causas, para sincronizar (`At the exact lighter click in @Audio1 ... <Lighter click>`). No se añaden sonidos que no estén en el audio.
- No hay sección `[Audio]`.

**Sin audio de referencia** (`[Audio]`, micro integrado de la compacta):

```text
Everything is the compact camera's built-in microphone as captured, raw and unprocessed: thin, a little boxy, light auto-gain pumping, handling noise, wind hitting the microphone directly in open air, no denoising, no polish. Nothing is heard that this camera would not have recorded. No music, no narrator, no designed sound. There are no sound effects on any camera movement, focus hunt or exposure change.
```

- Sonidos y ambiente `< >` inline en cada stage, junto a su causa visible, en la línea `Sound:`.
- La voz suena a su distancia real (`at room distance, never close-mic, never dry, never studio`). Se vuelve más apagada y con más sala cuando el hablante se gira, y más clara cuando vuelve la cara a la lente. Los secundarios se oyen con el mismo micro y al mismo nivel.
- Identidad vocal de cada hablante en `[Audio]`, sin repetir sus líneas: edad, acento, registro, tempo (`natural conversational speed, one flowing phrase per line, finishing a little early rather than late`), método de énfasis (`felt in a breath and a look, never as a slow-down`), imperfecciones (`audible small breaths, a little fry at the ends of phrases`) e intención de cada intervención.
- Se permite un detalle sonoro escondido: `<A door opens faintly somewhere else in the house>`.

### Paso 11. Final

- Corte seco exactamente al final, en el `End state` del último stage: `Hard cut exactly with the end of @Audio1` o `the clip cuts exactly at N.00s, the instant he starts moving, mid-step`.
- `No final pose, no hold, no fade, no black, no extra reaction.`
- La palabra `cut` tiene en esta estética dos usos validados: el punto de salida (`Hard cut exactly with the end of @Audio1`, `the only cut is the out-point at N.00s`) y el encuadre (`half her face and shoulder cut off`). No se usa en ningún otro sentido (`no cuts`, `cuts in`, `cut to`: Q20). Si una generación muestra un corte o un salto de plano en el cierre, se sustituye por `the footage stops exactly at N.00s, mid-motion`.
- Se cierra el prompt con una frase de intención, sin cifras nuevas: `The result feels like a genuinely captured early-digital moment: fast, intimate and always slightly ahead of the camera's ability to frame it perfectly.`

### Paso 12. Bloqueos y repetición

- Primero el estado deseado y después el "no X", en la misma línea o frase, en el stage donde surge el riesgo.
- `[Maintain Consistency]` recoge las reglas duras una sola vez. No se repite allí la lista completa de cámara ni el diálogo.
- **Repetición reforzada (hasta 3 menciones) solo para fallos conocidos de esta estética:**
  1. La adaptación de exposición se lee como un cambio de luz.
  2. Los movimientos de cámara llevan whoosh o sonido.
  3. Un acercamiento se convierte en zoom.
  4. Un gesto hacia fuera acaba señalando al propio cuerpo.
  5. El oyente se queda congelado.
  6. Se ve el aparato que graba o la pantalla de un móvil.
  7. La piel sale lisa o retocada.
  8. La cámara sale estabilizada o demasiado limpia.
  9. El diálogo sale en otro idioma, con otras palabras o repetido.
  10. Cualquier fallo que el usuario haya visto en una generación anterior de ese prompt.
- Los fallos críticos pueden marcarse con `★ ... ★` o MAYÚSCULAS, como mucho dos por prompt.

### Paso 13. Ensamblar y revisar

Rellena la plantilla de salida, pasa la verificación y haz antes de entregar una **lectura adversaria final**: se lee el prompt frase a frase como si el modelo solo tuviera esa frase, y se pregunta qué haría con ella. Tres pasadas:

1. **Estilo y lente:** el aparato es la compacta, ningún movimiento prohibido, presupuesto de lente igual a los eventos descritos (Q13), vocabulario coherente con lo que cada movimiento "no es" (Q15), `cut` solo en sus dos usos (Q20).
2. **Geometría y reloj:** cobertura de la cámara (Q8), distancias y zancadas (Q9), lados desde la cámara (Q10), ocupación de cada stage (Q12), absolutos sin contradicciones (Q14).
3. **Referencias y personas:** estado de cada imagen frente al arco (Q1), modo del modelo (Q2), jerarquía y exclusiones (Q4 a Q6), mirada con destino (Q11), personajes parecidos distinguidos (Q16), nada inventado (Q17), objetos con texto (Q18).

Un fallo en cualquiera se corrige antes de entregar.

---

## Comprobaciones de calidad (Q1 a Q20)

Se pasan siempre, en el Paso 0 y en la lectura adversaria del Paso 13. No miran el estilo (eso es el núcleo): miran que el prompt diga lo mismo que las referencias, que la física y que el reloj, y que no se contradiga. Son los errores de prompting que más se repitieron al generar con estas skills, en borradores del Video Prompter y en prompts propios (cuatro escenas de prueba, 2026-10-27 y 28). Son los mismos que el eje 11 de `estilo-espontaneo-viral`, aquí con su arreglo en esta estética. Cada comprobación que falla se arregla con lo mínimo y, si cambia algo material, se lista en "Supuestos".

**Referencias y modo del modelo**

| ID | Qué se busca | Por qué falla y cómo se arregla |
|---|---|---|
| Q1 | Referencia cuyo **estado** contradice el arco del texto: local sin el elemento que se usa, pose del primer frame que no admite la acción, mesa o props distintos, personas que no deberían estar | El modelo copia el estado de la imagen o mezcla las dos versiones. `defines only [...]. Do not use [...]`; lo que falta, como `the only addition`; si es protagonista, recomendar editar la imagen |
| Q2 | Modo del modelo incompatible con el conjunto de materiales (primer frame más fichas o audio en Lite: `i2v` y `ref` no se combinan) | Comprobar con `ailab info <modelo>`; versión principal más variante `i2v` con el vestuario en texto |
| Q3 | `Exactly as @ImageN` o `frame 0.00 is exactly @ImageN` mientras se excluye parte de la imagen | Contradicción. Se limita a lo que sí se toma (posición, altura, ángulo) |
| Q4 | Negativa que choca con lo que la imagen contiene (`no text` con carteles, `no phone` con móvil visible, `no other people` con extras en la imagen) | Se reescribe sobre lo que la imagen trae (`no other text than in @ImageN`) |
| Q5 | Ficha con paneles sin cabeza, cuello difuminado o rostros borrosos | Cuerpo de unos paneles con la cabeza de otros, zona borrosa excluida, todos son un único diseño |
| Q6 | Primer frame y ficha que difieren en un detalle visible (ropa, mano, cruz o logotipo en la espalda) | El modelo copia la ficha y pierde el detalle. Jerarquía dicha una vez: el primer frame manda en 0.00 y la ficha en lo que el frame no muestra |
| Q7 | Cambio de ratio respecto a la referencia o al prompt original, resuelto cambiando una palabra | La ventana recorta los lados. Se reescribe qué queda a cada lado y se avisa. Con primer frame manda la imagen |

**Cámara, geometría y ritmo**

| ID | Qué se busca | Por qué falla y cómo se arregla |
|---|---|---|
| Q8 | Cámara que promete mantener en cuadro algo que el operador no puede filmar desde su posición (vehículo, pilares, puertas, velocidad del sujeto frente a la del operador, luz que cambia por delante) | Prometer lo imposible produce un movimiento roto o un sujeto fuera de plano. Cobertura con números (Paso 5); se cierra el movimiento antes o se cambia la ruta |
| Q9 | Distancias o escalas que no cuadran con las acciones (`3 m` frente a `dos zancadas`) | Una cifra por distancia, escrita una vez, comprobada con zancadas de 1,3 a 1,5 m |
| Q10 | Lados sin sistema (`left` y `right` sin decir de quién; `his left` con dos hombres) | `frame-left` y `frame-right` desde la cámara; el lado de un personaje con su nombre |
| Q11 | `Faces the camera`, `toward the camera`, `eye contact` o `looks at` sin destino, sobre todo en secundarios y extras | Equivale a mirar a la lente. Política con la lente por persona (Paso 7) y destino de cada mirada |
| Q12 | Ocupación por stage fuera de 0,5 a 1,0, o diálogo que no cabe con sus gestos y la cámara | RÁPIDO o LENTO. Cálculo del Paso 2; se quita una acción, se reparte o se alarga |
| Q13 | Presupuesto de lente que no coincide con los eventos descritos, evento sin causa o AE sin bloqueo de luz | Contradicción interna. El número de eventos descritos es el del presupuesto; AE con su bloqueo de luz (Paso 6) |
| Q14 | Absolutos que chocan con el resto: `never still` frente a un plano sostenido sin deriva, `never addresses the camera` frente a un guiño a la lente (si es una excepción, se declara con su momento), `the only light` frente a luces visibles, `exactly N people` frente a extras | Se comprueba cada `only`, `never`, `always`, `exactly` y `whole` contra el resto del prompt |
| Q15 | Vocabulario que contradice lo que el movimiento "no es": `swings`, `whips`, `snaps`, `zooms` en la descripción de un movimiento que se declara simple | El modelo ejecuta la palabra, no la negación. Se usa `pans`, `drifts`, `turns`, `walks closer` |

**Personas y contenido**

| ID | Qué se busca | Por qué falla y cómo se arregla |
|---|---|---|
| Q16 | Personajes con el mismo vestuario o aspecto parecido (dos hombres, gemelos, uniformes), o pronombres sueltos con varias personas del mismo género | Se funden, se intercambian o aparece un tercero. Posiciones fijas, nombre del rol en cada frase, contacto limitado a lo pedido, `never swap`, recuento exacto |
| Q17 | Elementos, sonidos o reacciones que el input no trae (los añadió el agente), o sonidos imposibles por distancia o por cristal | Con audio exacto, nada nuevo. Sin él, solo sonido plausible para el micro de la compacta a esa distancia; el detalle sonoro escondido, uno como máximo y solo sin audio exacto |
| Q18 | Objetos pequeños con texto o símbolos (cartas, carteles, matrículas, etiquetas) y pantallas, sin regla de legibilidad, sitio ni cantidad | Se vuelven legibles al azar o se multiplican. `tiny, unreadable` o `text stays as in @ImageN`; las pantallas, como en el Paso 9 |
| Q19 | Formato: mapa de referencias antes del primer encabezado, stages sin `Initial state` o `End state`, efectos agrupados al final, nombres de personaje dentro de `< >`, diálogo entre comillas, guion largo en los rangos de tiempo | Se reconstruye en la plantilla sin preguntar. Rangos con guion simple |
| Q20 | La palabra `cut` fuera de sus dos usos validados (punto de salida y `cut off` de encuadre): `no cuts`, `cuts in`, `cut to` | El modelo la lee como un corte. Se sustituye (`moves into the gap`, `the footage stops exactly at N.00s`) |

---

## Plantilla de salida

El prompt va en inglés. El diálogo va en su idioma original, entre llaves. Las secciones que no aplican se omiten.

```text
[Generation Goal]
Create a [N]-second live-action [type of scene] in ONE continuous handheld take that looks like an early-2000s compact digital camera recording. [One-sentence story summary.] [@ImageN is the exact first frame.] [@Audio1 is the exact final soundtrack and absolute timing master.] Every visible action, lip movement, gesture, camera reaction and in-lens behaviour happens simultaneously in real time. The only cut is the out-point at [N].00s.

[Characters]
[Name] corresponds to @ImageN. Use only [face, hair, body, wardrobe]. Do not use [background, sheet layout]. [All views are the same single person.] [Talking hand; other hand.] [Lens policy.]
[Name] corresponds to @ImageN. ...
[Background person described from the first frame.] Never speaks.
Do not interchange their appearances, clothing, actions, positions or dialogue. Exactly [N] visible people: [...]. The person filming is never seen and never speaks.

[Props]
[Prop] corresponds to @ImageN and belongs only to [Name]. Use only [...]. Exactly one.

[Scene]
[Location] references @ImageN[, which is also the exact first frame]. [Layout, light, positions at frame 0.00.] [Begin directly from this exact visual state. / Do not use @ImageN as a first frame.]

[Audio Reference]
[Exact-track contract, Paso 10.]

[Visual Style]
[Compact CCD block adapted, Paso 3.]

[Camera]
[Operator, Paso 4: who, height, hand, walking or standing, reflex limit, 5 to 8 imperfection causes, intensity changes, never still.]
Every camera movement is a plain hand movement at ordinary hand speed with the shake continuing through it and no sound attached.
In-lens budget: [...]. Nothing else.
Not used anywhere: [forbidden moves and effects].

[Stage 1 | 0.00-X.X0s]
Initial state: [frame 0.00: positions, poses, gazes, hands of everyone visible.]
Primary event: [One main event. Action + dialogue fragments + gestures and camera moves anchored right after each fragment.]
Dialogue language: [Language (Variety)]. [Name] says in [variety/accent], [delivery]: {...} On this phrase, [gesture].
Performance: [micro-life, eyes, breath: 2 to 4 cues.]
Background: [each secondary: gaze, hands, body, what they do not do.]
Camera: [moves not tied to dialogue: trigger → late start → plain path → imperfect landing → settle.]
In-lens: [AF / AE / flare with cause and duration, silent.]
Sound: [< > only if generated audio or sounds known in @Audio1.]
End state: [observable state of everyone and everything.]

[Stage 2 | X.X0-Y.Y0s]
Continue from the previous stage: [what stays the same].
Primary event: ...
...
End state: ...

[Maintain Consistency]
[Duration and single take. First frame. Identities and counts. Dialogue: only the braced lines in the stages, each spoken exactly once, in order, in [language]; lips move only on the speaker's own lines; nobody else speaks. Skin. Grain. Handheld never still. Beginning-middle-end of every movement. Only plain camera moves. ★ Light never changes ★ (if AE). Device never seen. Close-encounter framing. Gesture locks. Secondaries' rules. Prop lifecycles and hand ownership. No music, no subtitles, no text. Ending.]

[Audio]
[Only without @Audio1: camera-mic block, spatial voice behaviour, voice identity per speaker without repeating lines.]

[Closing intent sentence.]
```

Fuera del bloque de código, en una línea:

`📐 Aspect ratio: [ratio] | ⏱ Duration: [N]s`

Con primer frame, el ratio es el de esa imagen (`📐 Aspect ratio: 4:3, lo fija @Image1 como primer frame`). Sin resolución ni fps. Si la duración la marca `@Audio1` y no se ha podido medir: `⏱ Duration: la de @Audio1, redondeada al segundo entero`.

---

## Casos edge

- **Sin personas** (producto, paisaje): se aplican estética, operador, mapa de cámara y lente. Los pasos 7 y 8 se sustituyen por física de objetos y manos del operador si entran en plano.
- **Sin diálogo:** `No talking. Mouths do not articulate.` La microvida y la mirada se mantienen.
- **Audio exacto sin transcripción ni archivo:** pedir al usuario la transcripción antes de entregar. Es de las pocas preguntas justificadas.
- **El timeline del input no encaja con el audio medido:** manda el audio; se reconstruyen los stages sobre las pausas reales y se avisa en "Supuestos".
- **Frase de un personaje de menos de un segundo:** la cámara necesita un disparador físico anterior (Paso 5).
- **El input pide cámara pulida, cinematográfica, slow motion o música:** se convierte a la estética y se indica en "Supuestos". Si el usuario insiste en mantenerlo, esta skill no es la adecuada.
- **Ratio pedido distinto al del primer frame:** se usa el de la imagen y se avisa (Contrato de formato).
- **Más de cuatro personas visibles:** los extras se agrupan por zonas con una acción motivada por grupo y reacciones escalonadas. El protagonista y quien habla mantienen dirección completa.
- **Clip de más de 15 s:** más stages y más de un pico de densidad, separados por stages tranquilos.
- **Otro modelo distinto de Seedance 2.5:** se conserva la dirección y se aplica la plantilla y la sintaxis de la guía de ese modelo. Se indica en "Supuestos".
- **Operador sin género ni identidad conocidos:** "the operator" o "an ordinary amateur". Si el input dice "a man", se respeta.
- **Referencia cuyo estado contradice el arco** (local sin el elemento que se usa, pose que no admite la acción, mesa o props distintos): Q1. Se toma solo lo que sirve, se excluye el estado, lo que falta se declara como único añadido y, si es protagonista, se recomienda editar la imagen antes.
- **Ficha con paneles sin cabeza o zonas borrosas:** Q5. Cuerpo de unos paneles con la cabeza de otros y la zona borrosa excluida.
- **Primer frame más otras referencias:** se comprueba el modo del modelo (Q2) con `ailab info <modelo>`. Si `i2v` y `ref` no se combinan, se entregan la versión principal y la variante, y se dice en "Supuestos".
- **Cámara dentro de un vehículo, o un sujeto más rápido que el operador:** Q8. La compacta va en las manos de quien filma, no montada. Se calcula la cobertura con números; lo que no se puede filmar con ese aparato desde esa posición (adelantar a un vehículo sin sacarlo del parabrisas, por ejemplo) no se promete: se entrega lo que sí cabe y se nombra la alternativa en "Supuestos".
- **Personajes con el mismo vestuario:** Q16. Posiciones fijas y nombre del rol en cada frase.
- **El input trae estética de móvil, UGC o cámara de otro tipo:** se convierte a la compacta CCD (el móvil solo existe como prop) y se indica en "Supuestos". Si el usuario quiere conservarlo, esta skill no es la adecuada: `estilo-espontaneo-viral` o `estilo-ugc`.
- **Cambio de ratio respecto a la referencia o al original:** Q7. Se reescribe el layout y se avisa.
- **Borrador de un agente que añadió cosas que la idea no pidió:** se comparan con la idea original (Q17) y se quitan, o se dejan y se listan en "Supuestos" si no cambian la historia.
- **El usuario reporta un fallo tras generar:** síntoma → causa mínima → se cambia una variable → se refuerza con repetición (Paso 12) → se conserva todo lo que funcionaba. Consultar primero la matriz de diagnóstico de la guía de Seedance 2.5.

## Output esperado

1. Un único bloque de código con el prompt refinado completo.
2. Una línea fuera del bloque: `📐 Aspect ratio: ... | ⏱ Duration: ...s`.
3. Solo si se ha decidido algo material que no estaba en el input: `Supuestos:` con un máximo de 5 viñetas cortas en castellano (mapping de referencias, tiempos del audio, quién filma, conversiones de estética o de formato, ratio).

Nada más: sin explicación, sin QA visible, sin traducción. Si el usuario pide explicación, comparación o diagnóstico, se responde en castellano.

## Verificación

Antes de entregar, todo debe ser "sí":

**Formato Seedance 2.5**
- ¿Encabezados en corchetes en el orden de la plantilla, y un evento principal por stage con estado inicial o de continuidad y estado final?
- ¿Todo el diálogo está entre `{ }` y ninguna línea ni palabra del diálogo va entre comillas normales?
- ¿Cada hablante tiene idioma, variedad, forma de decirlo y nombre declarados antes de su primera línea?
- ¿Cada fragmento aparece una sola vez, en su stage, con el texto literal del input?
- ¿Los gestos y movimientos anclados van justo después de su fragmento, sin repetir el texto?
- ¿SFX y ambiente en `< >` inline junto a su causa; música en `( )` solo si existe; subtítulos en `【 】` solo si se piden?
- ¿Ningún nombre de personaje o prop va entre `< >`?
- ¿Parámetros fuera del bloque, duración entera entre 4 y 30 s y ratio coherente con el primer frame?

**Referencias y tiempo**
- ¿Todos los handles son compactos, sin nombres de archivo, UUIDs ni "first image"?
- ¿Cada material tiene una línea con alias vinculado, qué usa y qué no usa?
- ¿Primer frame y localización están diferenciados?
- ¿Límites `.00/.50`, rangos de 1,00 s o más, consecutivos y cerrando en el total?
- ¿Con audio exacto, los stages caen en las pausas reales del audio?
- ¿Ningún evento fino lleva timestamp propio?

**Cámara**
- ¿Está definido quién filma, a qué altura, con qué mano, si camina y cuál es su límite?
- ¿Cada movimiento tiene disparador, arranque tardío, trayecto simple, aterrizaje imperfecto y lo que no es?
- ¿La intensidad del temblor cambia con el estado del operador?
- ¿Cero zooms, whips, estabilización, slow motion y sonidos de movimiento?
- ¿Los eventos de lente están contados, con causa, duración y "silent, in-lens"?
- ¿La AE está descrita como medición y hay un bloqueo de luz si hace falta?

**Estética**
- ¿El aparato es una compacta CCD de los 2000 y no queda ninguna referencia a móvil como cámara?
- ¿Piel con poros, grano más fuerte en sombras, luz de cámara constante que nunca dispara, sin grade?
- ¿Sin bokeh de retrato ni poca profundidad cinematográfica?

**Personas**
- ¿El principal arranca a mitad de acción o desde la pose exacta del primer frame?
- ¿Cada personaje tiene política con la lente y plan de mirada?
- ¿Mano con la que habla fijada y sin cambios?
- ¿Cada gesto tiene anclaje, forma, recorrido, tamaño, significado, diferencia con los demás y lectura errónea bloqueada?
- ¿Cada pausa tiene conducta dentro?
- ¿Cada secundario tiene uno de los cinco papeles y, en cada stage, mirada, manos, cuerpo y lo que no hace?
- ¿Nadie está congelado mientras otro habla?
- ¿Recuento exacto de personas?

**Calidad (Q1 a Q20)**
- ¿Estado de cada imagen comprobado contra el arco (Q1), jerarquía entre primer frame y ficha dicha (Q6) y modo del modelo comprobado si hay primer frame más otras referencias (Q2)?
- ¿Negativas sin contradecir lo que contienen las imágenes (Q4) y objetos con texto con su regla de legibilidad (Q18)?
- ¿Cobertura de cámara con números (Q8), distancias coherentes con las zancadas (Q9) y lados desde la cámara (Q10)?
- ¿Ocupación de cada stage entre 0,5 y 1,0, o justificada, con el diálogo medido (Q12)?
- ¿Presupuesto de lente igual a los eventos descritos y cada evento con su causa (Q13)?
- ¿Absolutos comprobados contra el resto del prompt (Q14) y vocabulario coherente con lo que cada movimiento "no es" (Q15)?
- ¿Mirada con destino en todos, también en secundarios y extras (Q11), y personajes parecidos distinguidos por posición y rol (Q16)?
- ¿Nada inventado por el agente (Q17), rangos de tiempo con guion simple (Q19) y `cut` solo en el punto de salida y en el encuadre (Q20)?

**Props, sonido y final**
- ¿Recuento de props, ciclos de vida, mano por stage y reparto final?
- ¿Audio exacto respetado sin inventar su contenido, o paleta de micro de cámara con voces a su distancia real?
- ¿Corte seco en el final exacto, sin pose, y frase de intención?
- ¿Sin restos de iteraciones anteriores, sin em dashes y con cifras que salen solo del input o de la medición?

## Mantenimiento

- **Cada vez que el usuario confirme que un prompt refinado ha funcionado**, proponer añadirlo al Anexo B como ejemplo validado (con aprobación).
- **Cada fallo visto en generación** se añade a la lista de fallos conocidos del Paso 12 cuando aparece en 2 o más prompts distintos.
- Historial de cambios:
  - 1.0.0: primera versión pública para la comunidad de Ailendra Labs.
- Ampliaciones de estética **pendientes de validar** (no usar hasta probarlas): smear vertical de CCD en fuentes muy brillantes y deriva visible del balance de blancos automático al cambiar de interior a exterior.
- Revisar la skill si AILAB cambia la sintaxis de referencias, si cambia la guía de Seedance 2.5 o si el modelo por defecto deja de ser Seedance 2.5.
- Señal de obsolescencia: los vídeos salen estabilizados o limpios pese a seguir la plantilla. En ese caso, revisar los bloques de los Pasos 3 y 4 con generaciones nuevas.

---

## Anexo A. Banco de frases validadas

Frases que aparecen en los prompts que han funcionado, ya adaptadas a la sintaxis de Seedance 2.5. Se reutilizan ajustándolas a la escena.

**Diálogo**
- `Dialogue language: Spanish (Spain). [Name] says in natural Castilian Spanish, [delivery]: {...}`
- `Dialogue language: Spanish (Spain). [Name] says in a warm Andalusian accent, [delivery]: {...}`
- `[Name] continues in the same Castilian Spanish: {...}` / `[Name] continues without a pause: {...}`
- `On this phrase, ...` / `On the last word of this phrase, ...` / `As she begins this phrase, ...`
- `The braced lines below are the exact words already in @Audio1; they assign speaker and timing, not a new performance.`

**Operador y temblor**
- `The camera is operated by an ordinary amateur person.`
- `held in one hand at chest height by someone who is walking and cannot keep it steady`
- `Handheld is obvious and human: step-driven bounce, lateral sway, breathing drift, horizon error and slightly late corrections.`
- `The camera reacts rather than anticipates.`
- `Never polished, stabilized, or pre-planned. Captured, not staged.`
- `The frame drifts, dips and corrects constantly, the horizon never level for long.`

**Retraso y aterrizaje**
- `It begins fractionally late, allowing [A] to clip the edge briefly before leaving frame.`
- `The camera pans left after her a beat too late, so for a moment she clips the left edge of the frame, half her face and shoulder cut off.`
- `The camera lands imperfectly on [B] already [doing X].`
- `finds him already walking toward [B], forcing a visible catch-up correction`
- `one small late correction as [A] lands the phrase, with a tiny unintended tilt and a slight loose headroom feel, then settles imperfectly`

**Movimiento**
- `It resembles a fast push-in but is entirely physical movement, NEVER a zoom.`
- `Fast reframing uses plain reactive pans, not stylized whip effects.`
- `A plain hand movement at ordinary hand speed with the unsteady shake continuing: not a whip, not a swing, not sped up, no smear, and no sound attached to the movement.`

**Lente**
- `A brief autofocus hunt moves from [depth A] to [B]'s face and locks.`
- `a soft breathing of sharpness across her face and the door. Silent, in-lens only.`
- `It reads unmistakably as a camera metering, not as the room getting darker.`
- `The foreground [object] briefly competes for focus; focus breathes softly back to [B]'s eyes.`

**Estética**
- `slightly crude CCD color, limited dynamic range, soft digital texture, mild highlight clipping, gentle natural lens flare`
- `hard near-axis fill-flash character. White surfaces and skin may run slightly hot.`
- `Natural unretouched skin with visible pores and texture. No cinematic grade or beauty treatment.`

**Actuación**
- `They are already mid-conversation at the start.`
- `his gestures stay motivated by the words rather than decorative`
- `[B] remains silent but active the entire time. Do not freeze [B] while [A] speaks.`
- `She never performs for the camera: the camera follows her, she does not adjust for it.`
- `Her eyes land on the lens casually and slide off again before the phrase is done.`

**Final**
- `Hard cut exactly with the end of @Audio1. No final pose, fade or extra reaction.`
- `The result feels like a genuinely captured early-digital family moment: fast, intimate, playful, physically continuous and always slightly ahead of the camera's ability to frame it perfectly.`

---

## Anexo B. Ejemplos

Sirven para calibrar, no para copiar. Handles normalizados a AILAB.

- **A y B:** prompts validados por la comunidad, fieles al original salvo handles (y un resto de iteración eliminado en A). A ya usa llaves para el diálogo. B escribe el diálogo entre comillas; al refinar, esas líneas pasan a `{ }` con idioma declarado. Se conservan por sus patrones de dirección.
- **C:** convertido por la skill al formato Seedance 2.5 a partir de un prompt validado en otra plataforma (el original usaba momentos de 0,4 s, un teléfono y comillas). Pendiente de generar.
- **D:** primer prompt refinado con el formato Seedance 2.5, en castellano con audio exacto. Pendiente de validar.

### Ejemplo A. Huerto, 5 s, audio exacto, oyente activo (validado)

Qué enseña: localización como estética y no como primer frame, dos imágenes para una misma persona, oyente con tarea física de ciclo completo, gestos y corrección de cámara anclados a fragmentos entre llaves, "Do not freeze".

```text
[LOCATION_AND_AESTHETIC_REFERENCE] corresponds to @Image1. Use @Image1 only for the exact environment, visual world, and camera-image aesthetic: a rustic Mediterranean country-house orchard edge with a weathered wooden bench, rough dirt ground, low whitewashed wall, terracotta pots, blossoming trees, distant hills, warm late-afternoon light, and a candid early-2000s digital point-and-shoot feel. Preserve the raw consumer-camera image character: slightly crude CCD color, limited dynamic range, soft digital texture, mild highlight clipping, gentle natural lens flare, and an authentic amateur snapshot mood. Do not use @Image1 as a first frame.
[MARCOS_REFERENCE] corresponds to @Image2 and @Image3. @Image2 controls Daniel's full-body identity, proportions, silhouette, and wardrobe: the same white T-shirt and dark trousers. @Image3 controls Daniel's exact facial identity from multiple angles. Ignore the studio backgrounds and sheet layouts. @Image2 and @Image3 are the same single person.
[RAFAEL_REFERENCE] corresponds to @Image4. Use @Image4 for Andrés's exact identity, age, facial structure, hair, body proportions, and wardrobe: the same navy shirt and light beige trousers. Ignore the studio background and sheet layout.
[AUDIO_REFERENCE] corresponds to @Audio1. Use @Audio1 as the exact spoken-audio authority. Preserve the exact wording, timing, pauses, cadence, and vocal performance. Do not rewrite, extend, paraphrase, or add dialogue. Daniel is the only audible speaker in this clip. Andrés does not speak.
[Overall Shot]
Single continuous 5-second live-action shot. Daniel and Andrés are already standing in the orchard environment from @Image1, facing one another and talking beside the bench, not seated. Daniel stands closer to frame-left and faces Andrés; Andrés stands closer to frame-right and faces Daniel. The camera is operated by an ordinary amateur person and feels obviously imperfect: handheld step-bounce, tiny accidental de-framing, small unplanned canted tilts, slight wrist drift, a faint body/strap rattle, and late micro-corrections. The camera never feels polished, stabilized, or pre-planned. Captured, not staged.
[Stage 1]
They are already mid-conversation at the start. Daniel speaks naturally to Andrés using the exact line from @Audio1, warm and animated, gesturing casually as he talks. Andrés listens attentively without speaking. He initially holds a cigarette in his right hand while watching Daniel, with a relaxed listening posture and small receptive nods. The camera hovers in a loose two-shot, slightly imperfect, with subtle accidental framing slips that recover naturally.
[Stage 2]
As Daniel continues the line, his gestures stay motivated by the words rather than decorative. On the exact words {a mí}, Daniel touches his chest with an open hand, as if personally claiming that taste. Andrés raises the cigarette in his right hand, takes a single natural drag while still listening, then lowers the hand again. He keeps his attention on Daniel and gives a small understanding nod.
[Stage 3]
Andrés holds the smoke briefly for about half a second, then exhales while continuing to listen and lightly nod. On the exact words {los 2000}, Daniel adds stronger emphasis: a slight brow furrow, a firmer expression, and a more pointed delivery while still feeling spontaneous and conversational. The camera makes one small late correction as Daniel lands the phrase, with a tiny unintended tilt and a slight loose headroom feel, then settles imperfectly. End with both men still present in the conversation, alive and unposed.
[Performance]
Daniel says exactly: {Ahora na' más me falta darle el rollo que quiero al vídeo… que a mí me tira mucho lo de los 2000.} Daniel never addresses the camera. Andrés remains silent but active the entire time: listening, smoking, nodding, tracking Daniel with his eyes, and reacting naturally. Do not freeze Andrés while Daniel speaks.
[Constraints]
No cuts, no shot changes, no digital zoom, no gimbal smoothness, no decorative cinematic moves, no polished commercial acting, no direct lens address, no extra dialogue, no subtitles, no added text, no identity drift, and no wardrobe drift. Preserve the environment and camera-image aesthetic from @Image1, Daniel from @Image2 and @Image3, Andrés from @Image4, and the exact spoken timing from @Audio1.
```

### Ejemplo B. Porche, 16 s, audio exacto, operadora que es un personaje (validado)

Qué enseña: simultaneidad con el audio como timing master, operadora que es un personaje y aparece al oír su nombre, acercamiento andando en lugar de zoom, paneos anclados a nombres, ciclo de vida de props, mano por prop, pantalla oculta, reacción en escalera, AF y AE solo al aterrizar.

Nota de formato: este original escribe el diálogo y los anclajes entre comillas. Al refinar un prompt así, las líneas pasan a `{ }` con idioma declarado y los anclajes pasan a "On this phrase" después de cada fragmento.

```text
Create an exactly 16-second ultra-realistic live-action family scene in ONE continuous handheld take. Use @Audio1 unchanged as the exact final soundtrack and absolute timing master. Every visible action, lip movement, camera reaction and prop interaction happens simultaneously in real time according to the existing audio; do not treat dialogue, acting and camera as separate sequential events.
[AESTHETIC / CAMERA]
Early-2000s digital point-and-shoot consumer-camera realism on a shaded rustic Mediterranean villa porch: whitewashed brick pillars, terracotta tiles, dark wooden beams, terracotta pots, flowers and a bright orchard beyond.
Raw CCD color, coarse visible grain, modest dynamic range, slightly imperfect white balance, deep textured shadows, slightly milky highlights and hard near-axis fill-flash character. White surfaces and skin may run slightly hot. Natural unretouched skin with visible pores and texture. No cinematic grade or beauty treatment.
Lucía from @Image4 is the sole camera operator throughout. There is no separate operator or fourth person. During ordinary coverage she is behind the viewpoint and invisible; when her name is spoken, the same Lucía briefly turns the viewpoint toward herself and becomes visible extremely close to lens. The recording device itself is never seen.
Handheld is obvious and human: step-driven bounce, lateral sway, breathing drift, horizon error and slightly late corrections. The camera reacts rather than anticipates.
The opening has the strongest movement: the camera is already walking briskly forward and toward frame-right, physically closing distance to Daniel and recentering him. It resembles a fast push-in but is entirely physical movement, NEVER a zoom. As the camera reaches him, the stronger walking shake naturally reduces into ordinary handheld drift.
Fast reframing uses plain reactive pans, not stylized whip effects. Brief autofocus hunting and gradual auto-exposure adaptation are allowed only when rapidly landing on Andrés or Lucía. They are silent and caused by the new distance/brightness. No physical light changes.
No zoom anywhere in the clip.
[REFERENCES]
@Image1 defines Daniel's full-body identity, proportions and white T-shirt / black-trouser wardrobe.
@Image2 defines the same single Daniel's face, hair, facial hair, earrings and facial geometry. @Image1 and @Image2 are one person.
@Image3 defines Andrés's exact identity, body, weathered skin, swept-back salt-and-pepper hair, navy linen shirt, beige trousers and watch.
@Image4 defines Lucía's exact identity, face, braided half-up curly hair, hoop earrings and black high-neck top. Lucía is also the camera operator.
@Image5 defines only Daniel's silver iPhone: rear casing, proportions and camera cluster. Its green reference display is never used. The recording camera must never see the phone screen.
@Image6 defines Daniel's single worn metal flip-top lighter and single plain cigarette. The cigarette is UNLIT when first removed and is lit exactly once during the scene.
@Image7 defines Andrés's table props: beer bottle, full beer glass, cigarette pack, lighter and cigarette. They appear naturally on the wooden table; Andrés already holds his cigarette when first shown.
Ignore all studio backgrounds and reference-sheet layouts.
@Audio1 is the sole audio authority. Preserve it exactly from start to finish: dialogue, Andalusian pronunciation, cadence, pauses, muffled cigarette speech, lighter click, inhale, footsteps, ambience, table sounds, Andrés's chuckle, chair creak and final question. Generate NO new audio and do not alter, clean, stretch or remix @Audio1.
[ACTION / CAMERA FLOW]
The take opens already moving. Daniel stands loosely against a whitewashed pillar, initially a little left of ideal center. The camera walks quickly toward him while moving frame-right, producing strong believable handheld bounce and rapidly changing perspective. Daniel grows larger because distance closes physically.
At the same time, Daniel pushes slightly away from the pillar and begins the opening line already contained in @Audio1: "Hoy me desperté con una idea."
While speaking, he removes the UNLIT cigarette and the metal lighter from @Image6. The cigarette reaches his mouth quickly and remains between his lips, matching the slightly muffled delivery in @Audio1.
At the exact lighter click in @Audio1, Daniel opens the lighter in his RIGHT hand, ignites one small flame, lights the previously unlit cigarette and takes the short inhale already heard in the soundtrack. A subtle ember appears and a thin thread of smoke begins. He closes the lighter and returns it toward his right pocket. The cigarette remains in his mouth for the following phrase.
As he says "pa convencer a Andrés de que me deje casarme con su hija Lucía," Daniel turns his eyes and head toward Andrés outside frame-right.
Exactly on "Andrés," the camera makes a fast reactive pan right. It begins fractionally late, allowing Daniel to clip the edge briefly before leaving frame.
The camera lands imperfectly on Andrés already seated at the wooden table. @Image7's beer, full glass, cigarette pack and lighter are present; Andrés casually holds his cigarette. He watches Daniel with guarded paternal stillness.
A brief autofocus hunt moves from the table depth to Andrés's face and locks. The shaded porch re-meters gradually against the brighter garden; this is camera exposure only.
Daniel continues speaking off-camera through "...de que me deje casarme con su hija Lucía."
Exactly on the spoken name "Lucía," the camera makes another fast reactive turn and lands on the camera operator herself.
The same single Lucía from @Image4 suddenly fills the frame at extremely close distance, approximately 25 to 35 cm from lens, with the viewpoint slightly below her eye line and angled gently upward. Mild wide consumer-camera perspective, imperfect centering, curls pressing toward the frame edges. Brief autofocus catch on her eyes.
Lucía gives one tiny closed-mouth smile and ONE quick knowing wink directly into lens. No dialogue, no pose, no hold. As soon as the wink completes, the camera immediately turns away from her again.
The camera returns to Daniel but finds him already walking toward Andrés, forcing a visible catch-up correction. It follows behind and slightly to one side with restrained walking bounce.
Daniel has now removed the lit cigarette from his mouth and holds it naturally in his LEFT hand. The lighter is already back in his pocket.
He continues exactly with @Audio1: "Como yo sé lo que le gusta."
His attention stays on Andrés; a faint knowing half-smile appears around the stressed "sé."
Without stopping, he continues: "Le he preparao unos vídeos con ía pa que vea como se luciría si fuera mi suegro."
Simultaneously, Daniel's RIGHT hand enters his trouser pocket and removes @Image5. The extraction remains continuous: hand enters → grips phone → phone emerges → settles in his right hand.
As he reaches Andrés, Daniel's LEFT hand, still holding the cigarette safely between the fingers, rests lightly on RAFAEL'S RIGHT SHOULDER. The cigarette angles outward, away from Andrés.
At the same moment Daniel's RIGHT hand rotates the iPhone toward Andrés.
Andrés can see the display.
The recording camera cannot.
Only the silver BACK casing, camera cluster and phone edges are visible. Never expose or reflect the display; never generate green, UI, text, video or screen content.
Andrés lowers his eyes to the unseen screen while Daniel finishes "...si fuera mi suegro."
The camera makes one small lateral adjustment around Daniel to keep Andrés's reaction visible. The foreground iPhone briefly competes for focus; focus breathes softly back to Andrés's eyes.
Andrés remains guarded for a moment, then his eyebrows lift slightly, his attention sharpens and he leans subtly toward the phone.
At the exact chuckle already contained in @Audio1, Andrés gives a small genuine incredulous laugh that flows directly into:
"¿Pero tú como haces estas cosas?"
He looks up from the phone toward Daniel while speaking, amused and genuinely curious but still carrying paternal authority.
As Andrés finishes the line, the camera makes one final fast reactive pan toward Daniel and catches him already looking down toward Andrés with a restrained satisfied half-smile, the lit cigarette still in his LEFT hand.
Hard cut exactly with the end of @Audio1 at 16.00 seconds. No final pose, fade or extra reaction.
[CONTINUITY]
Exactly three people: Daniel, Andrés and Lucía.
Lucía is the sole operator and the same Lucía who appears during the extreme-close self-facing beat.
Daniel uses exactly one cigarette and one lighter from @Image6:
unlit cigarette removed → placed in mouth → ignited once → brief inhale → later held in LEFT hand.
Daniel RIGHT hand uses the lighter during ignition, returns it to the pocket, then later retrieves and holds @Image5.
Final hand ownership:
Daniel LEFT hand = lit cigarette + Andrés's RIGHT shoulder.
Daniel RIGHT hand = iPhone.
Andrés's @Image7 props remain stable and unduplicated.
No extra people, duplicate props, hand swaps, teleportation, identity drift, malformed fingers, visible iPhone display, polished stabilization, slow motion, speed ramps, cuts before the end, subtitles or generated audio.
The result feels like a genuinely captured early-digital family moment: fast, intimate, playful, physically continuous and always slightly ahead of the camera's ability to frame it perfectly.
```

### Ejemplo C. Puerta de la villa, 7 s, voz generada en inglés (convertido, pendiente de generar)

Qué enseña: el nivel de detalle completo con voz generada: stages con Initial / Primary event / End, diálogo en llaves con idioma y acento, gestos anclados después de cada fragmento, extra de fondo con una sola acción, "el que ya está ahí" con encuadre medido, lente con presupuesto, sonido del micro de cámara con `< >` inline y voz por hablante.

Conversión: 8 momentos del original fusionados en 4 stages de la rejilla; teléfono sustituido por la compacta; UUID sustituido por Hugo; comillas sustituidas por llaves con idioma declarado; las palabras ancla del original (NO ONE, LIKE THIS, THE SKIN, LIGHT...) pasan a fragmentos y a "On this phrase"; PART 2 a 4 del original sustituidos por el presupuesto de `[Camera]`.

```text
[Generation Goal]
Create a 7-second live-action clip in ONE continuous handheld take that looks like an early-2000s compact digital camera recording. A woman walks through a villa doorway telling whoever is filming a small secret about AI images, and a young man caught in passing on the terrace answers straight into the lens. @Image1 is the exact first frame. Every visible action, lip movement, gesture, camera reaction and in-lens behaviour happens simultaneously in real time. The only cut is the out-point at 7.00s.

[Characters]
The woman is the woman at frame right in @Image1. Her right hand is her talking hand; her left hand hangs and swings naturally and later touches the door. The hands never swap roles and hold nothing. Her eyes come to the lens casually and slide off again; she never holds eye contact.
Hugo corresponds to @Image2, @Image3 and @Image4, the same single man. Use only his face, very short platinum-blond buzzed fade, thick dark eyebrows, warm hazel-brown eyes, olive-tan skin and build. Eyes bare: the sunglasses in @Image3 are not used. Do not use the studio backgrounds or the sheet layout of @Image4.
Hugo's wardrobe corresponds to @Image5. Use only the light blue and white pinstriped shirt with the stiff white contrast collar, the dark burgundy tie with small white dots and the dark pants. Do not use the man, the face, the bed or the room in @Image5.
Hugo does not film and never holds the camera. He comes from the right side of the terrace and goes after the woman to the left. He looks straight into the lens only for his line.
The woman in the lilac shirt is the background woman on the terrace in @Image1. She never speaks, makes no gestures and never looks at the camera.
Do not interchange their appearances, clothing, actions, positions or dialogue. Exactly three visible people: the woman, Hugo and the woman in the lilac shirt. The man holding the camera is never seen and never speaks.

[Scene]
The villa doorway references @Image1, which is also the exact first frame: the room, the open white door, the terrace with its chairs and table, the sea and the low sun beyond. Begin directly from this exact visual state: same room, same framing, same light, same crop, same two women in the same positions.

[Visual Style]
The whole clip is recorded on an early-2000s compact digital point-and-shoot camera in its video mode: candid, amateur, unpolished, a clip straight off an old camera's memory card. Raw CCD colour, slightly imperfect white balance, modest dynamic range, slightly milky highlights and deep textured shadows, as in @Image1. Strong, coarse, visible digital grain across the whole frame at all times, heavier in the shadows and in the darker parts of the room, still clearly present on the bright terrace. A hard on-camera light is on continuously for the whole take, never firing and never changing: whatever it reaches is a touch hot, with slightly blown highlights on the white door paint, her linen, her bare shoulders and arms, later his face and white collar; whatever it does not reach stays darker. Once she is outside, daylight is far brighter than it, so the same constant light reads as weak fill. Terrace, sky and sea stay slightly hazy and milky. Skin is never smooth: visible pores, fine texture, small unevenness, tiny marks and a natural sheen where the on-camera light hits. No smoothing, no retouching, no beauty filter. This is the single most important thing about how they look. No colour grade, no cinematic look.

[Camera]
The camera is a viewpoint only, held in one hand at chest height by a man who is walking and cannot keep it steady. He does not have the reflexes to keep her centred: the camera is always a beat behind her. The frame drifts, dips and corrects constantly, the horizon never level for long, and it is never still at any point. Every camera movement is a plain hand movement at ordinary hand speed with the shake continuing through it and no sound attached.
In-lens budget: exactly three autofocus hunts (two on her, one on Hugo), two automatic-exposure adaptations and one subtle sun flare, each silent and described in its stage. Nothing else.
Not used anywhere: cuts before the out-point, whips, smears, snaps, optical or digital zoom, punch-ins, stabilisation, slow motion, speed ramps, transitions, palm-over-lens, camera turning around.

[Stage 1 | 0.00–2.50s]
Initial state: frame 0.00 is exactly @Image1, with the unsteadiness already present. She is already mid-step at frame right, walking to frame left toward the open doorway, her face turned back over her right shoulder into the lens, her hands clasped in front of her. The woman in the lilac shirt stands out on the terrace.
Primary event: she walks left and delivers her first line. Her hands come apart on the first step: the right becomes her talking hand, the left hangs and swings. Dialogue language: American English. She says in a quiet, silky, unbothered American English at natural conversational speed, letting you in on something, faintly amused: {No one is telling you how to make your AI look like this,} As she begins this phrase her brows lift slightly as her chin tips back over her shoulder toward the lens. On its last two words her right hand comes up and draws a single loose circle in the air in front of her, index finger slightly extended, taking in the door, the terrace and the sea in one round sweep: she means exactly this, the world she is standing in. The phrase runs as one flowing line with no gaps and finishes cleanly.
Performance: she blinks once mid-phrase; her eyes land on the lens casually and slide off toward where she is walking before the phrase is done; a small breath at the end. The tail of her hair and a few loose strands move with each step.
Background: the woman in the lilac shirt turns her head to the left, as if someone off-frame has called her name, her hair moving in the wind, then walks off to the left and out of the shot. By the end of this stage the terrace is empty. Far out over the water, two or three seagulls drift across, small and completely out of focus.
Camera: her walk drifts further left than the camera expects. The camera swings left after her a beat too late, so for a moment she clips the left edge of the frame, half her face and shoulder cut off, because the man holding it does not have the reflexes to keep her centred.
Sound: <Her steps on the terracotta tile> <The sea washing faintly through the open door> <A light wind> <The other woman's steps fading on the terrace stone> <A door opens faintly somewhere else in the house>
End state: she is at the left side of the frame, partly cut by the edge; the terrace behind her is empty.

[Stage 2 | 2.50–4.50s]
Continue from the previous stage: same room, same light, the terrace empty, the handheld still unsteady.
Primary event: she turns back toward the doorway and delivers her second line. She turns halfway back and walks right toward the doorway opening, her front open to the camera. She continues in the same easy American English, matter-of-fact, almost naming what is in front of you: {The skin,} On this phrase her right hand passes in front of her own face, palm toward her face, across her cheek and up past her temple. She continues without a pause: {light,} On this phrase both hands come up and open outward at waist height, palms turning up and out into the space around her, presenting the air and the light itself. Her hands travel away from her body and never come back toward her chest, face or torso; she does not point at herself or at any single object. Small, offhand, barely a gesture at all: two hands, low and open, nothing like the round sweep of Stage 1. At the same moment the camera makes a small tilt toward the light, the sea and the sky above the sea and comes straight back to her; she stays in frame throughout, no hold on the sky. She continues without a pause, reaching the doorway as she speaks: {that old camera look.} As she begins this phrase her right hand lifts loosely toward the camera and drops again: one open, soft hand, fingers relaxed and together. She does NOT point with her index finger, does NOT jab and does NOT bring the hand back toward herself. A slight smile arrives with it and stays; her eyes soften. It is immediately readable that she loves that look.
Camera: as she turns back, the man corrects across to find her again a beat late.
In-lens: as she lands back in frame, the autofocus hunts and catches her for about a second, a soft breathing of sharpness across her face and the door. During the tilt, the camera's automatic exposure meters for the brighter sky: the highlights in the doorway hold detail, the contrast tightens, the interior sits a touch deeper; it rolls back the same way as the frame returns to her. It reads as the camera metering, never as the room getting darker.
Sound: <Her steps changing direction on the tile> <The wind now clearly audible through the doorway> <The first gulls calling>
End state: she is at the doorway, her right hand dropping from the lift toward the camera, her hair livelier near the open door.

[Stage 3 | 4.50–5.50s]
Continue from the previous stage: she is at the doorway, finishing her line.
Primary event: she walks out through the doorway while her last words are still landing. Her left hand comes up and touches the edge of the white door as she passes it, her body already turning out toward the terrace and the sea. She does not stop in the doorway: her last words land already outside, and she keeps moving off to the left, away from the camera's side of the frame. She reaches the doorway by walking there and goes through it by walking through it. The moment she is out, the wind off the sea catches her hair hard, lifting and streaming it sideways across her back and face.
Camera: the man follows her out through the doorway and ends one step outside. At the end of the stage, without any cut, the camera turns slightly to the right and almost straightens: a plain hand movement at ordinary hand speed, not a whip, not sped up, no smear, no sound.
In-lens: the autofocus hunts and catches her for about a second as she crosses the threshold, the last focus hunt on her. The camera's automatic exposure adapts to the daylight: the blown-out white of the doorway recovers into real sky and sea with visible detail, the terrace stone comes up out of the glare, her skin and linen settle into correct daylight tone, and the interior behind sinks into shadow because the camera no longer meters for it. It is a slow gradual roll across many frames, never a jump, never a light dimming, and completely silent. As the frame follows her into the light, a subtle sun flare crosses the lens from the low sun over the sea: a soft milky wash and a faint bloom in one corner that passes off as the frame settles.
Sound: <The wind coming up strong and constant, gusting on the microphone> <The sea below> <Gulls clearly audible> <Her hand softly touching the door>
End state: she is outside moving left; the camera is one step outside, turning right.

[Stage 4 | 5.50–7.00s]
Continue from the previous stage: the camera turning right on the terrace, the wind constant.
Primary event: Hugo, already there, answers straight into the lens. He is already in the frame the instant the camera lands, just in front of the doorway; he does not arrive. He has come from the right side of the terrace, from outside, on his way after her, and pauses for a second in passing just to say something. Framing: roughly 1 metre from the lens, head, shoulders, chest, arms and waist filling the frame, cut at the waist; his legs are not in frame. His collar and the loose tail of his tie move in the wind. With no dead air, he looks into the lens. Dialogue language: English with a slight Australian accent. Hugo says in warm, easy, low-key Australian English, with quiet certainty, speaking to us and not to her: {But I will,} On this phrase the stress lands on the second word, as if he is the one who will show us; he winks with a slight smile, gives a small tip of his head toward himself, blinks naturally and makes one small hand gesture.
In-lens: the autofocus hunts briefly and catches him in about half a second, silently.
Sound: <His steps on the terrace stone> <Wind across the microphone> <A faint collar rustle>
End state: right after his phrase he is already moving again after her to the left, and the clip cuts exactly at 7.00s, mid-step. No settle, no hold, no fade, no black. He never touches the camera or covers the lens.

[Maintain Consistency]
Exactly 7 seconds, one continuous handheld take in real time; the only cut is the out-point at 7.00s.
Dialogue: only the braced lines in the stages above, each spoken exactly once, in order. Her lips move only on her lines; Hugo's only on his; nobody else speaks.
Skin is never smooth on anyone. Grain is strong and coarse at all times. The frame is never still.
Every movement has a visible beginning, middle and end; nothing is already done and nobody teleports. The camera never leaves her before she is outside.
★ NO LIGHT IN THIS SCENE EVER CHANGES. ★ Every exposure and contrast change is the camera's automatic exposure; no light source brightens, dims, switches on or off; no flash firing, no white frame, no photograph being taken.
Her hand moments are all different: the round sweep in Stage 1, the pass across her face and the low outward opening toward the light in Stage 2, the loose lift toward the camera at the end of Stage 2. Apart from the deliberate pass across her face, she never points at or indicates her own body, chest or torso. She drifts off-centre and is never locked to the middle of the frame.
The woman in the lilac shirt leaves early and does not come back. Hugo wears no sunglasses; his outfit is the one from @Image5 and nothing else from @Image5 is used.
No music, no subtitles, no on-screen text.

[Audio]
Everything is the compact camera's built-in microphone as captured, raw and unprocessed: thin, a little boxy, light auto-gain pumping, handling noise, wind hitting the microphone directly near the door, no denoising, no polish. Nothing is heard that this camera would not have recorded. No music, no narrator, no designed sound, and no sound on any camera movement, focus hunt or exposure change.
Her voice sits at room distance, a few metres from the mic, with the room's faint short echo: never close-mic, never dry, never studio. It gets slightly quieter and roomier as she walks toward the door and turns to the sea, and slightly clearer whenever her face turns back to the lens. Hugo's voice comes through the same thin mic at the same modest level, never louder or sharper than hers, with wind gusting across it.
Her voice: quiet, silky American accent, relaxed and unbothered, talking to whoever is filming. One flowing phrase per line, finishing a little early rather than late; emphasis felt in a breath and a look, never as a slow-down. Small breaths, a little fry at the ends of phrases. Her first line lets you in on something with a hint of amusement; her second is matter-of-fact inventory that turns fond on its last phrase.
Hugo's voice: slight Australian accent, natural and friendly, offhand and generous, sure of himself, as if this is no trouble at all.

The result feels like a clip straight off an old compact camera's memory card: candid, fast, and always half a step behind a woman who is not waiting for the camera.
```

📐 Aspect ratio: el de @Image1, que es el primer frame | ⏱ Duration: 7s

### Ejemplo D. Terraza, 8 s, castellano con audio exacto (pendiente de validar)

Versión 2, tras el feedback de Daniel sobre la primera prueba ("prácticamente perfecto"): más movimiento de cámara al arranque (el operador se acerca andando mientras Clara se desapoya de la puerta y viene hacia cámara hablando directamente a lente), la chica del fondo levanta la cabeza y mira a cámara al empezar a grabar antes de irse, y Daniel pasa de primerísimo plano a plano medio a tres cuartos de cintura para arriba.

Qué enseña: el caso que falló con la versión anterior de la skill. Diálogo en castellano fragmentado según las pausas medidas en `@Audio1`, idioma y variedad declarados por hablante (castellano para Clara, andaluz para Daniel), gestos anclados con "On this phrase", stages colocados sobre las pausas reales del audio, disparador físico para una frase de medio segundo y ratio fijado por el primer frame.

Medición del audio (8,06 s): "Nadie te cuenta" 0,00 a 0,92 s; pausa; "cómo hacer que tus vídeos con IA se vean así" 1,68 a 3,56 s; pausa; "La piel, la luz" 4,46 a 5,43 s; pausa; "ese look de cámara antigua" 6,07 a 7,21 s; "Pero yo lo haré" 7,36 a 7,82 s.

```text
[Generation Goal]
Create an 8-second live-action clip in ONE continuous handheld take that looks like an early-2000s compact digital camera recording. Clara pushes off the open villa door and comes toward the camera to tell whoever is filming a small secret about AI video, then walks back out onto the terrace, and Daniel steps in from beside the camera to answer her. @Image1 is the exact first frame. @Audio1 is the exact final soundtrack and absolute timing master. Every visible action, lip movement, gesture, camera reaction and in-lens behaviour happens simultaneously in real time. The only cut is the out-point at 8.00s.

[Characters]
Clara corresponds to @Image3 and is the woman at frame right in @Image1. Use only her face, blonde hair in a loose low updo with loose face-framing strands, sun-kissed freckled skin, cream ribbed-knit tank top and ivory pleated linen wide-leg trousers. Do not use the grey studio background or the sheet layout. All views in @Image3 are the same single woman. Her right hand is her talking hand; her left hand hangs loosely and swings as she walks; the hands never swap roles and hold nothing. In Stage 1 she speaks directly into the lens; later her eyes come back to the lens over her shoulder and slide off again.
Daniel corresponds to @Image2. Use only his face, shoulder-length dark wavy hair swept back, thin mustache and chin goatee, freckles, small gold hoop earrings in both ears, build, and his light blue and white pinstriped shirt with a stiff white contrast collar and white cuffs, burgundy tie with small white dots and dark trousers. Do not use the grey studio background or the sheet layout. All views in @Image2 are the same single man. He is not in frame until the end of Stage 3 and holds nothing. He looks straight into the lens only for his line.
The woman in the lilac shirt is the background woman already in @Image1: long dark wavy hair, pale lilac shirt with rolled sleeves, white wide trousers, barefoot. She never speaks.
Do not interchange their appearances, clothing, actions, positions or dialogue. Exactly three visible people: Clara, Daniel and the woman in the lilac shirt. The person filming is never seen and never speaks.

[Scene]
The villa terrace references @Image1, which is also the exact first frame: a dim villa interior looking out through open white French doors onto a Mediterranean terrace with terracotta tiles, a low weathered stone parapet, a tall stone column, wicker armchairs around a marble table, dark cypresses and a calm distant sea under a pale late-afternoon sky. A table lamp glows at the right edge inside the room. Clara stands against the open glass door at frame right; the woman in the lilac shirt leans against the parapet in the background. Begin directly from this exact visual state and use @Image1 for the room, the light and the camera look.

[Audio Reference]
@Audio1 is the sole authority for the exact 8-second audio track: spoken dialogue, voices, accents, pauses, vocal delivery, its low-fi internal-camera-mic texture with mild hiss and close proximity, the quiet home atmosphere and the very distant sea ambience. Do not regenerate, rewrite, paraphrase, shorten, extend or replace the dialogue. Do not create a second voice, music, narration or new sound effects. The braced lines in the stages below are the exact words already in @Audio1, in Spanish from Spain; they assign speaker and timing, not a new performance. Synchronize lips, breathing, gestures and physical actions to the existing audio.

[Visual Style]
The whole clip is recorded on an early-2000s compact digital point-and-shoot camera in its video mode: candid, amateur, unpolished, a clip straight off an old camera's memory card. Raw CCD colour, slightly imperfect white balance, modest dynamic range, mild highlight clipping and slightly milky highlights, deep textured shadows in the dim interior, soft digital texture, as in @Image1. Strong, coarse, visible digital grain across the whole frame at all times, heavier in the dark interior and door frames, still clearly present on the bright terrace and sky. A hard near-axis on-camera light is on continuously for the whole take, never firing and never changing: whatever it reaches runs slightly hot with slightly blown highlights, like Clara's shoulders, arms and cream knit in @Image1, and later Daniel's face and white collar. Whatever it does not reach stays darker. Beyond the doors, the warm late-afternoon terrace, sky and sea stay slightly hazy and milky. The lamp inside keeps glowing the whole time. Skin is never smooth: visible pores, freckles, fine texture, small unevenness and a natural sheen where the on-camera light hits. No smoothing, no retouching, no beauty filter. This is the single most important thing about how they look. No colour grade, no cinematic look, no creamy portrait bokeh.

[Camera]
The camera is a viewpoint only, held in one hand at chest height by an ordinary amateur inside the room, a few steps back from the open doors. The operator is already walking toward Clara in the first frame, stops close to her, then follows her toward the doors. The operator does not have the reflexes to keep Clara centred: the camera reacts rather than anticipates, always a beat behind her. While walking: step-driven bounce, small dips and lateral sway. While standing: breathing drift, wrist drift, small unplanned canted tilts, tiny accidental de-framing and slightly late micro-corrections. When the operator stops, the walking bounce decays over two small oscillations into ordinary drift. The horizon is never level for long and the frame is never still. Never polished, never stabilised, never pre-planned. Every camera movement is a plain hand movement at ordinary hand speed with the shake continuing through it and no sound attached.
In-lens budget: exactly three autofocus hunts (two on Clara, one on Daniel), two automatic-exposure adaptations and one subtle sun flare, each silent and described in its stage. Nothing else.
Not used anywhere: cuts before the out-point, whips, smears, snaps, optical or digital zoom, punch-ins, stabilisation, gimbal smoothness, slow motion, speed ramps, transitions, palm-over-lens.

[Stage 1 | 0.00–3.50s]
Initial state: frame 0.00 is exactly @Image1, with the camera already moving. Clara stands at frame right with her back and right shoulder resting lightly against the open glass door, hands loosely clasped at her waist, her head turned toward frame left, looking out at the terrace. The woman in the lilac shirt leans against the parapet in the background, both hands behind her on the stone.
Primary event: Clara pushes off the door and comes toward the camera, delivering her first line straight into the lens. From the very first frame she shifts her weight forward and her shoulder leaves the glass; her clasped hands come apart as she takes her first step. Her eyes reach the lens a fraction before her head turns to follow, and she walks two easy steps toward the camera, her body in its own rhythm, heel contact and weight transfer visible. Dialogue language: Spanish (Spain). Clara says in soft, natural Castilian Spanish, quiet and faintly amused, straight into the lens, letting whoever is filming in on something rather than selling it: {Nadie te cuenta} On this phrase her right hand stays loose at waist height and her left drops to her side as she walks. In the short pause that follows she stops, about one metre from the lens; her eyes slide off toward the sea for an instant and she takes a small breath through the nose, then her eyes come straight back to the lens and hold it. Clara continues in the same Castilian Spanish: {cómo hacer que tus vídeos con IA se vean así.} On the last word of this phrase her right hand opens and makes one loose backward sweep, palm up, toward the doors, the terrace and the sea behind her: she means exactly this, the world she has just come in from. Small and offhand; the hand drops back to her side right after.
Performance: she blinks naturally mid-phrase, her brows and mouth stay alive between words, and a small smile plays at the corner of her mouth while she holds the lens.
Background: the instant the take begins, the woman in the lilac shirt lifts her head and her eyes find the lens: she realises she is being filmed. She holds the look for about a second, then pushes herself off the parapet with both hands and calmly walks to frame right along the parapet, barefoot on the tiles, without looking back, and disappears behind the tall stone column. She does not come back. She does not wave, does not smile at the camera and does not speak.
Camera: from the first frame the operator walks toward Clara while she walks toward the camera, closing the distance from both sides. It resembles a push-in but is entirely physical walking movement, NEVER a zoom: Clara grows larger in frame because the distance closes, from the knees-up framing of @Image1 to a medium shot from the waist up. The camera recentres her a beat late, so she drifts off-centre to the right with loose headroom. When she stops, the operator stops too, and the walking bounce decays over two small oscillations into ordinary handheld drift.
In-lens: as she arrives close, the autofocus breathes briefly across her face and the door behind her and catches her eyes in about half a second, silently.
End state: Clara stands about one metre from the lens in a medium shot from the waist up, facing the lens, hands at her sides; behind her, the open doors and the terrace are empty: the wicker chairs, the marble table, the parapet, the sea.

[Stage 2 | 3.50–5.50s]
Continue from the previous stage: Clara about one metre from the lens, the terrace behind her empty, the handheld drifting.
Primary event: Clara turns and walks back out toward the terrace while she continues. In the pause after her first line she turns away from the lens and walks back toward the open doors, heel contact and weight transfer visible, her face turning back over her right shoulder toward the lens. Clara continues: {La piel,} On this phrase her right hand passes in front of her own face, palm toward her face, across her cheek and up past her temple: the way people gesture at their own skin. Clara continues without a pause: {la luz,} On this phrase her right hand opens outward and away from her body at waist height, palm turning up toward the low sun and the sky beyond the doorway, presenting the light itself. The hand travels away from her and never comes back toward her chest or face; lower and smaller than the sweep in Stage 1. At the same moment the camera makes a small tilt toward the light, the sea and the pale sky and comes straight back to her; she stays in frame throughout, no hold on the sky.
Performance: her left hand swings loosely with each step, loose strands of her hair move as she walks, she blinks naturally and keeps her brows and mouth alive between phrases.
Camera: her path drifts further left than the camera expects. The camera swings left after her a beat too late and the operator follows with two steps toward the doors: step-driven bounce and a small dip, and for a moment Clara clips the left edge of the frame, part of her shoulder and arm cut off, before the frame catches her again.
In-lens: during the tilt, the camera's automatic exposure meters for the brighter sky: the highlights in the doorway hold detail, the contrast tightens and the dim interior edges sit a touch deeper. It reads as the camera metering, never as the light changing, and it rolls back the same way as the frame returns to her.
End state: Clara stands at the threshold, her head turned back toward the lens; the operator is a few steps behind her, just inside the room.

[Stage 3 | 5.50–7.00s]
Continue from the previous stage: Clara at the threshold, the terrace empty.
Primary event: Clara steps out onto the terrace and finishes her line. In the pause after her last phrase she steps over the threshold onto the terracotta tiles, moving away from the camera and to the left; she reaches the terrace by walking there. She looks back over her right shoulder at the lens once more and continues: {ese look de cámara antigua.} As she begins this phrase her right hand lifts loosely toward the camera and drops again: one open, soft hand, fingers relaxed and together. She does NOT point with her index finger, does NOT jab and does NOT bring the hand back toward herself. A slight smile arrives with it and stays; her eyes soften. It is immediately readable that she loves that look. Her eyes slide off the lens toward the sea as she keeps walking left. Near the end of this phrase, while she is still speaking, Daniel's shoulder and arm slide into the right edge of the frame, close and soft, as he steps forward past the operator's right side. On the last word of this phrase the camera reacts to that movement a beat late and begins a plain reactive turn to the right, leaving Clara so that the word ends off-frame.
Performance: she blinks naturally, her left hand swings with each step, and her smile lingers after the phrase as she turns toward the sea.
In-lens: as the distance to Clara grows, the autofocus hunts and catches her for about a second: a soft breathing of sharpness across her hair, her bare shoulders and the white door frame. As the frame faces the low sun beyond the parapet, a subtle flare crosses the lens: a soft milky wash and a faint bloom in one corner, small and unforced, passing off as the frame settles.
End state: Clara is outside on the terrace, moving left and leaving the frame; the camera is turning right toward Daniel.

[Stage 4 | 7.00–8.00s]
Continue from the previous stage: the camera mid-turn to the right, Clara out of frame.
Primary event: Daniel, already there, answers straight into the lens. The turn lands imperfectly on him as he completes his step, now about one metre from the lens. Framing: a three-quarter medium shot from the waist up: his head, shoulders, chest, arms and waist fill the frame, cut at the belt; the pinstripes, the white collar and the burgundy tie are clearly readable. His legs are never in frame. His torso stays angled at three-quarters toward the open doors he is heading for, and his head turns to the lens. He sits a little off-centre to the right with loose headroom; mild wide consumer-camera perspective, viewpoint at his chest height. His left hand rests in his trouser pocket and his right hand hangs loose at his side. With no pause before speaking: Dialogue language: Spanish (Spain). Daniel says in a warm, slightly raspy Andalusian accent, fast and deeply confident, straight into the lens: {Pero yo lo haré.} On this phrase the stress lands on the second word; he gives a small tip of his head toward himself and a slight knowing half-smile that stays once the phrase is done. No hand gesture.
Performance: his eyes stay on the lens the whole time, he blinks once naturally, and his breath comes a little quick after stepping in.
In-lens: the frame has swung from the bright doorway back to the dim interior, so the camera's automatic exposure re-meters; his face and white collar catch the on-camera light and run a touch hot for a moment before the picture settles, showing his freckles, pores and gold hoop earrings. It reads as the camera metering, never as a light changing. The autofocus catches his eyes within a fraction of a second, silently.
End state: right after his phrase he is already moving again, turning toward the open doors after Clara. The clip cuts exactly at 8.00s, mid-motion, as he starts to walk out of frame. No settle, no hold, no fade, no black. He never touches the camera and never covers the lens.

[Maintain Consistency]
Exactly 8 seconds, one continuous handheld take in real time; the only cut is the out-point at 8.00s. Frame 0.00 is exactly @Image1. Daniel is not in frame until the end of Stage 3.
Dialogue: only Clara's five braced phrases and Daniel's single braced phrase in the stages above, each spoken exactly once, in that order, in Spanish from Spain, exactly as in @Audio1. Nothing else is said. Clara's lips move only on her phrases and Daniel's only on his; the woman in the lilac shirt and the operator never speak.
Skin is never smooth on anyone. Grain is strong and coarse at all times. The frame is never still.
Every movement has a visible beginning, middle and end: Clara leaves the door by pushing off it, comes toward the camera by walking and returns to the terrace by walking; the woman in lilac leaves by walking behind the column; Daniel appears by stepping in past the operator. Nothing is already done and nobody teleports. Every change of size in the frame comes from people and the operator moving, never from a zoom.
★ NO LIGHT IN THIS SCENE EVER CHANGES. ★ Every exposure and contrast change is the camera's automatic exposure. The lamp inside and the sun outside never change. No flash firing, no flash pop, no white frame, no photograph being taken.
Clara's four hand moments are all different: the backward sweep toward the terrace, the pass across her face, the low outward opening toward the light, and the loose lift toward the camera. Apart from the deliberate pass across her face, she never points at or indicates her own body, chest or torso. No index-finger pointing, no jabs.
Daniel is framed from the waist up at three-quarters, never as an extreme close-up of his face.
The woman in the lilac shirt looks into the lens only at the very start, when she realises she is being filmed; once she starts walking she never looks at the camera again and does not come back.
No music, no subtitles, no on-screen text.

The result feels like a clip straight off an old compact camera's memory card: candid, warm, and always a beat behind people who are not waiting for the camera.
```

📐 Aspect ratio: 4:3, lo fija @Image1 como primer frame | ⏱ Duration: 8s
