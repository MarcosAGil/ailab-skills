# Dirección de actuación, cámara, enfoque y sonido

Reglas que se aplican al ESCRIBIR el prompt refinado, una vez cerrada la auditoría. Cada sección dice qué debe quedar escrito para que el modelo no tenga que adivinar.

## Referencias

- Convierte cualquier sintaxis a handles compactos (`@[Image 1](image_1)`, `<<<image_1>>>`, "first image", nombres de archivo o URLs pasan a `@Image1`). Los personajes guardados con un identificador interno (UUID) se sustituyen por un nombre vinculado a las imágenes que lo definen.
- Una línea por material con qué usa y qué no usa.
- Varias vistas de la misma persona: `All views in @Image2 are the same single man.`
- Fichas de personaje: `Do not use the studio background or the sheet layout.`
- Primer frame frente a localización: ver `formato-salida.md`.
- Props con pantalla: solo la carcasa, `Its reference display is never used.`
- Vídeo negro que solo aporta audio: `@Video1 is a blank black video carrying only the audio track. Use ONLY its audio.`
- Todo asset adjunto aparece en el prompt. Si uno no debe intervenir, se dice que se ignore.
- Si el orden de adjuntos no coincide con el mapping del prompt, se confirma el orden real y se corrigen los handles del prompt. Nunca se conserva un mapping que cruce identidades.

## Duración, stages y tiempo

- Duración entera dentro del rango del modelo (Seedance 2.5: de 4 a 30 s). Con audio exacto de 8,06 s, se elige 8 s. Si el redondeo cortara una palabra (9,40 s no cabe en 9 s), se redondea hacia arriba y se deja una espera final con conducta.
- Con dos o más cambios de estado, stages. Un evento principal por stage.
- Rango temporal en el stage solo cuando la sincronía importa (audio exacto con tiempos, entradas críticas, un movimiento de cámara clave). Si no, stages sin tiempos.
- Con audio exacto, los límites de los stages caen en las pausas reales del audio, redondeados a `.00` o `.50`. Si el timeline del prompt no coincide con el audio, manda el audio y se avisa.
- Sin tiempos ni archivo: stages sin tiempos y final anclado: `Hard cut exactly with the end of @Audio1.`
- Clips de más de 15 s: más stages y más de un pico de densidad, separados por stages tranquilos. Planificación interna: un único pico de densidad por tramo y stages tranquilos alrededor.

## Dirección de cada persona que habla o conduce la acción

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
7. **Énfasis.** Se transmite con respiración, mirada, cejas o inclinación; si es una palabra concreta, `the stress lands on the second word`. No se frena la frase salvo que el prompt lo pida.
8. **Pausas con contenido.** Cada pausa del diálogo o del audio se llena con conducta visible (`her eyes slide off toward the sea and she takes a small breath through the nose`). Si en la pausa no ocurre nada, la pausa sobra.
9. **Microvida continua**, en `Performance:`: parpadeo, respiración, cejas, boca viva entre palabras, cambio de peso, ropa y pelo respondiendo al movimiento. 2 a 4 señales por cambio emocional; no se lista cada músculo. Nadie queda congelado.
10. **Emoción como conducta.** Nunca etiquetas sueltas ("sad", "angry"). Cada emoción se escribe como conducta visible: qué hacen la mirada, la boca, las manos, la respiración y el cuerpo. Dos verdades a la vez cuando la escena lo pide (`amused but still carrying authority`).
11. **Física.** Todo movimiento tiene principio, desarrollo y final visibles. Nadie aparece ya hecho ni se teletransporta.
12. **Dramaturgia (escenas con conflicto).** Decide en silencio objetivo, obstáculo y táctica de cada personaje (objetivo, obstáculo y táctica), pero en el prompt solo se escribe conducta visible.

## Dirección de los que no hablan

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

## Cámara

La cámara es la que pide el prompt. Esta skill no la cambia de estilo: la describe sin ambigüedad. Para el `[Camera]` global y para cada movimiento:

**Global, en `[Camera]`:**

- Tipo de cámara tal como lo pide el prompt (en mano, en trípode, sobre carril, gimbal, dron...). Si no lo dice y importa, se pregunta (ver `SKILL.md`, sección Preguntas).
- Quién la lleva, si es relevante, y su postura.
- Encuadre de partida: tamaño de plano, altura, ángulo, distancia, qué incluye y dónde corta.
- Cierre de lo que no se usa en este clip (`Not used anywhere: ...`), solo con lo que el prompt excluye o lo que contradiría el estilo pedido.

**Cada movimiento lleva seis piezas:**

1. **Disparador.** Un fragmento de diálogo, un nombre, una mirada, un desplazamiento del sujeto, un sonido, una entrada por el borde del encuadre o el final de un gesto. Sin disparador, el movimiento es un movimiento de dirección (planificado) y se dice.
2. **Inicio.** Cuándo arranca respecto al disparador (inmediato, tras una pausa, anticipándose).
3. **Trayecto.** Tipo (paneo, tilt, travelling, dolly, órbita, grúa, giro, acercamiento, alejamiento, seguimiento, estático), dirección, amplitud (grados o distancia aproximada en lenguaje llano), velocidad (lenta, constante, que acelera, que frena) y si es continuo o a golpes.
4. **Aterrizaje.** Dónde termina: tamaño de plano final, encuadre del sujeto, headroom, descentrado, qué entra y qué sale de plano.
5. **Estado del enfoque durante y después** (ver sección Enfoque).
6. **Lo que no es.** Bloqueo de la lectura errónea más probable (`it is a physical dolly move, NEVER a zoom`, `no whip, no snap, no speed ramp`).

Reglas de cámara:

- Acercarse físicamente y hacer zoom son cosas distintas: se dice cuál. Lo mismo vale para seguir, rodear o recolocarse.
- Si el movimiento está sincronizado con un fragmento, se escribe en el `Primary event` justo después del fragmento; si no, en la línea `Camera:` del stage.
- Primero mira o se mueve el personaje y después llega la cámara, salvo que el prompt pida lo contrario.
- Si la frase que dispara el movimiento dura menos de un segundo, la cámara no puede reaccionar a su voz y llegar a tiempo: el disparador debe ser físico y anterior.
- Encuadres de cerca siempre medidos: distancia, altura respecto a los ojos, ángulo, línea de corte del cuerpo, qué nunca entra en plano.
- Un solo movimiento principal de cámara por stage. Los movimientos pequeños de corrección van dentro del mismo.
- La cámara no abandona al sujeto antes de un punto definido si el prompt no lo pide (`The camera never leaves her before she is outside`).
- La cámara no hace ruido propio: `no sound attached to the movement`, salvo que el prompt lo pida.

## Enfoque

Para cada stage, en la línea `In-lens:` o dentro del movimiento de cámara:

- **Plano nítido:** qué está enfocado (ojos, cara, manos, producto, fondo) y a qué distancia.
- **Profundidad de campo:** corta o amplia, tal como pide el prompt. Si el prompt no lo dice y importa, se pregunta. Qué queda desenfocado y cuánto.
- **Cambios de foco:** cada uno con causa (el sujeto cambia de distancia, un objeto entra en primer plano, un cambio de plano), duración (`about half a second`, `over about a second`) y comportamiento (`catches`, `breathes back to`, `pulls from the hand to the face`). Si el prompt pide un rack focus deliberado, se describe con origen, destino y velocidad; si no lo pide, no se inventa.
- **Exposición y luz:** solo si el prompt las trae. Los cambios de exposición de la cámara se distinguen siempre de cambios de luz de la escena (`it reads as the camera metering, never as a light changing`). Si la luz de la escena no debe cambiar, se bloquea en `[Maintain Consistency]`.
- Los eventos de enfoque que sean silenciosos lo dicen: `silent, in-lens only`.

## Props y manos

- `[Props]`: cada prop con referencia (si la hay), dueño y cantidad: `The lighter corresponds to @Image6 and belongs only to Leo. Exactly one.`
- Ciclos de vida con flechas, en `[Maintain Consistency]`: `unlit cigarette removed → placed in mouth → ignited once → held in LEFT hand`.
- El contacto y el cambio de estado también van inline en el stage donde ocurren.
- Reparto final de manos al cierre. Los estados son irreversibles: lo encendido sigue encendido, lo roto no vuelve.
- Pantallas ocultas con frases rotundas: `The character can see the display. The recording camera cannot.`
- Si no hay props: `X holds nothing in either hand at any point.`

## Sonido y voz

**Con audio exacto**, `[Audio Reference]`:

```text
@Audio1 is the sole authority for the exact [N]-second audio track: spoken dialogue, voices, accents, pauses, vocal delivery, [texture and ambience known from the prompt or measured]. Do not regenerate, rewrite, paraphrase, shorten, extend or replace the dialogue. Do not create a second voice, music, narration or new sound effects. The braced lines in the stages below are the exact words already in @Audio1; they assign speaker and timing, not a new performance. Synchronize lips, breathing, gestures and physical actions to the existing audio.
```

- Solo se describe lo que el audio contiene si el prompt, el usuario o la medición lo confirman.
- Cada fragmento va entre llaves en su stage, con idioma, variedad y hablante declarados.
- Sonidos puntuales del audio, en `< >` inline junto a su causa visible. No se añaden sonidos que no estén en el audio. No hay sección `[Audio]`.

**Sin audio de referencia**, `[Audio]`:

- Ambiente y sonidos `< >` inline en cada stage, en la línea `Sound:`, junto a su causa visible.
- Identidad vocal de cada hablante (edad, acento, registro, tempo, método de énfasis, imperfecciones, intención de cada intervención) sin repetir sus líneas.
- Coherencia de la voz con la distancia y la orientación del hablante (más clara de frente, más apagada y con más sala al girarse).
- El carácter del sonido global (limpio, de sala, de calle...) lo marca el prompt; no se impone uno.

## Final y bloqueos

- Final exacto, en el `End state` del último stage: `Hard cut exactly with the end of @Audio1` o `the clip cuts exactly at N.00s, mid-motion`. Si el prompt pide pose o fundido, se respeta; si no, `No final pose, no hold, no fade, no extra reaction.`
- Primero el estado deseado y después el "no X", en la misma frase y en el stage donde surge el riesgo.
- `[Maintain Consistency]` recoge las reglas duras una sola vez: duración, identidades, recuento, diálogo (solo las líneas entre llaves, una vez cada una, en orden), manos y props, bloqueos de gestos, reglas de secundarios, continuidad de luz si aplica, final. No repite el diálogo ni la lista de cámara.
- **Repetición reforzada (hasta 3 menciones)** solo para fallos conocidos de actuación y cámara:
  1. Un gesto acaba apuntando al propio cuerpo.
  2. El oyente se queda congelado.
  3. El diálogo sale con otras palabras, otro idioma o repetido.
  4. Un acercamiento se convierte en zoom.
  5. Se ve el aparato que graba o la pantalla de un móvil.
  6. La cámara hace un movimiento no pedido (órbita, giro de 360, zoom).
  7. Cualquier fallo que el usuario haya visto en una generación anterior de ese prompt.
- Los fallos críticos pueden marcarse con `★ ... ★` o MAYÚSCULAS, como mucho dos por prompt.
- Frase de intención al cierre, sin cifras nuevas, coherente con la estética del prompt.
