# Dirección y entrega

### Paso 4. Dirección de cada persona que habla o conduce la acción

Para cada una, en cada stage:

1. **Estado de arranque.** Desde qué pose y en qué acción empieza. Con primer frame, desde la pose exacta de la imagen.
2. **Política con la lente.** Nunca mira a cámara, mira casual y se desliza, o mira directa en un momento concreto con una acción concreta.
3. **Plan de mirada por stage.** A quién o a qué mira en cada momento, y cuándo gira ojos y cabeza. Si la mirada motiva la cámara, la mirada va primero.
4. **Manos.** Cuál es la mano con la que gesticula y cuál queda libre, y que nunca intercambian roles. Cada prop con su mano, en MAYÚSCULAS cuando es crítico (`RIGHT hand`). Si no sostiene nada: `holds nothing in either hand`.
5. **Gestos anclados a fragmentos.** Uno por fragmento clave, nunca uno por palabra. Cada gesto, justo después de su fragmento, lleva:
   - anclaje (`On this phrase`, `On the last word of this phrase`);
   - mano;
   - forma (orientación de la palma, configuración de los dedos);
   - recorrido (de dónde a dónde y a qué altura);
   - tamaño (`small, offhand, barely a gesture at all` o `wide and committed`);
   - significado (`as if claiming that taste`);
   - en qué se diferencia de los otros gestos del clip;
   - la lectura errónea más probable, bloqueada (`does NOT point with the index finger, does NOT bring the hand back toward herself`).
   Tras cada gesto, la mano se recupera de forma natural.
6. **Cuerpo.** Postura, peso, orientación del torso respecto a la cámara y a los demás, desplazamientos con sus rutas y distancias.
7. **Énfasis.** Se transmite con respiración, mirada, cejas o inclinación; si es una palabra concreta, `the stress lands on the second word`. No se frena la frase salvo que el input lo pida.
8. **Pausas con contenido.** Cada pausa del diálogo o del audio se llena con conducta visible (`her eyes slide off toward the sea and she takes a small breath through the nose`). Si en la pausa no ocurre nada, la pausa sobra.
9. **Microvida continua**, en `Performance:`: parpadeo, respiración, cejas, boca viva entre palabras, cambio de peso, ropa y pelo respondiendo al movimiento. 2 a 4 señales por cambio emocional; no se lista cada músculo. Nadie queda congelado.
10. **Emoción como conducta.** Nunca etiquetas sueltas ("sad", "angry"). Cada emoción se escribe como conducta visible: qué hacen la mirada, la boca, las manos, la respiración y el cuerpo. Dos verdades a la vez cuando la escena lo pide (`amused but still carrying authority`).
11. **Física.** Todo movimiento tiene principio, desarrollo y final visibles. Nadie aparece ya hecho ni se teletransporta.
12. **Dramaturgia (escenas con conflicto).** Decide en silencio objetivo, obstáculo y táctica de cada personaje (lógica de `ActingLabs.md`), pero en el prompt solo se escribe conducta visible.

### Paso 5. Dirección de los que no hablan

Toda persona visible tiene, en cada stage en que aparece: mirada, manos, cuerpo y lo que no hace (línea `Background:` o dentro del `Primary event` si es quien actúa). Se asigna uno de estos papeles:

1. **Oyente activo.** Silencioso pero activo todo el tiempo: escucha, sigue al hablante con la mirada, reacciona. Tiene una tarea física con ciclo completo y tiempos, y sus pasos caen sobre fragmentos de quien habla. Gestos de escucha con tamaño (`small receptive nods`). Bloqueo: `Do not freeze [Name] while [Speaker] speaks.`
2. **Reacción en escalera.** Estados encadenados, nunca un salto: `guarded, then eyebrows lift, attention sharpens, he leans toward the phone`. El último peldaño enlaza con su línea o con un sonido del audio.
3. **El que ya está ahí.** `Already in the frame; he does not arrive.` Con encuadre medido, de dónde viene y adónde va, y qué hace al hablar.
4. **Extra de fondo.** Una sola acción con motivo, momento y ruta de salida fijados, y lo que nunca hace (`never speaks, never waves, never looks at the camera`).
5. **Persona que filma y es personaje.** Solo aparece con un disparador motivado, con distancia, ángulo y una única expresión, y la cámara se aparta después.

Además:

- El recuento exacto de personas va siempre en `[Characters]` (`Exactly three visible people: ...`). Quien filma sin aparecer se declara aparte como nunca visible.
- Grupos: reacciones escalonadas, nunca simultáneas ni idénticas. Con más de cuatro personas, los extras se agrupan por zonas con una acción motivada por grupo; el protagonista y quien habla mantienen dirección completa.
- Vida de fondo dirigida (`two or three birds drift across, small and out of focus`).

### Paso 6. Cámara

La cámara es la que pide el prompt. Esta skill no la cambia de estilo: la describe sin ambigüedad. Para el `[Camera]` global y para cada movimiento:

**Global, en `[Camera]`:**

- Tipo de cámara tal como lo pide el input (en mano, en trípode, sobre carril, gimbal, dron...). Si no lo dice y importa, se pregunta (Paso 1).
- Quién la lleva, si es relevante, y su postura.
- Encuadre de partida: tamaño de plano, altura, ángulo, distancia, qué incluye y dónde corta.
- Cierre de lo que no se usa en este clip (`Not used anywhere: ...`), solo con lo que el input excluye o lo que contradiría el estilo pedido.

**Cada movimiento lleva seis piezas:**

1. **Disparador.** Un fragmento de diálogo, un nombre, una mirada, un desplazamiento del sujeto, un sonido, una entrada por el borde del encuadre o el final de un gesto. Sin disparador, el movimiento es un movimiento de dirección (planificado) y se dice.
2. **Inicio.** Cuándo arranca respecto al disparador (inmediato, tras una pausa, anticipándose).
3. **Trayecto.** Tipo (paneo, tilt, travelling, dolly, órbita, grúa, giro, acercamiento, alejamiento, seguimiento, estático), dirección, amplitud (grados o distancia aproximada en lenguaje llano), velocidad (lenta, constante, que acelera, que frena) y si es continuo o a golpes.
4. **Aterrizaje.** Dónde termina: tamaño de plano final, encuadre del sujeto, headroom, descentrado, qué entra y qué sale de plano.
5. **Estado del enfoque durante y después** (Paso 7).
6. **Lo que no es.** Bloqueo de la lectura errónea más probable (`it is a physical dolly move, NEVER a zoom`, `no whip, no snap, no speed ramp`).

Reglas de cámara:

- Acercarse físicamente y hacer zoom son cosas distintas: se dice cuál. Mismo para seguir, rodear o recolocarse.
- Si el movimiento está sincronizado con un fragmento, se escribe en el `Primary event` justo después del fragmento; si no, en la línea `Camera:` del stage.
- Primero mira o se mueve el personaje y después llega la cámara, salvo que el input pida lo contrario.
- Si la frase que dispara el movimiento dura menos de un segundo, la cámara no puede reaccionar a su voz y llegar a tiempo: el disparador debe ser físico y anterior.
- Encuadres de cerca siempre medidos: distancia, altura respecto a los ojos, ángulo, línea de corte del cuerpo, qué nunca entra en plano.
- Un solo movimiento principal de cámara por stage. Los movimientos pequeños de corrección van dentro del mismo.
- La cámara no abandona al sujeto antes de un punto definido si el input no lo pide (`The camera never leaves her before she is outside`).
- La cámara no hace ruido propio: `no sound attached to the movement`, salvo que el input lo pida.

### Paso 7. Enfoque

Para cada stage, en la línea `In-lens:` o dentro del movimiento de cámara:

- **Plano nítido:** qué está enfocado (ojos, cara, manos, producto, fondo) y a qué distancia.
- **Profundidad de campo:** corta o amplia, tal como pide el input. Si el input no lo dice y importa, se pregunta. Qué queda desenfocado y cuánto.
- **Cambios de foco:** cada uno con causa (el sujeto cambia de distancia, un objeto entra en primer plano, un cambio de plano), duración (`about half a second`, `over about a second`) y comportamiento (`catches`, `breathes back to`, `pulls from the hand to the face`). Si el input pide un rack focus deliberado, se describe con origen, destino y velocidad; si no lo pide, no se inventa.
- **Exposición y luz:** solo si el input las trae. Los cambios de exposición de la cámara se distinguen siempre de cambios de luz de la escena (`it reads as the camera metering, never as a light changing`). Si la luz de la escena no debe cambiar, se bloquea en `[Maintain Consistency]`.
- Los eventos de enfoque que sean silenciosos lo dicen: `silent, in-lens only`.

### Paso 8. Props y manos

- `[Props]`: cada prop con referencia (si la hay), dueño y cantidad: `The lighter corresponds to @Image6 and belongs only to Marcos. Exactly one.`
- Ciclos de vida con flechas, en `[Maintain Consistency]`: `unlit cigarette removed → placed in mouth → ignited once → held in LEFT hand`.
- El contacto y el cambio de estado también van inline en el stage donde ocurren.
- Reparto final de manos al cierre. Los estados son irreversibles: lo encendido sigue encendido, lo roto no vuelve.
- Pantallas ocultas con frases rotundas: `The character can see the display. The recording camera cannot.`
- Si no hay props: `X holds nothing in either hand at any point.`

### Paso 9. Sonido y voz

**Con audio exacto**, `[Audio Reference]`:

```text
@Audio1 is the sole authority for the exact [N]-second audio track: spoken dialogue, voices, accents, pauses, vocal delivery, [texture and ambience known from the input or measured]. Do not regenerate, rewrite, paraphrase, shorten, extend or replace the dialogue. Do not create a second voice, music, narration or new sound effects. The braced lines in the stages below are the exact words already in @Audio1; they assign speaker and timing, not a new performance. Synchronize lips, breathing, gestures and physical actions to the existing audio.
```

- Solo se describe lo que el audio contiene si el input, Marcos o la medición lo confirman.
- Cada fragmento va entre llaves en su stage, con idioma, variedad y hablante declarados.
- Sonidos puntuales del audio, en `< >` inline junto a su causa visible. No se añaden sonidos que no estén en el audio. No hay sección `[Audio]`.

**Sin audio de referencia**, `[Audio]`:

- Ambiente y sonidos `< >` inline en cada stage, en la línea `Sound:`, junto a su causa visible.
- Identidad vocal de cada hablante (edad, acento, registro, tempo, método de énfasis, imperfecciones, intención de cada intervención) sin repetir sus líneas.
- Coherencia de la voz con la distancia y la orientación del hablante (más clara de frente, más apagada y con más sala al girarse).
- El carácter del sonido global (limpio, de sala, de calle...) lo marca el input; no se impone uno.

### Paso 10. Final y bloqueos

- Final exacto, en el `End state` del último stage: `Hard cut exactly with the end of @Audio1` o `the clip cuts exactly at N.00s, mid-motion`. Si el input pide pose o fundido, se respeta; si no, `No final pose, no hold, no fade, no extra reaction.`
- Primero el estado deseado y después el "no X", en la misma frase y en el stage donde surge el riesgo.
- `[Maintain Consistency]` recoge las reglas duras una sola vez: duración, identidades, recuento, diálogo (solo las líneas entre llaves, una vez cada una, en orden), manos y props, bloqueos de gestos, reglas de secundarios, continuidad de luz si aplica, final. No repite el diálogo ni la lista de cámara.
- **Repetición reforzada (hasta 3 menciones)** solo para fallos conocidos de actuación y cámara:
  1. Un gesto acaba apuntando al propio cuerpo.
  2. El oyente se queda congelado.
  3. El diálogo sale con otras palabras, otro idioma o repetido.
  4. Un acercamiento se convierte en zoom.
  5. Se ve el aparato que graba o la pantalla de un móvil.
  6. La cámara hace un movimiento no pedido (órbita, giro de 360, zoom).
  7. Cualquier fallo que Marcos haya visto en una generación anterior de ese prompt.
- Los fallos críticos pueden marcarse con `★ ... ★` o MAYÚSCULAS, como mucho dos por prompt.
- Frase de intención al cierre, sin cifras nuevas, coherente con la estética del input.

### Paso 11. Ensamblar y revisar

Rellena la plantilla, pasa la verificación y entrega.

---

## Plantilla de salida

El prompt va en inglés. El diálogo va en su idioma original, entre llaves. Las secciones que no aplican se omiten.

```text
[Generation Goal]
Create a [N]-second [type of scene] [in ONE continuous take / with N shots as in the input]. [One-sentence story summary.] [@ImageN is the exact first frame.] [@Audio1 is the exact final soundtrack and absolute timing master.] Every visible action, lip movement, gesture, camera movement and focus change happens simultaneously in real time.

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
[Exact-track contract, Paso 9.]

[Visual Style]
[Style exactly as in the input. Nothing added.]

[Camera]
[Type of camera and operator if relevant. Starting frame: shot size, height, angle, distance. Focus baseline: sharp plane and depth of field. Not used anywhere: ...]

[Stage 1 | 0.00-X.X0s]
Initial state: [frame 0.00: positions, poses, gazes, hands of everyone visible.]
Primary event: [One main event. Action + dialogue fragments + gestures and camera moves anchored right after each fragment.]
Dialogue language: [Language (Variety)]. [Name] says in [variety/accent], [delivery]: {...} On this phrase, [gesture, hand, shape, path, size, meaning, what it is not].
Performance: [micro-life, eyes, breath: 2 to 4 cues.]
Background: [each non-speaker: gaze, hands, body, task, what they do not do.]
Camera: [trigger, start, path (type, direction, amplitude, speed), landing, what it is not.]
In-lens: [focus: sharp plane, change with cause and duration; exposure only if in the input.]
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

---

## Casos edge

- **Sin diálogo:** `No talking. Mouths do not articulate.` Se mantienen la microvida, la mirada y los gestos con sus anclajes a acciones.
- **Un solo personaje:** pasan los Pasos 4, 6 y 7. El Paso 5 se sustituye por la dirección de quien o qué rodea (fondo, vida ambiente).
- **Sin personas:** se aplican cámara, enfoque y física de objetos. Los Pasos 4 y 5 se sustituyen por la dirección de los props en movimiento.
- **Más de un plano o cortes en el input:** se respeta la estructura de planos pedida. Cada plano se escribe como un stage con su propio encuadre, cámara y enfoque, y el corte se declara explícitamente. Esta skill no convierte cortes en plano continuo ni al revés.
- **Audio exacto sin transcripción ni archivo:** pedir la transcripción antes de entregar.
- **El timeline del input no encaja con el audio medido:** manda el audio; se reconstruyen los stages sobre las pausas reales y se avisa.
- **Cámara pedida de forma vaga ("dinámica", "cinematográfica") sin más datos:** se pregunta. Si Marcos dice "decide tú", se elige un movimiento motivado por la acción, se escribe completo y se lista en `Supuestos`.
- **El input contiene movimientos de cámara que el modelo suele ejecutar mal (órbita de 360, zoom combinado con travelling):** se describen con los seis componentes y se advierte en `Supuestos` si el riesgo es alto.
- **Ratio pedido distinto al del primer frame:** se usa el de la imagen y se avisa.
- **Otro modelo distinto de Seedance 2.5:** se conserva la dirección y se aplica la plantilla de la guía de ese modelo. Se indica en `Supuestos`.
- **Marcos reporta un fallo tras generar:** síntoma, causa mínima, se cambia una variable, se refuerza con repetición (Paso 10) y se conserva todo lo que funcionaba. Consultar primero la matriz de diagnóstico de la guía de Seedance 2.5.
- **El input pide una estética concreta (CCD, cámara amateur):** esta skill no la fija ni la altera. Si Marcos quiere imponerla, derivar a `refinar-prompt-ccd`.
- **Usuario sin prompt, o que pregunta qué es la skill:** presentación del "Modo de funcionamiento" y esperar. No se rechaza ni se improvisa un prompt.
- **Prompt ya muy completo, sin bloqueantes:** informe corto con lo que está bien y los importantes, como máximo una ronda de preguntas, y prompt.
- **El usuario discrepa de un hallazgo:** se respeta su decisión y, si el riesgo es de fallo conocido, se refuerza con bloqueo en el prompt (Paso 10).
- **Respuestas incompletas o contradictorias:** se reconcilian en la ronda siguiente; si siguen en conflicto, se decide lo más cercano a lo último que pidió Marcos y se lista.
- **Respuesta en texto libre ("Other"):** manda sobre las opciones propuestas y se re-audita.
- **Muchos bloqueantes (más de 8):** se agrupan por eje y se preguntan primero los de cámara y actuación, que condicionan a los demás.
- **Caso no contemplado:** decírselo a Marcos en una línea y proponer cómo resolverlo. No improvisar reglas nuevas.

## Output esperado

**Fase 1 (modos completo y diagnóstico):**

1. El informe de auditoría con el formato del Paso 1.2.
2. En modo completo, las preguntas en rondas con `AskUserQuestion`. En modo diagnóstico, se cierra con una línea ofreciendo refinarlo; no se reescribe nada.

**Fase 2 (completo y rápido, cuando todo está cerrado):**

1. Un único bloque de código con el prompt refinado completo.
2. Una línea fuera del bloque: `📐 Aspect ratio: ... | ⏱ Duration: ...s`.
3. Solo si se ha decidido algo material que no estaba en el input ni en las respuestas: `Supuestos:` con un máximo de 5 viñetas cortas en castellano (mapping de referencias, tiempos del audio, decisiones de cámara o enfoque tomadas por defecto, conversiones de formato, ratio).

Nada más: sin explicación, sin QA visible, sin traducción. Si Marcos pide explicación, comparación o diagnóstico, se responde en castellano.

## Verificación

Antes de entregar, todo debe ser "sí":

**Auditoría**
- ¿Se han pasado los siete ejes del catálogo y no solo los que el prompt menciona?
- ¿Cada hallazgo cita el fragmento del prompt, dice por qué falla y trae una pregunta con opciones (o una decisión listada)?
- ¿Se ha comprobado antes si las referencias, el audio o el vídeo guía ya respondían la duda?
- ¿Queda algún bloqueante sin resolver o sin asumir de forma explícita?
- ¿Se ha re-auditado tras las respuestas, en busca de contradicciones nuevas?
- ¿Se ha chequeado cada movimiento de cámara contra la matriz de contradicciones y cada acción contra la tabla de tiempos?

**Formato Seedance 2.5**
- ¿Encabezados en corchetes en el orden de la plantilla y un evento principal por stage con estado inicial o de continuidad y estado final?
- ¿Todo el diálogo entre `{ }`, sin comillas normales, con idioma, variedad, forma de decirlo y nombre declarados antes de cada hablante?
- ¿Cada fragmento aparece una sola vez, en su stage, con el texto literal del input?
- ¿Gestos y movimientos anclados justo después de su fragmento, sin repetir el texto?
- ¿SFX en `< >` inline junto a su causa, y ningún nombre de personaje o prop entre `< >`?
- ¿Parámetros fuera del bloque, duración entera entre 4 y 30 s, ratio coherente con el primer frame?

**Referencias y tiempo**
- ¿Handles compactos, una línea por material con alias, qué usa y qué no usa?
- ¿Primer frame y localización diferenciados?
- ¿Límites `.00/.50`, rangos de 1,00 s o más, consecutivos y cerrando en el total?
- ¿Con audio exacto, los stages caen en las pausas reales?

**Actuación**
- ¿Cada persona visible tiene, en cada stage, mirada, manos, cuerpo y lo que no hace?
- ¿Cada hablante tiene política con la lente y plan de mirada?
- ¿Mano de gesticulación fijada y sin cambios?
- ¿Cada gesto con anclaje, mano, forma, recorrido, tamaño, significado, diferencia con los demás y lectura errónea bloqueada?
- ¿Cada pausa tiene conducta dentro y ninguna emoción es una etiqueta sin conducta?
- ¿Cada secundario tiene un papel asignado y nadie está congelado mientras otro habla?
- ¿Recuento exacto de personas?

**Cámara y enfoque**
- ¿Cada movimiento tiene disparador, inicio, trayecto (tipo, dirección, amplitud, velocidad), aterrizaje, estado del enfoque y lo que no es?
- ¿Encuadre inicial y final de cada stage medidos (tamaño de plano, altura, ángulo, distancia)?
- ¿Se ha respetado el estilo de cámara del input sin añadir ni quitar nada?
- ¿Cada cambio de foco con causa y duración, y el plano nítido definido en cada stage?

**Props, sonido y final**
- ¿Recuento de props, ciclos de vida y reparto final de manos?
- ¿Audio exacto respetado sin inventar su contenido, o voces coherentes con su distancia?
- ¿Final exacto y frase de intención sin cifras nuevas?
- ¿La estética del input intacta, sin restos de iteraciones anteriores, sin em dashes y con cifras que salen solo del input o de la medición?

## Mantenimiento

Actualizar desde el repositorio oficial. Esta copia portable conserva el método personal de Marcos, no necesita su vault ni otras skills. Los ejemplos de otras skills no están incluidos y no son requisitos. No modificar materiales del usuario sin su aprobación.
