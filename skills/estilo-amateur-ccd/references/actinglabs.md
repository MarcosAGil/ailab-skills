# ActingLabs: Base de conocimiento universal de interpretación

## Propósito

ActingLabs es la capa general de dirección interpretativa del Video Prompter de
Ailendra Labs.
Su función es convertir emociones, relaciones y conflictos narrativos en
comportamientos visibles, audibles, continuos y representables dentro de un
prompt de vídeo.

Esta base de conocimiento no pertenece a ninguna plataforma, marca o modelo.
Se aplica a cualquier escena con personajes humanos, criaturas antropomórficas
o figuras cuya conducta deba comunicar intención, pensamiento y reacción.

La personalización final se construye en cuatro capas:

1. **ActingLabs:** objetivo, obstáculo, tácticas, beats, subtexto, escucha,
   cuerpo, mirada, voz, proxémica, estatus y continuidad interpretativa.
2. **CineLabs:** primer frame, blocking espacial, óptica, cámara, física,
   iluminación, montaje, timing general y continuidad visual.
3. **Guía del modelo:** formato, sintaxis, orden, referencias, límites y
   capacidades del generador elegido.
4. **Petición del usuario:** personajes, historia, diálogo, tono, duración,
   assets y resultado creativo.

ActingLabs gobierna únicamente la capa de performance. No decide vestuario,
cámara, lente, color, iluminación ni composición. Cuando una conducta afecta
al espacio -por ejemplo, acercarse, retirarse o invadir la distancia de otra
persona- ActingLabs define la motivación y CineLabs fija su ejecución espacial.

---

## Axioma central

**Actuar es comportarse bajo presión, no mostrar una emoción.**

Un personaje quiere algo de alguien, algo se interpone y el personaje actúa
para conseguirlo. La emoción surge como consecuencia de esa lucha. Nunca debe
ser la única instrucción.

Débil:

```text
She looks angry and sad.
```

Fuerte:

```text
She tries to make him return the money without letting the others see how
desperate she is. She keeps her voice low, grips the receipt until it
creases, and looks at the door before asking him one final time.
```

La primera versión pide representar etiquetas emocionales. La segunda da al
personaje un objetivo, presión, táctica, ocultación y conducta filmable.

---

## Objetivo de calidad

Toda actuación debe intentar producir:

- conducta continua antes, durante y después del diálogo;
- un objetivo activo dirigido a una persona concreta;
- un obstáculo real y un coste de fracaso;
- cambios de táctica cuando la estrategia anterior falla;
- beats visibles mediante pausas, postura, ritmo o mirada;
- subtexto que no repita literalmente las palabras;
- escucha activa y reacciones que comienzan antes de terminar la réplica;
- pensamiento visible antes de responder;
- cuerpo coherente con biografía, cansancio y estado físico;
- respiración compatible con el esfuerzo y la voz;
- tareas físicas que mantengan las manos ocupadas con verdad;
- distancias y cambios de estatus motivados;
- ojos vivos, dirigidos y reactivos;
- voz consistente entre escenas;
- inercia emocional después de cada acontecimiento;
- contradicción humana: dos verdades compatibles en tensión;
- ausencia de gesticulación ilustrativa, muecas y sobreactuación.

---

## Actuación falsa frente a actuación viva

| Actuación falsa | Actuación viva |
|---|---|
| Muestra una emoción | Persigue un objetivo y la emoción aparece como consecuencia |
| Espera su turno para reaccionar | Escucha y cambia mientras el otro todavía habla |
| El gesto ilustra cada palabra | El cuerpo tiene vida propia y a veces contradice el texto |
| Todas las frases comparten tono y velocidad | El ritmo cambia cuando cambia la táctica |
| La emoción se activa al hablar y desaparece después | El estado tiene vida anterior e inercia posterior |
| El rostro hace muecas para explicar | El rostro piensa; los ojos reciben la idea antes que la boca |
| El personaje conoce ya el resultado de la escena | Solo actúa a partir de lo que sabe en ese instante |
| La pausa es tiempo muerto | La pausa contiene evaluación, decisión o resistencia |

---

## Los cinco pilares de una escena

Cada personaje activo necesita cinco elementos. Si falta uno, la actuación
tiende a volverse plana, arbitraria o puramente gestual.

### 1. Objetivo

Es lo que el personaje quiere conseguir **ahora**, **en esta escena** y **de
una persona concreta**.

Debe formularse como verbo de acción dirigido al compañero:

- hacerle confesar;
- conseguir una semana más;
- convencerla de que no tiene miedo;
- impedir que se marche;
- obligarlo a tomar una decisión;
- hacer que baje la voz;
- recuperar su respeto;
- distraerla para ocultar una prueba.

No formularlo como estado:

- estar enfadado;
- sentirse culpable;
- parecer triste;
- ser misterioso.

Los estados no pueden ejecutarse directamente. El objetivo sí genera conducta.

Detrás del objetivo de escena puede existir un objetivo mayor de personaje.
Cada escena representa un paso, avance o retroceso respecto a ese impulso.

### 2. Obstáculo y stakes

El obstáculo impide obtener el objetivo.

Puede ser externo:

- la otra persona quiere lo contrario;
- hay testigos;
- queda poco tiempo;
- el objeto necesario no está disponible;
- una jerarquía limita lo que puede decirse.

Puede ser interno:

- el orgullo impide suplicar;
- no cree sus propias palabras;
- necesita ayuda, pero teme parecer débil;
- quiere confesar, pero protege a otra persona;
- el cuerpo no responde al esfuerzo requerido.

Los stakes responden a esta pregunta:

**¿Qué ocurre si el personaje no consigue lo que quiere?**

La respuesta debe importar al personaje. Cuanto más alto sea el coste del
fracaso, mayor será la tensión de cada decisión, incluso cuando el exterior
permanezca quieto.

### 3. Tácticas

La táctica es el método concreto que el personaje utiliza para conseguir el
objetivo en este momento.

Se formula mediante verbos de acción:

- presionar;
- seducir;
- avergonzar;
- suplicar;
- provocar;
- negociar;
- amenazar;
- retrasar;
- tranquilizar;
- distraer;
- ridiculizar;
- proteger;
- castigar con silencio;
- fingir indiferencia.

Cuando una táctica falla, una persona viva cambia de estrategia. Mantener una
sola táctica durante toda la escena produce interpretación monocorde.

Ejemplo de progresión:

```text
Beat 1: She charms him into staying.
Beat 2: When charm fails, she shames him with what he promised.
Beat 3: When he reaches the door, she stops pretending and quietly begs.
```

### 4. Beats

El beat es la unidad mínima de acción: el tramo durante el cual un personaje
persigue una intención mediante una táctica concreta.

Un beat termina cuando:

- el objetivo se cumple;
- la táctica falla;
- aparece información nueva;
- cambia el equilibrio de poder;
- una conducta del compañero obliga a reevaluar;
- la situación física modifica lo posible.

Todo cambio de beat debe producir una señal observable:

- pausa con pensamiento;
- cambio de postura;
- modificación del ritmo de habla;
- desplazamiento de mirada;
- interrupción de una tarea física;
- acercamiento o retirada;
- cambio de volumen;
- inmovilidad repentina;
- nueva forma de tocar o soltar un objeto.

Como guía general, una escena breve funciona bien con 2–4 cambios de beat. El
número se ajusta a la duración y complejidad. Si el comportamiento permanece
igual durante todo el plano, la actuación se percibe plana.

### 5. Subtexto

El subtexto es lo que el personaje piensa, necesita o intenta ocultar frente a
lo que dice literalmente.

No se interpreta mostrando “el subtexto”. Se filtra cuando el personaje juega
su verdadero objetivo mientras pronuncia un texto que intenta ocultarlo.

Indicadores útiles:

- una pregunta que en realidad es una acusación;
- repetir lo mismo porque no se cree la respuesta;
- cambiar bruscamente de tema;
- hacer una broma en el peor momento para evitar vulnerabilidad;
- responder demasiado corto para cerrar una puerta emocional;
- ayudar mientras se castiga;
- pedir perdón mientras se sigue defendiendo;
- decir que no importa mientras se protege el objeto relacionado.

---

## Escucha y reacción

La actuación vive tanto entre las frases como dentro de ellas.

### La reacción comienza antes de terminar la réplica

Una persona comprende la intención del compañero a mitad de frase. El rostro,
la respiración o el cuerpo empiezan a responder antes de que llegue el último
término. Esperar con expresión vacía y activarse después crea una reacción
mecánica.

```text
Before he finishes the accusation, her fingers stop folding the napkin.
Her eyes rise toward him while the rest of her body remains still.
```

### Pensamiento antes de palabra

Una pregunta difícil necesita un instante de decisión. La micro-pausa no es
vacío: contiene selección, censura o cambio de estrategia.

```text
He inhales to answer, stops, checks her face, then chooses a safer sentence.
```

Las respuestas instantáneas y uniformes parecen recitadas cuando la situación
exige procesamiento.

### Momento de evaluación

Después de recibir una noticia, amenaza o insulto, reservar tiempo para que el
personaje lo asimile. La duración puede ser mínima o prolongada, pero debe
contener conducta:

- mirada que pierde foco;
- respiración suspendida;
- mandíbula que deja de trabajar;
- tarea física interrumpida;
- ojos que revisan al compañero buscando confirmación;
- postura que se reorganiza.

### Contagio del compañero

El ritmo, volumen y nivel de energía cambian en respuesta a lo que llega. Un
grito puede recibir otro grito o una quietud incisiva, pero nunca ignorarse como
si ambas interpretaciones pertenecieran a escenas distintas.

---

## Vida física del personaje

El cuerpo cuenta la historia antes de la primera frase.

### Estado físico antes que psicología

Definir para cada personaje:

**Centro de gravedad:**

- alto: pecho y barbilla dominan; seguridad, agresión o estatus;
- bajo: peso en caderas, hombros caídos; cansancio, miedo o sumisión;
- adelantado: urgencia, persecución, hambre de respuesta;
- retrasado: resistencia, sospecha, deseo de escapar.

**Tempo corporal:**

- rápido y fragmentado: nerviosismo, exceso de energía, falta de control;
- lento y económico: control, amenaza o agotamiento;
- irregular: conflicto entre impulso y contención.

**Apertura:**

- hombros cuadrados, manos visibles, pecho abierto;
- brazos cruzados, cabeza baja, torso protegido;
- apertura fingida con pies orientados hacia la salida;
- cuerpo cerrado y rostro socialmente amable.

**Respiración:**

- alta y rápida bajo pánico o esfuerzo;
- baja y lenta bajo control;
- retenida durante ocultación o amenaza;
- entrecortada después de correr, llorar o recibir un golpe;
- exhalación larga para recuperar dominio.

La voz y la física deben coincidir. Una persona que acaba de correr no habla de
inmediato con respiración estable salvo que se muestre el esfuerzo por ocultarlo.

### Business: la tarea física

El personaje casi siempre se beneficia de estar haciendo algo:

- reparar una máquina;
- contar dinero;
- cocinar;
- limpiar un vaso;
- doblar ropa;
- preparar una herida;
- ordenar documentos;
- intentar abrir un envase;
- desmontar un objeto.

La tarea física:

- evita teatralidad vacía;
- ocupa las manos con una verdad concreta;
- genera ritmo natural;
- rellena pausas con conducta;
- revela subtexto a través de cómo se ejecuta;
- ofrece un estado físico que puede cambiar con cada beat.

### Regla de la acción interrumpida

Detener una tarea habitual convierte el instante en puntuación dramática.

Si una persona lleva diez segundos cortando pan y deja el cuchillo inmóvil al
oír una frase, esa frase se convierte en acontecimiento. Usar la interrupción
de manera deliberada, no en cada línea.

```text
She keeps polishing the glass through the first accusation. On the final
word, the cloth stops. She does not look up yet.
```

### Proxémica: distancia como drama

La distancia entre personajes hace visible su relación:

| Distancia aproximada | Lectura posible |
|---:|---|
| Menos de 0,5 m | Intimidad, violencia, invasión o secreto |
| 0,5–1,2 m | Confianza, relación personal o confrontación contenida |
| 1,2–3,5 m | Negociación, cautela o formalidad |
| Más de 3,5 m | Alienación, jerarquía, exclusión o ruptura |

Estas lecturas no son reglas rígidas. Lo dramático está en quién cambia la
distancia, quién retrocede, quién no cede y quién congela el movimiento.

**Un cambio de distancia suele equivaler a un cambio de beat.**

Toda entrada en el espacio de otra persona necesita una motivación:

- acercarse para presionar;
- retirarse para recuperar control;
- susurrar una amenaza a centímetros del rostro;
- cruzar la habitación para impedir una salida;
- sentarse para rechazar una escalada;
- quedarse detenido en el umbral porque aún no ha decidido entrar.

### Estatus: jerarquía en conducta

El estatus no es el cargo; es lo que el cuerpo hace en ese momento.

Indicadores de estatus alto:

- cabeza relativamente inmóvil;
- movimientos lentos y económicos;
- miradas largas;
- pausas antes de responder;
- ocupar espacio sin pedir permiso;
- tocar objetos ajenos;
- tolerar el silencio;
- bajar el volumen y hacer que otros se acerquen para escuchar.

Indicadores de estatus bajo:

- ajustes constantes;
- tocarse cara o pelo;
- risa de relleno;
- habla fragmentada;
- buscar permiso con los ojos;
- retirar manos u objetos cuando otro se acerca;
- reaccionar demasiado rápido;
- elevar el volumen para recuperar terreno.

Los cambios de estatus son acontecimientos potentes:

- una figura dominante muestra miedo durante un segundo;
- una persona subordinada deja de sonreír;
- alguien entra con control y termina encogido;
- alguien entra pidiendo permiso y acaba dominando el espacio.

La persona con más poder suele moverse menos y hablar más bajo. Las excepciones
deben sentirse como una ruptura significativa, no como inconsistencia.

---

## Ojos y pensamiento

Los ojos congelados son una de las señales más claras de actuación sintética.
Cada personaje necesita vida ocular continua y motivada.

### Componentes obligatorios

**Micro-sácadas y objetivos:** la mirada se desplaza entre persona, manos,
objeto, salida o recuerdo espacial. No queda fijada en un punto sin motivo.

**Parpadeo:** ritmo y calidad responden al estado:

- ráfagas rápidas bajo estrés;
- párpados lentos bajo control;
- parpadeo seguido de desenfoque en disociación;
- frecuencia baja y deliberada en quietud amenazante.

**Brillo ocular vivo:** los ojos conservan humedad y reflejos naturales. La
quietud elegida no debe convertirse en mirada vidriosa o muerta.

**Los ojos lideran el pensamiento:** llegan al objetivo una fracción antes que
la cabeza. La decisión aparece en los ojos antes de la palabra.

**Respuesta al beat:** estabilidad, velocidad de escaneo, parpadeo y dirección
cambian cuando cambia la táctica o el equilibrio de poder.

### Quietud controlada

Un personaje puede casi no parpadear, pero esa inmovilidad debe percibirse como
decisión. Mantener pequeños desplazamientos de mirada, respiración y atención.

### Primer plano

Cuanto más cerrado sea el encuadre, menos movimiento facial se necesita. En un
primer plano, ojos, respiración, mandíbula y pensamiento suelen bastar. Reducir
cejas, muecas y gestos que intentan explicar la emoción.

---

## Voz y habla

### Ritmo

La velocidad debe ser precisa. Hablar rápido no significa perder articulación.
El ritmo cambia al cambiar la táctica.

### Solapamientos

Las personas se pisan las últimas palabras, pero los términos narrativamente
importantes deben quedar limpios. Definir qué línea interrumpe y dónde.

### Contraste de volumen

Las frases más peligrosas pueden decirse más bajo. Gritar no equivale a poder.
El personaje que controla la escena puede reducir el volumen y obligar al resto
a escuchar.

### Pausas

Una pausa solo funciona si ocurre algo dentro:

- evaluación;
- decisión;
- negativa a responder;
- cambio de táctica;
- tarea física;
- lucha por controlar la respiración.

Si no ocurre nada, eliminar la pausa o cortar.

### Imperfección verbal

El habla natural puede contener:

- interrupciones;
- repeticiones;
- finales abandonados;
- palabras corregidas;
- muletillas coherentes con el personaje;
- frases demasiado cortas;
- respiraciones que rompen la sintaxis.

No ensuciar todas las líneas por sistema. La imperfección debe corresponder a
clase social, educación, cansancio, urgencia y forma de ocultación.

---

## Perfil maestro de actuación

Cada personaje recurrente recibe un único perfil maestro. Es la fuente de
verdad permanente sobre cómo actúa y se adapta después a cada escena.

Longitud orientativa: **150–220 palabras**, en un único párrafo fluido, escrito
en inglés y compuesto solo por conducta observable.

### Orden del perfil

```text
Character acting as [NAME]. [Age, build, physique and posture: the body as
a document of biography]. [Psychological engine in one clause: the drive
that explains the physical behavior]. Vocal profile: [pitch and timbre,
accent or origin, pace, delivery, and how the voice shifts under pressure].
Key physical habits and tics: [signature tic and trigger; stress tic and
trigger; concealment behavior; facial mask and the exact condition that
breaks it]. Eye life: [gaze behavior, blink quality, thought-before-word,
and attention targets]. Walking style: [named gait with weight, rhythm,
foot placement, torso, arms and head]. However, when [trigger], [visible
transformation of posture, gait, face, breath and voice]. [Optional: the
single person, animal or object that genuinely softens the character].
```

### Reglas del perfil

#### Solo comportamiento observable

Transformar cada estado interno en marcador corporal.

No:

```text
He is nervous.
```

Sí:

```text
His lower lip trembles once, he swallows heavily, inhales through the
mouth, and releases a short breath through pursed lips before speaking.
```

#### Cada tic necesita desencadenante

Un tic sin causa es decoración. Un tic con desencadenante es dramaturgia.

No:

```text
He cracks his knuckles.
```

Sí:

```text
He cracks his knuckles during ordinary conversation whenever he needs to
manufacture confidence.
```

Fórmula:

```text
[tic] + [when or why it appears]
```

#### Nombrar y explicar la forma de caminar

Un nombre breve ayuda a mantener el patrón biomecánico, pero debe desarrollarse
mediante peso, ritmo, pies, torso, brazos y cabeza.

Ejemplo:

```text
A heavy “old fighter's walk”: short economical steps, full-foot weight,
level shoulders, loose hands, and a head that never arrives before the body.
```

#### Construir máscara y grieta

Cada perfil necesita una fachada habitual y una condición exacta que la rompa.

```text
However, when someone mentions his younger brother, the rehearsed smile
fails: his shoulders drop, his eyes lose focus, and his next breath arrives
through the mouth instead of the nose.
```

La transformación condicional permite que convivan dos verdades y evita un
personaje de una sola nota.

#### Un único objetivo de ablandamiento

Cuando sea coherente, elegir una persona, animal u objeto ante el que el rostro
se suaviza de verdad. Uno solo, para humanizar sin diluir el patrón.

#### El cuerpo contiene la biografía

Edad, constitución y postura deben comunicar profesión, lesiones pasadas,
desgaste, hábitos y autoimagen. El cuerpo es un documento narrativo.

#### Separación de capas

No incluir en el perfil maestro:

- vestuario;
- cámara;
- óptica;
- iluminación;
- color;
- composición;
- referencias de estilo visual.

El perfil debe seguir siendo válido aunque cambie el plano, el lugar o el
vestuario.

---

## Adaptación del perfil a cada escena

El perfil maestro define quién es el personaje. La adaptación define cómo se
manifiesta en este momento concreto. No pegar el perfil completo sin cambios.

### Reglas de adaptación

1. **Solo personajes presentes.** Un personaje fuera de plano no recibe
   párrafo de actuación.
2. **Conservar el núcleo.** Identidad vocal, tics, vida ocular, motor interno y
   continuidad emocional no se contradicen.
3. **Reescribir para la postura y acción actuales.** Adaptar a estar sentado,
   corriendo, escondido, herido, exhausto o inmovilizado.
4. **Transformar, no borrar.** Si una conducta no puede ejecutarse, desplazar su
   energía a una salida físicamente posible.
5. **Un solo párrafo fluido por personaje.** Sin listas ni controles internos
   dentro del prompt final.
6. **Vincular claramente la actuación al personaje correcto.** Si la capa del
   modelo utiliza identificadores de referencias, emplear únicamente el
   identificador activo que el usuario haya proporcionado.

Ejemplo de transformación:

Un personaje que descarga nervios caminando no puede hacerlo si está sentado.
La misma energía puede aparecer como balanceo mínimo, giro de muñeca, papel que
se desgarra o pie que busca apoyo. El motor permanece; cambia su salida física.

### Contenido de una adaptación

- postura y estado físico inicial;
- objetivo de escena;
- obstáculo inmediato;
- táctica inicial;
- tarea física;
- objetivos de mirada;
- respiración;
- 2–4 cambios de beat;
- cambio de táctica visible;
- máscara y posible grieta;
- estado final con inercia hacia el siguiente plano.

---

## Identidad vocal permanente

La actuación se adapta por escena; la identidad vocal permanece fija.

Cada personaje recurrente puede tener un prompt de voz independiente de 1–2
frases. Cuando habla, se reutiliza sin cambios. Cuando aparece en silencio, se
omite de la capa de audio.

### Fórmula

```text
"A [age]-year-old [origin or accent descriptor]. [Timbre and register];
[pace and delivery]; [emotional character and how the voice shifts under
pressure]."
```

El perfil vocal incluido en la actuación describe cómo se comporta el habla
dramáticamente. El prompt de voz fija la identidad sonora. Ambos deben ser
compatibles.

No adaptar de forma arbitraria acento, timbre o registro entre escenas. Los
cambios temporales (fatiga, llanto, lesión, susurro) se añaden como estado sin
reemplazar la identidad base.

---

## Estados claros en lugar de transiciones sobrecargadas

Una instrucción de vídeo es más robusta cuando describe estados de acción
claros y encadenados. Las transiciones con demasiados pasos tienden a comprimirse
o perderse.

Débil:

```text
He reaches into the bag, searches inside, pulls out the ball, prepares his
arm, winds up, and throws it.
```

Más robusto por beats:

```text
Beat 1: His hand is already inside the bag, searching by touch.
Beat 2: He holds the ball at shoulder height, arm loaded, eyes on the target.
Beat 3: He is mid-throw, weight crossing onto the front foot.
Beat 4: His arm follows through as he watches the result.
```

Esto no elimina la continuidad: la construye mediante estados físicamente
legibles unidos por causa y efecto.

---

## Interpretación de conjunto

### Reacciones en onda

Un grupo no reacciona de forma idéntica y simultánea. Una persona comprende
primero, otra medio beat después y una tercera apenas reacciona. Variar timing,
intensidad y conducta.

La sincronía solo se utiliza cuando es deliberadamente coreográfica.

### La reacción vale más que el acontecimiento

Después de una acción importante, reservar atención para quien la ha visto. La
reacción revela significado, relación y stakes.

### Quietud ante la amenaza

Un conjunto puede mantener microactividad (peso, manos, miradas, tareas) y
detenerse al llegar la amenaza. El contraste de actividad a quietud funciona
como puntuación.

### Movimiento motivado

Nadie cruza una habitación sin impulso interno. Todo movimiento se dirige hacia
algo o se aleja de algo.

Acciones espaciales potentes:

- cerrar distancia para escalar;
- dar la espalda para despreciar u ocultar el rostro;
- ponerse de pie mientras el otro permanece sentado para tomar dominio;
- sentarse en medio del conflicto para rechazar la escalada;
- detenerse en un umbral como punto de decisión;
- empezar a recoger objetos como ultimátum corporal.

### Amenaza sin anuncio

La peligrosidad no necesita pausas “amenazantes”, ojos entrecerrados o giros
lentos de preparación. La violencia verosímil puede llegar desde la conducta
cotidiana sin anunciarse. La tensión se lee también en quienes rodean a la
persona peligrosa.

### Degradación acumulativa

Cuando un personaje se desgasta a lo largo de una historia, el cuerpo conserva
la progresión: más pesado, más lento, menor tiempo de reacción, respiración más
difícil o menor capacidad para sostener la máscara. No reiniciar entre escenas.

---

## Continuidad interpretativa

Mantener una ficha de estado por personaje:

- objetivo mayor;
- objetivo de escena;
- conocimiento disponible en este instante;
- táctica actual;
- táctica anterior que ha fallado;
- relación y estatus frente a cada persona;
- nivel de energía;
- respiración;
- centro de gravedad;
- tarea física;
- posición y distancia;
- objetivos de mirada;
- máscara activa;
- grieta ya revelada o todavía oculta;
- estado vocal;
- consecuencias emocionales acumuladas;
- estado final del plano.

### Regla del conocimiento presente

El personaje solo puede actuar con la información que posee ahora. No debe
interpretar desde el primer segundo el desenlace que ocurrirá después.

### Inercia del estado

Una noticia, agresión o ruptura no desaparece al terminar la réplica. El cuerpo
arrastra respiración, tensión, mirada y ritmo al siguiente beat y al siguiente
plano.

### Regla de las dos verdades

La actuación más rica sostiene dos impulsos simultáneos:

- ayuda y lo detesta;
- pide perdón y todavía se defiende;
- ama y ya ha decidido marcharse;
- hace reír para evitar llorar;
- amenaza mientras desea que el otro no le obligue a cumplir;
- protege al compañero mientras intenta castigarlo.

Una emoción única y limpia suele sentirse simplificada, especialmente en
primer plano. La contradicción debe influir en conducta, no convertirse en una
explicación psicológica dentro del prompt.

---

## Arquitectura del bloque de actuación

La capa interpretativa de una escena puede construirse internamente con este
orden:

```text
CHARACTER AND CURRENT PHYSICAL STATE
SCENE OBJECTIVE
OBSTACLE AND STAKES
INITIAL TACTIC
PHYSICAL BUSINESS
EYE LIFE AND LISTENING TARGETS
BEAT CHANGES AND TACTIC SHIFTS
SUBTEXT AND CONCEALMENT
BREATH AND VOICE BEHAVIOR
STATUS AND PROXEMIC CHANGES
MASK, CRACK AND END STATE
```

La salida final debe convertirlo en un único párrafo fluido por personaje,
adaptado después a la estructura específica del modelo.

### Plantilla adaptable

```text
[CHARACTER] begins [current physical state and posture], pursuing [playable
objective directed at partner] while [obstacle and stakes]. [Physical
business and initial tactic]. The eyes [attention targets, micro-saccades,
blink behavior and thought-before-word], and the breath [state-consistent
pattern]. When [new information or failed tactic], [visible beat change:
pause, posture, gaze, tempo, distance or interrupted action], and the tactic
changes from [first action verb] to [second action verb]. The spoken words
say [surface intention], while the body protects or leaks [subtext through
observable behavior]. Status shifts through [stillness, space, volume or
timing]. However, when [mask-breaking trigger], [precise physical crack].
The scene ends with [state carrying inertia into the next beat or shot].
```

No es obligatorio conservar los corchetes o encabezados. Son una lista de
control de contenido.

---

## Atlas de actuación problemática

| Síntoma | Cómo se ve | Corrección en el prompt |
|---|---|---|
| Indicación emocional | Cejas, muecas y rostro “mostrando” la emoción | Quitar la emoción como tarea; escribir objetivo y dar una tarea física |
| Interpretar el resultado | El personaje juega el desenlace desde el primer segundo | Limitar la conducta a lo que sabe ahora |
| Esperar la réplica | Rostro vacío mientras habla el compañero | Iniciar reacción antes de terminar la frase |
| Una sola táctica | Todo se grita, suplica o mantiene igual | Marcar beats y asignar un verbo táctico distinto |
| Gesto ilustrativo | El gesto repite literalmente una palabra | Hacer que preceda, contradiga o desaparezca |
| Emoción gratuita | Lágrimas o furia sin acumulación ni trigger | Construir contención → coste → ruptura |
| Cuerpo incoherente | Postura sin relación con biografía o estado | Fijar centro de gravedad, tempo, desgaste y respiración |
| Habla demasiado limpia | Frases perfectas incompatibles con el personaje | Añadir interrupciones, repeticiones o finales cortados con criterio |
| Amenaza anunciada | Pausas, muecas y giros lentos antes de actuar | Mantener conducta cotidiana y acción sin wind-up teatral |
| Reacción de grupo sincronizada | Todos responden igual y a la vez | Escalonar la reacción y variar intensidad |
| Pausa muerta | Silencio sin pensamiento ni actividad | Llenar con evaluación o tarea; si no, eliminar |
| Reinicio emocional | Recuperación instantánea tras un evento fuerte | Mantener la inercia del estado en beats y planos posteriores |
| Comentar el personaje | La interpretación guiña al espectador | Creer plenamente las circunstancias; interpretar la comedia con seriedad |
| Exceso en primer plano | Actividad facial continua | Reducir a ojos, respiración, mandíbula y pensamiento |
| Ojos muertos | Mirada fija, parpadeo inexistente o brillo vidrioso | Añadir objetivos de mirada, micro-sácadas, parpadeo y ojos que lideran |
| Tics decorativos | Gestos repetidos sin causa | Asignar un desencadenante y una función dramática |
| Diálogo desconectado del cuerpo | Voz estable pese a esfuerzo o shock | Alinear respiración, articulación, tempo y energía física |
| Cambio de estatus invisible | La jerarquía cambia solo en el texto | Cambiar quietud, espacio, volumen, mirada o derecho a tocar objetos |
| Subtexto explicado | El prompt declara lo que el personaje oculta | Mostrar el fallo parcial al ocultarlo mediante conducta |

---

## Escala interna de performance

### Nivel 0: Maniquí

Existe texto, pero no comportamiento.

### Nivel 1: Declamación

Hay expresividad, emociones indicadas y cuerpo ilustrativo.

### Nivel 2: Correcta pero plana

Se intuye un objetivo, pero solo existe una táctica; las reacciones llegan
tarde y las pausas están vacías.

### Nivel 3: Construida

Objetivo y beats presentes, escucha activa y cuerpo coherente. Todavía faltan
subtexto, tácticas sorprendentes e inercia del estado.

### Nivel 4: Viva

Conducta continua, tácticas contrastadas, subtexto distinto al texto, estatus
visible, reacciones anteriores al final de la frase y al menos una elección
inesperada pero verdadera.

### Nivel 5: Magnética

Incluye todo el nivel 4 y añade paradoja: dos verdades simultáneas que producen
una conducta compleja, específica e imprevisible sin dejar de ser coherente.

Los planos centrados en personajes deben aspirar al nivel 4 o superior. Si el
bloque se evalúa en nivel 2 o inferior, debe reescribirse.

---

## QA interno obligatorio

Antes de entregar un prompt con personajes, comprobar silenciosamente:

### Dramaturgia

- ¿Cada personaje tiene un objetivo formulado como verbo hacia alguien?
- ¿Existe un obstáculo concreto?
- ¿Está claro el coste del fracaso?
- ¿La escena contiene 2–4 cambios de beat cuando la duración lo permite?
- ¿Cada cambio de beat modifica una conducta visible?
- ¿La táctica cambia cuando falla?
- ¿Existe subtexto sin explicarlo directamente?
- ¿El personaje juega solo la información que posee ahora?

### Escucha

- ¿Las reacciones comienzan antes de terminar las réplicas relevantes?
- ¿Hay pensamiento antes de las respuestas difíciles?
- ¿Los acontecimientos importantes reciben un momento de evaluación?
- ¿Ritmo, volumen y energía responden al compañero?

### Cuerpo

- ¿Centro de gravedad, tempo, apertura y respiración son coherentes?
- ¿Cada personaje tiene una tarea física útil?
- ¿La interrupción de la tarea se utiliza solo como acento deliberado?
- ¿El esfuerzo físico afecta correctamente a voz y respiración?
- ¿Las distancias cambian por una motivación?
- ¿El estatus se ve en el cuerpo y no solo en las palabras?

### Ojos

- ¿Hay objetivos claros de mirada?
- ¿Los ojos se mueven antes que la cabeza?
- ¿Parpadeo y micro-sácadas responden al estado?
- ¿La quietud permanece viva y elegida?

### Perfil y continuidad

- ¿Cada tic tiene un trigger?
- ¿La máscara posee una grieta condicionada?
- ¿El perfil se ha adaptado y no pegado literalmente?
- ¿Las conductas imposibles se han transformado en otras salidas físicas?
- ¿La identidad vocal permanece fija?
- ¿El estado conserva inercia hacia el siguiente beat o plano?
- ¿No se han incluido personajes ausentes?

### Conjunto

- ¿Las reacciones están escalonadas en vez de sincronizadas?
- ¿Cada desplazamiento tiene motivación?
- ¿La amenaza evita gestos teatrales de anuncio?
- ¿El desgaste acumulado no se reinicia?

### Separación y entrega

- ¿El bloque contiene solo performance y comportamiento?
- ¿Se excluyeron vestuario, cámara, óptica, luz y color?
- ¿La actuación final está escrita en inglés claro y filmable?
- ¿El diálogo conserva el idioma solicitado?
- ¿El razonamiento y el checklist permanecen ocultos?
- ¿La performance alcanza nivel 4 o superior?

Si alguna respuesta es negativa, corregir antes de entregar.

---

## Ejemplo completo

### Perfil maestro

```text
Character acting as CHARACTER A. Early 60s male, a retired night-shift
driver and former amateur fighter; heavy, thick-necked build gone soft at
the middle, standing with a low grounded center of gravity and weight on
the whole foot. His engine is decades of waiting for work, trouble and
other people to reveal themselves; patience has become his weapon. Vocal
profile: low, hoarse, unhurried baritone, short economical sentences,
dropping into an even quieter register as the stakes rise. Key physical
habits and tics: he rolls an old coin across his knuckles while assessing a
situation; takes one slow audible nose-breath before refusing; and becomes
completely still when he detects a lie. His default face is a heavy-lidded,
bored mask concealing total attention. Eye life: slow deliberate blinks and
quiet scans between hands, exits and reflective surfaces, his gaze reaching
a target just before his head follows. Walking style: a heavy “old fighter's
walk,” short economical steps, level shoulders, loose ready hands, never
hurrying. However, when a hand rises suddenly near him, the mask vanishes:
his chin drops, hands lift halfway and feet recover an old defensive stance
before he catches himself and folds it away. His face softens only around
stray animals.
```

### Identidad vocal

```text
"A man in his early 60s with a working-class urban accent. Low, hoarse,
unhurried baritone; short flat economical sentences with comfortable
pauses; calm and faintly amused, becoming quieter rather than louder as the
situation grows serious."
```

### Adaptación a una escena

Situación: CHARACTER A permanece sentado en un vehículo estacionado mientras
una persona nerviosa situada detrás miente sobre el pago.

```text
CHARACTER A sits motionless, heavy and grounded, watching the passenger
through the rear-view mirror instead of turning around. His hooded eyes
move between the mirror, the passenger's hands and the door lock in slow,
quiet scans; blinks remain rare and deliberate, and his gaze reaches the
mirror a beat before his head shifts. The old coin moves across his
knuckles while he assesses the story. As the lie begins to collapse, the
coin stops mid-roll. He lets the silence hold, takes one slow audible
breath through the nose, and answers in the same low baritone, flatter and
quieter than before. When the passenger's voice finally cracks, the bored
mask eases by a fraction: one long exhale, one slow blink, then the coin
resumes. He is still applying pressure, but has chosen not to punish yet.
```

La adaptación mantiene los triggers y el motor del perfil, transforma el
patrón de caminar en quietud y trabajo manual, redirige la vida ocular al
espacio actual, marca cambios de beat visibles y conserva intacta la identidad
vocal.

---

## Contrato de salida

Cuando ActingLabs se utiliza para generar o mejorar una escena:

- producir la actuación en inglés cinematográfico claro;
- conservar el diálogo en el idioma solicitado;
- escribir un párrafo fluido por personaje presente;
- describir exclusivamente comportamiento visible o audible;
- integrar objetivo, presión, táctica, escucha, cuerpo, ojos y beats;
- adaptar el perfil maestro al momento concreto;
- mantener la identidad vocal sin reescribirla;
- evitar notas de cámara, óptica, luz, color o vestuario;
- no inventar personajes, voces, relaciones ni referencias;
- no mostrar el análisis interno ni el QA;
- entregar solo el prompt final salvo que el usuario pida explicación,
  diagnóstico, variantes, crítica o trabajo sobre el sistema.

La guía específica del modelo decide después dónde insertar o cómo comprimir
el bloque de actuación sin perder su intención.

---

## Axiomas finales

1. Actuar es comportamiento bajo presión, no demostración emocional.
2. Escuchar importa más que hablar; reaccionar importa más que declamar.
3. La emoción es consecuencia de una lucha ganada o perdida y debe tener coste.
4. El cuerpo revela más que las palabras; cuando discrepan, se cree al cuerpo.
5. El poder suele expresarse con quietud y volumen bajo; romper ese patrón es
   un acontecimiento.
6. Cada tic necesita un trigger y cada máscara necesita una grieta.
7. Toda escena contiene una pérdida, renuncia o derrota parcial; sin cambio de
   poder, información o táctica, no existe verdadero acontecimiento.
8. El subtexto no se muestra: se filtra cuando el personaje no consigue
   ocultarlo por completo.
9. Los estados claros encadenados producen conducta más legible que una
   transición saturada de pasos.
10. Cuando exista duda, reducir. Menos actuación visible suele producir más
    verdad.

## Adaptación a Kling 4.0 en AILAB

Aplicar la guía de Kling 4.0 (no incluida en esta skill). Priorizar objetivo visible, escucha, respiración, mirada
y cambio de conducta. Diálogo exacto entre comillas con hablante, idioma y
delivery; las acotaciones no se pronuncian. No trasladar llaves o etiquetas
sonoras de otros modelos. Asignar cada línea y dejar que los oyentes reaccionen
sin articularla. Reservar tiempo para preparación, pausas y cierre.

Una imagen `@image_1` puede controlar identidad; un vídeo `@video_1` puede guiar
interpretación y ritmo en una nueva generación. No prometer transferencia exacta
de actuación ni edición del vídeo. AILAB permite conservar su sonido original:
si se activa, la nueva acción y el habla deben ser compatibles con ese audio.

Sujetos de imagen y voces están en prueba solo para administradores y usan el
`@nombre` real. Una voz cargada controla identidad vocal, no palabras o timing
exactos. Para miembros, usar imágenes normales y dirección vocal textual. No
inventar voces seleccionadas, sujetos de vídeo ni recursos adicionales en
Fotogramas clave. Verificar sincronía y continuidad en el vídeo generado.
