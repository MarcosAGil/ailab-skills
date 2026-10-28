# UGC Labs: Base de conocimiento para vídeo UGC

## Propósito

Esta base define cómo construir vídeo UGC verosímil: contenido que parece
grabado por una persona real con un dispositivo cotidiano, dentro de una
situación social reconocible y con una intención comunicativa clara.

UGC no significa automáticamente:

- mala calidad;
- cámara temblando todo el tiempo;
- piel exageradamente detallada;
- improvisación sin blocking;
- un timeline cada medio segundo;
- ausencia obligatoria de música;
- vertical 9:16 en todos los casos.

La autenticidad surge de la relación coherente entre dispositivo, cuerpo,
espacio, actuación, luz, sonido y propósito.

---

## Orden de aplicación

```text
User intent
→ UGC capture grammar
→ CineLabs
→ ActingLabs
→ Model-specific guide
→ QA
→ English prompt
```

UGC define la lógica de captura y credibilidad. La guía del modelo define la
sintaxis final.

---

## Principio rector: una partitura de interpretación

El UGC natural se dirige como una actuación continua, no como tres listas
independientes de acción, diálogo y voz. El modelo relaciona mejor gesto,
prosodia, mirada y expresión cuando la indicación corporal aparece junto al
fragmento exacto de la frase que la motiva.

Estructura causal:

```text
capture state → pre-speech action → spoken hook → gesture on a specific phrase
→ energy change → final reaction and hold
```

Una instrucción compacta como esta suele producir más conducta humana que una
checklist larga:

```text
Locked-off static shot. Realistic arm movement and restrained micro-movements.
She quickly uncovers the lens, starts the hook fast and punchy, points with her
free index finger on the contrast phrase, then settles into a calm articulate
delivery and a natural final hold. Single continuous take, no cuts.
```

Reglas:

- colocar la acción anterior al habla antes de `says`;
- colocar la acción que ocurre durante una frase junto a esas palabras;
- colocar la reacción posterior inmediatamente después de la última línea;
- relacionar cada gesto principal con una intención comunicativa;
- dejar respiración, parpadeo, preparación de manos y microajustes como
  comportamiento emergente, salvo que uno sea narrativamente crítico;
- no separar `Action` y `Dialogue` si su sincronía determina el resultado;
- no repetir identidad, cámara y preservación alrededor de cada gesto.

“Inline” significa **proximidad temporal y semántica**, no obliga a utilizar un
delimitador universal. Si el modelo admite acotaciones no habladas dentro del
bloque de interpretación, pueden usarse corchetes. Si su guía exige otra
sintaxis para diálogo o acciones, conservar la proximidad pero traducirla al
formato del modelo. Las acotaciones nunca deben pronunciarse.

### Regla obligatoria para UGC hablado

Todo prompt de UGC con una persona hablando debe incluir una **performance
score**, no únicamente el texto y una descripción genérica como “natural
gestures”. El borrador es inválido si los gestos quedan en una sección distante
sin relación con palabras o beats concretos.

Para una frase corta, incluir por defecto:

1. una acción o preparación inicial que introduzca el hook;
2. uno o dos gestos o microacciones vinculados a palabras exactas;
3. un cambio observable de delivery cuando cambia la intención;
4. relajación de la mano, respiración o reacción final y un breve hold.

El gesto no tiene que ser siempre señalar. Puede ser descubrir la lente, mirar
el producto, ajustar el agarre, anticipar con los ojos, inclinar la cabeza,
cambiar peso, asentir, contener una sonrisa o soltar una respiración. Elegir el
que nazca del significado de la frase y sea compatible con las manos ocupadas.

Excepciones:

- si el usuario pide explícitamente inmovilidad corporal o ausencia de gestos,
  respetarlo;
- si `@VideoN` es la autoridad exacta de actuación, no inventar acciones:
  identificar sus beats y vincular **esos mismos** gestos al diálogo;
- si el sujeto no habla (b-roll, voiceover o producto solo) aplicar acciones
  naturales, pero no una performance score de diálogo.

---

## Preparación de referencias para UGC

La naturalidad del vídeo depende también de que la imagen inicial sea
ejecutable. Preparar referencias mediante cambios de un solo dominio reduce la
contaminación entre identidad, ropa, fondo, producto y pantalla.

### Regla de vinculación

Usar las menciones de la guía del modelo y plataforma. Los ejemplos generales
de esta base usan `@Image1`, `@Image2`, `@Video1`, `@Audio1`. Para Kling 4.0
en AILAB se traducen obligatoriamente a `@image_1`, `@video_1` o la mención
del campo de fotograma; sujetos/voces habilitados usan su `@nombre` real. Nunca usar nombres de archivo,
rutas, URLs, “file 1” o “the provided image”.

### Cambiar una sola cosa

En una edición de imagen previa, fijar lo que permanece y aislar el cambio:

```text
@Image1 is the sole identity, pose, framing, setting, and lighting authority.
Change only the wardrobe to [OUTFIT]. Preserve everything else exactly.
```

No pedir simultáneamente una nueva ropa, pose, cámara, fondo y expresión cuando
el objetivo es preparar una referencia estable.

### Persona + outfit o fondo

Separar dominios:

```text
@Image1 controls only the person's identity, body, pose, and framing.
@Image2 controls only the exact outfit. Ignore any person, pose, background,
camera, and lighting in @Image2.
```

Para un fondo de referencia, `@Image2` controla localización, perspectiva,
profundidad y atmósfera; nunca su persona. Integrar escala, temperatura de color,
sombras y bordes para evitar aspecto de recorte.

### Character sheet

Una hoja multiángulo es útil cuando el vídeo exige perfil, tres cuartos,
contrapicado o giro amplio. Todas las vistas representan una sola identidad y
deben conservar estructura facial, asimetrías, edad, pelo, maquillaje y
accesorios. Ignorar paneles, bordes, fondo neutro y layout; nunca crear varias
personas a partir de la hoja.

No solicitar nueve vistas si el vídeo solo mostrará un frontal corto: más
referencias no siempre aportan más control.

### Persona + producto

Definir `@Image1` como persona y `@Image2` como producto. Preservar geometría,
escala, colores, logo, label, cap y mecanismo del producto, pero ignorar el
fondo y la composición de su packshot. La imagen inicial debe resolver qué mano
lo sostiene, agarre, orientación del frontal y contacto de dedos.

### Mecanismos difíciles

Para tapas flip-top, dispensadores, cierres o aplicadores, una imagen adicional
puede controlar solo el mecanismo abierto. Declarar eje, bisagra, piezas que
siguen unidas y estado final. Esto evita que una tapa articulada se arranque o
que el envase cambie de forma.

### Apps, webs y pantallas

Flujo robusto en dos pasos:

1. crear a la persona sosteniendo el teléfono o portátil con una pantalla negra
   limpia y perspectiva correcta;
2. insertar la captura de `@Image2` únicamente dentro de esa superficie,
   conservando persona, manos, dispositivo, pose, fondo y luz de `@Image1`.

La captura mantiene su aspect ratio y se adapta mediante perspectiva, esquinas,
brillo y reflejo; no debe redibujarse como pseudo-UI ni derramarse fuera del
display.

---

## Tipos de UGC

### Selfie a brazo extendido

- Teléfono sostenido por el propio sujeto.
- Perspectiva corta y ligera distorsión cercana.
- Microajustes de muñeca y brazo.
- Ojos alternan entre lente y pantalla si es natural.
- La cámara comparte el movimiento corporal.

### Selfie en espejo

- El teléfono es visible en el reflejo.
- La mirada debe dirigirse al reflejo, la pantalla o el producto de forma
  coherente.
- El producto puede invertirse visualmente; verificar logos y texto.
- El encuadre depende de la posición real del teléfono frente al espejo.

### Teléfono apoyado

- Cámara casi fija.
- Pequeña vibración solo por contacto con la superficie o el suelo.
- El sujeto entra, sale o se acerca dentro de un encuadre preexistente.
- Adecuado para demostraciones, cocina, fitness y haul.

### Walk-and-talk

- Rebote asociado a pasos.
- Reencuadres para evitar obstáculos.
- Respiración afectada por el movimiento.
- Fondo y luz cambian al cruzar espacios.
- La mano libre gesticula sin bloquear constantemente el rostro.

### Walk-to-static

- Comienza andando.
- El teléfono se estabiliza cuando el cuerpo se apoya o se detiene.
- El cambio de física de cámara debe coincidir con el contacto corporal.

### POV de manos o demostración

- Cámara orientada al objeto o superficie.
- Manos entran desde posiciones anatómicamente plausibles.
- Contacto, agarre y sonido de materiales son centrales.
- Rostro puede estar fuera de plano.

### Audience-filmed

- La persona que graba reacciona al evento.
- Obstáculos, teléfonos y cabezas ocupan el foreground.
- Zoom digital y reframing son reactivos.
- El sonido refleja distancia, crowd y micrófono del dispositivo.

---

## La cámara debe tener propietario

Antes de redactar, responder:

```text
Who holds the camera?
Where is the device relative to the body?
What physical event moves it?
What is the operator trying to keep in frame?
```

Ejemplos:

```text
The phone is held in her right hand at arm's length, slightly above eye level.
The phone is propped on the kitchen counter at chest height.
The camera is a spectator's phone held between raised arms in the crowd.
```

No añadir shake genérico. Vincularlo a pasos, respiración, cambio de agarre,
reacción o contacto con una superficie.

---

## Estructura recomendada

```text
Reference mapping, when assets exist
Capture contract: device, shot, continuity and camera behavior
First-frame body, hands, product and gaze state
Performance score: action + exact dialogue + inline gesture/prosody cues
Voice identity, language and regional accent
Diegetic sound and optional music
Final reaction, preservation and targeted constraints
```

Orden práctico para talking head:

```text
camera → optional pre-speech action → says + exact line + phrase-linked gestures
→ voice fingerprint → language/accent → sound/preservation
```

La estructura se adapta al modelo. Ningún campo es obligatorio si no aporta
control útil. Cuando la guía específica exige secciones, stages o sintaxis de
audio distinta, conservar esta lógica dentro de su formato en vez de imponer
los encabezados de UGC Labs.

---

## Style and capture device

Definir:

- plataforma o gramática social;
- dispositivo;
- orientación;
- calidad óptica;
- estabilización;
- tratamiento de color;
- audio diegético o musical.

```text
Vertical 9:16 smartphone UGC, front-facing phone camera, natural auto-exposure, slight edge softness, restrained compression, no cinematic color grade.
```

No fijar un modelo de teléfono concreto salvo que su estética sea importante.

---

## Selección de cámara para UGC

Elegir una conducta dominante y explicar cuándo termina. Toda toma continua
debe conservar eje y geografía después del movimiento.

| Conducta | Uso | Control decisivo |
|---|---|---|
| Locked-off + cuerpo vivo | Talking head, podcast, demostración | Cámara inmóvil; microgestos proceden del sujeto |
| Push-in casi imperceptible | Autoridad o intimidad creciente | De medium a medium close-up y hold |
| Push-in rápido al hook | Entrada enfática | Aterriza al comenzar la frase, después se bloquea |
| Pull-back reveal | Presentar habitación, producto o contexto | Comienza cerca, revela y sostiene el plano abierto |
| Handheld sutil | Selfie o creador acompañado | Shake causado por agarre, respiración o pasos |
| Lateral tracking | Walk-and-talk | Velocidad ligada al paso y dirección estable |
| Arco lento | Producto, moda o sujeto quieto | Un solo arco legible, sujeto centrado, sin órbita decorativa |
| Push a ojos | Línea crítica o reacción | Llega al primerísimo plano en la frase clave y sostiene |
| Low-angle push | Autoridad o fashion | Contrapicado moderado; evitar distorsión accidental |

Profundidad de campo y bokeh son decisiones ópticas, no movimientos. Slow motion
es útil para b-roll de moda, pelo, líquido o textura, pero suele perjudicar un
talking head con voz y lip sync natural.

Patrón de continuidad:

```text
[Camera move] begins from the first frame, reaches [final framing] on [visible
or spoken beat], then holds steady for the rest of the single continuous take.
No cuts or scene changes.
```

No combinar zoom, orbit, crane, handheld y reframing en una frase breve. La
variedad de UGC procede más del blocking y la interpretación que de una cámara
constantemente activa.

---

## Localización

Incluir solo elementos que:

- sitúan socialmente el contenido;
- afectan el blocking;
- reflejan luz o sonido;
- contextualizan el producto;
- deben permanecer constantes.

```text
High-floor apartment kitchen with pale stone counter, sage cabinets, one large window, and a soft city skyline in the background.
```

Evitar inventarios decorativos extensos que compitan con la acción.

---

## Persona y piel

La credibilidad de piel se describe según escala y luz:

```text
natural skin texture, visible pores at close range, slight unevenness, subtle forehead shine, no beauty-filter smoothing
```

No repetir “maximum realism” ni enumerar imperfecciones si la persona aparece
en plano general.

También definir:

- cabello y comportamiento físico;
- ropa, caída y material;
- accesorios;
- mano que sostiene cámara o producto;
- postura;
- energía inicial.

Cuando existe referencia, preservar identidad sin redescribirla de forma
contradictoria.

---

## Producto

Fijar:

- propiedad: quién lo sostiene;
- mano y tipo de agarre;
- orientación del frontal;
- label y logo;
- momento en que entra o sale del plano;
- cambio permitido;
- estado final.

```text
She holds the square perfume bottle in her left hand at shoulder height, rotates it once so the label faces the mirror, then lowers it to chest level without covering the text.
```

Para packaging:

```text
Preserve the box geometry, brand name, label placement, color, cap, and product proportions throughout.
```

---

## Acting UGC

UGC convincente evita la presentación permanente. La persona:

- empieza a mitad de una acción o pensamiento cuando procede;
- busca palabras;
- respira;
- mira brevemente fuera de cámara;
- ajusta el objeto;
- cambia de energía en el punchline;
- deja un pequeño tail después de hablar.

Aplicar ActingLabs:

```text
Objective: persuade a friend, not sell to an audience.
Subtext: she is surprised it worked and expects disbelief.
Observable behavior: quick eyebrow lift, label check, restrained smile after the claim.
```

Evitar gestos constantes, sonrisa fija, contacto ocular continuo y énfasis en
cada palabra.

### Microacciones con función

Una microacción mejora el plano cuando revela pensamiento, regula la atención o
interactúa con un objeto. Familias útiles:

- **preparación:** descubre la lente, ajusta gorra o gafas, coloca el producto;
- **orientación:** mirada breve al producto, pantalla, interlocutor o fuera de
  plano antes de volver a lente;
- **énfasis:** un dedo, asentimiento, inclinación de cabeza o shrug en la idea
  decisiva;
- **contacto:** gira el envase, deja una taza, pulsa el dispensador, toca una
  superficie;
- **resolución:** pequeña exhalación, sonrisa contenida, confirmación con la
  mirada o quietud final.

Elegir normalmente uno o dos gestos principales por frase corta. No convertir
una lista de gestos en coreografía. El cuerpo debe preparar el gesto, ejecutarlo
y recuperar una postura natural; no saltar entre poses.

### Manos y disponibilidad

Nombrar la **free hand** cuando la otra sostiene cámara, micrófono o producto.
Una mano ocupada no puede señalar simultáneamente. Mantener propiedad y agarre:

```text
Her right hand keeps the microphone stable near her chest. On the contrast
phrase, her free left index finger points briefly toward frame-right, then the
hand relaxes instead of remaining frozen.
```

Usar `frame-left` o `frame-right` cuando la dirección visual importa. “Left” sin
referente puede interpretarse como izquierda del personaje o del espectador.

### Mirada UGC

“Direct to camera” define el destinatario, no una mirada inmóvil. Permitir:

- microdesviaciones mientras formula la idea;
- ojos que anticipan un giro de cabeza;
- mirada al producto durante su manipulación;
- retorno a lente en la afirmación o punchline;
- reacción final que no siempre necesita contacto ocular.

Bloquear mirada constante solo cuando el formato realmente lo exige.

---

## Diálogo

Debe sonar dicho, no escrito.

### Principios

- Frases respirables.
- Una idea por beat.
- Marcadores conversacionales selectivos.
- Vocabulario acorde al personaje y región.
- Pausas donde ocurre una acción o reacción.
- Duración comprobada mediante lectura real.

### Dirección

```text
She speaks in English, fast but clear, as if telling a friend something she just discovered; her breathing is slightly audible during the walk and settles after she stops.
```

### Diálogo como performance score

Cuando una frase contiene cambios de energía o gestos sincronizados, no dejar el
texto aislado de la interpretación. Colocar cada cue junto a su frase:

```text
She says: "[quickly uncovers the lens] Así vamos a hacer tus vídeos talking head
[speaks rapidly with punchy emphasis] menos aburridos [the free index finger
points briefly toward frame-right] y mucho más entretenidos [the hand relaxes;
delivery settles, calm and articulate]."
```

Los corchetes representan acciones no habladas. Solo usar esta forma literal si
el modelo entiende acotaciones inline. Cuando su sintaxis separa diálogo y
acciones, mantener la misma proximidad mediante instrucciones como:

```text
On the exact words "menos aburridos", her free index finger points briefly
toward frame-right. On "mucho más entretenidos", the hand redirects toward
frame-left as her delivery settles from punchy to calm and articulate.
```

La segunda forma sigue estando vinculada a palabras exactas y es preferible a
una lista `Action` genérica alejada del guion.

Los cues deben controlar beats significativos, no cada sílaba. Dejar que el
modelo complete transiciones faciales, respiración y microgestos coherentes.

### Exclusiones

```text
Single speaker only, no narrator, no subtitles, no overlapping voices.
```

No asumir que UGC siempre necesita diálogo directo a cámara.

---

## Voz, idioma y acento

La voz necesita una huella estable, separada de la energía de cada beat:

```text
Voice: [gender/presentation and age range], [pitch/register], [timbre/texture],
[baseline pace], [social attitude].
Language: [language and regional variety], [degree of formality], [naturalness].
```

Ejemplo:

```text
Voice: a clear engaging female voice, early 20s, bright mid-high register,
smooth natural texture, conversational and assured. She is dynamic and fast on
the hook, then settles into a calm authoritative cadence without shouting.
Spanish with a neutral Peninsular Spain accent, informal and natural.
```

Reglas:

- reutilizar **exactamente la misma descripción base de voz** en todos los clips
  del mismo personaje;
- variar energía, velocidad y énfasis por beat sin cambiar edad, pitch, timbre o
  identidad vocal;
- definir género/presentación, edad aproximada, registro, textura y delivery;
- especificar idioma y variedad regional fuera del texto hablado;
- evitar caricaturizar el acento mediante ortografía fonética excesiva;
- no combinar `fast`, `calm`, `energetic` y `unhurried` sin indicar en qué frase
  cambia el delivery;
- añadir `without shouting` cuando se busca energía rápida pero no volumen
  publicitario;
- si existe referencia de voz, definir si controla identidad vocal, pista
  exacta o solo estilo; nunca dejar su función implícita.

Cuando la guía del modelo permita audio externo, vincularlo con su mención
real. La notación genérica `@AudioN` y el vídeo portador `@VideoN` solo se usan
en modelos que admiten esas vías. En Kling 4.0 de AILAB, distinguir la voz
cargada de administrador por `@nombre` y la opción de conservar sonido de
`@video_1`; no extrapolar la vía de vídeo negro. Nunca usar filenames.

---

## Action flow y timestamps

Los timestamps son útiles cuando:

- el producto cambia de orientación;
- caminar y detenerse cambian la cámara;
- el diálogo debe coincidir con gestos;
- existen varios beats en una toma;
- el audio requiere sincronización.

No son obligatorios para una acción simple.

Para un talking head corto con una sola frase, las acotaciones inline suelen
sincronizar mejor que dividir la actuación en demasiados timestamps. Usar
timeline cuando hay cambios reales de estado, no para microadministrar cada
palabra. Si existe audio maestro, heredar sus beats; si se redactan timestamps,
aplicar la rejilla universal `.00/.50`, mínimo 1,00 s y duración total entera.

Ejemplo:

```text
[0.00–2.00s] Already walking, she raises one finger as if remembering something.
[2.00–4.00s] Her left palm lands on the counter and both body and camera settle.
[4.00–8.00s] She lifts the product into the window light and delivers the main claim.
[8.00–10.00s] She checks the label, looks back into the lens, and gives one small confirming nod.
```

El estado final de cada beat debe alimentar el siguiente.

---

## Física de cámara

### Selfie andando

```text
Footsteps create restrained vertical bounce through the extended arm; the wrist makes small lateral corrections to keep her eyes near the upper third.
```

### Parada

```text
When her palm contacts the counter, her torso stops and the camera bounce decays over two small oscillations rather than freezing instantly.
```

### Giro

```text
The frame lags slightly behind her body turn, catches the doorway edge, then recenters.
```

### Teléfono apoyado

```text
The camera remains locked; only one tiny vibration occurs when the product box touches the same counter.
```

Usar medidas exactas solo si ayudan a resolver un fallo. No convertir centímetros
y grados en requisitos universales.

---

## Iluminación UGC

Preferir fuentes domésticas plausibles:

- ventana;
- luz de baño;
- lámpara de techo;
- pantalla;
- luz de escaparate;
- farolas;
- mezcla de temperatura entre habitaciones.

Describir exposición automática si el sujeto cambia de espacio:

```text
As she enters the brighter living room, the phone briefly underexposes her face, then corrects smoothly without a cinematic lighting change.
```

No usar iluminación de estudio invisible si se busca autenticidad cotidiana.

---

## Audio UGC

Capas habituales:

- micrófono del teléfono;
- room tone;
- respiración;
- pasos;
- ropa;
- contacto con producto o superficie;
- tráfico o vecinos;
- ruido de electrodomésticos;
- música diegética o añadida si el encargo la pide.

```text
Audio: clean but slightly compressed phone-mic voice, soft barefoot steps, sweater movement, one box tap, faint city traffic through the window, no music.
```

Vincular sonidos con acciones visibles. No enumerar foley que nunca ocurre.

---

## Formatos reutilizables

### Mirror selfie

```text
Vertical mirror-selfie UGC. [Person] holds the phone in [hand and position] and [product] in [other hand]. [Mirror composition and background]. [Action flow]. [Dialogue]. Audio: [phone-mic ambience and product sounds]. Preserve [identity and product].
```

### Static counter

```text
Vertical smartphone camera propped on [surface] at [height]. [Person] performs [demonstration] inside a fixed frame. [Natural light]. [Dialogue and acting]. Audio: [room tone and contacts]. Preserve [product and setting].
```

### Walk-to-static

```text
One continuous handheld selfie. She is already walking through [space]; step-driven bounce and imperfect recentering continue until she touches [surface], then decay naturally. She [product action] and says {[line]}. [Light transition]. Audio: [steps, breath, fabric, room tone].
```

### Product demonstration

```text
One continuous vertical UGC take. Begin with [product state]. The creator demonstrates [process] in causal order while explaining [claim]. Keep the label readable during every hero beat. Audio: [voice, material sounds, ambience]. End with [proof/result].
```

### Talking head de una persona

```text
[Camera and continuity contract]. [Optional pre-speech action], then the creator
says: "[exact script with phrase-linked performance cues]". Voice: [stable
fingerprint and beat-specific delivery]. [Language/accent]. [Room/device audio].
Preserve [identity, wardrobe, microphone, setting, final pose].
```

Una cámara estática no implica un cuerpo congelado. Pedir movimiento realista
de brazos y microajustes sobrios, pero evitar una lista cerrada de parpadeos,
respiraciones y cejas.

### Podcast de dos personas en planos separados

Generar a cada participante por separado cuando el montaje alternará planos:

- cámara y fondo estables;
- eyeline hacia el lado donde está el interlocutor;
- solo habla la persona del plano;
- la voz del otro no aparece;
- el segundo ángulo pertenece a la misma habitación, pero no debe ser un espejo
  literal del primero;
- invertir pantalla solo si la geografía y los logos lo permiten.

```text
Single speaker: only the person in @Image1 speaks. They look toward frame-left
at the off-camera guest, with restrained conversational gestures and brief
listening pauses. No off-camera reply or overlapping voice.
```

### Dualcast de dos personas en el mismo plano

Nombrar hablante y oyente por posición o handle. El oyente no queda inmóvil:
respira, mantiene eyeline, reacciona con demora natural y puede asentir una vez,
pero nunca articula el guion del hablante.

```text
The person on frame-left speaks. The person on frame-right only listens, keeps
their gaze on the speaker, makes one delayed small nod after the key claim, and
never moves their lips or interrupts.
```

Preservar eje, distancia entre cuerpos, dirección de miradas, propiedad de
micrófonos y continuidad del turno.

### Voiceover con b-roll

Si la narración se añadirá después, el sujeto visible no habla:

```text
No talking; mouth naturally closed except for breathing. No visible speech,
lip-sync, muttering, narrator, subtitles, or generated dialogue.
```

“No talking” no significa inmovilidad: la persona puede cocinar, caminar,
examinar la piel, trabajar, abrir un paquete o mostrar un resultado. El audio
nativo puede conservar ambiente y foley si el flujo de edición lo necesita.

### Moda

Elegir una sola finalidad por clip:

- cuerpo entero para leer el outfit;
- giro parcial o 360° para mostrar volumen;
- walking shot para caída de tejido;
- pose editorial para silueta;
- macro para costuras, material o accesorio.

Preservar identidad, prenda, patrón, costuras y fondo. En giros, cuerpo, ropa y
pelo comparten inercia; no rotar como turntable rígido salvo que se pida. Si no
hay diálogo: boca cerrada y ausencia explícita de habla.

### Skincare y transformación de producto

Describir conservación de materia y evolución visible:

```text
She spreads the existing cream in gentle upward circular motions. The visible
amount decreases continuously as it is absorbed, leaving no new buildup,
streaks, residue, or product appearing from nowhere.
```

Para dispensadores y tapas, declarar contactos, mano activa, bisagra y pieza que
permanece unida. Separar “abrir”, “dispensar”, “aplicar” y “resultado” si no
caben físicamente en un solo beat.

### App, web o producto digital

Usar una referencia compuesta donde la captura ya esté integrada en la pantalla
antes de animar. Durante el vídeo:

- preservar perspectiva, aspect ratio, bordes y brillo del display;
- mantener manos y dispositivo estables;
- no regenerar texto o iconos de la interfaz;
- evitar que dedos atraviesen la pantalla;
- decidir si el creador mira a lente, display o espectador reflejado;
- reservar un hold legible del dispositivo.

---

## Ejemplo: Talking head con partitura inline

Este patrón prioriza la actuación sobre la enumeración técnica. Adaptar sus
delimitadores a la guía del modelo sin separar los gestos de las palabras que
los causan.

```text
Locked-off static vertical talking-head shot matching the exact framing,
seated position, grey shirt, held wireless microphone, room, lighting, and
background of @Image1. @Image2 is the sole facial-identity and likeness
reference for the same single woman throughout. Ignore @Image2's background,
framing, and reference-sheet layout. Single continuous take, no cuts, scene
changes, or decorative camera movement.

She says: "[her free hand quickly uncovers the lens, creating the hook] Así
vamos a hacer tus vídeos talking head [fast, punchy emphasis; her free index
finger points briefly toward frame-right] menos aburridos [the same hand
redirects smoothly toward frame-left; delivery settles, calm and articulate] y
mucho más entretenidos. [the hand relaxes; she completes one natural breath and
holds the final expression]"

Voice: a clear, engaging female voice, early 20s, bright natural register and
smooth texture. Dynamic and fast on the hook, then calm, authoritative, and
articulate without shouting. Spanish with a neutral Peninsular Spain accent,
informal, confident, and conversational.

Audio: clean close wireless-microphone voice, subtle interior room tone,
natural breath and light clothing movement. No music, narrator, subtitles, or
additional voices. Preserve @Image1's shot and wardrobe, @Image2's identity,
the microphone hand, realistic free-hand anatomy, natural lip sync, and a short
settling tail. No fixed smile, continuous rigid eye contact, gesture on every
word, identity drift, or frozen pose.
```

---

## Ejemplo: Mirror selfie de perfume

```text
Vertical 9:16 mirror-selfie UGC in a warm beige bathroom, natural morning window light from frame left, no beauty filter or cinematic grade. A woman in her mid-20s holds the phone in her right hand at chest height and a small square perfume bottle with amber liquid in her left hand at shoulder height. Her reflection fills most of the frame; the phone remains visible lower right and the shower stays softly out of focus.

She is already looking at the bottle, rotates it once so the liquid catches the light, lowers it to chest level while speaking, then returns her gaze to the phone reflection and raises the label toward the mirror. Her delivery is calm and matter-of-fact, like recommending something to a friend: {It's sweet, but not overwhelming. It just smells expensive.}

Audio: natural phone-mic voice, soft bathroom room tone, faint bottle handling, one breath, no music. Preserve her identity, grey headband, navy top, bottle geometry, label, mirror layout, and window-light direction. End with one small nod and the label unobstructed.
```

---

## Ejemplo: Walk-to-counter

```text
One continuous vertical smartphone selfie in a bright apartment kitchen. She is already walking beside the stone counter, phone in her right hand at arm's length; restrained footstep bounce and small wrist corrections keep her face near the upper third. The city window remains visible behind her.

She raises her left index finger on the opening thought, walks for three seconds, then plants her left palm on the counter. Her body stops and the camera settles over two small residual oscillations. She leans closer, lifts the perfume bottle into the window light, and says in English, quick and amused: {Someone stopped me downstairs just to ask what I was wearing. It costs forty dollars.}

Audio: phone-mic voice, footsteps ending at the counter, palm contact, cloth movement, faint traffic, no music. Natural skin texture and auto-exposure. Preserve her face, headband, outfit, perfume bottle, kitchen, skyline, and single-take continuity. No subtitles.
```

---

## Ejemplo: Producto fitness con cámara apoyada

```text
Vertical 9:16 smartphone UGC, camera propped motionless on a kitchen shelf at chest height. A muscular man stands behind a wooden butcher block in a dark residential kitchen, lit by one warm side window and a practical ceiling lamp. Natural skin texture, slight post-workout sheen, no cinematic haze.

He is already slicing a seared ribeye. The knife maintains a safe, anatomically correct grip. He looks up only after the first slice separates, points toward the meat with the flat of the knife, then sets it down before lifting the slice with his free hand. He says in Spanish from Madrid, blunt and confident: {¿Pero qué me estáis contando de suplementos? Esto es comida de verdad.}

Audio: crisp knife through crust, blade contacting wood, close phone-mic voice, quiet refrigerator, no music. Preserve his identity, chain, knife, steak, board, kitchen geometry, and static camera. End with the knife resting on the board and the steak slice held safely at chest height.
```

---

## Fallos frecuentes

| Síntoma | Corrección |
|---|---|
| Parece anuncio profesional | Reducir movimientos perfectos, grade y luz imposible |
| Shake constante | Vincular cámara a cuerpo y contactos |
| Gestos mecánicos o tardíos | Vincular cada gesto a la frase exacta y dejar recuperación |
| Cuerpo rígido con cámara estática | Pedir microajustes sobrios, no movimientos de cámara |
| Mirada fija | Alternar lente, pantalla, producto y entorno con motivo |
| Voz genérica o cambiante | Repetir la misma huella vocal y variar solo el delivery del beat |
| Dos personas hablan a la vez | Definir hablante único y conducta silenciosa del oyente |
| Producto muta | Fijar agarre, orientación, label y estado final |
| Tapa arrancada | Aportar mecanismo y fijar bisagra, unión y trayectoria |
| Pantalla o UI se deforma | Componer antes la captura y preservar la superficie del display |
| Boca articulando en b-roll | Declarar no talking, mouth closed y no generated dialogue |
| Diálogo no cabe | Leerlo, acortar o ampliar duración |
| Audio artificial | Usar micrófono y ambiente coherentes con el dispositivo |
| Fondo cambia | Fijar geografía y recorrido |
| Piel plástica | Pedir textura natural y retirar filtro de belleza |
| UGC sobredescrito | Eliminar decoración y microdatos sin efecto visible |

---

## QA

- ¿Quién sostiene o apoya la cámara?
- ¿Cada movimiento tiene una causa física?
- ¿El encuadre corresponde a la longitud del brazo o soporte?
- ¿La persona actúa para una audiencia, un amigo, un espejo o un producto?
- ¿El diálogo cabe y suena hablado?
- Si es UGC hablado, ¿incluye una performance score con preparación, conducta
  vinculada al lenguaje y recuperación, salvo excepción explícita?
- ¿Los gestos decisivos están junto a las palabras que los motivan?
- ¿Se distingue acción previa, gesto durante la frase y reacción final?
- ¿Las acotaciones permanecen no habladas según la sintaxis del modelo?
- ¿La voz conserva la misma edad, pitch, timbre y acento entre clips?
- ¿La mirada cambia con intención?
- ¿Cada mano tiene una sola función compatible en cada momento?
- ¿El producto conserva geometría, label y propiedad?
- ¿Los mecanismos mantienen bisagras, tapas y piezas unidas?
- ¿Las pantallas conservan perspectiva y contenido exacto?
- En dualcast, ¿solo habla la persona designada y el oyente reacciona?
- En b-roll, ¿la boca no articula diálogo?
- ¿La luz pertenece al espacio?
- ¿El audio suena al dispositivo correcto?
- ¿El estado final cierra el beat?
- ¿La capa específica del modelo se ha aplicado después?

---

## Contrato de salida

UGC Labs aporta conocimiento interno. El asistente debe devolver únicamente el
prompt final en inglés, con el diálogo en el idioma solicitado, salvo que el
usuario pida análisis.

## Adaptación a Kling 4.0 en AILAB

Aplicar la guía y los ejemplos de Kling 4.0 (no incluidos en esta skill). Las menciones reales son
`@image_1`, `@video_1`, `@first_frame`, `@keyframe_1` y `@last_frame` según el
modo/campo. Los ejemplos genéricos anteriores se traducen a esta sintaxis; no
se copian sus handles. Referencias y Fotogramas clave no se combinan.

Identidad, ropa, producto, escenario, interpretación y voz pueden tener
referencias distintas. Definir la autoridad de cada una. Sujetos de imagen y
voces están en prueba solo para administradores y se mencionan por su `@nombre`
real. Para miembros usar imágenes normales y voz descrita por texto; no pedir
crear recursos restringidos ni sujetos de vídeo.

Mantener partitura inline: preparación, línea entre comillas, uno o dos gestos
ligados a palabras concretas y recuperación. Resolver apoyo del móvil, manos,
contacto con producto y mirada. Para b-roll, declarar ausencia de habla; para
conversación, distinguir hablante y oyente. Música/subtítulos se excluyen si no
se desean. No congelar el cuerpo por mantener la cámara fija.

Los vídeos guían nuevas generaciones; no permiten edición conservadora de
creador o producto. Si se conserva el sonido original mediante la opción de
AILAB, adecuar conducta y habla al audio, sin inventar una mezcla entre fuentes.
Si se dirige audio nuevo, desactivar esa conservación expresamente. No usar el
vídeo negro como atajo acreditado para importar música/SFX. El sonido original
es una opción de Referencias, no un recurso adicional de Fotogramas clave.
