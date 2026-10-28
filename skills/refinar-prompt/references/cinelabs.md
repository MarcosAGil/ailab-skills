# CineLabs: Base de conocimiento cinematográfico universal

## Propósito

CineLabs es la capa general de dirección cinematográfica del Video Prompter de
Ailendra Labs.
Su función es mejorar cualquier prompt de generación de vídeo antes de aplicar
las reglas particulares del modelo elegido.

Esta base de conocimiento no pertenece a ninguna plataforma, marca o modelo.
Define principios universales para construir planos legibles, físicamente
creíbles, visualmente controlados y consistentes.

La personalización final se aplica en tres capas:

1. **Capa universal - CineLabs:** intención del plano, primer frame, blocking,
   óptica, cámara, continuidad, física, iluminación, acción, audio y control de
   errores.
2. **Capa del modelo:** sintaxis, orden de secciones, referencias, límites,
   timestamps, capacidades y restricciones del generador seleccionado.
3. **Capa de la petición:** idea del usuario, personajes, assets, duración,
   formato, diálogo, estilo y objetivo creativo.

Si una regla universal entra en conflicto con una capacidad real del modelo,
prevalece la guía específica del modelo. La intención cinematográfica debe
conservarse y traducirse a la sintaxis que dicho modelo comprenda mejor.

---

## Objetivo de calidad

Todo prompt debe intentar producir:

- un primer frame útil y correctamente ocupado;
- identidad estable cuando existan referencias;
- colocación espacial inequívoca;
- posiciones izquierda/derecha consistentes;
- miradas y orientaciones corporales correctas;
- proximidad clara a lugares, objetos y personajes;
- una óptica coherente con el contenido del plano;
- movimiento de cámara ejecutable;
- acciones físicamente posibles dentro de la duración;
- iluminación con fuente, dirección y prioridad de exposición;
- continuidad de personajes, props y estados entre cortes;
- diálogo limpio y temporalmente viable;
- sonido motivado por fuentes visibles o por el entorno;
- ausencia de información heredada que no pertenezca al plano actual;
- ausencia de referencias, personajes u objetos no utilizados;
- instrucciones densas donde importa el control y breves donde no importa.

La meta no es escribir prosa bonita. La meta es dar instrucciones visuales,
temporales, espaciales y sonoras que puedan representarse en pantalla.

---

## Principios fundamentales

### 1. El vídeo es temporal

Una imagen describe qué existe. Un vídeo describe qué ocurre, cuándo ocurre y
qué cambia como consecuencia. Toda acción importante debe tener:

- estado inicial;
- desencadenante;
- progresión física;
- reacción o consecuencia;
- estado final cuando sea relevante para la continuidad.

### 2. Solo se puede controlar lo observable

Traducir conceptos abstractos a comportamiento visible y audible.

Débil:

```text
He feels guilty and conflicted.
```

Fuerte:

```text
He avoids her gaze, presses his lips together, tightens his grip on the
glass, then releases a slow breath before answering.
```

### 3. La prioridad debe ser explícita

Los elementos críticos no deben quedar enterrados dentro de estilo o prosa
decorativa. Colocación, mirada, óptica, luz, acción y diálogo deben expresarse
de forma directa y en una posición prominente del prompt.

### 4. Una instrucción por función

Evitar frases que mezclen en una sola cláusula ubicación, emoción, cámara,
óptica y acción. Separar las decisiones importantes para reducir ambigüedad.

### 5. Movimiento con causa y efecto

Cada movimiento debe respetar gravedad, masa, inercia, fricción, contacto,
resistencia, transferencia de peso y continuidad. Un objeto no cambia de
posición o estado sin una causa visible.

### 6. La referencia es la fuente de verdad

Cuando existe una referencia visual, esta controla identidad, proporciones,
vestuario, materiales o geografía según su función. El texto solo añade los
anclajes necesarios para el plano y no debe sobrescribirla con descripción
excesiva.

### 7. El plano actual es un documento sellado

Cada prompt contiene únicamente información visible o audible en el plano o
secuencia solicitada. No arrastra personajes, objetos, etiquetas, heridas,
lugares ni notas de escenas anteriores salvo que sean necesarios para la
continuidad actual.

### 8. Señal antes que longitud

Más detalle no equivale automáticamente a más control. La densidad debe
concentrarse en los puntos donde una interpretación incorrecta arruinaría el
resultado.

---

## Metodología interna de construcción

El asistente aplica este proceso de forma silenciosa antes de escribir el
prompt final.

### Fase 1: Descomponer

Extraer exclusivamente lo necesario para el plano o secuencia actual:

- personajes activos;
- referencias activas;
- localización;
- props, vehículos o criaturas visibles;
- acción principal;
- acciones secundarias y microacciones;
- diálogo;
- duración y formato;
- modo de cámara;
- primer frame requerido;
- mapa espacial;
- hitos visuales;
- trayectoria de movimiento;
- dirección de la luz;
- estado emocional observable;
- necesidades de audio;
- estado final necesario para el siguiente plano;
- elementos que deben quedar fuera.

Eliminar del prompt:

- personajes no utilizados;
- referencias no utilizadas;
- números de escena o episodio;
- encabezados de guion irrelevantes;
- resúmenes de la escena anterior;
- fragmentos antiguos del prompt;
- notas internas de producción;
- expresiones vagas como “igual que antes” o “continúa lo anterior”;
- cualquier elemento que no deba verse ni oírse en el plano actual.

### Fase 2: Diagnosticar riesgos

Comprobar antes de redactar:

- ¿Puede aparecer un primer frame vacío o inútil?
- ¿Puede retrasarse la aparición de un personaje obligatorio?
- ¿Puede abrir con un plano general no solicitado?
- ¿Puede un personaje quedar demasiado lejos de un hito importante?
- ¿Puede invertirse la línea de mirada?
- ¿Es ambigua la orientación del torso o de la cabeza?
- ¿Pueden intercambiarse izquierda y derecha?
- ¿Puede la cámara situarse en el lado equivocado del eje?
- ¿Puede la óptica derivar hacia un encuadre más cómodo pero incorrecto?
- ¿Puede la luz convertirse en frontal o plana?
- ¿Puede la descripción textual alterar una referencia visual?
- ¿Hay referencias antiguas o inventadas?
- ¿Pueden aparecer duplicados, extras u objetos no solicitados?
- ¿Está claro qué mano sostiene cada objeto?
- ¿Puede el movimiento sentirse flotante o sin peso?
- ¿Cabe la acción completa en el tiempo disponible?
- ¿Puede comenzar el diálogo demasiado pronto o demasiado tarde?
- ¿Puede una referencia de localización imponer por error su encuadre?
- ¿Puede un corte reiniciar posiciones, vestuario o estados físicos?

Si existe un riesgo real, añadir un bloqueo breve, concreto y local junto a la
instrucción positiva que protege.

### Fase 3: Desarrollar

Orden general recomendado:

1. Contexto del plano.
2. Referencias activas.
3. Mapa de la localización.
4. Primer frame y blocking espacial.
5. Modo de plano o secuencia.
6. Óptica.
7. Cámara y composición.
8. Acción y timing.
9. Física y comportamiento de materiales.
10. Iluminación y exposición.
11. Audio y diálogo.
12. Bloqueos positivos.
13. Restricciones locales necesarias.

Este orden es una arquitectura conceptual. La guía específica del modelo puede
reordenar o integrar sus componentes sin perder la información esencial.

### Fase 4: Entregar

El artefacto generado para el modelo debe ser únicamente el prompt final,
redactado en inglés cinematográfico claro, salvo que el usuario solicite
explicación, diagnóstico, variantes, crítica o trabajo sobre el propio sistema.

La conversación con el usuario se mantiene en su idioma. El diálogo dentro del
vídeo conserva el idioma solicitado por el usuario.

No mostrar razonamiento interno, checklist ni notas de QA dentro del prompt.

---

## Arquitectura universal del prompt

Usar solo las secciones necesarias y traducirlas después al formato preferido
por el modelo:

```text
SCENE CONTEXT
ACTIVE REFERENCES
LOCATION MAP
FIRST FRAME AND SPATIAL BLOCKING
FORMAT MODE
OPTICS
CAMERA AND COMPOSITION
ACTION TIMING
PHYSICS AND MATERIAL BEHAVIOR
LIGHTING AND EXPOSURE
AUDIO AND DIALOGUE
POSITIVE CONSTRAINTS
LOCAL FAILURE-PREVENTION LOCKS
```

No todas las secciones tienen que aparecer como encabezados literales. Su
contenido sí debe estar presente cuando sea relevante.

Los ajustes que el usuario ya controla en la interfaz -por ejemplo resolución,
semilla o modo de entrada- no se repiten salvo que afecten al resultado visible
o que la guía del modelo exija incluirlos.

---

## Contexto del plano

Describir en una o dos frases qué sucede en este plano concreto.

Debe incluir:

- quién está presente;
- dónde se encuentra;
- cuál es la acción o conflicto visible;
- cuál es el estado inicial relevante.

No debe incluir:

- número de escena;
- resumen de la historia;
- información de personajes ausentes;
- motivaciones que no puedan verse u oírse;
- notas de montaje que no pertenezcan al plano.

Ejemplo:

```text
A wounded young man stands beside a burned-out car in heavy rain while
two companions face him from the foreground. He slowly raises a dented
steel pipe and quietly refuses to continue.
```

---

## Control de referencias

### Regla de activación

Solo incluir referencias que sean visibles o necesarias en el plano actual.
La sintaxis concreta depende del modelo y nunca se inventa en la capa general.

Para cada referencia:

- conservar exactamente el identificador proporcionado;
- asignarle una única función principal;
- describir solo los anclajes críticos para este plano;
- eliminar referencias heredadas que no se utilicen;
- evitar que una referencia de estilo controle identidad o geografía;
- evitar que una referencia de localización imponga cámara o encuadre salvo
  petición expresa.

### Jerarquía funcional

**Referencia de identidad:** rostro, cuerpo, edad aparente, proporciones,
vestuario y rasgos distintivos.

**Referencia de localización:** arquitectura, materiales, geografía,
atmósfera, hitos y, cuando corresponda, dirección de la luz.

**Referencia de prop:** forma, escala, material, estado y contacto con manos o
superficies.

**Referencia de vehículo:** tipo, geometría, marcas visuales no textuales,
puertas, posición, daños, movimiento y reflejos.

**Referencia de estilo:** textura visual, tratamiento cromático, contraste,
ritmo o lenguaje gráfico. Nunca debe anular identidad, blocking, física,
acción, óptica o iluminación.

### Descripción mínima de personaje referenciado

Incluir únicamente:

- edad aproximada;
- rol o constitución física;
- estado actual;
- identificadores visibles imprescindibles;
- prop o parte corporal crítica para la acción;
- voz solo si existe diálogo;
- instrucción de coincidencia con la referencia.

Fórmula general:

```text
[REFERENCE]: age + role/body type + current state + critical visible
anchors + action-critical prop or body state. Fully matches the reference.
```

Evitar anatomía facial exhaustiva, vestuario ya resuelto por la referencia,
adjetivos decorativos, lesiones irrelevantes y props fuera de plano.

---

## Mapa de localización

Antes de redactar el blocking, construir mentalmente un mapa práctico:

- posición de cámara;
- dirección hacia la que mira la cámara;
- foreground, midground y background;
- hitos principales;
- posiciones iniciales de los personajes;
- distancias relativas;
- trayectorias de movimiento;
- entradas y salidas del cuadro;
- dirección principal de la luz;
- relaciones de profundidad.

Una referencia de localización aporta geografía y materiales, no
necesariamente el punto de vista. El prompt debe distinguir entre “cómo es el
lugar” y “desde dónde se filma”.

---

## Primer frame

El primer frame establece identidad, geografía y jerarquía visual. Si el plano
requiere personajes u objetos visibles desde el inicio, declararlo de forma
directa.

Bloque de control reutilizable:

```text
The first visible frame already contains every required subject in the
correct position. The spatial relationship is immediately readable.
No empty establishing frame and no delayed subject reveal.
```

Permitir una apertura vacía únicamente si el usuario la solicita y tiene una
función narrativa clara.

Un plano breve de establecimiento también debe mostrar de inmediato la
información espacial que justifica su existencia. Evitar inserts abstractos,
paisajes aleatorios o frames de relleno.

### Checklist del primer frame

- ¿Están visibles todos los sujetos necesarios?
- ¿Se entiende quién mira a quién?
- ¿Se entiende la distancia entre personajes?
- ¿Se reconoce el hito principal?
- ¿Cada prop está en el lugar o mano correctos?
- ¿La composición prepara la acción que va a ocurrir?
- ¿La luz inicial coincide con la continuidad posterior?

---

## Blocking espacial

Definir para cada sujeto importante:

- posición en pantalla: izquierda, centro o derecha;
- posición en el mundo;
- plano de profundidad;
- distancia respecto a otro personaje o hito;
- orientación del torso;
- orientación de la cabeza;
- objetivo de la mirada;
- dirección de movimiento;
- mano que sostiene o toca cada objeto.

Ejemplo:

```text
Character A stands within one meter of the burned-out car, with one hand
pressed against the scorched hood. Characters B and C stand together in
the foreground facing Character A. Character B is camera-right and
Character C is camera-left. Both torsos face Character A and both gaze
lines remain locked on him.
```

### Lenguaje espacial débil

- near;
- around;
- beside, cuando la distancia exacta importa;
- somewhere;
- in the area;
- close by.

### Lenguaje espacial fuerte

- within one meter;
- touching the surface;
- back pressed against the wall;
- hand gripping the handle;
- standing directly beneath the sign;
- centered in front of the rear door;
- boots planted inside the marked circle;
- at the outer edge of the pavement.

---

## Mirada y orientación corporal

El torso, la cabeza y los ojos son controles diferentes. Especificarlos por
separado cuando la relación entre personajes sea importante.

Lenguaje útil:

- `torso faces Character B`;
- `eyes remain locked on Character B`;
- `head turns toward screen-left`;
- `back faces the camera`;
- `profile faces screen-right`;
- `looks past the camera toward the doorway`;
- `does not look away until the line ends`.

En diálogo:

- solo se mueven los labios del personaje que habla;
- los demás escuchan en silencio salvo indicación contraria;
- no aparecen voces fuera de campo si no se han pedido;
- la mirada del hablante y la del receptor mantienen una línea coherente;
- un cambio de eje debe ser deliberado y estar definido por un nuevo plano.

---

## Proximidad a hitos y contacto con props

Cuando un elemento debe estar cerca, en contacto o en una mano concreta, la
relación física se escribe explícitamente.

Para cada prop relevante, definir:

- posición inicial;
- escala y material;
- mano o punto de contacto;
- orientación;
- estado inicial;
- cambio de estado;
- estado final;
- consecuencia física del contacto.

Ejemplo:

```text
She holds the metal key in her right hand. Her left palm remains flat on
the door. She inserts the key, turns it clockwise against visible lock
resistance, and the heavy door opens inward on its hinges.
```

---

## Decisión de formato

Elegir internamente uno de estos modos:

```text
SINGLE CONTINUOUS TAKE
```

```text
CONTROLLED MULTI-SHOT SEQUENCE
```

### Usar plano continuo por defecto

Es preferible cuando:

- una sola posición de cámara puede explicar la acción;
- la continuidad física es prioritaria;
- el diálogo funciona en un mismo eje;
- el plano depende de inmersión o realismo documental;
- los cortes añadirían complejidad sin información nueva.

### Usar secuencia multi-shot cuando

- el usuario pide cortes, montaje, inserts o contraplanos;
- la acción no puede leerse desde una sola posición;
- un detalle crítico necesita su propio insert;
- deben verse reacciones simultáneas desde ángulos diferentes;
- se necesita geografía, reacción y detalle;
- el lenguaje solicitado es fragmentado, musical, onírico o de impacto.

No permitir que el modelo invente cortes no especificados.

---

## Arquitectura multi-shot

Cada plano interno debe definir:

- duración;
- óptica;
- posición y lado de cámara;
- sujetos presentes desde su primer frame;
- blocking;
- acción;
- sonido relevante;
- estado final;
- tipo de corte hacia el siguiente plano.

Plantilla:

```text
SHOT A - [time range]
Lens and camera:
First-frame subjects and blocking:
Action:
End state:

HARD CUT

SHOT B - [time range]
Lens and camera:
First-frame subjects and blocking:
Action continuing from Shot A:
End state:
```

### Tipos de corte controlables

- `HARD CUT`: cambio directo de plano;
- `SMASH CUT`: contraste abrupto e intencional;
- `MATCH CUT`: continuidad por forma, movimiento o composición;
- `INSERT CUT`: detalle aislado de un objeto o acción;
- `REVERSE CUT`: contraplano dentro de una conversación;
- `WHIP CUT`: corte oculto o motivado por movimiento rápido.

Evitar fundidos, disoluciones o efectos de transición si no se solicitan.

### Bloqueo de continuidad entre cortes

Preservar siempre:

- lista de personajes activos;
- geografía del lugar;
- dirección en pantalla;
- línea de mirada;
- relación izquierda/derecha;
- dirección de la iluminación;
- vestuario;
- heridas y suciedad;
- props y manos;
- sudor, agua, sangre, nieve, fuego, humo o polvo;
- estado de puertas, vehículos y objetos;
- progresión emocional;
- velocidad y fase de la acción.

No reiniciar una acción después de un corte. No teletransportar personajes.
No introducir elementos nuevos sin instrucción explícita.

---

## Óptica y campo de visión

La óptica se define primero por su resultado visible y después, si aporta
valor, mediante un campo de visión aproximado. Los metadatos técnicos no deben
ser el único mecanismo de control.

### Variables ópticas observables

- campo de visión;
- distancia física entre cámara y sujeto;
- expansión o compresión de perspectiva;
- proporciones de cara y cuerpo;
- cantidad de entorno visible;
- profundidad de campo;
- caída de foco;
- separación del sujeto respecto al fondo;
- distorsión en los bordes;
- oclusión de foreground;
- comportamiento durante el movimiento.

### Árbol de decisión

**Retrato:**

- rostro íntimo con entorno presente: angular moderado;
- retrato medio estable: tele corto;
- primerísimo plano emocional: teleobjetivo;
- observación lejana y oculta: superteleobjetivo con oclusión frontal.

**Acción ambiental:**

- acción documental natural: óptica normal;
- cuerpo y entorno con perspectiva marcada: angular;
- geografía amplia: ultraangular rectilíneo;
- inmersión extrema: campo de visión muy amplio, solo si toda la acción es
  ambiental.

**Detalle:**

- detalle estándar: tele corto o teleobjetivo;
- macro dentro de una escena amplia: convertirlo en insert independiente;
- no mezclar macro, retrato y geografía amplia en el mismo beat óptico.

**Observación a distancia:**

- deportes, fauna, vigilancia o seguimiento lejano: superteleobjetivo;
- retrato comprimido desde lejos: teleobjetivo con foreground y atmósfera.

### Rangos orientativos de campo de visión diagonal

| Campo aproximado | Carácter visual | Uso principal |
|---:|---|---|
| 107° | Angular rectilíneo muy amplio | Geografía, inmersión, acción próxima |
| 84° | Angular clásico | Cuerpo cercano con entorno legible |
| 47° | Perspectiva normal | Acción natural y documental |
| 29° | Tele corto | Retrato medio y separación del fondo |
| 18° | Teleobjetivo | Primer plano emocional y compresión |
| 8° | Superteleobjetivo | Observación distante y fondo aplanado |

Estos valores son guías visuales, no requisitos universales. Si el modelo no
responde bien a grados, traducirlos a su resultado óptico observable.

### Bloques ópticos reutilizables

#### Perspectiva normal

```text
Natural human-eye perspective from a moderate physical camera distance.
Stable face and body proportions, no obvious edge distortion, readable
background depth, and no strong telephoto compression.
```

#### Angular clásico

```text
Wide-angle perspective with the camera physically close to the subject.
Foreground body presence feels larger, the environment remains visible to
the frame edges, straight architectural lines stay rectilinear, and there
is no fisheye curvature.
```

#### Angular rectilíneo muy amplio

```text
Very wide rectilinear perspective from close physical distance. Immediate
foreground elements loom large, the surrounding environment spreads to
all frame edges, spatial depth stays readable, and straight lines remain
straight without a circular or fisheye look.
```

#### Tele corto

```text
Short-telephoto portrait perspective from several meters away. Close
framing comes from lens reach rather than physical proximity. The subject
stays sharp, facial proportions remain stable, and the background begins
to compress and soften.
```

#### Teleobjetivo

```text
Telephoto perspective from a distant camera position. The background
compresses behind the subject, focus isolates the eyes and key facial
features, and foreground and background dissolve into soft optical blur.
```

#### Superteleobjetivo de observación

```text
Extreme long-lens observation from far away. Only the subject is sharp;
the background becomes a compressed color wash. Large blurred foreground
shapes partially occlude the lower frame, creating the feeling of distant
observation rather than physical camera proximity.
```

### Alineación entre contenido y óptica

La óptica angular funciona mejor con contenido espacial, físico, inmersivo o
muy próximo a cámara.

La óptica larga funciona mejor con retrato, aislamiento, observación,
compresión y seguimiento desde lejos.

El macro funciona mejor como beat o insert propio.

Si un plano exige clases de contenido incompatibles, separarlas mediante
cortes controlados y asignar una óptica a cada plano.

### Prevención de deriva óptica

Para óptica larga:

```text
The camera remains physically distant. Wider framing is achieved by
repositioning with the same long-lens character, not by switching to a
wide lens. Background compression and optical separation remain stable.
```

Para óptica angular:

```text
The camera remains physically close. The environment stays visible around
the subject and the wide spatial expansion remains consistent. The shot
does not drift into compressed portrait coverage.
```

Para óptica normal:

```text
The perspective stays natural and grounded, without extreme wide-angle
distortion or telephoto compression.
```

### Continuidad óptica en secuencias

Si todos los planos comparten óptica, declararla como constante y comprobarla
en cada corte. Abrir cada plano con el carácter óptico requerido y mantenerlo
hasta el siguiente corte.

Si la secuencia utiliza ópticas diferentes:

- asignar una óptica explícita a cada plano;
- cambiarla únicamente mediante un corte definido;
- no realizar transiciones de campo de visión accidentales;
- justificar el cambio mediante una nueva función visual;
- preservar identidad, geografía, eje, miradas, luz, props y estados físicos.

Para reforzar un teleobjetivo, combinar al menos cuatro resultados observables:

- cámara físicamente alejada;
- fondo comprimido;
- sujeto como único elemento nítido;
- fondo disuelto en una masa cromática suave;
- foreground desenfocado que enmarca u oculta parcialmente;
- haze atmosférico entre cámara y sujeto;
- encuadre cerrado conseguido por alcance óptico, no por proximidad.

Para reforzar un angular, combinar al menos tres resultados observables:

- cámara físicamente próxima;
- presencia grande del foreground;
- entorno visible hasta los bordes;
- profundidad espacial legible;
- líneas rectas sin curvatura de ojo de pez;
- ausencia de compresión de fondo;
- foco profundo cuando la geografía sea prioritaria.

### Errores ópticos frecuentes

- usar “wide shot” como si fuera una lente;
- combinar zoom, cambio de lente y desplazamiento físico sin aclararlo;
- pedir encuadre cerrado y geografía extrema en el mismo beat;
- mezclar macro, retrato y acción ambiental sin cortes;
- depender solo de distancia focal, apertura o metadatos;
- encadenar varios movimientos de cámara incompatibles;
- describir únicamente lo que no se quiere sin definir el resultado positivo.

---

## Cámara y composición

Describir la cámara como comportamiento físico de un operador o soporte.

Definir cuando sea relevante:

- altura de cámara;
- distancia física al sujeto;
- ángulo vertical;
- lado del eje;
- posición inicial y final;
- tamaño del sujeto en cuadro;
- ubicación en tercios;
- espacio negativo;
- dirección del movimiento;
- prioridad de encuadre;
- comportamiento del foco;
- profundidad de campo;
- nivel de estabilización;
- relación con la fuente de luz.

Lenguaje útil:

- `camera fixed at waist height`;
- `camera moves from the doorway to the table`;
- `operator remains on the shadow side`;
- `subject holds the screen-left third`;
- `the doorway remains visible on screen-right`;
- `profile view is maintained`;
- `focus remains on the eyes while the background softens`.

### Un movimiento principal por beat

Cada beat debe tener una intención de cámara dominante. Si se combinan paneo,
órbita, dolly, inclinación, zoom y cambio de foco sin jerarquía, el movimiento
se vuelve impredecible.

Una cadena compleja solo se utiliza cuando:

- cada fase tiene timing propio;
- existe una trayectoria física posible;
- el sujeto permanece encuadrable;
- el cambio responde a una acción visible.

### Cámara handheld

Describirla físicamente:

- respiración del operador;
- asentamiento del peso;
- rebote por pasos;
- correcciones orgánicas imperfectas;
- masa del equipo sobre hombro o manos;
- pequeños pulsos;
- inclinaciones involuntarias;
- retraso humano al reaccionar.

Evitar “random shake”, jitter digital o flotación mecánica. Si se pide
estabilización, definir su grado y el residuo de movimiento humano que debe
conservarse.

---

## Acción y timing

Para planos temporizados, dividir la duración en bloques legibles:

```text
[0.00–3.00s]
[3.00–6.00s]
[6.00–9.00s]
```

Regla universal de cuantización: la duración total debe expresarse en segundos
enteros; cada límite temporal solo puede terminar en `.00` o `.50`; ningún
plano o beat puede durar menos de 1,00 s; y el último tramo debe terminar
exactamente en la duración total. Reequilibrar el montaje antes de redactar si
un análisis aporta centésimas o milisegundos.

Cada bloque puede incluir:

- posición inicial;
- acción principal;
- microacción;
- reacción de cámara;
- prop o estado corporal crítico;
- consecuencia física;
- audio o diálogo sincronizado;
- posición final.

No sobrecargar un intervalo con acciones incompatibles. Cronometrar
mentalmente lo pedido, incluyendo pausas, respiraciones, desplazamientos y
tiempo de lectura del diálogo.

### Construcción de acción

Preferir verbos concretos y continuos:

- stands;
- faces;
- looks;
- holds;
- walks;
- raises;
- touches;
- leans;
- breathes;
- falls;
- slides;
- presses;
- turns;
- opens;
- closes;
- enters;
- reclines.

Evitar acumulaciones de adverbios o psicología no visible.

### Microacciones

Las microacciones evitan el efecto de imagen estática animada:

- parpadeo irregular;
- respiración visible;
- ajuste de agarre;
- desplazamiento de peso;
- movimiento secundario de pelo o tela;
- reacción ocular;
- pequeña corrección postural;
- contacto y liberación de un objeto.

No añadir microacciones aleatorias. Deben ser compatibles con el estado
emocional, el entorno y la acción principal.

---

## Física y materiales

Cada cuerpo y objeto posee masa, resistencia y consecuencias materiales.

### Reglas generales

- gravedad constante;
- contacto visible;
- fricción con el suelo;
- aceleración y desaceleración;
- inercia;
- transferencia de peso;
- resistencia de articulaciones y bisagras;
- colisión y reacción;
- follow-through;
- retraso secundario de tela y pelo;
- comportamiento coherente de líquidos y partículas.

### Caminar

- contacto de talón;
- transferencia de peso;
- desplazamiento de cadera;
- impulso de dedos;
- asentamiento de masa;
- movimiento opuesto de brazos.

### Correr

- contacto real con el suelo;
- elevación de rodilla;
- inclinación del torso;
- zancada variable;
- brazos en oposición;
- impacto que se transmite a ropa, pelo y cámara cercana.

### Objetos pesados o herramientas

- el brazo soporta peso visible;
- la muñeca reacciona a la masa;
- el objeto tiene inercia;
- el movimiento acelera y frena;
- el agarre no cambia de mano sin transición;
- el impacto provoca una consecuencia en cuerpo y superficie.

### Líquidos

- se adhieren, gotean, fluyen, salpican, manchan o se acumulan;
- siguen gravedad y pendiente;
- las gotas recorren arcos físicos;
- el contacto mojado deja residuo;
- la viscosidad condiciona velocidad y forma.

### Tela y pelo

- responden después del movimiento principal;
- conservan peso y longitud;
- reaccionan a viento, aceleración y contacto;
- no atraviesan cuerpos ni props;
- se asientan de forma gradual.

### Nieve, polvo, humo, fuego y partículas

- siguen una dirección ambiental;
- ocupan capas de profundidad cuando son importantes;
- se acumulan o dejan residuo con el tiempo;
- reaccionan al paso de cuerpos y vehículos;
- el calor produce distorsión óptica cuando corresponde;
- el humo conserva origen y dirección de flujo.

### Vehículos y puertas

- masa y radio de giro coherentes;
- ruedas en contacto con el terreno;
- suspensión y carrocería responden a aceleración;
- puertas giran desde sus bisagras con resistencia;
- reflejos se desplazan según cámara, objeto y luz;
- daños y estados abiertos/cerrados persisten entre planos.

Evitar cuerpos flotantes, pies sin fricción, props sin peso, carreras
deslizantes, colisiones sin reacción y movimientos con apariencia elástica no
solicitada.

---

## Iluminación y exposición

La luz es una restricción prioritaria, no un adjetivo estilístico.

Definir:

- fuente principal;
- dirección;
- posición de cámara respecto a la fuente;
- lado iluminado y lado en sombra;
- brillo del fondo;
- prioridad de exposición;
- altas luces permitidas;
- rebotes ambientales;
- comportamiento durante el movimiento;
- fallo que debe evitarse cuando exista riesgo.

Ejemplo:

```text
The main light comes from behind and camera-right. The camera remains on
the subject's shadow side. A narrow rim light outlines the shoulders and
hair while the camera-facing side stays dark. Exposure is held for the
bright background, with no frontal fill and no flat face lighting.
```

### Contraluz

```text
The subject remains between the camera and the brighter background. The
camera stays on the shadow side. Only rim light, wet specular highlights,
eye glints, and environmental bounce reveal detail. Exposure prioritizes
the backlight rather than the face.
```

### Continuidad de luz

Entre cortes conservar:

- dirección de la fuente;
- intensidad relativa;
- temperatura aparente;
- sombras dominantes;
- hora del día;
- clima;
- reflejos y superficies mojadas;
- exposición de piel y fondo.

Un cambio de luz necesita una causa: atravesar una puerta, pasar bajo una
farola, encender una lámpara, aparecer una nube o cambiar deliberadamente de
localización.

---

## Audio y diálogo

El audio debe estar motivado, sincronizado y jerarquizado.

### Capas posibles

- ambiente continuo;
- efectos puntuales;
- foley corporal;
- contacto con objetos;
- respiración;
- diálogo;
- voz fuera de campo solicitada;
- música cuando proceda;
- silencios deliberados.

### Principios de audio

- cada sonido tiene una fuente o función;
- los sonidos puntuales se sincronizan con el contacto visible;
- el ambiente no compite con el diálogo;
- el espacio determina reverberación y distancia;
- el movimiento de cámara no crea sonidos imposibles;
- indicar explícitamente ausencia de música cuando sea importante;
- evitar bandas sonoras genéricas añadidas por defecto.

### Reglas de diálogo

- solo se pronuncia el texto entrecomillado;
- no hay palabras adicionales ni improvisaciones;
- no hay subtítulos ni captions salvo petición expresa;
- no se dicen nombres salvo que estén escritos en el diálogo;
- no aparecen voces fuera de campo no solicitadas;
- los labios permanecen quietos cuando el personaje no habla;
- el texto debe caber con naturalidad en la duración disponible;
- dejar margen para respiración, pausas y acción;
- reducir el ambiente bajo la voz si se necesita claridad;
- definir tono mediante conducta vocal concreta, no con listas abstractas.

Si se necesita silencio alrededor de una línea, reservarlo explícitamente. Si
el habla debe comenzar de inmediato, indicar el instante aproximado.

### Contexto sonoro anterior

Cuando una frase previa solo sirve para continuidad emocional y no debe
generar contenido visual:

```text
Prior audio context only, not visual content: "[line]."
```

No visualizar personas, nombres u objetos mencionados únicamente en ese
contexto sonoro.

---

## Control de continuidad

Construir un estado de continuidad para cada plano:

### Personaje

- identidad y proporciones;
- vestuario;
- peinado;
- heridas;
- suciedad, sudor o humedad;
- postura;
- emoción visible;
- mano ocupada;
- dirección de movimiento;
- línea de mirada.

### Prop

- posición;
- orientación;
- mano de contacto;
- estado abierto/cerrado, lleno/vacío, limpio/dañado;
- nivel de desgaste;
- movimiento y posición final.

### Entorno

- geografía;
- dirección de luz;
- clima;
- objetos movidos o destruidos;
- puertas y ventanas;
- humo, polvo, agua o fuego;
- extras visibles.

### Cámara

- lado del eje;
- óptica;
- altura;
- distancia;
- dirección de movimiento;
- sujeto prioritario;
- exposición y foco.

El estado final de un plano es el estado inicial del siguiente. Si cambia, el
prompt debe mostrar la acción que produce el cambio.

---

## Densidad del prompt

### Alta densidad donde el control es crítico

- identidad;
- primer frame;
- blocking;
- línea de mirada;
- orientación corporal;
- proximidad a hitos;
- manos y props;
- timing;
- óptica;
- luz;
- física;
- diálogo.

### Baja densidad donde el modelo puede resolver

- belleza genérica;
- decoración no importante;
- vestuario ya fijado por referencia;
- extras de fondo;
- objetos sin función;
- adjetivos de prestigio;
- información obvia o repetida.

La mejora procede de reforzar la señal, no de añadir longitud decorativa.

---

## Lenguaje de estilo

El estilo se aplica después de espacio, óptica, acción, física y luz.

Un buen ancla de estilo describe resultados observables:

- textura de imagen;
- contraste;
- reproducción cromática;
- grano o limpieza;
- respuesta de altas luces;
- nivel de pulido;
- ritmo visual;
- cualidad documental, publicitaria o narrativa.

Ejemplo:

```text
Naturalistic low-key cinema texture, restrained contrast, realistic grain,
soft highlight roll-off, grounded colors, and no synthetic surface gloss.
```

Evitar lenguaje puramente poético, cadenas de referencias culturales,
adjetivos contradictorios o estilo que sustituya instrucciones físicas.

### Sufijo técnico opcional

Solo cuando sea compatible con la intención y ayude a prevenir degradación:

```text
Sharp subject clarity, stable picture, natural colors, no ghosting, no
flicker, and motion blur only where physically motivated.
```

Este sufijo no sustituye decisiones de cámara, óptica, iluminación o física.

---

## Constraints y prevención de errores

No añadir por defecto una lista negativa genérica y enorme. Primero describir
el resultado positivo deseado y después bloquear solo el fallo probable.

Preferir:

```text
The face remains in deep shadow; no flat frontal fill.
```

En lugar de una lista desconectada de prohibiciones.

Restricciones locales útiles cuando sean necesarias:

- no duplicate characters;
- no extra people;
- no unused references;
- no empty first frame;
- no delayed subject reveal;
- no reversed gaze direction;
- no left/right position swap;
- no subject drifting away from the landmark;
- no prop changing hands;
- no flat frontal lighting;
- no weightless motion;
- no random cuts;
- no subtitles;
- no music;
- no context leakage.

Las restricciones deben ser proporcionales al riesgo. Si un fallo se repite,
reforzar tanto el estado positivo como la prohibición local.

---

## Diagnóstico de fallos

| Síntoma | Causa probable | Corrección universal |
|---|---|---|
| Primer frame vacío | Falta de ocupación explícita | Declarar sujetos visibles y posiciones desde el primer frame |
| Personaje aparece tarde | Reveal implícito | Bloquear aparición inmediata y eliminar establishing innecesario |
| Izquierda/derecha se invierten | Blocking incompleto o cambio de eje | Fijar posiciones de pantalla, torso, mirada y lado de cámara |
| Mirada incorrecta | Objetivo de mirada ambiguo | Separar torso, cabeza y ojos; nombrar el objetivo |
| Personaje lejos del hito | Proximidad vaga | Usar distancia medible o contacto físico |
| Prop cambia de mano | Estado de manos no controlado | Declarar mano inicial, transición y mano final |
| Óptica deriva | Resultado visual no protegido | Definir distancia física, perspectiva, fondo y anti-deriva |
| Plano demasiado ancho | Confusión entre encuadre y lente | Definir tamaño del sujeto y entorno visible por separado |
| Fondo demasiado nítido | Profundidad de campo ambigua | Especificar qué queda nítido y qué se disuelve |
| Luz plana | Fuente o lado de cámara indefinidos | Fijar dirección, sombra, exposición y ausencia de relleno frontal |
| Movimiento flotante | Falta de masa/contacto | Añadir apoyo, fricción, transferencia de peso e inercia |
| Acción acelerada | Demasiados eventos | Reducir beats o ampliar duración; asignar intervalos |
| Acción se reinicia tras corte | Estado final no definido | Hacer que el plano siguiente continúe desde el estado exacto |
| Personaje muta | Descripción excesiva o referencia débil | Tratar referencia como fuente de verdad y usar anclajes mínimos |
| Aparecen duplicados | Lista de activos ambigua | Enumerar sujetos activos y bloquear personas adicionales |
| Diálogo incorrecto | Texto largo o voces no delimitadas | Reducir línea, asignar hablante y reservar tiempo de silencio |
| Audio genérico | Fuente no especificada | Definir ambiente, foley, efectos y ausencia/presencia de música |
| Corte aleatorio | Modo de formato indefinido | Declarar plano continuo o cortes exactos |
| Contexto antiguo reaparece | Prompt contaminado | Sellar el plano y eliminar referencias, nombres y objetos heredados |

---

## QA interno obligatorio

Antes de entregar, comprobar silenciosamente:

### Alcance

- ¿El prompt contiene solo el plano o secuencia actual?
- ¿Se eliminaron personajes, props y referencias inactivos?
- ¿No quedan números de escena, notas internas o contexto heredado?

### Primer frame y espacio

- ¿El primer frame contiene lo necesario?
- ¿Cada personaje tiene posición clara?
- ¿La relación de profundidad es legible?
- ¿Las posiciones izquierda/derecha están fijadas?
- ¿La proximidad a hitos es física y concreta?

### Personajes

- ¿La identidad está protegida sin sobrescribir la referencia?
- ¿Torso, cabeza y mirada están definidos cuando importa?
- ¿Cada prop está en la mano correcta?
- ¿Vestuario, heridas y estados permanecen constantes?

### Óptica y cámara

- ¿La óptica corresponde al tipo de contenido?
- ¿El resultado óptico está descrito visualmente?
- ¿La distancia física de cámara es coherente?
- ¿La óptica está protegida contra deriva?
- ¿El lado de cámara y el eje son claros?
- ¿Existe un movimiento principal ejecutable?

### Acción y física

- ¿La acción cabe en la duración?
- ¿Cada cambio tiene causa y consecuencia?
- ¿Hay masa, contacto, fricción e inercia?
- ¿Los estados finales preparan correctamente el siguiente plano?

### Iluminación

- ¿La fuente y su dirección están definidas?
- ¿La cámara está en el lado correcto respecto a la luz?
- ¿La prioridad de exposición es clara?
- ¿La luz se mantiene entre cortes?

### Audio y diálogo

- ¿Solo habla quien debe hablar?
- ¿El texto exacto está delimitado?
- ¿Cabe de forma natural en el tiempo?
- ¿Los efectos están sincronizados con acciones visibles?
- ¿Música, ambiente y silencio están controlados?

### Entrega

- ¿El prompt está en inglés claro y directo?
- ¿Se aplicó la sintaxis específica del modelo solo en la capa posterior?
- ¿El QA y el razonamiento están ocultos?
- ¿La salida está libre de explicación no solicitada?

Si alguna respuesta es negativa, corregir el prompt antes de entregarlo.

---

## Contrato de salida

Por defecto, cuando el usuario pide generar o mejorar un prompt:

- entregar el prompt final en inglés;
- conservar el diálogo en el idioma solicitado;
- usar palabras simples, directas y visuales;
- omitir razonamiento interno y QA;
- no incluir notas de ingeniería dentro del prompt;
- no inventar referencias ni assets;
- no repetir ajustes ya controlados externamente salvo necesidad;
- no añadir personajes, objetos, voces o cortes no solicitados.

Si el usuario pide análisis, auditoría, explicación, alternativas o debugging,
se puede mostrar esa información fuera del prompt.

---

## Plantilla maestra adaptable

```text
SCENE CONTEXT
[One or two sentences describing only the visible event in this shot.]

ACTIVE REFERENCES
[Only the references required in this shot, each with its assigned role.]

LOCATION MAP
[Camera position and facing direction. Foreground, midground, background,
landmarks, movement path, and light direction.]

FIRST FRAME AND SPATIAL BLOCKING
[Who is visible immediately, screen position, world position, depth,
distance, torso direction, gaze target, props, and hand states.]

FORMAT MODE
[Single continuous take, or an explicitly timed controlled sequence.]

OPTICS
[Field-of-view character, physical camera distance, perspective result,
focus behavior, depth of field, and anti-drift lock if necessary.]

CAMERA AND COMPOSITION
[Height, angle, side of axis, subject size, screen placement, movement,
operator behavior, and framing priority.]

ACTION TIMING
[Timed beats with position, action, camera reaction, prop state, physical
consequence, dialogue/audio, and end state.]

PHYSICS AND MATERIAL BEHAVIOR
[Mass, gravity, contact, friction, inertia, cloth, hair, liquid, particles,
vehicle or object behavior relevant to this shot.]

LIGHTING AND EXPOSURE
[Source, direction, shadow side, background brightness, exposure priority,
allowed highlights, environmental bounce, and continuity.]

AUDIO AND DIALOGUE
[Ambient sources, synchronized effects, foley, voice, exact dialogue,
silence, and music rule.]

POSITIVE CONSTRAINTS
[The critical states that must remain true throughout the shot.]

LOCAL FAILURE-PREVENTION LOCKS
[Only the short restrictions required for likely failures.]
```

Esta plantilla es una lista de control de contenido, no un formato rígido. La
capa específica del modelo decide si se conserva por secciones, se transforma
en prosa, se comprime o se reordena.

## Adaptación a Kling 4.0 en AILAB

Aplicar la guía y los ejemplos de Kling 4.0 (no incluidos en esta skill). La arquitectura cinematográfica
universal es razonamiento de dirección, no una obligación de emitir todos los
encabezados. Referencias y Fotogramas clave son modos separados. Usar las
menciones nativas: `@image_1`, `@video_1`, `@first_frame`, `@keyframe_1` y
`@last_frame`; un sujeto/voz de administrador usa su `@nombre` real.

Definir encuadre, espacio, acción, cámara, luz y estado final con controles
observables. Separar identidad, producto, composición, interpretación y cámara.
Una toma continua debe declararse si se necesita. En Fotogramas clave siempre
hay primero, hasta 8 intermedios y último opcional; cantidad total según duración
y ratio del primero. No trasladar un vídeo de cámara a ese modo.

El vídeo de referencia sirve para nueva generación, no para edición conservadora.
No ofrecer funciones externas de edición, Flash, 4K, HDR ni extensión. Los
blockouts o mapas de profundidad son posibles contenidos de referencias, no
modos dedicados acreditados en AILAB. Aplicar sus límites de archivo y revisar
la eficacia visual en el resultado. Resolución y sonido original se resuelven
en ajustes; describir una luz intensa no activa otro formato de salida.
