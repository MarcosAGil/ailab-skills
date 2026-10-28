# Camera Movement: Base operativa

## Propósito

Esta base traduce una intención visual a un movimiento de cámara físicamente
comprensible. Complementa `references/cinelabs.md`; no sustituye su razonamiento de campo
de visión, blocking, continuidad ni primer frame.

El movimiento debe responder siempre:

```text
Why does the camera move?
What does it follow or reveal?
How fast does it move?
Where does it begin and end?
What physical rig or operator behavior does it imply?
```

---

## Regla fundamental

No usar `cinematic camera movement` como instrucción suficiente.

Débil:

```text
The camera moves cinematically.
```

Fuerte:

```text
A slow eye-level dolly push-in narrows from a medium two-shot to a close-up on Character A as her voice breaks; Character B remains soft in the foreground.
```

---

## Componentes

```text
initial framing
→ camera position and height
→ movement
→ direction
→ speed and acceleration
→ subject relationship
→ final framing
```

No todos necesitan aparecer si ya son evidentes.

---

## Catálogo profesional de 46 movimientos

Catálogo integrado desde la propuesta visual de Ailendra Labs.


Cada ficha contiene el nombre técnico en inglés, su comportamiento, la
aplicación narrativa y una formulación de prompt reutilizable. Las fórmulas son
puntos de partida: deben completarse con sujeto, causa, velocidad, framing y
estado final cuando la escena lo requiera.

---

### A. Paneo e inclinación

#### 1. Static shot

La cámara permanece fija y conserva el mismo encuadre. Útil para observar una
acción, contener tensión o presentar un producto sin distracciones.

```text
Locked-off static shot, no camera movement, stable framing and identical composition from start to finish.
```

#### 2. Pan right

Rotación horizontal hacia la derecha desde un punto fijo. Revela información,
acompaña una mirada o conecta dos sujetos.

```text
Pan right from a fixed position, smooth constant rotation, level horizon, settle on a clear final subject.
```

#### 3. Pan left

Rotación horizontal hacia la izquierda sin desplazamiento físico.

```text
Pan left from a fixed position, smooth constant rotation, level horizon, settle on a clear final subject.
```

#### 4. Whip pan right

Paneo extremadamente rápido hacia la derecha, con motion blur entre dos
composiciones legibles. Funciona como reacción o transición energética.

```text
Whip pan right, rapid snap rotation with brief motion blur, start and finish on sharp readable compositions.
```

#### 5. Whip pan left

Paneo rápido hacia la izquierda que desplaza la atención a un evento inesperado.

```text
Whip pan left, rapid snap rotation with brief motion blur, start and finish on sharp readable compositions.
```

#### 6. Tilt up

Rotación vertical hacia arriba desde un punto fijo. Revela altura, arquitectura,
rostro o escala.

```text
Tilt up from a fixed camera point, smooth vertical rotation, keep the subject centered, finish on the upper target.
```

#### 7. Tilt down

Rotación vertical hacia abajo sin desplazar la cámara. Recorre vestuario,
desciende desde arquitectura o termina en un objeto inferior.

```text
Tilt down from a fixed camera point, smooth vertical rotation, keep the subject centered, finish on the lower target.
```

---

### B. Zoom y óptica

#### 8. Slow zoom in

Aumento gradual de distancia focal desde una cámara fija. Estrecha el campo de
visión sin producir el paralaje de un dolly.

```text
Slow zoom in, gradual focal-length increase, steady framing, finish on a stable close composition.
```

#### 9. Slow zoom out

Reducción gradual de distancia focal para revelar contexto desde una posición
fija.

```text
Slow zoom out, gradual focal-length decrease, reveal the environment, finish on a stable wide composition.
```

#### 10. Fast zoom in

Acercamiento óptico rápido hacia un detalle, producto o reacción.

```text
Fast zoom in toward the main target, quick decisive lens change, keep the subject readable, end stable.
```

#### 11. Fast zoom out

Alejamiento óptico rápido que transforma un detalle en una revelación espacial.

```text
Fast zoom out from the main target, quick decisive lens change, reveal the setting, end stable.
```

#### 12. Crash zoom in

Zoom de entrada extremadamente veloz y agresivo. Aporta sorpresa, comedia,
urgencia o énfasis extremo.

```text
Crash zoom in, extremely fast punchy lens snap toward the target, land on a bold tight frame.
```

#### 13. Crash zoom out

Zoom de salida brusco que convierte instantáneamente un detalle en un plano
amplio.

```text
Crash zoom out, extremely fast punchy lens snap away from the target, land on a bold wide frame.
```

---

### C. Dolly y seguimiento

#### 14. Dolly in

La cámara avanza físicamente en línea recta, creando paralaje y cambio real de
perspectiva.

```text
Dolly in on a straight forward path, smooth controlled push, stable camera height and subject framing.
```

#### 15. Dolly out

La cámara retrocede físicamente y permite que entre más entorno en el plano.

```text
Dolly out on a straight backward path, smooth controlled retreat, stable height, reveal more environment.
```

#### 16. Tracking shot

La cámara acompaña el recorrido del sujeto y adapta su trayectoria para
mantenerlo legible.

```text
Tracking shot moving with the main subject, match their pace, keep consistent readable framing.
```

#### 17. Follow shot / over-the-shoulder

Seguimiento desde atrás utilizando hombro, espalda o cabeza como ancla, mientras
el destino permanece visible.

```text
Follow shot from behind at shoulder height, match the subject pace, keep the route ahead visible.
```

#### 18. Reverse tracking / walk-and-talk

La cámara retrocede frente a un sujeto que avanza. Es el movimiento clásico de
presentadores y conversaciones caminadas.

```text
Reverse tracking in front of a walking subject, move backward at matching speed, stable front-facing frame.
```

#### 19. Side tracking

Seguimiento paralelo que mantiene una distancia lateral constante y muestra el
perfil del desplazamiento.

```text
Side tracking parallel to the moving subject, match their speed, maintain a stable profile distance.
```

#### 20. Low tracking

Seguimiento cerca del suelo para enfatizar pies, ruedas, velocidad o textura del
terreno.

```text
Low tracking shot near ground level, follow the subject movement, emphasize feet, wheels or terrain.
```

#### 21. Vehicle tracking

La cámara iguala la velocidad y ruta de un vehículo para mantenerlo estable
mientras el entorno se desplaza.

```text
Vehicle tracking shot, match the vehicle speed and route, keep it stable while the environment moves.
```

#### 22. Chase shot

Seguimiento rápido, próximo y reactivo. Aumenta urgencia e inmersión en acción,
deporte o huida.

```text
Energetic chase shot following close behind the moving subject, fast reactive pace, readable action.
```

---

### D. Movimientos físicos

#### 23. Truck right

La cámara completa se desplaza lateralmente hacia la derecha manteniendo fija
la orientación del objetivo.

```text
Truck right on a straight lateral path, keep the lens direction fixed, smooth constant movement.
```

#### 24. Truck left

Desplazamiento lateral físico hacia la izquierda sin rotar la cámara.

```text
Truck left on a straight lateral path, keep the lens direction fixed, smooth constant movement.
```

#### 25. Pedestal up

La cámara completa asciende verticalmente mientras la lente permanece nivelada.
No es un tilt.

```text
Pedestal up, move the entire camera vertically upward, keep the lens level and direction unchanged.
```

#### 26. Pedestal down

La cámara desciende verticalmente sin inclinar la lente.

```text
Pedestal down, move the entire camera vertically downward, keep the lens level and direction unchanged.
```

#### 27. Slider right

Desplazamiento lateral corto, uniforme y preciso hacia la derecha. Produce
paralaje sutil en producto, gastronomía o retrato.

```text
Short slider move to the right, slow precise travel, preserve foreground, subject and background layers.
```

#### 28. Slider left

Desplazamiento lateral corto y controlado hacia la izquierda.

```text
Short slider move to the left, slow precise travel, preserve foreground, subject and background layers.
```

#### 29. Push past / pass-by shot

La cámara avanza muy cerca de un elemento de foreground y continúa hacia el
espacio posterior. Refuerza profundidad y puede ocultar una transición.

```text
Push forward past a close foreground object, smooth glide, reveal and enter the space beyond it.
```

#### 30. Arc right

Curva parcial alrededor del sujeto hacia la derecha, sin completar una órbita.

```text
Arc right around the main subject on a shallow curved path, stable radius, height and framing.
```

#### 31. Arc left

Curva parcial alrededor del sujeto hacia la izquierda.

```text
Arc left around the main subject on a shallow curved path, stable radius, height and framing.
```

#### 32. Orbit clockwise

La cámara rodea al sujeto en sentido horario con radio y altura constantes.

```text
Clockwise orbit around the subject, consistent radius and height, keep the subject centered throughout.
```

#### 33. Orbit counterclockwise

Órbita antihoraria manteniendo distancia, altura y centro de interés.

```text
Counterclockwise orbit around the subject, consistent radius and height, keep the subject centered throughout.
```

---

### E. Cámara humana

#### 34. Handheld shot

La cámara responde al cuerpo del operador mediante sway, respiración y pequeños
reajustes. Aporta cercanía documental, UGC o tensión.

```text
Natural handheld shot at human operator height, subtle sway and micro-adjustments, keep the subject readable.
```

#### 35. Body-mounted camera / Snorricam

La cámara queda unida al cuerpo del personaje. El rostro o torso permanece casi
fijo mientras el fondo se mueve intensamente.

```text
Body-mounted Snorricam fixed to the subject, keep their face centered while the background moves around them.
```

No confundir Snorricam con body-cam: en Snorricam la cámara mira al propio
sujeto; una body-cam suele mirar hacia fuera desde su pecho.

---

### F. Dron y grúa

#### 36. Crane up

Ascenso suave a través del espacio que cambia progresivamente la altura del
punto de vista y revela escala.

```text
Crane up through open space, slow controlled vertical lift, keep subject and location readable.
```

#### 37. Crane down

Descenso controlado desde una posición elevada hasta un sujeto o destino.

```text
Crane down through open space, smooth controlled descent, arrive on the subject or destination.
```

#### 38. Drone push in

Vuelo de aproximación hacia un destino manteniendo trayectoria y geografía
legibles.

```text
Drone push in along a smooth forward flight path, keep the route and destination clearly visible.
```

#### 39. Drone pull back

El dron retrocede y revela gradualmente paisaje y escala sin perder al sujeto.

```text
Drone pull back on a smooth reverse flight path, keep the subject visible while revealing the landscape.
```

#### 40. Helicopter shot

Plano aéreo amplio desde gran altura y trayectoria extensa. Adecuado para
geografía, vehículos y escala monumental.

```text
Helicopter-style aerial shot at high altitude, broad gradual flight path, stable wide landscape composition.
```

---

### G. Movimientos y efectos especiales

#### 41. First-person view

La cámara adopta los ojos del personaje. Manos, brazos o cuerpo pueden funcionar
como referencias físicas del POV.

```text
First-person view at human eye height, natural body motion, visible hands as physical reference.
```

#### 42. Tilt-shift

Efecto óptico con una banda estrecha de foco y desenfoque superior e inferior,
que transforma ciudades o multitudes en una aparente miniatura.

```text
Tilt-shift miniature view from a high angle, narrow sharp focus band, soft blur above and below.
```

No es un movimiento físico: pertenece al tratamiento óptico y de foco.

#### 43. Infinite zoom

Zoom continuo hacia un punto central que conecta escalas o mundos visuales.

```text
Infinite zoom continuously into the exact center, smooth accelerating motion, transition into the next visual world.
```

Definir el elemento central de correspondencia y el mundo de llegada.

#### 44. Earth zoom out

Alejamiento que atraviesa escalas de sujeto, calle, ciudad, paisaje y planeta.

```text
Earth zoom out from the starting point through street, city and landscape scales to a planetary view.
```

Debe conservar un eje geográfico reconocible para que no parezca una sucesión
arbitraria de cortes.

#### 45. Time-lapse

Compresión temporal con encuadre estable. Resume procesos largos, tráfico,
clima o cambios de luz.

```text
Locked-camera time-lapse, stable composition and horizon, compress the visible passage of time.
```

No es un movimiento de cámara por sí mismo. Si la cámara también se desplaza,
describir ambas capas por separado.

#### 46. Pass-through objects

La cámara atraviesa visualmente una superficie u objeto y emerge en otro
espacio. Es un movimiento imposible o VFX-driven.

```text
Pass through a centered object or surface on a smooth forward path, emerge into the space beyond.
```

Definir:

- objeto o superficie atravesados;
- punto de entrada;
- material o transición interna;
- correspondencia espacial;
- mundo y framing de salida.

---

## Cámara fija

### Locked-off / static

La cámara no cambia de posición ni orientación.

Útil para:

- diálogo;
- tensión contenida;
- composición gráfica;
- demostración de producto;
- UGC con teléfono apoyado;
- observar acción dentro del plano.

```text
Locked-off medium-wide shot; all movement occurs within the frame.
```

No confundir cámara fija con imagen congelada. Añadir microactividad del sujeto
y del entorno cuando proceda.

---

## Dolly y push

### Dolly push-in

La cámara se desplaza físicamente hacia el sujeto. Aumenta intimidad, presión o
relevancia.

```text
Slow dolly push-in from medium shot to close-up as he recognizes the handwriting.
```

### Dolly pullback

La cámara se aleja y revela contexto, aislamiento o consecuencia.

```text
The camera pulls back from her face to a wide shot revealing the empty station around her.
```

### Punch-in

Acercamiento brusco, óptico o digital. Útil para énfasis, comedia o lenguaje de
redes.

```text
A quick phone-camera punch-in lands on the product label at the punchline.
```

No usar dolly y zoom como sinónimos.

---

## Tracking y trucking

### Lateral tracking

La cámara se desplaza paralela al sujeto.

```text
Low lateral tracking shot moving left to right beside the runner, matching her speed.
```

Protege dirección de pantalla y permite leer locomoción.

### Follow shot

La cámara sigue desde detrás, delante o tres cuartos.

```text
Shoulder-mounted follow shot behind the courier, maintaining two meters of distance as she enters the market.
```

### Lead / backward tracking

La cámara retrocede delante del sujeto.

```text
The camera tracks backward at chest height, holding him in a medium shot while he advances.
```

Definir cómo evita obstáculos cuando el camino es complejo.

---

## Pan y tilt

### Pan

La cámara gira horizontalmente desde una posición fija.

```text
A restrained pan right follows her gaze from the empty chair to the open doorway.
```

### Tilt

Giro vertical desde posición fija.

```text
Begin in a close-up on his wet shoes, tilt up quickly into a medium shot, then hold.
```

Usar pan o tilt para redirigir atención, no como decoración.

---

## Orbit y arc

La cámara rodea parcial o completamente al sujeto.

```text
A smooth 120-degree arc moves from her front-left side to an over-the-shoulder view while she remains in place.
```

Definir:

- grados aproximados si importan;
- sentido horario o antihorario;
- altura;
- radio;
- orientación final.

Para first/last frame, el arco puede conectar dos POV definidos.

---

## Crane y jib

Movimiento vertical o diagonal que cambia escala y revela geografía.

```text
Crane up from a low medium shot of the hiker to a high wide reveal of the canyon.
```

No combinar con maniobras imposibles sin explicar la transición de rig.

---

## Handheld

Handheld no significa temblor aleatorio.

Fuentes físicas:

- respiración;
- pasos;
- cambio de peso;
- correcciones de hombro o muñeca;
- reacción a un impacto;
- pérdida y recuperación de framing.

```text
Restrained shoulder-mounted handheld movement with breathing-level drift and brief step-driven jolts; the operator corrects late after each turn.
```

### Documental

```text
Imperfect reactive framing, subjects occasionally drifting off-center, no polished stabilization.
```

### Tensión cinematográfica

```text
Controlled handheld micro-jitter that intensifies only during the confrontation, then settles.
```

---

## Smartphone selfie

```text
Front-facing phone held at arm's length, slight wide-angle perspective, wrist corrections, step-driven vertical bounce, natural auto-exposure.
```

Si el sujeto se detiene, la cámara no debe seguir rebotando igual.

```text
When her palm reaches the counter, the bounce decays over two small oscillations.
```

---

## Body-cam

```text
Chest-mounted 130-degree view, mild fisheye distortion, horizon tilt, walking bounce, abrupt turn jitter, arms entering the lower frame, rolling-shutter wobble, auto-exposure shifts.
```

No pedir shallow depth of field cinematográfico si se busca body-cam real.

---

## Broadcast

```text
Long-lens broadcast tracking from outside the field, restrained operator corrections, focus following the active player, mild compression, natural arena shake.
```

La cámara prioriza legibilidad de la acción, no coreografía perfecta.

---

## Drone y FPV

### Drone

```text
High aerial glide descending gradually toward the road while maintaining the horizon.
```

### FPV

```text
Low FPV flight accelerates along the runway, banks beneath the wing, then pitches upward to follow the aircraft.
```

Definir obstáculos, altura, velocidad y curvas para evitar teletransporte.

---

## Rack focus

No es desplazamiento de cámara; es transición de foco.

```text
Rack focus from the candle flame in the foreground to the handwritten name on the book spine behind it.
```

Debe haber dos planos de profundidad claros.

---

## Zoom y dolly zoom

### Optical zoom

Cambia campo de visión desde la misma posición.

```text
Slow telephoto zoom toward the balcony while perspective remains compressed.
```

### Digital zoom

Adecuado para teléfono o broadcast reactivo.

```text
The spectator reacts with a quick imperfect digital zoom, overshoots slightly, then corrects.
```

### Dolly zoom

La cámara se mueve mientras la focal cambia en sentido contrario, alterando la
perspectiva del fondo.

```text
A restrained dolly zoom isolates her face while the corridor appears to stretch behind her.
```

Usarlo solo cuando el efecto narrativo lo justifica.

---

## Whip pan

```text
A fast whip pan follows the sudden sound from Character A to the doorway, with natural motion blur, then settles on Character B.
```

Necesita un detonante y un destino claros.

---

## Speed ramp y slow motion

La velocidad temporal debe anclarse a un evento:

```text
Remain at natural speed during the run. Ramp into slow motion at the exact glass impact, hold long enough to reveal fragments and liquid, then return to natural speed before they reach the floor.
```

No pedir múltiples tasas extremas si no son necesarias para la lectura.

---

## Selección por intención

| Intención | Movimiento recomendado |
|---|---|
| Intimidad creciente | Slow push-in |
| Revelar aislamiento | Pullback to wide |
| Mostrar geografía | Crane, aerial reveal |
| Seguir locomoción | Parallel tracking o follow |
| Reacción urgente | Pan, whip pan o handheld correction |
| Observar actuación | Locked-off o push-in mínimo |
| Energía UGC | Selfie handheld causal |
| Autenticidad deportiva | Telephoto broadcast tracking |
| Inmersión documental | Shoulder cam o body-cam |
| Transformar perspectiva | Arc u orbit |
| Redirigir atención | Rack focus |
| Desorientación emocional | Dolly zoom selectivo |

---

## Combinación de movimientos

Una secuencia puede combinar movimientos si existe continuidad:

```text
Begin locked on his hands. Tilt up into a medium shot as he stands, then track backward while he walks toward camera, ending in a wide reveal at the doorway.
```

Evitar listas incompatibles:

```text
static handheld drone orbit tracking shot
```

Cada fase necesita orden y transición.

---

## Continuidad

Comprobar:

- dirección de pantalla;
- altura de cámara;
- lado del eje;
- distancia al sujeto;
- velocidad;
- focal aparente;
- posición final;
- posibilidad física del recorrido.

Para clips sucesivos:

```text
Continue from the same camera height, lens feel, left-to-right movement, and distance established in the previous frame.
```

---

## Errores frecuentes

| Error | Corrección |
|---|---|
| “Cinematic movement” | Nombrar movimiento, dirección y final |
| Shake constante | Vincularlo a cuerpo y eventos |
| Cámara teletransportada | Describir camino continuo |
| Pan sin destino | Indicar detonante y sujeto final |
| Orbit imposible | Definir radio, altura y obstáculos |
| Zoom confundido con dolly | Elegir perspectiva deseada |
| Rack focus sin profundidad | Definir foreground y background |
| Slow motion genérica | Anclar entrada y salida a un evento |
| Multi-movimiento caótico | Ordenar fases o reducir maniobras |
| Dirección invertida | Fijar screen direction y eje |

---

## Plantilla final

```text
Begin in [initial framing] from [camera position]. The camera [movement] [direction and speed], [relationship to subject or reveal], then ends in [final framing]. [Operator or rig behavior]. Preserve [screen direction, lens feel, height, and continuity anchors].
```

---

## QA

- ¿El movimiento tiene motivo?
- ¿Existe un inicio y un final?
- ¿La cámara puede recorrer físicamente ese camino?
- ¿Velocidad y duración son compatibles?
- ¿Está claro qué sigue o revela?
- ¿Las imperfecciones corresponden al dispositivo?
- ¿Se conserva la dirección de pantalla?
- ¿El movimiento apoya la actuación y no la oculta?
- ¿La guía específica del modelo se ha aplicado después?

## Adaptación a Kling 4.0 en AILAB

Consultar la guía de Kling 4.0 (no incluida en esta skill). Dirigir inicio, trayectoria, velocidad, relación con
el sujeto y encuadre final. Si `@video_1` guía solo la cámara, declararlo y
asignar identidad/escenario a sus `@image_1`, `@image_2`, etc. Mantener esas
menciones nativas. El vídeo genera una referencia para otra pieza; no hay modo
de edición que garantice preservar su recorrido exacto.

Separar movimientos de cámara y sujeto. No pedir cámara fija y órbita a la vez.
Los blockouts y mapas de profundidad pueden ensayarse como vídeos compatibles,
sin presentarlos como controles dedicados de AILAB. No convertir focal/FOV o
timestamps en garantías de calibración exacta; la rejilla `.00/.50` es interna.

En Fotogramas clave siempre existe `@first_frame`; cada intermedio usa
`@keyframe_1`, etc., y el último opcional `@last_frame`. Explicar transiciones,
respetar la cantidad que permite la duración y heredar ratio del primero. No
combinar ese modo con vídeos de referencia. Las imágenes deben hacer viable
el recorrido; escribir una trayectoria no crea un campo o recurso ausente.
