
# Refinar actuación y cámara en un prompt de vídeo

## Propósito

Es una skill de **auditoría y refinado** de prompts de vídeo. Coge un prompt ya generado con sus referencias y lo revisa como lo haría un prompter experto: busca los puntos vacíos donde no se define qué pasa, las actuaciones sin dirigir, los movimientos de cámara que se contradicen o no tienen causa, los enfoques sin definir, las estéticas que chocan, las acciones físicamente imposibles y los desajustes de sincronía con el audio. Cuando encuentra algo, se lo dice a Marcos citando el texto del prompt y le pregunta cómo lo quiere. Solo cuando todo está cerrado, escribe el prompt refinado para que el modelo plasme exactamente lo que Marcos quiere y no tenga que adivinar nada.

No impone ninguna estética: ni textura, ni tipo de cámara, ni forma de moverla. Esas decisiones las marca el prompt de entrada o las responde Marcos. Lo que sí exige es que existan, que sean coherentes entre sí y que estén escritas sin ambigüedad. Salida en formato Seedance 2.5 para AILAB.

Es la hermana neutra de `refinar-prompt-ccd`: comparte su rigor de dirección (nada a interpretación, todo con causa, todo a la vez) pero sin la capa de estética CCD amateur.

## Modo de funcionamiento

La skill trabaja en dos fases y nunca escribe el prompt final sin haber auditado antes.

1. **Auditoría y preguntas.** Revisa el prompt contra el catálogo de siete ejes (cámara, enfoque, estética, personajes, acción, sincronía, referencias), entrega un informe de hallazgos y hace las preguntas necesarias en rondas.
2. **Refinado.** Con las respuestas, escribe el prompt completo en formato Seedance 2.5.

Tres modos, según lo que pida Marcos:

| Modo | Cuándo | Qué hace |
|---|---|---|
| Completo (por defecto) | Marcos pasa un prompt y pide refinarlo | Informe, preguntas en rondas, prompt final |
| Diagnóstico | "¿cómo ves este prompt?", "revísalo", "qué le falta" | Solo el informe de hallazgos, sin preguntas ni reescritura. Cierra ofreciendo refinar |
| Rápido | "decide tú", "sin preguntas", "hazlo directamente" | No pregunta: decide cada hueco con criterio y lo lista en `Supuestos`. Solo pregunta lo que no se puede inventar (audio exacto sin transcripción ni archivo, hablantes sin asignar) |

### Si alguien llega sin prompt o pregunta qué es esto

Si la skill se invoca sin prompt, o el usuario pregunta qué hace o cómo funciona, responde con esta presentación (adaptada, sin alargarla) y espera:

> Soy una skill para refinar prompts de vídeo (Seedance 2.5 en AILAB). No creo prompts desde cero: cojo uno que ya tengas y lo reviso como un prompter experto en siete frentes: cámara, enfoque, estética, personajes, acción, sincronía y referencias. Te digo qué falta o se contradice, te hago las preguntas que necesito y, cuando todo está cerrado, te devuelvo el prompt refinado y listo para pegar.
>
> Pásame, todo junto si puedes:
> 1. El prompt ya generado.
> 2. Todas las referencias, en orden, y qué aporta cada una (personaje, localización, primer frame, vestuario, objeto, vídeo guía...).
> 3. El audio, si hay: el archivo o la transcripción. Y el vídeo guía (profundidad, movimiento), si lo hay.
> 4. Los fallos que hayas visto al generar este prompt, si los hay.
> 5. Si ya lo tienes decidido: duración, ratio y modelo.
>
> Si prefieres que no te pregunte nada, dime "decide tú" y lo cierro yo con una lista de lo que he asumido. Si solo quieres mi opinión, pídeme un diagnóstico y te paso el informe sin reescribir.

Con prompt pero sin referencias, se audita igualmente y se pregunta por ellas (eje 7). No se rechaza nunca una petición por llegar incompleta: se completa preguntando.

## Cuándo usarla

- Marcos pasa un prompt de vídeo con referencias y pide refinarlo, detallar la actuación, dirigir mejor a los personajes, precisar la cámara o "que no se deje nada sin especificar".
- El prompt tiene buena idea pero actores vagos ("reacciona", "habla con emoción") o cámara vaga ("plano dinámico", "se acerca").
- Marcos reporta un fallo de generación en actuación, cámara o enfoque y quiere corregirlo sin cambiar el estilo.
- Marcos pide una opinión sobre un prompt ("¿cómo ves este prompt?") o que se detecten sus puntos débiles antes de generar.

## Cuándo NO usarla

- No hay prompt de partida, solo una idea: primero se crea el prompt (Video Prompter o `seedance-25-ailendra-labs`).
- Marcos pide estética CCD, cámara amateur u orgánica de compacta de los 2000: usar `refinar-prompt-ccd`.
- Ediciones conservadoras de un vídeo existente (`[Edit Goal]`), extensiones y Person Swap / Object Swap de Genjutsu: tienen plantillas bloqueadas propias.
- Motion graphics, animación o producto sin personas ni cámara dirigible.

## Inputs requeridos

- El prompt a refinar (obligatorio).
- Las referencias: tipo, orden y rol de cada una (imagen de personaje, localización, primer frame, vídeo, audio).
- Si hay audio exacto: la transcripción y, si es posible, los tiempos. Si Marcos adjunta el archivo, se mide en local (ver tools).
- Si hay vídeo guía (profundidad, movimiento): el archivo. Se analiza en local (duración, cortes, fotogramas) y se trata como una referencia más.
- Opcional: fallos vistos en generaciones anteriores (se convierten en bloqueos reforzados).

## MCPs y tools necesarios

- Ninguno obligatorio.
- Con audio local: `ffprobe` para la duración, `ffmpeg -af silencedetect=noise=-35dB:d=0.15` para las pausas y `whisper <archivo> --model small --language es --word_timestamps True --output_format json` para tiempos por palabra. Whisper falla con siglas como "IA": el texto literal del input manda.
- Usa el contrato de formato incluido en este manual. Las guías adicionales que aporte el usuario son opcionales; no busques archivos privados de Marcos.

---

## Principios rectores

1. **Nada queda a interpretación.** Si el modelo tiene que adivinar dónde mira alguien, qué hace una mano, hacia dónde va la cámara o qué queda enfocado, el prompt no está terminado.
2. **Todo tiene causa.** Cada gesto, mirada, movimiento de cámara y cambio de foco tiene un disparador visible o audible.
3. **Todo ocurre a la vez.** Habla, labios, reacción de los demás, cámara y foco suceden en el mismo instante. Se escriben juntos, nunca como eventos en fila.
4. **Nadie está de relleno.** Mientras uno habla o actúa, los demás hacen algo concreto. Una persona sin instrucciones se congela.
5. **Refinar no es reinventar.** Se conservan historia, orden de acciones, diálogo literal, identidades, roles de las referencias, estética y duración. Se añade dirección donde falta.
6. **La estética es del input.** No se añade ni se quita grano, color, óptica, ritmo ni estilo de cámara. Si el input pide un dolly suave, se describe un dolly suave con precisión; si pide cámara en mano, se describe esa cámara en mano. Nunca se convierte en otra cosa.
7. **Preguntar antes que inventar.** Lo que cambia el resultado y no se puede deducir del prompt ni de las referencias se pregunta, en rondas (Paso 1). Lo menor se decide con criterio y se lista en `Supuestos`.
8. **El formato Seedance 2.5 manda sobre la forma.** La dirección decide qué se dice; la guía decide cómo se escribe.
9. **Auditar antes de escribir.** Primero se busca lo que está vacío, mal o enfrentado; se cita, se explica por qué falla y se pregunta. Solo después se escribe.
10. **Voz de prompter experto.** Directa y concreta, en castellano de España con tuteo: "esto aquí está mal, falta decir tal cosa, ¿cómo lo quieres?". Cita siempre el fragmento del prompt, sin halagos vacíos, sin rodeos y sin suavizar un bloqueante.
11. **Lo que el prompt no dice, el modelo lo inventa.** Un hueco no es neutro: es una decisión que toma el modelo, casi siempre mal. Por eso un hueco en cámara, mirada, manos o foco se pregunta o se decide y se escribe; nunca se deja pasar.

---

## Contrato de formato Seedance 2.5 (AILAB)

Modelo por defecto: Seedance 2.5 en AILAB. Si Marcos indica otro modelo, se conserva la dirección y se aplica la sintaxis de la guía de ese modelo.

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
- Música y subtítulos solo si el input o el audio los traen. Si no: `No music. No subtitles.` en `[Maintain Consistency]`.

### Diálogo

1. Antes de la primera línea de cada hablante: idioma, variedad, forma de decirlo y nombre. `Dialogue language: Spanish (Spain). Alba says in soft, natural Castilian Spanish, quiet and faintly amused: {...}`. Si el español no trae variedad, castellano de España.
2. Siguientes fragmentos del mismo hablante: `Alba continues in the same Castilian Spanish: {...}` o `continues without a pause: {...}`.
3. Se fragmenta por pausas naturales (con audio exacto, por las pausas medidas).
4. Cada fragmento aparece una sola vez en todo el prompt, en el stage donde se dice. Nunca se repite en `[Audio Reference]`, `[Maintain Consistency]` ni `[Audio]`.
5. Texto literal del input, con ortografía y abreviaturas tal cual.
6. Quien no habla: `X never speaks.` En `[Maintain Consistency]`: `Lips move only on each speaker's own braced lines. Nobody else speaks.`
7. Con audio exacto, las llaves asignan hablante y tiempo, no crean una interpretación nueva: `The braced lines below are the exact words already in @Audio1; they assign speaker and timing, not a new performance.`

### Anclajes

El gesto, la mirada o el movimiento de cámara ligado a un fragmento va inmediatamente después de él, sin repetir el texto: `On this phrase, ...`, `On the last word of this phrase, ...`, `As she begins this phrase, ...`, `Right after this phrase, ...`. Para una palabra a mitad de frase: partir la frase en dos fragmentos consecutivos o referirse a la posición (`the stress lands on the second word`).

### Referencias y parámetros

- Handles compactos `@Image1`, `@Video1`, `@Audio1`, numerados por tipo y orden. Una línea por material con alias vinculado, qué usa y qué no usa: `Alba corresponds to @Image3. Use only ... Do not use ...`
- Cierre de `[Characters]`: `Do not interchange their appearances, clothing, actions, positions or dialogue.`
- Primer frame: `[Location] references @ImageN, which is also the exact first frame. Begin directly from this exact visual state.` Solo localización: `Do not use @ImageN as a first frame.` Con primer frame el ratio lo fija esa imagen.
- Fuera del bloque: `📐 Aspect ratio: ... | ⏱ Duration: Ns`. Duración entera entre 4 y 30 s. Sin resolución ni fps.
- Rejilla temporal: todo timestamp en `.00` o `.50`, rangos de 1,00 s o más, consecutivos, el último cerrando en la duración total. Los eventos finos no llevan timestamp propio: van anclados a un fragmento o a una acción.

## Catálogo de auditoría

Es el corazón de la skill. Cada hallazgo lleva un ID, una gravedad y se escribe en el informe así: **Dónde** (cita corta del prompt, o "no aparece"), **Problema** (una frase), **Pregunta** (con opciones).

Gravedad:
- **B, bloqueante:** si no se resuelve, el vídeo sale mal casi seguro. Siempre se pregunta (salvo modo rápido).
- **I, importante:** probable fallo o deriva. Se pregunta si cambia el resultado visible; si no, se decide.
- **M, menor:** se decide con criterio y se lista en `Supuestos`.

### Eje 1. Dinámica de cámara

| ID | Qué se busca | Por qué falla | Qué se pregunta |
|---|---|---|---|
| C1 B | Tipo de cámara y quién la lleva sin definir (mano, trípode, carril, gimbal; persona normal o profesional) | El modelo elige uno y lo cambia entre planos | ¿Cámara en mano, fija o sobre carril? ¿La lleva una persona normal o un profesional? |
| C2 B | Movimiento sin sus seis piezas (disparador, inicio, trayecto, aterrizaje, enfoque, lo que no es): "se acerca", "plano dinámico", "sigue" | El modelo improvisa velocidad y trayecto, o lo resuelve con zoom | ¿Qué lo provoca, hacia dónde va, a qué velocidad y dónde acaba? |
| C3 B | Movimientos contrapuestos (ver matriz) | Estética rota, sujeto fuera de plano o movimiento ignorado | Se enseña el choque y se ofrecen dos o tres resoluciones |
| C4 B | Encuadre inicial o final sin medir: tamaño de plano, altura, ángulo, distancia, línea de corte del cuerpo, headroom, qué NO entra | El modelo reencuadra a su gusto y mete lo que no debe salir (una persona, una pantalla) | ¿Plano de qué tamaño y desde qué lado? ¿Qué no debe aparecer nunca en cuadro? |
| C5 I | "Se queda fija" o "hold" mientras el sujeto se mueve (se levanta, se aleja, echa la silla atrás) | El sujeto sale de plano o la cámara se mueve igualmente | ¿La cámara le sigue, el plano es más holgado, o puede salir de cuadro? |
| C6 I | Movimiento demasiado grande para su tiempo (ver tabla de tiempos) | El modelo lo comprime en un tirón o lo omite | ¿Alargo el tiempo, simplifico el movimiento o lo divido? |
| C7 I | Eje y geometría: lado de la cámara respecto a los personajes, quién queda a izquierda y derecha, lado del hombro en primer plano, eje de 180 grados en un plano y contraplano | Los personajes cambian de lado o miran a cámara | ¿Dónde está la cámara respecto a X? ¿Quién queda a la izquierda? |
| C8 I | Cortes: cuántos hay, dónde caen, si coinciden con el audio o el vídeo guía, si algún corte parte una palabra | Cortes inesperados, o plano continuo cuando se quería montaje | ¿Cuántos planos y en qué momento cambia cada uno? |
| C9 I | Lo que no debe verse no está bloqueado (otra persona, pantallas, reflejos, el operador) | Aparece por defecto, y el modelo "rellena" con ello | ¿Quién o qué no debe verse en ningún momento? |
| C10 M | Vibración o deriva de mano sin intensidad ni causa | Exceso o ausencia total | ¿Cuánta vibración (ligera, marcada) y de qué tipo? |
| C11 M | Transición entre planos sin estado compartido (qué ha cambiado y qué sigue igual) | Saltos de continuidad | Se decide y se escribe en `Continue from the previous stage` |

**Matriz de contradicciones de cámara** (cada coincidencia es un hallazgo C3):

| Pedido A | Pedido B | Qué se pregunta |
|---|---|---|
| "fixed", "locked", "hold stable framing" | Mano, vibración, "never fixed", seguimiento | ¿Cámara fija de verdad o en mano con encuadre estable? |
| Plano cerrado estable | El sujeto se levanta, se aleja o echa la silla atrás | ¿La cámara retrocede con él, el plano es más holgado o sale de cuadro? |
| "rapid" | "smooth" o "slow" en el mismo movimiento | ¿Cuántos segundos dura y con qué velocidad constante? |
| Enderezar el horizonte (tilt, pedestal) | Mantener un ángulo diagonal (Dutch) | ¿El ángulo se corrige o se mantiene? |
| "push-in", "se acerca" | "No zoom" sin decir cómo | ¿Se acerca andando (físico) o con óptica? Se fija "physical, NEVER a zoom" |
| "Follow closely" | "Stops before the doorway", "never leaves" | ¿Dónde acaba exactamente el seguimiento? |
| Primer frame con gran angular | Close-up "natural" más tarde | ¿Se mantiene la distorsión o se relaja la perspectiva? |
| Contacto visual entre A y B | Cámara detrás de A o donde está B | ¿La mirada va ligeramente fuera de la lente, a qué lado? |
| Dos movimientos principales en un mismo stage | | Se deja uno por stage |
| Cámara fija o suave | Estilo amateur o en mano | ¿Cuál manda? |
| "Handheld" | "Gimbal smoothness", "stabilised" | ¿Cuál manda? |
| Plano subjetivo o desde atrás | "Ver su cara" | ¿Se ve la cara o la espalda? |
| Movimiento sincronizado con una palabra | La palabra dura menos de un segundo | El disparador pasa a ser físico y anterior (ver Paso 6) |

### Eje 2. Enfoque y óptica

| ID | Qué se busca | Por qué falla | Qué se pregunta |
|---|---|---|---|
| F1 B | No se dice qué está nítido al empezar, durante y al acabar cada plano | El modelo enfoca el fondo o el primer plano al azar | ¿Qué debe estar nítido al empezar y al acabar? |
| F2 I | Cambio de foco sin causa, duración o dirección | Flota, hace rack focus no pedido o no cambia | ¿De qué a qué, cuándo y cuánto dura? |
| F3 I | Profundidad de campo en conflicto con la estética (bokeh de retrato con una compacta, todo nítido en un look de cine) | Look incoherente | ¿Profundidad corta o amplia? |
| F4 I | Primer plano muy cercano (hombro, teclado, mano) sin decir si queda desenfocado | Compite con el sujeto y le roba el foco | ¿Queda blando o nítido? |
| F5 I | Óptica o perspectiva no declarada, o que cambia dentro del clip | Distorsión inesperada o cambio de lente | ¿Gran angular, normal o tele, y fija todo el clip? |
| F6 M | Exposición confundida con luz; autofocus sin presupuesto | Parece que cambia la luz | Se decide `In-lens` con número de eventos |

### Eje 3. Estética y luz

| ID | Qué se busca | Por qué falla | Qué se pregunta |
|---|---|---|---|
| E1 B | Estética no declarada ni deducible de las referencias | Cada plano sale con un look distinto | ¿Qué look quieres? (se ofrecen opciones según el contexto) |
| E2 B | Estética contradictoria: "pulido cinematográfico" con "amateur"; "grano fuerte" con "limpio"; "grade" con "raw"; "bokeh cremoso" con "compacta" | El modelo promedia y sale genérico | ¿Cuál de las dos manda? |
| E3 I | Luz: fuentes, dirección y constancia sin definir; sin bloqueo de "la luz no cambia" cuando la cámara se mueve hacia una ventana o pantalla | Parpadeos, cambios de luz o flashes | ¿Qué luces hay y cuál es constante? |
| E4 I | La referencia tiene un look (óptica, color, grano) que el texto contradice, o al revés | El modelo mezcla ambos | ¿Manda la imagen o el texto? |
| E5 I | Piel y textura sin decir, en estéticas realistas | Piel lisa y retocada | ¿Piel con textura visible o limpia? |
| E6 I | Conflicto entre referencias del mismo elemento (una bata lisa en una hoja y de felpa en el primer frame; dos vestuarios; dos tonos de piel) | Deriva de identidad o vestuario | ¿Qué referencia manda para ese elemento? |
| E7 I | Texto visible (pósters, diplomas, pantallas): legibilidad y fidelidad sin definir | Texto inventado o ilegible | ¿Debe coincidir exacto con la referencia, quedar blando o no verse? |
| E8 M | Hora del día, color, ratio y ambientación sin declarar | Variaciones menores | Se decide |
| E9 M | Sonido sin carácter definido cuando el audio se genera (micro cercano, sala, limpio) | Mezcla incoherente con la imagen | ¿Cómo suena? |

### Eje 4. Movimiento y actuación de los personajes

| ID | Qué se busca | Por qué falla | Qué se pregunta |
|---|---|---|---|
| P1 B | Emoción como etiqueta ("furioso", "confundido", "desesperado") sin conducta visible | Resultado genérico o caricaturesco | ¿Cómo se ve? Se ofrecen opciones de conducta (cejas, mandíbula, ojos, respiración, ritmo) |
| P2 B | Mirada sin política con la lente ni destino en cada tramo | Miran a cámara o a ninguna parte | ¿A quién o a qué mira en cada momento, y nunca a la lente? |
| P3 B | Manos y props sin definir: qué mano, qué hace, qué sostiene | Cambian de mano, aparecen o desaparecen objetos | ¿Con qué mano gesticula, qué sostiene y con cuál? |
| P4 B | Quien no habla no tiene papel | Se queda congelado o hace cosas raras | ¿Qué hace mientras el otro habla o actúa? |
| P5 I | Gestos sin anclaje, forma, recorrido, tamaño, significado ni lectura errónea bloqueada | Gesticulación decorativa o señalan al lugar equivocado | ¿Qué gesto acompaña esa frase, con qué mano, de qué tamaño? |
| P6 I | Pausas vacías | Dead air o poses congeladas | ¿Qué hace en la pausa? |
| P7 I | Cuerpo sin definir: postura, peso, ruta, giro, velocidad de paso, orientación respecto a la cámara | Movimientos genéricos o direcciones contrarias | ¿Cómo se mueve y hacia dónde? |
| P8 I | Cambio emocional en salto, sin escalera | Cambio brusco poco creíble | ¿Cómo pasa de A a B? (se ofrecen peldaños) |
| P9 I | Voz sin definir: edad, acento, registro, tempo, intención, distancia al micro; idioma y variedad por hablante | Voz y acento al azar | ¿Cómo suena cada hablante? |
| P10 I | Recuento de personas y quién sale o no sale | Aparecen personas no pedidas | ¿Cuántas personas se ven y quién no debe salir nunca? |
| P11 I | Identidad parcial: qué rasgos de la referencia se usan y cuáles no (fondo, hoja, ropa) | Se cuela el fondo de estudio o la ropa de otra imagen | Se decide con las referencias; solo se pregunta si chocan |
| P12 M | Microvida (parpadeo, respiración, peso, pelo, ropa) sin definir | Poses rígidas | Se decide |
| P13 M | Objetivo y táctica del personaje no deducibles | Actuación plana | Solo se pregunta si cambia la conducta visible |

### Eje 5. Acción

| ID | Qué se busca | Por qué falla | Qué se pregunta |
|---|---|---|---|
| A1 B | Estado inicial y final de cada tramo no observables | El stage queda ambiguo y el modelo lo rellena | ¿Cómo está cada persona y cada objeto al empezar y al acabar? |
| A2 B | Acción físicamente imposible o sin causa: puerta que abre hacia el lado equivocado, objeto que cae sin impacto, silla que rueda sin empuje, hojas que salen por donde no toca, ruta con obstáculos | El modelo hace lo físicamente plausible, no lo pedido | ¿Hacia qué lado abre, qué provoca cada cosa, por dónde pasa? |
| A3 B | Densidad: demasiadas acciones para el tiempo disponible (ver tabla de tiempos) | El modelo omite o acelera acciones | ¿Alargo el tiempo, quito una acción o la divido? |
| A4 I | Acciones sin principio, desarrollo y final visibles | Teletransporte, acciones ya hechas | Se escribe cada fase |
| A5 I | Props sin ciclo de vida: cantidad, mano, estados irreversibles, quién los tiene al final | Duplicados, cambios de mano, regresiones | ¿Quién tiene qué al final y en qué mano? |
| A6 I | Contradicción con el primer frame (pose, posición, ropa, props) | El modelo "corrige" el primer frame | ¿Manda el primer frame o el texto? |
| A7 I | Orden de acciones ambiguo, o simultaneidad no declarada | Acciones en serie que debían ser a la vez, o al revés | ¿Qué ocurre a la vez y qué después? |
| A8 I | Final no definido: corte seco, pose, salida de plano, fundido | El modelo inventa un cierre | ¿Cómo acaba el clip, exactamente? |
| A9 M | Sonidos sin causa visible, o causas visibles sin sonido | Desincronía audiovisual | Se decide junto a la causa |

**Tabla de tiempos** (orden de magnitud, heurística de la skill; no es un dato medido). Si lo pedido cabe en menos de la mitad del tiempo disponible, se avisa:

| Acción | Tiempo razonable |
|---|---|
| Levantarse de una silla | 1,0 a 1,5 s |
| Sentarse | 1,0 a 1,5 s |
| Caminar unos 3 metros a ritmo normal | unos 3 s |
| Abrir una puerta y salir | 1,5 a 2 s |
| Impacto del portazo | 0,2 a 0,4 s |
| Ponerse unas gafas | 1,0 a 1,5 s |
| Gesto de mano marcado | 0,5 a 1,0 s |
| Giro de cabeza | 0,4 a 0,8 s |
| Paneo de cámara a velocidad de mano | 0,7 a 1,0 s |
| Cambio de foco | unos 0,5 s |
| Frase hablada | unas 3 palabras por segundo (con audio, se mide) |

### Eje 6. Sincronía

| ID | Qué se busca | Por qué falla | Qué se pregunta |
|---|---|---|---|
| S1 B | Audio exacto sin transcripción, tiempos ni archivo | No se puede sincronizar | ¿Me pasas el archivo o la transcripción? |
| S2 B | Cortes y stages que no caen en pausas reales del audio, o duración que trunca una palabra | Cortes sobre palabras, labios desfasados | ¿Muevo los cortes a las pausas, o alargo la duración? |
| S3 B | Quién dice cada fragmento sin asignar, o solapamientos | Voces cruzadas, labios mal | ¿Quién dice cada línea? |
| S4 I | Gestos, miradas o cámara sin anclaje a un fragmento o a un evento del audio | Caen donde el modelo quiere | ¿En qué frase o sonido cae cada uno? |
| S5 I | Eventos que dependen de un sonido del audio que no está identificado (impresora, golpe, chasquido) | No se puede sincronizar con certeza | ¿En qué momento exacto suena y qué es? |
| S6 I | Vídeo guía (profundidad, movimiento) que contradice el texto en cortes, tempo, gestos o encuadre | El modelo sigue el vídeo y ignora el texto, o al revés | ¿Manda el vídeo guía o el texto? |
| S7 I | Acciones simultáneas escritas en serie, o en serie escritas como simultáneas | Orden incorrecto | Se reescribe con "a la vez" o "después" |
| S8 I | Silencios de más de un segundo sin conducta | Poses congeladas | ¿Qué ocurre en ese silencio? |
| S9 M | Timestamps fuera de la rejilla `.00/.50`, rangos de menos de 1,00 s, rangos no consecutivos o que no cierran en la duración | Formato inválido o desfases | Se corrige |
| S10 M | Duración final: redondeo del audio (9,40 s puede ser 9 o 10) y cola sin sonido | Palabra truncada o silencio largo | ¿Redondeo hacia arriba y dejo una espera final? |

### Eje 7. Referencias y formato

| ID | Qué se busca | Por qué falla | Qué se pregunta |
|---|---|---|---|
| R1 B | Handles que no corresponden al orden y tipo reales de los adjuntos | Identidades cruzadas | Se confirma el orden |
| R2 B | Asset sin rol o con rol ambiguo (primer frame, localización, solo estética) | El modelo usa la imagen donde no debe | ¿Qué aporta exactamente cada referencia y qué no debe usarse? |
| R3 I | Asset que no debe intervenir y no se dice (una persona que no aparece) | Aparece | Se declara "ignore entirely" |
| R4 I | Conflicto entre lo que muestra la imagen y lo que pide el texto | Mezcla ambas | ¿Manda la imagen o el texto? |
| R5 I | Ratio que choca con el primer frame; duración que choca con el audio | Recorte o estiramiento | Se decide y se avisa |
| R6 I | Errores de formato Seedance 2.5 (diálogo entre comillas, idioma sin declarar, SFX agrupados al final, alias sin `@`) | El modelo ignora o malinterpreta | Se corrige sin preguntar |
| R7 M | Contaminación: restos de iteraciones ("again", "than before"), números de escena, nombres de archivo, @tags inexistentes | Instrucciones fantasma | Se limpia sin preguntar |

---

## Procedimiento

### Paso 0. Intake y diagnóstico

**0.1 Presentación.** Si no hay prompt, o el usuario pregunta qué es la skill o cómo funciona, se da la presentación de "Modo de funcionamiento" y se espera. Si hay prompt, se sigue.

**0.2 Medición y lectura de lo adjunto**, en silencio:

- **Audio:** `ffprobe` (duración), `silencedetect` (pausas), `whisper` con tiempos por palabra y envolvente de volumen con `astats` para localizar golpes y ruidos.
- **Vídeo guía:** `ffprobe`, detección de cortes con `select='gt(scene,0.1)'` y un mosaico de fotogramas para leer encuadres y bloqueo con `Read`.
- **Imágenes:** `Read` de cada una. Dimensiones reales, qué muestran y qué contradicen del texto.

**0.3 Inventario:**

- Duración, ratio, primer frame.
- Referencias: tipo, orden, rol.
- Audio: exacto, guía libre o ninguno.
- Personas: principales, secundarias, extras, y si alguien filma.
- Diálogo: cada línea literal, hablante, idioma, variedad.
- Props y localización.
- Acciones en orden.
- Cámara: movimientos pedidos, encuadres, enfoque.
- Estética declarada (se conserva tal cual).

**0.4 Modo.** Se elige entre completo, diagnóstico y rápido según la petición.

### Paso 1. Auditoría y preguntas

**1.1 Auditoría.** Se pasa el catálogo completo, eje por eje, contra el prompt, las referencias y el inventario. Cada hallazgo lleva ID, gravedad, cita del prompt (o "no aparece"), problema y pregunta. Antes de preguntar nada, se comprueba si las referencias, el audio o el vídeo guía ya responden: lo que se puede deducir no se pregunta.

**1.2 Informe.** Se entrega en el chat con este formato, directo y sin suavizar:

```text
Auditoría de tu prompt
Veredicto: <una línea: qué tiene de bueno y cuántos bloqueantes tiene>.

Bloqueantes
1. [C3] Dónde: "<cita corta>". Problema: <una frase>.
2. ...

Importantes
3. [P2] Dónde: no aparece. Problema: <una frase>.

Menores que decidiré yo: <IDs y lista en una línea>.
```

Además de los hallazgos negativos, el informe señala en una línea lo que ya está bien resuelto, para que Marcos sepa qué se conserva.

**1.3 Preguntas en rondas.** Tras el informe se lanzan las preguntas con `AskUserQuestion`:

- **Ronda 1:** todos los bloqueantes, hasta 4 por llamada y varias llamadas seguidas si hay más.
- **Ronda 2:** los importantes que cambian el resultado visible.
- **Ronda 3:** solo si las respuestas abren huecos o contradicciones nuevas.

Cada pregunta:

- cita el fragmento del prompt que la origina;
- explica en una frase por qué falla;
- ofrece de 2 a 4 opciones concretas, con la recomendada primera y marcada "(Recommended)", y el motivo en su descripción;
- en actuación ofrece conductas y no etiquetas; en cámara ofrece movimientos con velocidad y aterrizaje; en enfoque ofrece planos nítidos y cambios con duración;
- agrupa en una misma pregunta lo que está relacionado (una cámara y su enfoque, un gesto y su frase);
- no pregunta lo que las referencias ya contestan.

**1.4 Re-auditoría.** Tras cada ronda se comprueba si las respuestas generan una contradicción nueva (por ejemplo, "cámara fija" más "le sigue"). Si la hay, se pregunta en la ronda siguiente.

**1.5 Cierre.** Máximo 3 rondas. Lo que quede sin responder (importantes y menores) se decide con criterio, motivado por la historia, y se lista en `Supuestos`. Si Marcos responde "decide tú" a una pregunta, vale como respuesta para esa pregunta. Después se pasa al Paso 2 y se escribe el prompt.

**Banco de preguntas modelo** (para calibrar el tono; se adaptan al caso):

- [C5] "Dices 'hold this stable framing', pero él echa la silla atrás y tira la cabeza hacia atrás. Si la cámara se queda fija, se sale de plano. ¿Cómo lo quieres?" A) La cámara retrocede con él y lo mantiene centrado (Recommended). B) Plano más holgado y él se mueve dentro. C) Plano fijo y que salga de cuadro.
- [P2] "En ningún sitio dices a dónde mira mientras teclea. ¿Dónde está el monitor y a dónde van sus ojos?" A) Al monitor, junto a la lente y a su derecha (Recommended). B) A la nada, ligeramente por encima de la lente. C) A cámara.
- [F1] "No dices qué está nítido al empezar. Con el teclado pegado a la lente, ¿qué queda enfocado?" A) Teclado y fondo al principio, y el foco pasa a la cara al subir la cámara (Recommended). B) Cara siempre nítida y teclado blando.
- [A2] "La puerta: ¿se abre hacia dentro o hacia fuera? Cambia dónde está la cámara y qué ve." A) Hacia dentro, con las bisagras como en la referencia (Recommended). B) Hacia fuera.
- [S2] "Tu audio dura 9,40 s y el prompt pide 9 s: cortaría la última palabra. ¿Cómo lo resolvemos?" A) 10 s con una espera final de Marcos (Recommended). B) 9 s y recortamos el audio.
- [E2] "Pides 'raw CCD' y a la vez 'cinematic grade'. Chocan. ¿Cuál manda?" A) Raw CCD, sin grade (Recommended). B) Look cinematográfico y sin grano marcado.
- [P1] "'Furioso' no dice cómo se ve. ¿Qué conducta quieres?" A) Furia contenida: mandíbula apretada, ojos fijos, respiración corta (Recommended). B) Furia explosiva: gestos amplios, respiración fuerte. C) Cansancio y resignación.

### Paso 2. Referencias

- Convierte cualquier sintaxis a handles compactos (`@[Image 1](image_1)`, `<<<image_1>>>`, "first image", nombres de archivo o URLs pasan a `@Image1`). Elements con UUID se sustituyen por un nombre vinculado a las imágenes que lo definen.
- Una línea por material con qué usa y qué no usa.
- Varias vistas de la misma persona: `All views in @Image2 are the same single man.`
- Fichas de personaje: `Do not use the studio background or the sheet layout.`
- Primer frame frente a localización (ver contrato).
- Props con pantalla: solo la carcasa, `Its reference display is never used.`
- Vídeo negro que solo aporta audio: `@Video1 is a blank black video carrying only the audio track. Use ONLY its audio.`
- Todo asset adjunto aparece en el prompt. Si uno no debe intervenir, se dice que se ignore.
- Si el orden de adjuntos no coincide con el mapping del prompt, se mantiene el del prompt y se avisa en `Supuestos`.

### Paso 3. Duración, stages y tiempo

- Duración entera entre 4 y 30 s. Con audio exacto de 8,06 s, se elige 8 s.
- Con dos o más cambios de estado, stages. Un evento principal por stage.
- Rango temporal en el stage solo cuando la sincronía importa (audio exacto con tiempos, entradas críticas, un movimiento de cámara clave). Si no, stages sin tiempos.
- Con audio exacto, los límites de los stages caen en las pausas reales del audio, redondeados a `.00` o `.50`. Si el timeline del input no coincide con el audio, manda el audio y se avisa.
- Sin tiempos ni archivo: stages sin tiempos y final anclado: `Hard cut exactly with the end of @Audio1.`
- Clips de más de 15 s: más stages y más de un pico de densidad, separados por stages tranquilos. Planificación interna: un único pico de densidad por tramo y stages tranquilos alrededor.
