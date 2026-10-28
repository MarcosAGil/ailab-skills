# Guía Seedance 2.5: Base de conocimiento de prompting

## Propósito

Esta guía contiene la capa específica de prompting para Seedance 2.5. Se usa
después de interpretar la petición del usuario y de aplicar los principios
universales de CineLabs y, cuando haya personajes, ActingLabs.

Orden de trabajo:

1. Comprender el objetivo y los materiales disponibles.
2. Aplicar CineLabs para espacio, primer frame, cámara, óptica, física, luz y
   continuidad.
3. Aplicar ActingLabs para actuación, mirada, respiración, beats y subtexto.
4. Traducir el resultado a la sintaxis y al flujo específico de Seedance 2.5
   descritos en esta guía.
5. Ejecutar el QA específico antes de entregar.

Los prompts se redactan en inglés claro. El diálogo conserva el idioma pedido
por el usuario y debe reforzarse con una declaración explícita de idioma cuando
no sea chino o cuando importe una variedad regional concreta.

Los parámetros configurables no se incluyen dentro del prompt salvo que sean
necesarios para describir el resultado visible. Aspect ratio y duración se
presentan fuera del bloque de código según las reglas generales del Video
Prompter. En tareas donde el modelo bloquea automáticamente esos parámetros,
hay que informar del bloqueo y no presentarlos como configurables.

En generación, la duración debe ser un número entero de segundos entre 4 y 30:
`4s`, `5s`, `6s` ... `30s`. No usar decimales como `10.63s`, milisegundos ni
rangos. Resolución y fps se configuran en la plataforma y no se escriben dentro
del prompt.

Cuando se usen timestamps, todos los límites deben caer en intervalos de 0,50 s
y escribirse con `.00` o `.50`. Cada rango debe durar al menos 1,00 s, ser
consecutivo y terminar exactamente en la duración total entera. Reequilibrar el
timing analizado; nunca trasladar centésimas o milisegundos al prompt final.

---

## Reglas no negociables

1. Toda referencia declara qué aporta y qué debe excluirse.
2. Cada personaje, producto, prop y escena se nombra y mapea individualmente.
3. Nunca se obliga a que todos los materiales aparezcan al mismo tiempo.
4. Varias vistas del mismo sujeto declaran explícitamente una única instancia.
5. Un vídeo de referencia aporta solo los atributos señalados; no se heredan
   identidad, fondo, ropa o escena por inferencia.
6. Los diálogos usan `{ }`; música `( )`; efectos `< >`; subtítulos `【 】`
   cuando se necesita separación explícita.
7. El diálogo no chino declara idioma; si importa, también variedad regional,
   acento y estilo de entrega.
8. Con dos o más cambios de estado, dividir en etapas con un solo evento
   principal y un estado final observable por etapa.
9. Los timestamps asignan presupuesto temporal; no garantizan edición exacta.
10. La edición declara un único vídeo maestro, scope preciso y contenido a
    preservar.
11. Una sustitución hereda aparición, timing, trayectoria, velocidad, oclusión
    y salida del elemento original.
12. Una extensión empieza o termina en el estado de frontera del vídeo fuente.
13. First frame, last frame y keyframes se asignan imagen por imagen; las
    referencias auxiliares no modifican sus composiciones.
14. Primera y última imagen deben compartir aspect ratio.
15. Todo blockout se clasifica como grueso o fino antes de redactar.
16. Los términos emocionales y cinematográficos ambiguos se traducen a cambios
    visibles o audibles.
17. No se inventan referencias ni se alteran sus identificadores.
18. Los parámetros bloqueados por la modalidad no se presentan como editables.
19. Un vídeo carrier de audio se declara como `exact track` o `loose guide`;
    nunca como ambos a la vez.
20. Todo speed ramp declara trigger físico, comportamiento de cámara, resultado
    material y retorno de velocidad sin reiniciar el estado.
21. Los timestamps se reservan para 1–3 beats críticos; no sustituyen stages ni
    funcionan como reloj frame-perfect.
22. Toda duración configurable es un número fijo, nunca un rango.
23. Las restricciones críticas aparecen inline en la etapa donde surge el
    riesgo, no únicamente al final.
24. En edición conservadora usar los seis encabezados oficiales y omitir
    duración, ratio, stages innecesarios y listas de preservación duplicadas.
25. Todo timeline usa límites `.00/.50`, tramos mínimos de 1,00 s y termina
    exactamente en la duración total expresada en segundos enteros.

---

## Índice operativo

- Capacidades y selección de flujo.
- Fórmula fundamental.
- Sintaxis de audio, diálogo y texto.
- Límites de materiales.
- Referencias y creación multi-referencia.
- Vídeos largos, stages y timestamps.
- Parámetros bloqueados.
- Edición visual y sonora.
- Extensión hacia delante y hacia atrás.
- First/last frame, keyframes y storyboard.
- Blockouts gruesos y finos.
- Montaje automático de imágenes.
- Transiciones entre vídeos.
- Dirección emocional y cinematografía.
- Proceso de construcción, QA, limitaciones y diagnóstico.

---

## Capacidades cubiertas

Seedance 2.5 admite:

- text-to-video;
- generación con imágenes de referencia;
- generación con vídeos de referencia;
- generación con audios de referencia;
- combinación multimodal de imágenes, vídeos y audios;
- edición de un vídeo existente;
- sustitución de sujetos, objetos o fondos;
- edición independiente de diálogo, idioma, voz, música o efectos;
- extensión hacia delante o hacia atrás;
- generación con primer frame;
- generación con primer y último frame;
- secuencias controladas mediante múltiples keyframes;
- interpretación de storyboards;
- render final a partir de blockouts gruesos o detallados;
- creación de un vídeo completo a partir de varias imágenes;
- transiciones continuas entre dos vídeos;
- vídeos de hasta 30 segundos organizados por etapas.

---

## Árbol de decisión del flujo

Antes de escribir, elegir una de estas **ocho familias vinculantes**. Esta
decisión determina la plantilla completa:

| # | Familia | Cuándo usarla |
|---:|---|---|
| 1 | Simple | Texto o una imagen, vídeo corto y una sola acción |
| 2 | Multi-referencia | Varios personajes, props, escenas o medios combinados |
| 3 | Vídeo largo por etapas | Más de 10–15 s o varias acciones consecutivas |
| 4 | Edición | Modificar sujeto, fondo, objeto o audio de un vídeo existente |
| 5 | Extensión | Añadir contenido antes o después de un vídeo fuente |
| 6 | First/last, keyframes o storyboard | Estados visuales o composiciones ancla |
| 7 | Blockout | Movimiento/espacio grueso o estructura fina para re-render |
| 8 | Montaje o transición | Crear vídeo desde fotos o unir dos vídeos |

Las subsecciones A–J desarrollan subflujos dentro de estas ocho familias; no
son plantillas que deban mezclarse entre sí.

### A. Generación básica

Usar cuando la petición parte de texto y, como máximo, necesita pocas
referencias con roles sencillos.

Estructura:

```text
Subject + Action/Event + Scene/Environment + Visual Style + Camera/Cuts + Audio
```

### B. Creación multi-referencia

Usar cuando existen varios personajes, objetos, escenas, movimientos o audios.
Mapear cada material por separado, crear perfiles centrales y seleccionar solo
las referencias necesarias en cada escena.

### C. Vídeo largo

Usar para varias acciones consecutivas o narrativas de hasta 30 segundos.
Dividir en etapas. Cada etapa contiene un único cambio principal y un estado
final observable.

### D. Edición de vídeo

Usar cuando un vídeo existente debe conservarse y solo se modifica una parte.
Definir un único vídeo maestro, alcance exacto, material objetivo y contenido
que no puede cambiar.

### E. Extensión

Usar para generar antes o después de un vídeo existente. El frame de frontera,
la dirección del movimiento y el audio del vídeo fuente controlan la unión.

### F. Primer/último frame o keyframes

Usar cuando imágenes concretas deben definir estados visuales obligatorios. Dar
un rol independiente a cada imagen y describir la acción continua que conecta
los estados.

### G. Storyboard

Usar cuando una cuadrícula define orden de planos y composición aproximada. No
heredar su estilo de dibujo, etiquetas ni personajes provisionales.

### H. Blockout

Identificar primero si es grueso (esqueleto de movimiento y espacio) o fino
 (estructura completa que debe recibir nuevos materiales o estilo) .

### I. Montaje de imágenes

Usar cuando varias imágenes deben convertirse en un vídeo completo. Definir
roles, orden, cantidad de movimiento, edición, tratamiento visual y audio.

### J. Transición entre vídeos

Usar para crear contenido puente entre dos clips. Definir vídeo anterior,
vídeo posterior, trigger, movimiento de cámara, transformación, estado de
llegada y transición sonora.

No mezclar plantillas completas de varias modalidades. Elegir una estructura
principal y añadir únicamente los módulos auxiliares necesarios.

---

## Fórmula fundamental

Los prompts básicos combinan de forma flexible:

```text
Subject + Action or Event + Scene and Environment (optional) +
Visual Style (optional) + Camera Movement or Cut (optional) + Audio (optional)
```

### Subject + Action/Event

Declarar quién o qué realiza qué acción. Es la base obligatoria.

### Scene and Environment

Puede incluir:

- localización;
- hora;
- clima;
- relaciones espaciales;
- estado del fondo;
- materiales o arquitectura relevantes.

### Visual Style

Puede incluir:

- fuente y comportamiento de la luz;
- color;
- materiales;
- textura de imagen;
- nivel de realismo;
- atmósfera o tono visual.

### Camera Movement/Cut

Puede incluir:

- tamaño de plano;
- ángulo;
- posición;
- movimiento;
- sujeto prioritario;
- foco;
- cortes y transiciones.

### Audio

Puede incluir:

- diálogo;
- características de voz;
- ambiente;
- efectos;
- música;
- subtítulos cuando se soliciten.

Los componentes opcionales se omiten cuando no aportan control. No rellenar la
plantilla con información decorativa.

### Plantilla básica

```text
<Subject> performs <primary action or event> in <scene and environment>.
The visuals feature <visual style>.
Use <shot size, camera angle, movement, focus behavior, or cuts>.
Audio includes <dialogue, ambience, sound effects, or music>.
```

### Ejemplo básico

```text
A ceramic artist finishes a pale blue cup in a quiet studio at dawn,
lifts it from the wheel, and places it in the center of a wooden shelf.
Soft morning light enters through the window. The wet clay carries a
delicate sheen, and the workbench remains tidy.
Begin with a medium shot of the shaping process, slowly push in toward the
cup's surface texture, then cut to a frontal view of the shelf.
Retain the low hum of the pottery wheel, clay friction, and subtle indoor
ambience.
```

---

## Sintaxis especial para audio y texto

El lenguaje que rodea la acción puede ser natural, pero cuando aparezcan estas
categorías su delimitador es obligatorio y literal:

| Contenido | Sintaxis | Ejemplo |
|---|---|---|
| Música | `( )` | `(Soft rhythmic piano plays in the background)` |
| Efectos de sonido | `< >` | `<A bell rings in the distance>` |
| Diálogo | `{ }` | `{Hello, welcome back.}` |
| Subtítulos | `【 】` | `【Chapter One: Departure】` |

### Reglas de uso

- Usar una frase completa y audible dentro de cada delimitador.
- No mezclar música, efectos y diálogo dentro del mismo delimitador.
- Asignar hablante a cada diálogo.
- Especificar qué sonidos deben conservarse o eliminarse en edición.
- Mantener el diálogo dentro de llaves aunque se refuerce idioma, acento o
  estilo de entrega.
- Nunca escribir diálogo entre comillas normales.
- Usar subtítulos solo cuando el usuario los solicite.
- Colocar cada SFX puntual inline dentro del shot o stage donde ocurre su causa
  visible: `<Footsteps compressing dry sand>`. No agrupar todos los efectos al
  final separándolos de sus acciones.
- Si texto o subtítulos deben ser absolutamente exactos, aportar referencias
  preparadas y contemplar postproducción; el prompt por sí solo no garantiza
  precisión total.

### Nombres de sujetos frente a efectos

La guía puede usar etiquetas nominales como `<Guide>` o `<Prop A>` para
identificar sujetos y, a la vez, `<A bell rings>` para efectos. El contexto
debe impedir ambigüedad:

- las etiquetas de sujeto se declaran en bloques de personajes/props y son
  sintagmas nominales breves;
- los efectos aparecen dentro de la sección de audio y describen una acción
  sonora completa;
- no reutilizar la misma expresión como sujeto y como efecto.

### Refuerzo de idioma

Cuando el diálogo no está en chino, declarar el idioma antes de la línea.

```text
The girl says softly in Japanese: {もう大丈夫です}
```

Si existe riesgo de que una línea inglesa se pronuncie en chino, o si se
necesita una variedad regional, usar:

```text
Dialogue Language + Regional Variety/Accent + Delivery Style + Speaker +
{Dialogue}
```

Ejemplos:

```text
Dialogue language: American English. The girl says in natural,
conversational American English: {I thought you weren't coming.}

Dialogue language: authentic Los Angeles English. The young man says in
natural Los Angeles vernacular: {No way, you actually made it.}
```

El acento, variedad regional y estilo de entrega deben ser compatibles con la
identidad vocal definida por ActingLabs.

---

## Límites y recomendaciones de materiales

Seedance 2.5 puede combinar hasta **50 materiales de referencia**. Los límites
por tipo se aplican simultáneamente.

| Tipo | Límite de entrada | Rango recomendado |
|---|---:|---|
| Imágenes | Hasta 30; cada una no mayor de 4K | 1–8 sujetos distintos en referencias de sujeto |
| Vídeos | Hasta 10; duración combinada máxima de 30 s | 1–5 sujetos distintos; 5–10 s por vídeo de sujeto |
| Audios | Hasta 10; duración combinada máxima de 30 s | Solo diálogo, voz, ambiente o música directamente relevantes |
| Edición de vídeo | Un vídeo fuente junto con imágenes de referencia | Vídeo fuente menor de 20 s y 1–5 imágenes |

Se pueden probar rangos superiores a los recomendados:

- 9–12 sujetos en imágenes de referencia;
- 6–10 sujetos entre audio o vídeo de referencia;
- 6–8 imágenes para editar un vídeo.

La estabilidad puede disminuir a medida que crecen los materiales y sujetos.

Si más de cinco sujetos necesitan varias vistas, colocar cada vista en una
imagen independiente. Las vistas separadas suelen ser más estables que una
composición o collage con varios ángulos en una única imagen.

### Selección de materiales

- Eliminar materiales irrelevantes.
- Mantener únicamente audios directamente relacionados con diálogo, voz,
  ambiente, efectos o música necesarios.
- Evitar referencias redundantes o contradictorias.
- Para cada material, decidir qué aporta y qué debe excluirse.
- No obligar a que las 50 referencias aparezcan simultáneamente.

---

## Planificación de duración

Cuando la duración sea configurable, elegir siempre un número entero de segundos
entre 4 y 30, nunca un decimal ni un rango. Si el usuario no la proporciona,
calcularla por complejidad y seleccionar un valor concreto:

- acción única: elegir entre 6 y 8 s;
- secuencia de 2–3 eventos: elegir entre 10 y 14 s;
- narrativa completa: elegir entre 16 y 25 s;
- mínimo: 4 s; máximo absoluto: 30 s.

Los rangos anteriores sirven para decidir, no deben aparecer como salida. En
edición se hereda la duración del vídeo maestro. En extensión, fijar únicamente
la duración exacta del segmento añadido.

Si el material analizado dura, por ejemplo, 10,63 s y la salida es una nueva
generación, seleccionar 11 s y redistribuir sus planos sobre la rejilla de
0,50 s. Si es una edición conservadora que hereda el vídeo maestro, no declarar
una duración redondeada: indicar herencia y omitir timestamps innecesarios.

---

## Sintaxis y control de referencias

Los ejemplos de esta guía utilizan:

- `@Image1`, `@Image2`, etc.;
- `@Video1`, `@Video2`, etc.;
- `@Audio1`, `@Audio2`, etc.

Asignarlos obligatoriamente por tipo y orden de adjunto como `@Image1`,
`@Image2`, `@Video1`, `@Video2`, `@Audio1`, `@Audio2`. Esta asignación canónica
es binding determinista, no invención. El tipo y el índice forman una sola
variable: nunca insertar espacios entre ambos.
Cuando exista un handle, nunca sustituirlo por `the provided source video`,
`the provided image`, `the WAV audio` u otra descripción genérica.

Si una exportación muestra una etiqueta con espacio o un wrapper Markdown,
normalizarla antes de responder. Conservar el tipo de medio y el orden del
adjunto, pero entregar únicamente la variable compacta. Cualquier borrador con
whitespace interno en una referencia es inválido y debe reescribirse.

### Toda referencia necesita rol

El prompt debe declarar qué atributos aporta cada material y qué atributos no
deben heredarse. No confiar en textos o etiquetas presentes dentro de una
imagen y no pedir al modelo que deduzca qué persona, prop o escena representa.
Todos los adjuntos deben aparecer con `@`; si alguno se describe solo como
`source video`, `reference image` o `audio reference`, el prompt es inválido.
Escribir una línea de mapping por sujeto, prop, escena, vídeo o audio. No agrupar
varios materiales en frases como `images one through four define four characters`.
Si se crea un alias semántico, vincularlo en la misma línea:
`[CHARACTER_REFERENCE] corresponds to @Image1.` Un alias sin `@ImageN`,
`@VideoN` o `@AudioN` no vincula ningún archivo y es inválido.

### Plantilla de rol

```text
@Image1 defines <subject>'s <appearance, clothing, structure, or material>.
@Video1 defines <motion, camera movement, sequence, or pacing>.
@Audio1 defines <character or sound category>'s <voice, dialogue,
ambience, sound effect, or music>.

<Subject> completes <primary action or event> in <scene>.
The visuals feature <visual style>, with <camera treatment>.
```

### Herencia positiva y exclusiones

Cada mapping debe responder:

1. ¿Qué se hereda?
2. ¿Qué no se hereda?
3. ¿A qué sujeto o parte del resultado se aplica?

Ejemplo:

```text
@Image1 defines the ceramic artist's facial features, hairstyle, and dark
green apron. Do not use the image background.
@Image2 defines the wooden workbench, window placement, and morning light
of the pottery studio. Do not use the people in the image.
@Video1 defines the pacing of shaping clay with both hands, lifting the
cup, and placing it down. Do not use the person's identity, clothing, or
scene from the video.

The ceramic artist finishes a pale blue cup in the studio at dawn, lifts
it from the wheel, and places it in the center of a wooden shelf.
Begin with a medium shot, then slowly push in toward the cup's surface.
Retain the wheel sound, clay friction, and indoor ambience.
```

### Varias vistas del mismo sujeto u objeto

Declarar por separado cada vista y cerrar con una regla de instancia única.

```text
@Image1 defines the front view of the same folding desk lamp.
@Image2 defines the left-side structure of the same folding desk lamp.
@Image3 defines the right-side structure of the same folding desk lamp.
@Image4 defines the rear structure of the same folding desk lamp.
All four images define one folding desk lamp. The output contains exactly
one lamp throughout.
```

No permitir que distintas vistas creen varias copias.

### Vídeo de movimiento

Cuando un vídeo ya define correctamente acción, cámara y secuencia, declarar
solo los atributos que deben heredarse. Repetir toda la coreografía por texto
puede entrar en conflicto con el movimiento de referencia.

Un blockout o vídeo de movimiento no define automáticamente identidad, escena,
materiales ni estilo. Estos elementos deben especificarse mediante texto u
otras referencias.

---

## Creación multi-referencia

Orden recomendado:

```text
Define each material's role → Map subjects → Group by type →
Create subject profiles → Select references by scene
```

### Paso 1: Mapear cada sujeto individualmente

```text
<Character A> corresponds to @Image1. Use only the appearance, hairstyle,
and clothing.
<Character B> corresponds to @Image2. Use only the appearance, hairstyle,
and clothing.
<Prop A> corresponds to @Image3. Use only the structure, material, and color.
<Scene A> references @Image4. Use only the spatial layout, architecture,
and lighting. Do not use the people in the image.
```

No escribir “las imágenes 1–4 definen cuatro personajes respectivamente”. Esa
formulación no asigna de manera inequívoca cada material.

### Paso 2: Agrupar por tipo

```text
[Characters]
<Conservator> corresponds to @Image1. Use only the appearance, hairstyle,
and clothing.
<Registrar> corresponds to @Image2. Use only the appearance, hairstyle,
and clothing.
<Installer> corresponds to @Image3. Use only the appearance, hairstyle,
and clothing.
<Guide> corresponds to @Image4. Use only the appearance, hairstyle,
and clothing.
Do not interchange their appearances, clothing, actions, positions, or dialogue.

[Props]
<Sample Case> corresponds to @Image5 and belongs only to <Conservator>.
<Record Board> corresponds to @Image6 and belongs only to <Registrar>.

[Scenes]
<Conservation Lab> references @Image7. Use only the space, materials,
and lighting.
<Gallery> references @Image8. Use only the space, materials, and lighting.

[Motion and Audio]
@Video1 defines the motion of <Conservator> opening <Sample Case>. Do not
use the person or scene from the video.
@Audio1 defines <Guide>'s voice and specified dialogue.
```

### Paso 3: Perfil centralizado del sujeto

Cuando un personaje utiliza varias referencias en distintas escenas:

```text
[Subject Profile: Conservator]
Appearance and clothing: @Image1.
Fixed prop: <Sample Case> from @Image5.
Locations: <Conservation Lab> and <Gallery>.
Motion references: the case-opening motion from @Video1 and the
sample-placement motion from @Video2.
Do not use other characters' clothing. Do not give this character
<Record Board> or guide equipment.
```

Este perfil técnico de referencias complementa el perfil interpretativo de
ActingLabs; no lo sustituye.

### Paso 4: Seleccionar referencias por escena

```text
Scene 1 | Inspection in the Conservation Lab
Use: <Conservator>, <Sample Case>, <Conservation Lab>, and the case-opening
motion from @Video1.
Event: <Conservator> opens <Sample Case> at the workbench and inspects the
sample inside.
End state: <Conservator> remains on the inner side of the workbench.
<Sample Case> stays beside the conservator's right hand on the left side
of the frame.

Scene 2 | Registration in the Gallery
Use: <Registrar>, <Record Board>, and <Gallery>.
Event: <Registrar> checks the number on <Record Board> beside the display case.
End state: <Registrar> still holds <Record Board> with both hands. No other
character enters the display-case area.
```

La finalidad del sistema multi-referencia es seleccionar correctamente los
materiales necesarios en cada escena, no mostrar todos a la vez.

### Reglas de consistencia multi-referencia

- No intercambiar identidades, ropa, acciones, posiciones o diálogo.
- Fijar propiedad de cada prop.
- Definir cantidad exacta cuando haya riesgo de duplicación.
- Distinguir referencias de identidad, escena, estructura, movimiento y audio.
- Excluir fondos, personas o composiciones irrelevantes.
- Repetir el mapping cuando una nueva escena pudiera introducir ambigüedad.
- Mantener un sujeto como una misma instancia continua, sin dividirlo.

---

## Vídeos largos: etapas, estados finales y timing

Regla transversal: cuando haya dos o más cambios de estado importantes, usar
`[Stage N]`. Cada etapa contiene un único evento principal con `Initial state`,
`Primary event` y `End state`; la siguiente etapa declara qué permanece igual.
No fusionar varios eventos grandes en un párrafo continuo.

Para historias con varios eventos, dividir el vídeo en etapas consecutivas.
Cada etapa debe contener:

- estado inicial;
- un único evento o cambio principal;
- estado final directamente observable.

El estado final de una etapa se convierte en el estado inicial de la siguiente.

### Plantilla de vídeo largo

```text
[Generation Goal]
Generate a <video type>. The central subject is <subject>, and the primary
event is <story summary>.

[Stage 1]
Initial state: <initial state of characters, props, and scene>.
Primary event: <one primary action or event>.
End state: <character positions, prop ownership, or visible scene state>.

[Stage 2]
Continue from the previous stage: <state that must remain unchanged>.
Primary event: <one primary action or event>.
End state: <observable state>.

[Stage 3]
Primary event: <closing event>.
End state: <final visible state>.

[Maintain Consistency]
Keep <character identity, number of characters, clothing, prop ownership,
spatial direction, and audio relationships> consistent.
```

### Ejemplo

```text
[Generation Goal]
Generate an instructional video showing a flower shop's order-packing
process. <Florist> and <Store Assistant> arrange, wrap, and hand off one
bouquet together.

[Stage 1]
Initial state: <Florist> stands behind the workbench. Loose flower stems,
scissors, and wrapping paper lie on the tabletop.
Primary event: <Florist> arranges the stems and trims them to length.
End state: <Florist> holds the bouquet in the left hand, and the scissors
are back on the right side of the workbench.

[Stage 2]
Continue from the previous stage: both characters retain the same identities
and clothing, and <Florist> still holds the bouquet.
Primary event: <Store Assistant> unfolds the wrapping paper. <Florist>
places the bouquet inside and ties it with a green ribbon.
End state: the wrapped bouquet lies flat in the center of the workbench,
with the ribbon bow facing the camera.

[Stage 3]
Primary event: <Store Assistant> picks up the bouquet and places it on the
pickup shelf.
End state: the bouquet is centered on the pickup shelf, and both characters
stand behind the workbench inspecting the finished order.

[Maintain Consistency]
Keep both identities, clothing, workbench orientation, scissors position,
and bouquet ownership consistent.
```

### Cuándo usar stages y cuándo timestamps

Para narrativa ordinaria, usar etapas por defecto.

Usar precisión temporal solo para:

- entrega crítica de un objeto;
- entrada o salida;
- transición;
- corte o movimiento de cámara importante;
- beat explícito;
- sincronización de diálogo o sonido.

### Tres formas de timing

**Rango temporal:** asigna presupuesto a un evento.

```text
0.00-3.00 seconds: <event>.
3.00-7.00 seconds: <event>.
7.00-12.00 seconds: <event>.
```

**Punto exacto:** reserva un momento para un acontecimiento único.

```text
At 5 seconds, the camera whip-pans rapidly to the left and completes the
transition.
```

**Timing relativo:** define retraso entre eventos.

```text
Three seconds after the character presses the button, the room lights
gradually turn off.
```

### Reglas temporales

- Los rangos deben ser consecutivos y no solaparse.
- Cada límite termina en `.00` o `.50` y cada rango dura al menos 1,00 s.
- El timeline termina exactamente en la duración total, que es un segundo
  entero.
- Representan el presupuesto temporal, no un punto de edición frame-perfect.
- La acción puede adelantarse o retrasarse ligeramente respecto al límite.
- Limitar los timestamps a 1–3 beats realmente críticos; las etapas gobiernan
  el resto del flujo.
- Muy poco contenido concede más libertad al modelo.
- Demasiado contenido produce cortes excesivos u omisiones.
- No usar timestamps para exigir frecuencias físicamente inviables, como tres
  acciones completas en un segundo.
- Cada rango debe cerrar con un estado que pueda comprobarse visualmente.

---

## Speed ramps y cámara lenta dentro de una acción continua

La cámara lenta puede integrarse dentro de un plano continuo sin cortes si el
cambio de velocidad se vincula a eventos físicos concretos.

### Arquitectura recomendada

```text
[time range | base speed → slow-motion intensity]
The action is already in progress. At the exact instant <contact, grab,
collision, shatter, landing, explosion, or other trigger>, playback drops
to <slow-motion or suspended-time intensity>.
<Describe deformation, particles, cloth, debris, body reaction, and sound
stretch visible during the temporal change>.
The camera continues its existing path without a cut, hidden transition,
or reset. Playback returns to <next speed>, while every physical consequence
remains in the scene.
```

### Reglas

- Declarar al principio `one continuous take`, `no cuts` y `no transitions`
  cuando sean requisitos reales.
- Iniciar el rango con la acción ya en movimiento.
- Vincular el speed ramp a un trigger exacto, no a una intención abstracta.
- Describir qué se vuelve perceptible al ralentizar: deformación, nieve,
  gotas, fragmentos, tela, piel, armadura, polvo o shockwave.
- Mantener la trayectoria y el lado de cámara durante el cambio.
- Declarar el regreso a velocidad normal o a la siguiente velocidad.
- Preservar el resultado: heridas, objetos rotos, manos vacías, posiciones y
  partículas no se reinician al recuperar velocidad.
- Sincronizar el diseño sonoro con el evento: impacto, caída de tono, silencio
  suspendido o retorno a ambiente real, según la intención.

### Varios picos de cámara lenta

Cada pico debe cumplir una función distinta y tener su propio trigger. Evitar
ralentizar toda la secuencia de manera uniforme.

Ejemplo de progresión:

```text
[0.00-2.50s | real time → heavy slow motion]
Ramp during the camera orbit as the attacker becomes visible in mid-air.

[5.00-7.00s | slow motion → suspended impact peak]
At the exact instant the hand closes around the armor, particles and metal
deformation become suspended. Return to heavy slow motion for the lift.

[12.00-13.50s | suspended explosion peak]
At the exact instant the blast hits, hold the fireball, debris, silhouette,
and snow displacement through the full bloom.

[13.50-15.00s | return to real time]
The shockwave consequences continue as the subject loses balance and the
camera follows laterally without resetting.
```

Los valores de fps pueden expresar intensidad temporal, pero no garantizan una
captura técnica exacta. El resultado visible, el trigger y la continuidad son
controles más importantes que el número aislado.

### Propiedad y estado durante acción ralentizada

Para cada personaje y prop, fijar:

- mano asignada;
- dirección de fuerza;
- punto de contacto;
- estado antes del impacto;
- deformación o rotura;
- estado después del impacto;
- ausencia permanente si el objeto queda destruido.

La cámara lenta no debe introducir armas duplicadas, miembros adicionales,
teletransportes, cambios de tamaño o reapariciones.

---

## Parámetros bloqueados según la tarea

Algunas modalidades heredan automáticamente aspect ratio o duración.

| Tipo de tarea | Aspect ratio | Duración |
|---|---|---|
| Edición de vídeo | Conserva el ratio del vídeo de entrada; no puede configurarse por separado | Conserva aproximadamente la duración del vídeo; no puede configurarse por separado |
| Primer frame o primer+último frame | Usa automáticamente el ratio de la primera imagen | Puede configurarse |
| Extensión de vídeo | Conserva el ratio del vídeo de entrada; no puede configurarse por separado | Puede configurarse para el segmento extendido |

### Restricciones

- En edición, el procesamiento de frames puede producir una diferencia de hasta
  aproximadamente 0,3 segundos respecto al vídeo fuente.
- Las imágenes de primer y último frame deben compartir aspect ratio; si no,
  el último frame puede deformarse.
- Los parámetros bloqueados automáticamente no se presentan como editables.
- En edición no recomendar otro ratio ni otra duración, ni pedir al usuario que
  los elija: ambos se heredan automáticamente del vídeo maestro. No abrir el
  prompt con una duración, no añadirlos como parámetros y no repetirlos dentro
  de `[Content to Preserve]`; en esta modalidad no aportan señal útil.
- En extensión, el volumen del segmento nuevo puede diferir ligeramente del
  audio fuente.
- Los demás parámetros dependen de las opciones disponibles en la interfaz o
  API utilizada.

---

## Edición de vídeo

La edición parte de un **único vídeo maestro**. El prompt debe definir:

1. objetivo de edición;
2. rol del vídeo fuente;
3. rol del material objetivo;
4. alcance exacto;
5. contenido que debe preservarse.

Si el usuario dice `editar`, `mantener exactamente el mismo vídeo`, `cambiar
solo` o una formulación equivalente, elegir esta modalidad aunque también haya
imágenes y audios adjuntos. Esas referencias son materiales de sustitución; no
convierten la tarea en generación multi-referencia.

Nunca resumir los assets como `provided source video`, `male reference image`
o `provided audio`. Nombrar `@Video1`, `@Image1`, `@Audio1`, etc., en todas
las secciones donde gobiernen.

### Estructura obligatoria para edición conservadora multimodal

Cuando se sustituye identidad visual y/o voz manteniendo el vídeo original,
usar en este orden:

```text
[Edit Goal]
[Source Video Role]
[Target Reference Role]
[Edit Scope]
[Timeline Inheritance]
[Content to Preserve]
```

No reemplazar esta estructura por prosa genérica con encabezados inventados.
En sustitución conservadora no añadir `[Stage]`: `@Video1` ya es el timing
master. Usar stages únicamente cuando la edición introduce dos o más cambios de
estado nuevos que no existen en el source. La identidad visual y vocal se mapea
dentro de `[Target Reference Role]`, una línea independiente por material.

#### Formatos inválidos para esta modalidad

Un prompt puede ser detallado y seguir siendo incorrecto. Rechazar y reescribir
cualquier edición conservadora que:

- use la plantilla genérica `Style/Camera`, `Audio`, `Lighting`, `Location`,
  `Main Character`, `Scene Flow`, `Constraints`;
- inserte espacios dentro de `@Video1`, `@Image1` o `@Audio1`, o conserve un
  wrapper serializado en lugar de la variable compacta;
- use `[0s–END]` en lugar de heredar la duración conocida del vídeo maestro;
- mezcle el mapping de vídeo, imagen y audio dentro de descripciones generales;
- omita `[Source Video Role]`, `[Edit Scope]`, `[Timeline Inheritance]`,
  `[Target Reference Role]` o `[Content to Preserve]`;
- sustituya nombres oficiales por `[Male Identity Reference]`, `[Character
  Replacement]` u otros encabezados propios;
- añada `[Stage]`, duración o aspect ratio a una sustitución conservadora;
- añada un bloque masivo de negativas como sustituto del scope positivo;
- repita la lista completa de preservación en varias secciones;
- recomiende ratio o duración diferentes del vídeo fuente.

La validación no consiste en comprobar si “dice cosas correctas”, sino si usa
la arquitectura de edición de Seedance 2.5 y separa correctamente autoridades.

### Sustitución de presentador con identidad visual y vocal separadas

Aplicar tres autoridades sin mezclarlas:

```text
@Video1 = sole editing master: complete script, language, word order,
speaking times, pauses, performance, gestures, camera, cuts, environment,
and non-dialogue audio.

@Image1 = replacement presenter's visual identity only: face, hair, facial
anatomy, body identity, age, and recognizable likeness. Ignore its studio
background, pose, and composition. Multiple views define one person.

@Audio1 = replacement presenter's voice identity only: timbre, pitch range,
resonance, accent characteristics, articulation, and speaking texture.
It does not define script or timing.
```

Estas dos líneas pertenecen juntas a `[Target Reference Role]`. No crear bloques
alternativos llamados `[Character]` o `[Audio Reference]` para esta plantilla.

El diálogo procede exclusivamente de `@Video1`; `@Audio1` solo cambia quién
parece hablar. Mantener texto, idioma, orden, pausas, inicio/fin de cada frase y
ritmo del source. Sustituir solo la voz objetivo, conservar las demás voces y
todas las capas no dialogadas. Exigir lip-sync fonémico y ausencia de mezcla
entre la voz original y la nueva.

El personaje nuevo hereda posición, escala, profundidad, orientación, miradas,
gestos, contactos, oclusiones, entradas, salidas y timing del personaje
reemplazado. Si la imagen es una ficha multivista, declarar que todas sus vistas
representan una sola persona. La ropa se conserva del source o se adapta a su
rol según el encargo; no se hereda automáticamente de la imagen.

### Plantilla general

```text
[Edit Goal]
Edit @Video1. Within <the entire video or a specific time range>, <add,
remove, replace, or adjust> <visual object, region, or audio category>.

[Source Video Role]
@Video1 is the sole editing master. It defines <characters, scene, actions,
composition, camera movement, occlusion relationships, audio, and event order>.

[Target Material Role]
@Image1 or @Audio1 defines <specified attributes of the target object or sound>.

[Edit Scope]
Modify only <object, region, time range, or audio category>.

[Content to Preserve]
Keep <visual content, motion, audio, and timing relationships that must not
change> from @Video1.
```

### Ejemplo: modificación localizada

```text
[Edit Goal]
Edit @Video1. Only from 4.00-7.00 seconds, change the cool blue light on the
right wall to warm orange light.

[Source Video Role]
@Video1 is the sole editing master. It defines the character, room layout,
actions, composition, camera movement, audio, and event order.

[Edit Scope]
Change only the light color on the right wall and the area it illuminates.
Allow the character's skin tone to respond naturally to the environmental light.

[Content to Preserve]
Keep the character's identity, clothing, expression, position, motion, room
structure, camera movement, dialogue, and ambience from @Video1.
```

### Principio de mínima modificación

Describir primero lo que sí cambia. Después enumerar lo que debe permanecer.
No pedir una reinterpretación general si el objetivo es local.

---

## Sustitución de sujeto u objeto

Además del vídeo maestro, una sustitución necesita:

- referencia del elemento nuevo;
- cantidad exacta de instancias;
- área afectada;
- atributos que no deben heredarse de la referencia;
- herencia completa de la línea temporal del elemento original.

### Plantilla

```text
[Edit Goal]
Edit @Video1. Change only <original object> to <target object>.

[Source Video Role]
@Video1 is the sole editing master. It defines the original scene, camera
position, camera movement, motion path, occlusion relationships, and event order.

[Target Reference Role]
@Image1 defines <target object>'s <appearance, structure, or material>.
Do not use <irrelevant background, people, or composition>.

[Edit Scope]
Modify only <specific object and area>. The entire video contains <number>
target object(s). Do not modify <content to preserve>.

[Timeline Inheritance]
<Target object> inherits every appearance, motion, occlusion, and exit of
<original object>, including timing, duration, path, and speed changes.
Except for the object or area explicitly modified above, keep all other
people, props, scene content, camera movements, cuts, and event order from
@Video1 unchanged.
```

### Ejemplo

```text
[Edit Goal]
Edit @Video1. Replace only the yellow folding desk lamp with the white
folding desk lamp in @Image1.

[Source Video Role]
@Video1 is the sole editing master. It defines the desk, books, hand
movements, camera position, camera movement, occlusion relationships, and
event order.

[Target Reference Role]
@Image1 defines only the white folding desk lamp's appearance, structure,
and material. Do not use the image's background, composition, or other objects.

[Edit Scope]
Keep exactly one white folding desk lamp throughout. Replace only the
original yellow lamp. Do not modify the books, desk, hands, or background.

[Timeline Inheritance]
The white folding desk lamp inherits every appearance, arm rotation, hand
occlusion, and exit of the original lamp, including timing, path, and speed.
Except for that lamp, keep all people, props, scene content, camera movements,
cuts, and event order from @Video1 unchanged.
```

---

## Sustitución de fondo

La imagen de entorno debe controlar únicamente espacio, materiales, profundidad,
color ambiental y dirección de luz. No debe sustituir identidad, foreground ni
composición del vídeo maestro.

### Plantilla

```text
[Edit Goal]
Edit @Video1. Replace only <original background area> with <target
environment> from @Image1.

[Source Video Role]
@Video1 is the sole editing master. It defines the people, foreground
objects, actions, composition, camera movement, and event order.

[Target Reference Role]
@Image1 defines only <target environment>'s spatial layout, materials,
depth of field, ambient color, and lighting direction. Do not use the
people or foreground objects in the image.

[Edit Scope]
Modify only <background outside the subject's silhouette>. Do not modify
<subject identity, facial features, hairstyle, clothing, expression,
position, size, or motion>.

[Timeline Inheritance]
Keep the character actions and occlusion relationships from @Video1.
Except for the modified background, keep all other people, props, camera
movements, cuts, and event order unchanged.
```

Permitir que piel, ropa y superficies respondan naturalmente a la nueva luz
ambiental sin alterar la identidad o acción.

---

## Edición de audio

El diálogo, idioma, voz, música y efectos pueden modificarse por separado.
Declarar:

- hablante o categoría sonora;
- cambio deseado;
- intervalos si procede;
- contenido sonoro que debe mantenerse;
- elementos visuales que no deben cambiar.

### Eliminar música

```text
Edit @Video1. Remove only the original background music. Keep the
character dialogue, lip sync, ambience, and action sound effects. Preserve
the visuals, camera treatment, and editing rhythm from @Video1.
```

### Cambiar idioma

```text
Edit @Video1. Change <Presenter>'s spoken language to natural American
English while preserving the dialogue content and speaking times. Keep all
other character voices, background music, ambience, and visuals from @Video1.
```

### Reglas

- Mantener lip-sync y tiempos de habla cuando se conserve el contenido.
- No borrar ambiente o foley al retirar música.
- No modificar otras voces al editar un hablante.
- Reforzar idioma y variedad regional con la sintaxis de diálogo.
- Si se sustituye voz mediante audio, declarar exactamente qué atributos
  aporta `@AudioN`.

---

## Vídeo carrier utilizado únicamente para audio

Un vídeo visualmente negro o vacío puede utilizarse como contenedor de una
pista de audio. El prompt debe aislar de forma explícita ambos dominios:

```text
@Video1 is a blank black video carrying only the audio track.
Use ONLY its audio. Ignore its black visual content entirely.
```

Después hay que elegir uno de dos contratos incompatibles.

### Contrato A: Pista exacta

Usar cuando el audio ya está terminado y controla la generación.

```text
@Video1 is the sole authority for the exact audio track,
spoken dialogue, voice, accent, pauses, vocal delivery, ambience, and
synchronized sound-event timing.
Do not regenerate, rewrite, paraphrase, shorten, extend, or replace the
dialogue. Do not create a second voice. Synchronize lips, breathing,
gestures, object handling, and physical actions to the existing audio.
```

En este modo:

- el audio existente es timing master;
- el diálogo del prompt sirve para asignar hablante y significado, no para
  crear una versión alternativa;
- se conserva duración, pausa, ambiente y eventos sonoros;
- no se añade voz, música o narración no presentes;
- un timeline de audio puede especificar silencios y acciones exactas.

### Contrato B: Guía libre

Usar cuando la pista solo orienta voz, acento, energía, ritmo o estética sonora.

```text
Use only @Video1's audio as a loose stylistic and vocal guide,
not an exact track. Ignore its black visual content entirely. Inherit only
<voice, accent, energy, rhythm, impact style, ambience, or sound aesthetic>.
```

En este modo:

- se puede generar una mezcla nueva;
- la pista no obliga a coincidir exactamente frame a frame;
- hay que enumerar qué atributos se heredan;
- el prompt define qué voces, rugidos, música o efectos están permitidos.

### Música existente como timing master

Cuando el carrier aporta música terminada:

```text
Use ONLY @Video1's existing audio. Preserve its exact music,
rhythm, tempo, beat structure, transitions, accents, dynamic changes, and
overall timing. Ignore the video's visual content. Do not regenerate or
replace the music. Synchronize every visual cut to an existing beat,
percussion hit, accent, or rhythmic change.
```

Se pueden añadir efectos naturales debajo o alrededor de la música, pero sin
sustituirla ni dominarla.

### Restricción crítica

Nunca mezclar `exact track` y `loose guide` dentro del mismo contrato. Si
distintas categorías necesitan comportamientos diferentes, declararlas por
separado: por ejemplo, música exacta con Foley nuevo.

---

## Extensión de vídeo

La extensión crea contenido fuera del límite del vídeo fuente. El frame de
frontera controla la unión:

- extensión hacia delante: el primer frame nuevo continúa el último frame del
  vídeo fuente;
- extensión hacia atrás: el último frame nuevo alcanza el primer frame del
  vídeo fuente.

Además del frame, comprobar continuidad de:

- identidad y ropa;
- pose y orientación;
- props, cantidad y propiedad;
- fondo y relaciones espaciales;
- posición de cámara y composición;
- iluminación;
- eje y dirección del movimiento;
- tendencia sonora.

Los frames de frontera deben conectar visualmente, pero no se garantiza que
sean idénticos píxel a píxel.

### Extensión hacia delante

Primero describir el estado continuo del último frame. Después describir el
nuevo evento.

```text
@Video1 is the source video to extend forward.

Extend @Video1 forward. The first frame of the extended segment directly
continues from the last frame of @Video1. Maintain continuity in <subject
pose and orientation>, <prop position>, <background and spatial
relationships>, <camera position and composition>, <lighting>, and
<motion direction>.

Then, <new action, event, camera treatment, or audio>.

Throughout the extension, maintain continuity in <character identity and
clothing>, <key props>, <background layout>, and <axis of action>.
Keep each subject as the same continuous instance throughout: do not
duplicate or split it, and keep the person's appearance or the object's
number of parts stable.
```

### Ejemplo

```text
@Video1 is the source video to extend forward.

Extend @Video1 forward. The first frame of the extended segment directly
continues from the last frame of @Video1. Maintain the same locked-off
medium shot, the orange paper airplane's position and orientation, the
classroom-window background, afternoon lighting, and movement toward the
right side of the frame.

Then, the same orange paper airplane continues gliding right and exits the
frame while the white curtain beside the window sways slightly. Keep the
camera and classroom background in the state established by the source
video's last frame.
```

### Extensión hacia delante con materiales adicionales

Definir primero el rol de cada material. El vídeo fuente sigue controlando la
frontera; las referencias nuevas no pueden reemplazar su composición inicial.

```text
@Image1 defines <Character A>'s facial features.
@Image2 defines <Character A>'s clothing.
@Image3 defines <key prop>'s structure and material.
@Video1 is the source video to extend forward.

Extend @Video1 forward. The first frame of the extended segment directly
continues from the last frame of @Video1. Maintain continuity in
<boundary-frame state>.

Then, <Character A uses the key prop to complete a new action or event>.

Throughout the extension, maintain continuity in <character identity and
clothing>, <key prop>, <background layout>, and <axis of action>.
Keep each subject as one continuous instance; do not duplicate, split, or
change its number of parts.
```

### Extensión hacia atrás

Describir primero lo que sucede antes del vídeo. Después definir el primer
frame del vídeo fuente como estado final explícito del nuevo segmento.

Es insuficiente escribir únicamente “connect to the source video”: puede hacer
que personajes o efectos posteriores aparezcan antes de tiempo o que la imagen
siga cambiando después de alcanzar el estado objetivo.

```text
@Video1 is the source video to extend backward.

Extend @Video1 backward. Before the source video begins, <preceding action,
event, camera treatment, or audio>.

The last frame of the extended segment naturally connects to the first
frame of @Video1: <subject pose and orientation>, <prop position>, and
<background and spatial relationships>. Match the <camera position and
composition>, <lighting>, and <motion direction> of @Video1's first frame.

Throughout the extension, maintain continuity in <character identity and
clothing>, <key props>, <background layout>, and <axis of action>.
Keep each subject as one continuous instance; do not duplicate, split, or
change its number of parts.
```

### Extensión hacia atrás con materiales adicionales

Declarar qué materiales aparecen durante la precuela y cuáles solo deben
aparecer después de comenzar el vídeo fuente.

```text
@Image1 defines <Character A>'s facial features.
@Image2 defines <Character A>'s clothing.
@Image3 defines <key prop>'s structure and material.
@Video1 is the source video to extend backward.

Extend @Video1 backward. Before the source video begins, <Character A
completes a preceding action or event>.

The last frame of the extended segment naturally connects to the first
frame of @Video1: <Character A's pose and orientation>, <key prop's
position and state>, and <other characters' positions>. Match the
<background and spatial relationships>, <camera position and composition>,
<lighting>, and <motion direction> of @Video1's first frame.

<Materials that should appear only after the source video begins> must not
appear early in the backward extension.
```

### QA de frontera

Revisar ambos lados de la unión y el segmento completo:

- pose, mirada y orientación;
- posición y estado de props;
- número de sujetos y piezas;
- composición;
- dirección de movimiento;
- luz y exposición;
- fondo;
- audio y volumen;
- ausencia de elementos que pertenecen al futuro.

---

## Primer y último frame con referencias adicionales

En modo multimodal puede declararse en la primera línea que una imagen es el
primer frame y otra el último. No es necesario activar un modo separado si la
interfaz admite esta asignación mediante referencias.

El aspect ratio queda fijado por la primera imagen. La duración se configura
fuera del prompt. Primera y última imagen deben tener el mismo ratio.

### Plantilla

```text
@Image1 is the first frame. It defines the opening composition, subject
position, pose, prop state, scene, and camera direction.
@Image2 is the last frame. It defines the ending composition, subject
position, pose, prop state, scene, and camera direction.
@Image3 defines <Subject A>'s <appearance, clothing, structure, or material>.
Do not change the first-frame composition defined by @Image1 or the
last-frame composition defined by @Image2.
@Image4 defines <specified attributes> of <Subject B, prop, or scene>.
Do not change the first-frame composition defined by @Image1 or the
last-frame composition defined by @Image2.

<Describe one continuous action or event>.
The video begins naturally from the first frame defined by @Image1 and
reaches the last frame defined by @Image2 after the continuous action.
Between the first and last frames, maintain continuity in <character
identity, prop structure and ownership, scene layout, and camera direction>.
```

### Reglas críticas

- Describir cada imagen ancla por separado.
- No escribir únicamente “the first two images are the first and last frames”.
- La primera imagen controla composición inicial, no solo estética.
- La última imagen controla composición final, no solo destino narrativo.
- Las referencias adicionales solo suplementan atributos concretos.
- Las referencias adicionales no pueden sustituir las composiciones ancla.
- Describir una acción continua y físicamente ejecutable entre ambos estados.
- Mantener identidad, cantidad, estructura, propiedad, escena, luz y eje.

### Ejemplo

```text
@Image1 is the first frame. It defines the opening composition, character
positions, poses, tabletop prop states, workshop scene, and camera direction.
@Image2 is the last frame. It defines the ending composition, character
positions, poses, tabletop prop states, workshop scene, and camera direction.
@Image3 defines <Perfumer>'s face, hairstyle, and dark green apron. Do not
change the first-frame composition from @Image1 or the last-frame
composition from @Image2.
@Image4 defines <Glass Bottle>'s shape, material, and label position. Do
not change either anchor composition.

Starting from the first-frame pose, <Perfumer> picks up a dropper and
<Glass Bottle>, adds amber fragrance oil, swirls it gently, closes the
stopper, places the finished bottle in the center of the table, and
naturally reaches the last frame defined by @Image2.
Between the first and last frames, maintain <Perfumer>'s identity and
clothing, bottle count and structure, table layout, warm side lighting,
and camera direction.
```

---

## Secuencia con múltiples keyframes

Cuando varias imágenes definen etapas de un proceso, empezar con la instrucción:

```text
Use @Image1 through @ImageN as keyframes in this order.
```

Después describir el estado clave de cada imagen. Los keyframes controlan orden
y estados, pero no reproducen cada frame intermedio de forma exacta.

Las imágenes independientes suelen alinearse mejor que una cuadrícula con
varios keyframes combinados.

### Plantilla

```text
Use @Image1 through @ImageN as keyframes in this order.

@Image1 is the first frame. It defines <opening composition, subject
position, pose, prop state, and camera direction>.
@Image2 defines the second keyframe: <visible end state of Stage 1>.
@Image3 defines the third keyframe: <visible end state of Stage 2>.
@ImageN is the last frame. It defines <ending composition, subject
position, pose, prop state, and camera direction>.

The video passes through the states defined by @Image1, @Image2,
@Image3, and @ImageN in order, using continuous action to transition
naturally between stages.
Maintain continuity in <subject identity, prop structure and ownership,
scene layout, lighting, and axis of action> throughout.
```

### Reglas

- Cada imagen define un estado, no una colección de instrucciones vagas.
- Declarar primer frame y último frame explícitamente.
- Describir cada keyframe intermedio como final visible de una etapa.
- Mantener dirección y velocidad continuas entre estados cuando proceda.
- No intercambiar props, identidades o ejes.
- No esperar reproducción exacta de todos los frames intermedios.

---

## Storyboard grids

Una cuadrícula de storyboard comunica:

- estructura general;
- orden de planos;
- composiciones aproximadas;
- acciones principales.

No sirve para reproducir estrictamente cada detalle de todos los paneles.

### Preparación recomendada

- máximo aproximado de 15 paneles;
- line art limpio o diagramas simples;
- pocas etiquetas de texto;
- lectura inequívoca;
- evitar elementos visuales que puedan confundirse con el estilo final.

### Plantilla

```text
@Image1 provides an <N-panel storyboard grid> for shot order and
approximate composition. Read it <left to right, top to bottom>. Do not use
the grid's <line-art style, text labels, or placeholder characters>.
@Image2 defines <Subject A>'s <appearance and clothing>.
@Image3 defines <key prop or scene>'s <structure, material, or lighting>.

Shot 1: <shot size, subject action, and scene state>.
Shot 2: <shot size, subject action, camera movement, or transition>.
...
Shot N: <closing action and final visible state>.

The final video uses <visual style>. Audio includes <dialogue, ambience,
action sound effects, or music>.
```

### Reglas

- Declarar orden de lectura.
- Separar rol narrativo del storyboard y aspecto final.
- Excluir line art, textos y personajes provisionales.
- Definir para cada panel plano, acción y estado.
- Añadir referencias separadas para identidad, prop, escena o material.
- Declarar estilo final y audio fuera de la referencia del storyboard.

---

## Blockouts: diagnóstico previo

Antes de escribir el prompt, clasificar el blockout:

| Tipo | Función | Material recomendado | Foco del prompt |
|---|---|---|---|
| Grueso | Movimiento, trayectorias, blocking, cámara, cortes, luz o ritmo | Geometría simple con relaciones claras y acción completa | Mapear cada forma y especificar qué información temporal/espacial heredar |
| Fino | Estructura completa que necesita nuevos personajes, materiales, colores, escena o estilo | Modelo limpio y completo | Preservar estructura, acción y cámara; definir atributos a rerenderizar |

### Blockout grueso

Puede controlar:

- trayectoria;
- dirección de movimiento;
- blocking;
- entradas y salidas;
- posición, ruta y velocidad de cámara;
- puntos de corte;
- cambios de luz;
- ritmo sonoro.

Mapear cada objeto geométrico al sujeto final. Brazos, alas u otros apéndices
solo deben aparecer si la acción está resuelta por completo; de lo contrario,
pueden producir rigidez o interpretaciones estructurales erróneas.

#### Plantilla

```text
@Video1 is a coarse blockout reference. It provides only <motion paths,
subject blocking, camera position, camera movement, cuts, lighting changes,
sound rhythm, or spatial relationships>. Do not use its blockout appearance,
materials, or scene.
<Blockout Subject A> in @Video1 corresponds to <Subject A>.
<Blockout Subject B or geometric prop> in @Video1 corresponds to
<Subject B or key prop>.
@Image1 defines <Subject A>'s <appearance, clothing, or structure>.
@Image2 defines <attributes> of <Subject B, key prop, or scene>.

<Subject> completes <primary action or event> in <scene>.
Keep <motion path, blocking, camera movement, cuts, lighting, or sound
rhythm> from @Video1.
The final video uses <characters, scene, materials, and visual style>.
Audio includes <dialogue, ambience, or action sound effects>.
```

### Blockout fino

Ya contiene estructuras completas. Debe estar limpio de:

- líneas de trayectoria;
- ejes de coordenadas;
- controles;
- frustums de cámara;
- marcadores de producción.

#### Plantilla

```text
@Video1 is a fine blockout reference. Preserve <subject structure, action,
spatial layout, camera position, camera movement, and cuts>. Do not use its
original gray materials or empty background.
@Image1 defines <subject>'s <character appearance, material, color, or
surface details>.
@Image2 defines <scene>'s <space, materials, lighting, or visual style>.

Re-render <subject> from @Video1 as <final subject>, and re-render the
scene as <final scene>.
Keep <structure, action, camera treatment, and spatial relationships> from
@Video1. Use <materials, colors, and style>. Audio includes <ambience,
sound effects, or music>.
```

### Diferencia crítica

- Grueso: heredar esqueleto temporal y espacial; reemplazar apariencia.
- Fino: heredar estructura completa, acción y cámara; cambiar superficies,
  identidad visual, entorno o estilo.
- Nunca pedir al modelo que deduzca cuál de las dos funciones cumple el vídeo.

---

## Montaje automático a partir de imágenes

Este flujo organiza varias imágenes (y opcionalmente un vídeo de estilo) en un
vídeo completo con ritmo y packaging consistentes.

Orden obligatorio de decisiones:

```text
Material Roles → Image Order → Motion Amount → Editing Style →
Visual Treatment → Audio
```

No es suficiente pedir “turn these materials into a video”.

### Plantilla

```text
[Material Roles]
@Image1 is used for <character, product, scene, or opening image>.
@Image2 is used for <character, product, scene, or process image>.
@Image3 is used for <character, product, scene, or ending image>.
@Video1 is used only for <editing rhythm, transitions, subtitle treatment,
or music style>. Do not use its character identities or scene. (Optional)

[Arrangement]
Show the images in <upload order, specified order, or model-selected thematic
order>.
<State character, product, location, and event relationships that must
remain consistent>.

[Image Motion]
Apply <subtle live motion, parallax, push-in/pull-out, lateral movement, or
local action> to each image.
Keep <subject appearance, product structure, text, or background
relationships> stable.

[Final Style]
Use <editing rhythm, transition style, subtitle or graphic treatment, and
color style>.

[Audio]
Include <dialogue, ambience, sound effects, or music>.
```

### Ejemplo

```text
[Material Roles]
@Image1 defines the night-market entrance and opening environment.
@Image2 defines <Traveler> walking along the street.
@Image3 defines the lantern stall and craft details.
@Image4 defines three friends eating together.
@Image5 defines the riverside night view and reflections.
@Image6 defines the final group photo by the bridge.
@Video1 defines only the light editing rhythm, hand-drawn edge graphics,
and transition style. Do not use its character identities or locations.

[Arrangement]
Show @Image1 through @Image6 in order: arrival, street exploration,
dinner, riverside walk, and group photo. Keep the three friends'
appearances and clothing consistent. Do not mix their identities.

[Image Motion]
Use slow push-ins and subtle parallax for environment images. Add only
natural blinking, head turns, glass-raising, and slight clothing movement
to character images. Keep stall structure, table position, and bridge
railing stable.

[Final Style]
Use an upbeat travel-video rhythm. Connect scenes with natural occlusion and
similar colors. Keep the hand-drawn graphics at the frame edges.

[Audio]
Retain night-market chatter, light dish sounds, and riverside wind, with
upbeat but unobtrusive instrumental music.
```

### Reglas

- Si el orden importa, escribir la secuencia exacta.
- Si puede decidirse libremente, autorizar organización temática.
- Nombrar y mapear cada personaje o producto por separado.
- Definir cuánto se anima cada imagen.
- Proteger identidad, estructura de producto, textos y relaciones de fondo.
- Una referencia de estilo no debe aportar personajes o localizaciones.

---

## Transición continua entre dos vídeos

Una transición sin costuras genera contenido puente. No es un empalme de
edición píxel a píxel.

Orden de construcción:

```text
Before Video → After Video → Trigger Action → Camera Movement →
Visual Transformation → Arrival State → Audio Transition
```

### Métodos posibles

| Método | Qué especificar |
|---|---|
| Dive o movimiento inverso | Dirección de cámara, cambio de velocidad y momento de entrada a la nueva escena |
| Rotación de personaje | Pose, dirección de giro y transformación continua de ropa o fondo |
| Oclusión de foreground | Momento en que el objeto llena el frame y composición que aparece después |
| Morph de objeto | Formas correspondientes, materiales y proceso de transformación |
| Push/pull o cambio de foco | Movimiento, objetivo de foco y relación espacial continua |

### Plantilla

```text
@Video1 is the before-transition clip. Use its <ending subject, action,
composition, camera direction, and audio>.
@Video2 is the after-transition clip. Use its <opening subject,
composition, camera direction, and audio>.
Keep <character identity, product structure, scene, and primary action>
stable in the original portions of @Video1 and @Video2.

At the end of @Video1, <subject or foreground object> triggers the
transition through <action>.
The camera <movement direction and speed change>, while <shape, material,
light, or space> gradually transforms into <corresponding element> at the
start of @Video2.
The transition ends naturally at @Video2's opening composition,
preserving continuity in <subject position, camera direction, and motion trend>.
Audio transitions smoothly from <before audio> to <after audio>.
```

### Ejemplo

```text
@Video1 is the before-transition clip. Use its rainy night street, red
umbrella, slow push-in, and rain sound.
@Video2 is the after-transition clip. Use its circular gallery skylight,
upward camera movement, and quiet interior reverberation.
Keep the people, street, gallery structure, and primary actions stable in
the original portions of both videos.

At the end of @Video1, the red umbrella approaches the camera and fills
the entire frame, triggering the transition. The camera continues forward.
The umbrella's circular edge becomes the skylight's metal ring, and the red
fabric transforms into white daylight passing through the skylight.
The transition reaches @Video2's upward-looking opening composition while
the movement changes smoothly from forward travel to an upward rise.
The rain fades gradually into footsteps reverberating inside the gallery.
```

### Reglas

- Proteger las porciones originales de ambos vídeos.
- Definir un trigger visible.
- Describir correspondencia de forma, material, luz o espacio.
- Mantener tendencia de cámara y movimiento en la llegada.
- Diseñar continuidad sonora, no solo visual.
- No prometer preservación idéntica píxel a píxel.

---

## Dirección emocional y actuación observable

Palabras como `tense`, `warm` u `oppressive` aportan dirección general, pero
dejan libertad interpretativa. Para controlar la actuación, añadir señales
visibles o audibles:

- movimiento ocular;
- tensión de cejas;
- boca o mandíbula;
- respiración;
- objetivo de mirada;
- manos;
- postura;
- cambio de ritmo o voz.

Para una sola transición emocional bastan normalmente **2–4 señales claras**.
No listar cada músculo facial. Usar etapas disparadas por eventos solo cuando la
emoción cambia varias veces.

### Transición emocional única

```text
The overall emotion shifts from <starting emotion> to <ending emotion>.
After <triggering event>, <subject> first shows <immediate observable reaction>.
Then, <eyes, brows, mouth, breathing, gaze, or hand movement> gradually changes.
Finally, <subject> expresses <target emotion> through <restrained or explicit
outward behavior>.
```

### Progresión multi-etapa

```text
When <subject> hears or sees <first trigger>, <first observable reaction>.
When <second trigger> occurs, <change in expression, gaze, or breathing>.
After confirming <critical information>, the emotion that <subject> tries
to restrain or conceal gradually becomes visible through <observable behavior>.
Finally, <subject's final action, expression, or manner of speaking>.
```

### Ejemplo

```text
Applause marking the end of the performance comes from behind the stage.
The young actor's fingers stop on the program, the gaze turns slowly toward
the curtain, and the shoulders remain tense.
After confirming that the curtain call is over, the actor exhales softly.
The shoulders gradually relax, a restrained smile appears, and the eyes
slowly well with tears, but the actor never turns to leave.
```

ActingLabs debe aportar objetivo, obstáculo, táctica, beats y subtexto. Esta
sección traduce después esa interpretación a cues que Seedance 2.5 pueda
representar de forma estable.

---

## Lenguaje cinematográfico reconocido

Los términos comunes pueden escribirse directamente. Cuando un término sea
poco frecuente, ambiguo o requiera precisión, añadir:

- sujeto al que se aplica;
- cambio visible;
- relación foreground/background;
- dirección;
- velocidad;
- estado final.

### Lenguaje básico

| Categoría | Términos comunes |
|---|---|
| Tamaño de plano | `extreme wide shot`, `wide shot`, `medium shot`, `close-up`, `extreme close-up` |
| Movimiento | `push in`, `pull out`, `pan`, `lateral move`, `follow shot`, `orbit`, `dive`, `dolly out`, `tilt up`, `handheld shake` |
| Posición/punto de vista | `low angle`, `overhead view`, `first-person view` |

### Técnicas populares

| Técnica | Qué especificar |
|---|---|
| One-take | Sujetos, espacios y eventos que la cámara atraviesa en orden |
| Dolly zoom | Tamaño del sujeto que se conserva y si el fondo parece acercarse o alejarse |
| Aerial view | Altura, dirección y área del entorno que se revela |
| FPV | Ruta en primera persona, velocidad y giros |
| Bullet time | Acción que se congela o ralentiza y dirección de órbita |
| Handheld | Sujeto seguido y cantidad de shake |
| Bounce speed ramp | Puntos de aceleración, desaceleración o rebote y estado final |

Con varios sujetos, especificar siempre cuál sigue o rodea la cámara, dónde
empieza el movimiento y dónde termina.

### Términos poco comunes

Usar:

```text
Cinematography Term + Target Subject + Visible Change +
Foreground/Background Relationship + Direction or Speed
```

Ejemplo:

```text
Rack focus: shift focus smoothly from the leaves in the foreground to the
person in the background. The leaves gradually blur while the person's
face changes from soft to sharp.
```

Para una transición precisa, añadir trigger temporal, objeto oclusor, dirección
de cámara, método y composición/tendencia que debe continuar.

### Ejemplos de resultado visible

```text
Shallow-depth-of-field portrait: keep <Pastry Chef>'s eyes and face sharp
while the glass jars and lights in the background become soft circular bokeh.

Tracking shot: move horizontally at the same speed as <Skateboarder>,
keeping the subject sharp while the roadside wall forms horizontal motion
blur from right to left.

Golden hour: warm low-angle sunlight enters from behind and camera-left of
<Hiker>, casting long shadows across the ridge.

Natural vignette: darken the four corners gradually while keeping the
brightness and skin tone of <Pianist> natural, without a black border.

Whip-pan transition: at 5 seconds, move the camera rapidly to the left. Cut
when the foreground bookshelf fully covers the frame, then continue left
at a similar speed in the next scene.
```

Apertura, focal y shutter pueden incluirse, pero el resultado visible suele ser
más claro y fiable que el valor numérico aislado. Aplicar siempre los principios
ópticos de CineLabs.

---

## Proceso de construcción del prompt

### 1. Identificar la tarea

- generación;
- multi-referencia;
- vídeo largo;
- edición;
- extensión;
- keyframes;
- storyboard;
- blockout;
- montaje de imágenes;
- transición entre vídeos.

### 2. Inventariar materiales

Para cada archivo:

- identificador canónico compacto;
- tipo;
- sujeto o categoría;
- atributos que aporta;
- atributos que se excluyen;
- escenas donde se utiliza;
- posibles conflictos.

### 3. Mapear entidades

Nombrar individualmente:

- personajes;
- productos;
- props;
- escenas;
- movimientos;
- voces;
- categorías sonoras.

### 4. Definir estados

- estado inicial;
- cambio principal por etapa;
- estado final;
- continuidad hacia la siguiente etapa;
- propiedad y cantidad de props;
- dirección y eje.

### 5. Traducir CineLabs y ActingLabs

- convertir blocking, óptica y cámara al lenguaje aceptado;
- conservar física y luz como resultados observables;
- expresar la actuación con 2–4 cues por transición;
- no sobrecargar el prompt con el razonamiento completo de las bases generales.

### 6. Añadir audio

- asignar hablantes;
- reforzar idioma;
- separar música, SFX, diálogo y subtítulos cuando sea necesario;
- preservar o excluir categorías en tareas de edición;
- verificar continuidad en extensión y transición.

### 7. Añadir constraints locales

Especialmente:

- no mezclar identidades;
- no duplicar instancias;
- no intercambiar props;
- no heredar fondos o personas irrelevantes;
- no alterar vídeo maestro fuera del alcance;
- no cambiar composiciones de first/last frame;
- no introducir temprano elementos de una extensión posterior.

Las restricciones críticas se escriben inline dentro de la etapa donde aparece
el riesgo, además del bloque general cuando proceda. Contactos, propiedad de
props, exclusividad espacial y cambios de estado no deben quedar solo al final.

### 8. Eliminar redundancia

- No repetir por texto una acción ya definida correctamente por un vídeo.
- No describir parámetros configurados en la interfaz.
- No pedir que todas las referencias aparezcan simultáneamente.
- No duplicar la misma regla en varias secciones salvo riesgo real.
- Repetir el bloqueo de identidad cuando sea frágil sí es señal útil; repetir la
  lista completa de cámara, escena, timing y audio en tres secciones es bloat.
- En edición, repartir la señal: autoridad en `[Source Video Role]`, cambio en
  `[Edit Scope]`, herencia en `[Timeline Inheritance]` y preservación restante
  una sola vez en `[Content to Preserve]`.

---

## QA específico antes de entregar

### Objetivo y estructura

- ¿Está claro el sujeto y la acción/evento principal?
- ¿Se ha elegido exactamente una de las ocho familias de tarea?
- ¿La estructura corresponde a esa modalidad?
- ¿Los parámetros de generación están fuera del prompt?
- Si la duración es configurable, ¿es un número fijo y no un rango?

### Referencias

- ¿Cada adjunto aparece dentro del prompt mediante un handle con `@`?
- Si la interfaz no mostró IDs, ¿se asignaron `@ImageN`, `@VideoN` y
  `@AudioN` por tipo y orden?
- ¿Cada material declara qué usar y qué no usar?
- ¿Cada personaje, producto y prop está nombrado y vinculado individualmente?
- ¿Se conserva la variable canónica compacta de cada referencia?
- ¿Las referencias se seleccionan por escena?
- ¿Varias vistas declaran que representan una sola instancia?
- ¿Propiedad y cantidad de objetos están fijadas?

### Vídeo largo

- Con dos o más cambios de estado, ¿se usan stages?
- ¿Cada etapa contiene un único cambio principal?
- ¿Cada etapa termina con un estado visible?
- ¿El siguiente estado continúa el anterior?
- ¿Los rangos son consecutivos y no se solapan?
- ¿Los timestamps se usan como presupuesto y no como precisión frame-perfect?
- ¿Se limitan a 1–3 beats críticos?
- Si hay cámara lenta, ¿cada cambio de velocidad tiene trigger, resultado
  visible, continuidad de cámara y retorno explícito?

### Consistencia

- ¿Se mantienen identidad, número de personajes y ropa?
- ¿Se mantiene propiedad de props?
- ¿Las relaciones espaciales y dirección de acción son consistentes?
- ¿Los sujetos permanecen como instancias únicas y no se dividen?
- ¿Los objetos conservan su número de piezas?

### Edición

- ¿Existe un único vídeo maestro?
- ¿Se nombra como `@Video1` o mediante el handle exacto, nunca como
  `provided source video`?
- ¿Se define el alcance exacto?
- ¿Se usan exactamente `[Edit Goal]`, `[Source Video Role]`, `[Target Reference
  Role]`, `[Edit Scope]`, `[Timeline Inheritance]` y `[Content to Preserve]`?
- ¿Se declara la cantidad del objeto objetivo?
- ¿El elemento nuevo hereda timing, trayectoria, oclusión y salida?
- ¿Se enumera qué contenido debe preservarse?
- ¿Se omiten stages, ratio y duración en una sustitución conservadora?
- ¿La lista completa de preservación aparece una sola vez?

### First/last frame y keyframes

- ¿Cada imagen ancla tiene rol separado?
- ¿Primera y última imagen usan el mismo aspect ratio?
- ¿Las referencias adicionales no sustituyen composiciones ancla?
- ¿Los estados aparecen en el orden indicado?
- ¿La acción que los conecta es continua y ejecutable?

### Extensión

- ¿Se ha descrito el frame de frontera?
- ¿Se conserva pose, prop, fondo, cámara, luz y dirección?
- ¿La continuidad sonora está controlada?
- ¿Los materiales que pertenecen al vídeo original se mantienen fuera de la
  precuela cuando deben aparecer más tarde?

### Storyboard y blockout

- ¿El storyboard declara orden de lectura y elementos que no deben heredarse?
- ¿Se ha clasificado el blockout como grueso o fino?
- ¿Se especifica qué información temporal, estructural, material y estilística
  se hereda?
- ¿El blockout está libre de marcadores de producción cuando debe usarse como
  estructura fina?

### Montaje y transición

- ¿El montaje define roles, orden, cantidad de movimiento, edición, estilo y audio?
- ¿La transición define ambos vídeos, trigger, transformación y estado de llegada?
- ¿La transición sonora acompaña a la visual?

### Actuación, cámara y audio

- ¿Las emociones abstractas se traducen a 2–4 cues observables?
- ¿Los términos cinematográficos ambiguos incluyen resultado visible?
- ¿Cada diálogo tiene hablante, idioma y llaves?
- ¿Música, efectos, diálogo y subtítulos usan la sintaxis correcta cuando se
  necesita separación explícita?
- ¿Las restricciones críticas aparecen inline en la etapa del riesgo?
- Si un vídeo se usa solo por su audio, ¿se ignora expresamente su imagen?
- ¿Se ha elegido claramente entre pista exacta y guía libre?
- Si la música es timing master, ¿los cortes siguen beats ya existentes y el
  Foley queda subordinado?

Si alguna respuesta es negativa, corregir antes de entregar.

---

## Limitaciones que deben comunicarse con precisión

- Los timestamps distribuyen tiempo entre eventos; no son puntos de edición
  frame-perfect.
- La edición puede mejorar la coincidencia con acontecimientos críticos del
  vídeo fuente, pero no garantiza superposición frame a frame.
- Multi-referencia sirve para seleccionar y combinar los materiales correctos,
  no para hacer que todos aparezcan simultáneamente.
- Subtítulos, fórmulas, rótulos, especificaciones de producto o timing a nivel
  de frame que deban ser totalmente exactos requieren referencias preparadas y
  posible postproducción.
- La edición bloquea ratio y duración aproximada del vídeo fuente. La salida
  puede diferir hasta aproximadamente 0,3 segundos.
- First-frame y first+last-frame bloquean el ratio a la primera imagen; la
  duración puede configurarse. Ratios distintos pueden deformar el último frame.
- La extensión bloquea el ratio del vídeo fuente; la duración del segmento sí
  puede configurarse. El volumen puede variar ligeramente.
- En montaje de imágenes, orden y mapping deben declararse si importan.
- Las transiciones continuas buscan coherencia visual y sonora, no preservación
  idéntica de ambos vídeos.
- Los resultados varían según materiales, complejidad y parámetros.

---

## Matriz de diagnóstico rápido

| Síntoma | Causa probable | Corrección |
|---|---|---|
| Se mezclan personajes | Mapping colectivo o ambiguo | Nombrar y vincular cada sujeto por separado; prohibir intercambio |
| Aparecen fondos de referencias de identidad | Falta de exclusión | Añadir `Do not use the image background` |
| Una vista crea varios objetos | No se declaró instancia única | Indicar que todas las vistas definen el mismo objeto y fijar cantidad exacta |
| Un vídeo de movimiento cambia identidad/escena | Rol del vídeo demasiado amplio | Heredar solo movimiento/cámara/ritmo y excluir persona, ropa y escena |
| Todas las referencias aparecen juntas | No hay selección por escena | Crear perfiles y bloque `Use:` específico para cada escena |
| Acción larga se comprime | Demasiados cambios por etapa | Un cambio principal por stage y estado final claro |
| Eventos se omiten | Rango temporal sobrecargado | Reducir acciones o ampliar presupuesto temporal |
| Edición altera todo el clip | Vídeo maestro o scope ambiguos | Declarar sole editing master, edit scope y content to preserve |
| Sustitución pierde movimiento original | Falta timeline inheritance | Heredar aparición, timing, trayectoria, velocidad, oclusión y salida |
| Fondo nuevo altera al personaje | Máscara de edición no definida | Modificar solo fuera de la silueta y preservar identidad/posición/movimiento |
| Extensión salta en la unión | Frontera incompleta | Describir pose, prop, fondo, cámara, luz, dirección y audio del boundary frame |
| Elementos futuros aparecen en precuela | No se prohibió aparición temprana | Declarar materiales permitidos y los que solo aparecen al comenzar el original |
| Last frame se estira | Ratios de imágenes distintos | Usar el mismo aspect ratio para primera y última imagen |
| Referencia adicional cambia keyframe | No se protegió la composición ancla | Limitar la referencia a atributos y bloquear first/last composition |
| Storyboard conserva boceto o texto | No se excluyeron atributos | Prohibir line art, labels y placeholder characters |
| Blockout produce geometría gris | Tipo/rol mal definido | Clasificarlo y definir materiales, personajes, escena y estilo finales |
| Transición parece corte aleatorio | Falta trigger o correspondencia | Definir objeto oclusor/morph, cámara, transformación y arrival state |
| Diálogo sale en idioma incorrecto | Idioma implícito | Reforzar idioma, variedad, delivery, hablante y `{dialogue}` |
| Música se mezcla con SFX | Categorías no separadas | Usar `(music)`, `<SFX>`, `{dialogue}` y `【subtitles】` |
| Actuación es genérica | Solo hay etiqueta emocional | Añadir 2–4 cues observables disparados por un evento |
| Técnica de cámara no se interpreta | Término ambiguo | Añadir sujeto, cambio visible, relación de planos, dirección y velocidad |

---

## Contrato de salida del Video Prompter

Al responder con un prompt para Seedance 2.5:

- escribir el prompt en inglés dentro de un bloque de código;
- conservar el diálogo en el idioma pedido;
- reforzar explícitamente idioma y variedad regional cuando corresponda;
- cuando sean configurables, mostrar aspect ratio y duración fuera del bloque
  con una duración entera entre 4 y 30 segundos;
- no mostrar razonamiento interno ni QA;
- utilizar la plantilla propia de la modalidad elegida;
- conservar variables de referencia compactas y numeradas;
- no inventar assets;
- indicar roles positivos y exclusiones;
- usar siempre `( )`, `< >`, `{ }` y `【 】` cuando aparezcan música, SFX,
  diálogo o subtítulos respectivamente;
- no incluir resolución, dimensiones en píxeles ni fps dentro del prompt;
- en edición, omitir ratio y duración tanto dentro como fuera del prompt: se
  heredan automáticamente de `@Video1`;
- realizar primero una propuesta y después solicitar únicamente el refinamiento
  necesario según las reglas generales del asistente.

Formato para generación:

```text
[English prompt]
```

📐 Aspect ratio: 9:16 | ⏱ Duration: 11s

La línea de parámetros queda fuera del bloque que contiene el prompt. En
edición, omitirla porque ratio y duración se heredan de `@Video1`.
