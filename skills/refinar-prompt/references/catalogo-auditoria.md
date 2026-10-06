# Catálogo de auditoría

Es el corazón de la skill: la lista de comprobaciones que se pasan, eje por eje, contra el prompt y sus referencias. Cada hallazgo lleva un ID, una gravedad y se escribe en el informe así: **Dónde** (cita corta del prompt, o "no aparece"), **Problema** (una frase), **Pregunta** (con opciones).

Gravedad:
- **B, bloqueante:** si no se resuelve, el vídeo sale mal casi seguro. Siempre se pregunta (salvo modo rápido).
- **I, importante:** probable fallo o deriva. Se pregunta si cambia el resultado visible; si no, se decide.
- **M, menor:** se decide con criterio y se lista en `Supuestos`.

## Eje 1. Dinámica de cámara

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
| Movimiento sincronizado con una palabra | La palabra dura menos de un segundo | El disparador pasa a ser físico y anterior (ver `direccion-actuacion-camara.md`, sección Cámara) |

## Eje 2. Enfoque y óptica

| ID | Qué se busca | Por qué falla | Qué se pregunta |
|---|---|---|---|
| F1 B | No se dice qué está nítido al empezar, durante y al acabar cada plano | El modelo enfoca el fondo o el primer plano al azar | ¿Qué debe estar nítido al empezar y al acabar? |
| F2 I | Cambio de foco sin causa, duración o dirección | Flota, hace rack focus no pedido o no cambia | ¿De qué a qué, cuándo y cuánto dura? |
| F3 I | Profundidad de campo en conflicto con la estética (bokeh de retrato con una compacta, todo nítido en un look de cine) | Look incoherente | ¿Profundidad corta o amplia? |
| F4 I | Primer plano muy cercano (hombro, teclado, mano) sin decir si queda desenfocado | Compite con el sujeto y le roba el foco | ¿Queda blando o nítido? |
| F5 I | Óptica o perspectiva no declarada, o que cambia dentro del clip | Distorsión inesperada o cambio de lente | ¿Gran angular, normal o tele, y fija todo el clip? |
| F6 M | Exposición confundida con luz; autofocus sin presupuesto | Parece que cambia la luz | Se decide la línea `In-lens` con el número de eventos |

## Eje 3. Estética y luz

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

## Eje 4. Movimiento y actuación de los personajes

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

## Eje 5. Acción

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

## Eje 6. Sincronía

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

## Eje 7. Referencias y formato

| ID | Qué se busca | Por qué falla | Qué se pregunta |
|---|---|---|---|
| R1 B | Handles que no corresponden al orden y tipo reales de los adjuntos | Identidades cruzadas | Se confirma el orden |
| R2 B | Asset sin rol o con rol ambiguo (primer frame, localización, solo estética) | El modelo usa la imagen donde no debe | ¿Qué aporta exactamente cada referencia y qué no debe usarse? |
| R3 I | Asset que no debe intervenir y no se dice (una persona que no aparece) | Aparece | Se declara "ignore entirely" |
| R4 I | Conflicto entre lo que muestra la imagen y lo que pide el texto | Mezcla ambas | ¿Manda la imagen o el texto? |
| R5 I | Ratio que choca con el primer frame; duración que choca con el audio | Recorte o estiramiento | Se decide y se avisa |
| R6 I | Errores de formato Seedance 2.5 (diálogo entre comillas, idioma sin declarar, SFX agrupados al final, alias sin `@`) | El modelo ignora o malinterpreta | Se corrige sin preguntar |
| R7 M | Contaminación: restos de iteraciones ("again", "than before"), números de escena, nombres de archivo, @tags inexistentes | Instrucciones fantasma | Se limpia sin preguntar |
