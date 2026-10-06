# Formato de salida: Seedance 2.5 (AILAB) y otros modelos

## Perfil por defecto: Seedance 2.5

Este es un perfil editorial de redacción para Seedance 2.5 en AILAB. No es un contrato de sintaxis obligatorio de la API. Es el perfil por defecto cuando el usuario no indica otro modelo; los límites y las capacidades de la modalidad vigente prevalecen.

### Estructura

- Tarea típica: multi-referencia con stages. Una sola acción corta sin referencias es familia simple (misma sintaxis, sin stages).
- Encabezados en corchetes, en este orden: `[Generation Goal]`, `[Characters]`, `[Props]`, `[Scene]`, `[Audio Reference]`, `[Visual Style]`, `[Camera]`, `[Stage N]`, `[Maintain Consistency]`, `[Audio]` (solo si el audio se genera). Se omiten los que no aplican.
- Cada `[Stage N]` tiene un único evento principal con `Initial state:` (solo el primero), `Continue from the previous stage:` (los siguientes), `Primary event:` y `End state:`. El estado final de un stage es el inicial del siguiente.

### Delimitadores

| Contenido | Sintaxis | Ejemplo |
|---|---|---|
| Diálogo | `{ }` | `{Nadie te cuenta}` |
| Efectos de sonido y ambiente | `< >` | `<Footsteps on gravel>` |
| Música | `( )` | `(Soft piano in the background)` |
| Subtítulos | `【 】` | `【Capítulo uno】` |

- Una frase completa y audible por delimitador; no se mezclan categorías.
- Nunca diálogo entre comillas normales. Tampoco se citan palabras sueltas del diálogo para anclar gestos.
- Nombres de personajes y props en texto plano, nunca entre `< >`.
- Música y subtítulos solo si el prompt o el audio los traen. Si no: `No music. No subtitles.` en `[Maintain Consistency]`.

### Diálogo

1. Antes de la primera línea de cada hablante: idioma, variedad, forma de decirlo y nombre. `Dialogue language: Spanish (Spain). Alba says in soft, natural Castilian Spanish, quiet and faintly amused: {...}`. Si el idioma es español y no se indica la variedad, se pregunta (hallazgo P9) o se usa la estándar del país del usuario y se lista en `Supuestos`.
2. Siguientes fragmentos del mismo hablante: `Alba continues in the same Castilian Spanish: {...}` o `continues without a pause: {...}`.
3. Se fragmenta por pausas naturales (con audio exacto, por las pausas medidas).
4. Cada fragmento aparece una sola vez en todo el prompt, en el stage donde se dice. Nunca se repite en `[Audio Reference]`, `[Maintain Consistency]` ni `[Audio]`.
5. Texto literal del prompt, con ortografía y abreviaturas tal cual.
6. Quien no habla: `X never speaks.` En `[Maintain Consistency]`: `Lips move only on each speaker's own braced lines. Nobody else speaks.`
7. Con audio exacto, las llaves asignan hablante y tiempo, no crean una interpretación nueva: `The braced lines below are the exact words already in @Audio1; they assign speaker and timing, not a new performance.`

### Anclajes

El gesto, la mirada o el movimiento de cámara ligado a un fragmento va inmediatamente después de él, sin repetir el texto: `On this phrase, ...`, `On the last word of this phrase, ...`, `As she begins this phrase, ...`, `Right after this phrase, ...`. Para una palabra a mitad de frase: partir la frase en dos fragmentos consecutivos o referirse a la posición (`the stress lands on the second word`).

### Referencias y parámetros

- Handles compactos `@Image1`, `@Video1`, `@Audio1`, numerados por tipo y orden. Una línea por material con alias vinculado, qué usa y qué no usa: `Alba corresponds to @Image3. Use only ... Do not use ...`
- Cierre de `[Characters]`: `Do not interchange their appearances, clothing, actions, positions or dialogue.`
- Primer frame: `[Location] references @ImageN, which is also the exact first frame. Begin directly from this exact visual state.` Solo localización: `Do not use @ImageN as a first frame.` Con primer frame el ratio lo fija esa imagen.
- Fuera del bloque: `📐 Aspect ratio: ... | ⏱ Duration: Ns`. Duración entera entre 4 y 30 s (rango de Seedance 2.5). Sin resolución ni fps.
- Rejilla temporal: todo timestamp en `.00` o `.50`, rangos de 1,00 s o más, consecutivos, el último cerrando en la duración total. Los eventos finos no llevan timestamp propio: van anclados a un fragmento o a una acción.

---

## Plantilla de salida (perfil Seedance 2.5)

El prompt va en inglés. El diálogo va en su idioma original, entre llaves. Las secciones que no aplican se omiten.

```text
[Generation Goal]
Create a [N]-second [type of scene] [in ONE continuous take / with N shots as in the original prompt]. [One-sentence story summary.] [@ImageN is the exact first frame.] [@Audio1 is the exact final soundtrack and absolute timing master.] Every visible action, lip movement, gesture, camera movement and focus change happens simultaneously in real time.

[Characters]
[Name] corresponds to @ImageN. Use only [face, hair, body, wardrobe]. Do not use [background, sheet layout]. [All views are the same single person.] [Talking hand; other hand.] [Lens policy.]
[Name] corresponds to @ImageN. ...
[Background person described from the first frame.] Never speaks.
Do not interchange their appearances, clothing, actions, positions or dialogue. Exactly [N] visible people: [...]. [The person filming is never seen and never speaks.]

[Props]
[Prop] corresponds to @ImageN and belongs only to [Name]. Exactly one.

[Scene]
[Location] references @ImageN[, which is also the exact first frame]. [Layout, light, positions at frame 0.00.] [Begin directly from this exact visual state. / Do not use @ImageN as a first frame.]

[Audio Reference]
[Exact-track contract: see `direccion-actuacion-camara.md`, section Sonido y voz.]

[Visual Style]
[Style exactly as in the original prompt. Nothing added.]

[Camera]
[Type of camera and operator if relevant. Starting frame: shot size, height, angle, distance. Focus baseline: sharp plane and depth of field. Not used anywhere: ...]

[Stage 1 | 0.00-X.X0s]
Initial state: [frame 0.00: positions, poses, gazes, hands of everyone visible.]
Primary event: [One main event. Action + dialogue fragments + gestures and camera moves anchored right after each fragment.]
Dialogue language: [Language (Variety)]. [Name] says in [variety/accent], [delivery]: {...} On this phrase, [gesture, hand, shape, path, size, meaning, what it is not].
Performance: [micro-life, eyes, breath: 2 to 4 cues.]
Background: [each non-speaker: gaze, hands, body, task, what they do not do.]
Camera: [trigger, start, path (type, direction, amplitude, speed), landing, what it is not.]
In-lens: [focus: sharp plane, change with cause and duration; exposure only if in the original prompt.]
Sound: [< > only if generated audio or sounds known in @Audio1.]
End state: [observable state of everyone and everything.]

[Stage 2 | X.X0-Y.Y0s]
Continue from the previous stage: [what stays the same].
Primary event: ...
...
End state: ...

[Maintain Consistency]
[Rules once: duration, identities and counts, braced dialogue only, hands and props lifecycle, gesture locks, secondaries' rules, light continuity if any, ending.]

[Audio]
[Only without @Audio1.]

[Closing intent sentence.]
```

Fuera del bloque de código: `📐 Aspect ratio: [ratio] | ⏱ Duration: [N]s`. Con primer frame, el ratio es el de esa imagen (`📐 Aspect ratio: 4:3, lo fija @Image1 como primer frame`). Si la duración la marca `@Audio1` y no se pudo medir: `⏱ Duration: la de @Audio1, redondeada al segundo entero`.

## Perfil para otros modelos

Si el usuario indica otro modelo (Veo, Kling, Sora, Runway, Wan, Hailuo, etc.) o una plataforma que no es AILAB:

1. La auditoría no cambia: los siete ejes valen para cualquier modelo.
2. Se conserva toda la dirección (actuación, cámara, enfoque, sincronía) y se escribe en prosa clara, en el idioma que use ese modelo (normalmente inglés), con el mismo orden: objetivo, personajes, escena, estilo, cámara, y la acción por tramos.
3. La sintaxis especial de Seedance (encabezados `[Stage N]`, llaves `{ }` para el diálogo, `< >` para sonidos, handles `@Image1`) se usa solo si el usuario confirma que ese modelo la entiende. Si no la conoce, se pregunta o se pasa el diálogo entre comillas normales, que es lo habitual fuera de Seedance.
4. Si el usuario pega la guía de sintaxis del modelo, manda sobre este documento.
5. Se avisa en `Supuestos` de que se ha usado un perfil genérico.
