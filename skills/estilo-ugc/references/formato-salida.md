# Formato de salida: Seedance 2.5 (por defecto) y otros modelos

El prompt va **en inglés**. El diálogo va en su idioma original (castellano de España por defecto), entre llaves.

## Valores por defecto de esta skill

- **Ratio 9:16**, salvo que el usuario diga otro. Con primer frame, el ratio lo fija esa imagen.
- **Una sola toma continua.** Los cortes solo si el usuario los pide; siempre **cortes duros** (`Hard cut, no transition, no fade, no dissolve, no wipe`).
- **Dial de imperfección: natural**.
- **Look de captura: móvil.** En el formato podcast es una cámara dedicada fija (ver `formatos-ugc.md`).
- **Duración:** entero dentro del rango del modelo (Seedance 2.5: de 4 a 30 s). Con audio, la marca el audio.

## Perfil Seedance 2.5

### Estructura

- Encabezados en corchetes, en este orden: `[Generation Goal]`, `[Characters]`, `[Props]`, `[Scene]`, `[Audio Reference]`, `[Visual Style]`, `[Camera]`, `[Stage N]`, `[Maintain Consistency]`, `[Audio]` (solo si el audio se genera). Se omiten los que no aplican.
- Cada `[Stage N]` tiene **un único evento principal** con `Initial state:` (solo el primero), `Continue from the previous stage:` (los siguientes), `Primary event:` y `End state:`. El estado final de un tramo es el inicial del siguiente.
- Una toma continua puede tener varios tramos (las acciones o los cambios de lugar). Los tramos **no son cortes**.

### Dónde va cada cosa del UGC

| Qué | Dónde |
|---|---|
| Montaje, cámara frontal o trasera, qué contiene el encuadre, vibración con sus causas, enfoque inicial y final, presupuesto de eventos de lente | `[Camera]` |
| Inventario del entorno por capas, hora y estación, fuentes de luz | `[Scene]` |
| Cómo se ve la imagen: de móvil (nitidez, ruido, contraste, procesado) o, solo en podcast, de cámara dedicada (limpia, profundidad corta); dial; sin "cinematic" | `[Visual Style]` |
| Composición y zona libre para texto posterior (Q&A), cabezas del público en primer plano | `[Camera]` (encuadre) y `[Scene]` (qué debe estar vacío) |
| Referencia, rasgos, mirada, manos, habla | `[Characters]` |
| Producto y objetos de mano con cantidad y ciclo de vida | `[Props]` |
| Cambios de luz, enfoque o exposición con causa y ritmo | línea `In-lens:` del tramo |
| Sonidos puntuales con causa visible | línea `Sound:` del tramo |
| Bloqueos duros (móvil invisible, sin música, un solo movimiento de cámara) | `[Maintain Consistency]` |

### Delimitadores

| Contenido | Sintaxis | Ejemplo |
|---|---|---|
| Diálogo | `{ }` | `{Mira, esta es la botella.}` |
| Efectos de sonido y ambiente | `< >` | `<A cupboard door closes in the kitchen>` |
| Música | `( )` | `(Soft piano in the background)` |
| Subtítulos | `【 】` | `【Capítulo uno】` |

- Una frase completa y audible por delimitador; no se mezclan categorías.
- Nunca diálogo entre comillas normales. Tampoco se citan palabras sueltas para anclar gestos.
- Nombres de personajes y props en texto plano, nunca entre `< >`.
- Música y subtítulos solo si el usuario o el audio los traen. Si no: `No music. No subtitles.` en `[Maintain Consistency]`.

### Diálogo

1. Antes de la primera línea de cada hablante: idioma, variedad, forma de decirlo y nombre. `Dialogue language: Spanish (Spain). She says in relaxed, colloquial Castilian Spanish, close to the camera, at the pace of someone talking to a friend: {...}`.
2. Siguientes fragmentos: `She continues in the same Castilian Spanish: {...}` o `continues without a pause: {...}`.
3. Se fragmenta por pausas naturales (con audio, por las pausas medidas).
4. Cada fragmento aparece **una sola vez**, en el tramo donde se dice. No se repite en `[Audio Reference]`, `[Maintain Consistency]` ni `[Audio]`.
5. Texto literal del usuario, con ortografía y abreviaturas tal cual.
6. Quien no habla: `X never speaks.` En `[Maintain Consistency]`: `Lips move only on the braced lines. Nobody else speaks.`
7. Con audio exacto: `The braced lines below are the exact words already in @Audio1; they assign speaker and timing, not a new performance.`

### Anclajes

El gesto, la mirada o el movimiento ligado a una frase va inmediatamente después de ella, sin repetir el texto: `On this phrase, ...`, `On the last word of this phrase, ...`, `As she begins this phrase, ...`, `Right after this phrase, ...`.

### Referencias y parámetros

- Handles compactos `@Image1`, `@Video1`, `@Audio1`, numerados por tipo y orden. Una línea por material con alias vinculado, qué usa y qué no usa: `She corresponds to @Image1. Use only ... Do not use ...`
- Todo asset adjunto aparece en el prompt. Si uno no debe intervenir, se dice que se ignore.
- Primer frame: `The stage references @Image3, which is also the exact first frame. Begin directly from this exact visual state.` (se escribe el lugar real: the stage, the kitchen, the street...) Se escribe como instante de acción, no como pose de retrato [H]. Solo localización: `Do not use @ImageN as a first frame.`
- Fuera del bloque: `📐 Aspect ratio: ... | ⏱ Duration: Ns`.
- Rejilla temporal: todo timestamp en `.00` o `.50`, rangos de 1,00 s o más, consecutivos, el último cerrando en la duración total. Los eventos finos no llevan timestamp propio: van anclados a una frase o una acción.
- **Varios ángulos** (podcast): cada ángulo es un plano estático distinto, con corte duro en una pausa del audio. La acción continúa en tiempo real a través del corte y el mapa de plató, la ropa, el micrófono y la luz no cambian [D].
- **Cortes** (solo si se piden): cada corte es duro y cae en una pausa real del audio. Se declara qué se mantiene (ropa, lugar, hora, luz) y qué cambia (posición, encuadre, estado del producto). Sin transiciones [D].

### Reglas de escritura

- **Una sola frase de prohibición del aparato** en `[Maintain Consistency]` y el resto en términos de "la cámara" y "el encuadre". Nunca se narra una acción del aparato [D].
- **Una instrucción definitiva por cosa.** Sin "o", "quizá", "podría" ni alternativas [D].
- **Primero el estado deseado y después el "no X"**, en la misma frase y en el tramo donde surge el riesgo [D].
- **Repetición reforzada** (hasta 3 menciones, como mucho dos marcas `★ ... ★`) solo para fallos conocidos: móvil visible, vibración equivocada, luz que cambia, mirada a la cámara, producto deformado.
- **Sin palabras vacías** ("ultra realistic", "8K", "cinematic", "masterpiece") ni adjetivos de belleza [D].
- **Imperfecciones escritas como detalle observado**, no como petición [H].

### Plantilla

**Todo lo que va entre corchetes dentro de la plantilla es un hueco por rellenar.** En el prompt final no queda ningún corchete salvo los encabezados (`[Scene]`, `[Stage 1 | 0.00-6.00s]`...). El lint de la skill lo comprueba.

```text
[Generation Goal]
Create a [N]-second live-action UGC clip in ONE continuous take, shot as phone footage with the [front/rear] camera [mount: held at arm's length / propped on ... / mounted in the car / filmed by someone else / first person / while walking]. [One-sentence description of what is seen.] [@ImageN is the exact first frame.] [@Audio1 is the exact final soundtrack and absolute timing master.] Every visible action, lip movement, gesture, camera movement and focus change happens simultaneously in real time.

[Characters]
[Name] corresponds to @ImageN. Use only [face, hair, body, wardrobe]. Do not use [background, sheet layout]. [Gaze policy.] [Hand roles.] [Speech: language and variety.] Exactly [N] visible people. [The person filming is never seen and never speaks.]

[Props]
[Product] corresponds to @ImageN. Exactly one. [How it is handled; size in frame; readable text policy.]

[Scene]
[Place, time of day, season, weather. Layered inventory: behind / around / at the edge of the frame. Light sources and their side. Background life.] [Begin directly from this exact visual state. / Do not use @ImageN as a first frame.]

[Audio Reference]
[Exact-track contract, if there is an @Audio1.]

[Visual Style]
[How a smartphone records: sharpness, noise, contrast, colour. Natural dial. No cinematic grade, no HDR look, no beauty filter, no bokeh unless asked.]

[Camera]
[Format and mount. Camera front or rear. The camera is the viewpoint itself; the frame contains only the scene, with nothing between the lens and the subject. Zoom fixed, never moving. Vibration profile with causes. Starting and final framing. Focus baseline. In-lens budget. Not used anywhere: ...]

[Stage 1 | 0.00-X.X0s]
Initial state: [frame 0.00: positions, poses, gazes, hands.]
Primary event: [One main event, with dialogue fragments and gestures anchored right after each.]
Dialogue language: [...] {...} On this phrase, [gesture].
Performance: [micro-life, eyes, breath: 2 to 4 cues.]
Camera: [cause of any movement, how it lands, what it is not.]
In-lens: [focus and exposure changes with cause and duration.]
Sound: [< > with visible cause.]
End state: [observable state of everyone and everything.]

[Stage 2 | ...]
Continue from the previous stage: [...]

[Maintain Consistency]
[Rules once: one continuous take, no cuts (or hard cuts at ...), no phone, no hands holding anything and no recording interface in the frame, identities and counts, braced dialogue only, the light changes only as described, no music, no text, ending.]

[Audio]
[Only without @Audio1.]

[Closing intent sentence.]
```

## Perfil para otros modelos

Si el usuario indica otro modelo (Veo, Kling, Sora, Runway, Wan, Hailuo...):

1. La auditoría no cambia: los diez ejes valen para cualquier modelo.
2. Se conserva toda la dirección y se escribe en prosa clara, en el idioma del modelo (normalmente inglés), con el mismo orden: objetivo, personajes, escena, estilo, cámara y acción por tramos.
3. La sintaxis de Seedance (`[Stage N]`, `{ }`, `< >`, `@Image1`) se usa solo si el usuario confirma que ese modelo la entiende. Si no, el diálogo va entre comillas normales.
4. Si el usuario pega la guía de sintaxis del modelo, manda sobre este documento.
5. Se avisa en `Supuestos` de que se usó un perfil genérico.
