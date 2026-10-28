# Estilo espontáneo-viral (Seedance 2.5)

## Propósito

Convierte lo que llegue (una idea escrita, un prompt ya hecho, un vídeo de referencia, imágenes o audio, o una mezcla de todo) en un **prompt de Seedance 2.5 de estilo espontáneo-viral**, con la arquitectura, el detalle y las reglas técnicas de la guía de Seedance 2.5.

Hace tres cosas, en este orden:

1. **Estudia la entrada**: comprueba si encaja con el estilo espontáneo-viral, si cumple las reglas y si hay errores o cosas que mejorar.
2. **Propone y pregunta**: dice qué falla y cómo arreglarlo, y deja decidir al usuario cómo lo quiere.
3. **Genera el prompt** cuando el usuario acepta y responde, usando todas las referencias que haya.

No decide por el usuario lo que cambia el resultado, no cambia la historia y no envía nada a AILAB: entrega el texto.

**Objetivo de calidad.** El prompt que entrega esta skill debe ser el mejor posible dentro del estilo, venga de una idea, de un prompt (incluido el borrador que devuelve el Video Prompter) o de un vídeo de referencia. El estilo lo fijan los diez rasgos y el eje 10. La calidad la fija el eje 11 (errores comunes de prompting: referencias que contradicen el texto, modo del modelo incompatible con los materiales, cámara que no cubre lo que promete, distancias y tiempos que no cuadran, elementos o sonidos inventados, personajes iguales que se funden) y la lectura adversaria final de la Fase 3.

## Qué es el estilo espontáneo-viral

Definición del estilo: una escena que **se siente grabada a mano, de forma orgánica, como una escena cotidiana de la vida real**. No hay movimiento de cámara profesional. Es lo que pasa delante de alguien que tiene un dispositivo de consumo en la mano y no sabe qué va a ocurrir.

**La cámara siempre sigue el ADN de cámara** (sección del mismo nombre, tomado de la guía de cámara y POV): la cámara es el dispositivo que sostiene una persona, nunca se ve en plano y tiene el aspecto real de ese aparato. Es la parte más importante del estilo y no se negocia en ningún prompt.

Los ejemplos de referencia son los prompts de la comunidad. Esos prompts tienen el **contenido, el tipo de cámara (a mano, de testigo) y el movimiento** correctos, pero no la arquitectura, el detalle ni los apuntes técnicos que el usuario quiere. Por eso la regla de oro de esta skill es:

> **Conservar el contenido y el movimiento de la entrada. Escribir la cámara siempre con el ADN de cámara (el dispositivo manda). Añadir arquitectura, detalle y apuntes técnicos.**

Si la entrada trae otro aparato (los prompts de referencia usan un camcorder), el movimiento, el tipo de cámara y el aparato se conservan; D1 solo avisa en una línea de que existe la alternativa móvil.

### Los diez rasgos

Cada rasgo cita su origen. La skill los usa como criterio de análisis (Fase 1) y como guía de escritura (Fase 3).

| # | Rasgo | Qué significa | Origen |
|---|---|---|---|
| 1 | Testigo lejano, no cineasta | La cámara tiene dueño, posición y motivo, a distancia y en tercera persona, con una única perspectiva. Quien graba no sabe qué va a pasar y no anticipa nada | prompts de referencia ("the camera never anticipates"), references/ugc.md ("la cámara debe tener propietario") |
| 2 | Cámara en mano de un dispositivo real, reactiva e imperfecta | Siempre en mano (handheld es la base de todo plano) y sin estabilizar a la perfección. Reacciona con retraso humano, corrige, pierde al sujeto tras un obstáculo y lo vuelve a encontrar. Todo el temblor viene de la mano, los pasos o la respiración | ADN de cámara (Guía de cámara y POV), prompts de referencia, CineLabs (handheld) |
| 3 | Sin movimiento mecánico ni profesional | Nada de gimbal robótico, carril o dolly sobre vehículo, grúa, dron, órbita, trípode o plano bloqueado, cámara lenta o speed ramp (salvo petición expresa). El seguimiento a pie, el whip pan y el push-in o pull-back con balanceo de mano **sí** forman parte del estilo | Definición del estilo, prompts de referencia (listas de exclusión), Guía de cámara y POV (movimientos) |
| 4 | Toma continua y final abierto | Una sola toma. El metraje acaba de golpe mientras la situación sigue, sin resolución dramática | prompts de referencia, CineLabs ("plano continuo por defecto") |
| 5 | Mundo cotidiano y creíble | El lugar funciona de verdad y tiene vida de fondo. Nadie actúa para la cámara | prompts de referencia, ActingLabs (conjunto) |
| 6 | Un solo quiebre de la rutina | Un mundo claro más un único quiebre más una acción sencilla que escala. El quiebre puede ser un objeto anacrónico, un personaje fuera de sitio o una acción de un personaje que sorprende. Lo raro se trata como normal por todos: nadie reacciona al hecho absurdo. Solo reacciona quien está afectado directamente, de forma práctica (se aparta, se agacha). Una escena cotidiana creíble con su propio accidente ya cumple: no se añade nada surreal | Guía de referencia (paso 3 de la práctica 01), prompts de referencia y el usuario (2026-10-27) |
| 7 | Escalada física con causa y efecto | Cada cambio tiene un disparador visible y una consecuencia física | prompts de referencia (drive-thru, cinta de correr) |
| 8 | Aspecto de dispositivo de consumo (por defecto, móvil) | El look sale del aparato que graba, sin pulido ni grading | ADN de cámara (Guía de cámara y POV), prompts de referencia, references/ugc.md |
| 9 | Sonido diegético desde el micro del aparato | Ambiente y efectos con la distancia correcta. Sin música, narración ni golpe de humor, salvo petición | prompts de referencia, Guía de cámara y POV (audio de POV) |
| 10 | Actuación práctica y contenida | Los personajes hacen lo suyo. Nadie mira a la lente ni al testigo, no posan ni celebran | prompts de referencia, ActingLabs |

## Cuándo usarla

- El usuario (o un alumno) pide un vídeo espontáneo-viral, "grabado a mano", "escena cotidiana", "testigo con camcorder", "como si lo hubiera grabado alguien con el móvil", "found footage cotidiano".
- Llega una descripción de texto y hay que convertirla en un prompt de Seedance 2.5 de este estilo.
- Llega un prompt (sencillo o complejo, en prosa o estructurado, con o sin referencias) y hay que valorarlo, ajustarlo al estilo y reconstruirlo con la arquitectura de Seedance 2.5.
- Llega el borrador que ha devuelto el Video Prompter (u otro agente) y hay que pulirlo. Es el caso más habitual y el que más errores de calidad trae (eje 11).
- Llega un vídeo, o un enlace a uno, que se quiere recrear o tomar como referencia de cámara y ritmo.
- Llegan imágenes (personaje, objeto, localización), audio o vídeo para construir el prompt con todas las referencias.

## Cuándo NO usarla

- Auditar un prompt de Seedance 2.5 que ya está bien estructurado, sin importar el estilo: usa `refinar-prompt`.
- Convertir un prompt a estética CCD de compacta o a UGC de móvil sin más: `estilo-amateur-ccd` o `estilo-ugc`.
- Edición conservadora de un vídeo, extensión, blockout, montaje de imágenes o transiciones: Video Prompter con la guía de Seedance 2.5 (`seedance-25-ailendra-labs`).
- Estilo cinematográfico, comercial o de campaña: otras skills (una skill de dirección cinematográfica de campañas).
- Otro modelo que no sea Seedance 2.5.
- Enviar el prompt a AILAB: lo hace la skill `ailab`, con su propia confirmación de gasto.

## Inputs requeridos

Ninguno es obligatorio. La skill trabaja con lo que haya y pregunta lo que falte.

| Tipo de entrada | Qué es | Qué hace la skill con ella |
|---|---|---|
| A. Idea | Una petición escrita, sin prompt | Extrae mundo, elemento inesperado y escalada, calcula si cabe en el reloj y propone las decisiones de dirección |
| B. Prompt | Un prompt existente, sencillo o muy complejo, con o sin referencias, incluido el borrador de un agente | Lo estudia contra el estilo y las reglas, lo audita (con la lista de deslices del agente primero) y propone cómo reconstruirlo |
| C. Vídeo | Un archivo o un enlace de referencia | Lo analiza (cámara, ritmo, aspecto, sonido, qué pasa) y decide con el usuario qué hereda |
| D. Referencias | Imágenes, audio o vídeo con su orden y su función | Aplica la disciplina de referencias (mapa, jerarquía, exclusiones) |

Las entradas se combinan. Lo normal es B más D, o A más D.

Si el usuario no ha dicho el dispositivo, la duración o el ratio, no son obligatorios: se deducen de la entrada y, si no se pueden deducir, se proponen (ver decisiones de dirección).

## MCPs y tools necesarios

- `Read` de cada imagen de referencia, siempre.
- Vídeo: `ffprobe` (duración, ratio, fps) y cortes con `ffmpeg -vf "select='gt(scene,0.1)'"` con un mosaico de fotogramas para leerlo con `Read`. Para el análisis narrativo, la skill `vervideo` (modo completo, con foco en cámara, estética y sonido); alternativas: la skill `watch:watch` o el MCP `claude-video-vision`.
- Audio: `ffprobe` (duración), `ffmpeg -af silencedetect=noise=-35dB:d=0.15` (pausas) y `whisper <archivo> --model small --language es --word_timestamps True --output_format json` (tiempos por palabra; Whisper falla con siglas como "IA": manda el texto literal).
- `wc -c` para la longitud del prompt de entrada.
- No se inventa lo que no se ha podido ver: si un vídeo o una imagen no se puede abrir, se dice y se pide otra vía.

## Fuentes y quién manda en cada cosa

Antes de empezar se leen, enteras, las guías que se van a aplicar (la lectura es obligatoria, no se escribe de memoria):

| Qué | Fuente | Manda en |
|---|---|---|
| Estructura, sintaxis y contrato de salida | `references/guia-seedance-2-5.md` (más `references/ejemplos-seedance-2-5.md` para calibrar) | Formato: familias, stages, timestamps, handles, delimitadores, parámetros, QA |
| Disciplina de referencias | Sección "Disciplina de referencias" de esta maestra, cruzada con la guía de Seedance 2.5 | Cómo se mapean, se jerarquizan y se excluyen las referencias |
| Reglas de revisión del estilo | la guía de cámara y POV de esta maestra | Reloj, diálogo, reglas anti-fallo, fallos y arreglos, iteración, checklist |
| Auditoría | Maestra `references/auditoria-refinar-prompt.md` (ejes 1 a 9, detector de ambigüedad, ocupación, tabla de tiempos) y los ejes 10 (estilo) y 11 (calidad) de esta maestra | Cómo se busca lo que falla y cómo se redacta el informe |
| ADN de cámara | las secciones de cámara y POV de esta maestra, sección "ADN de cámara" de esta maestra | **Todo lo de cámara.** Manda sobre CineLabs, Camera-movement y la tabla de riesgos de `refinar-prompt` cuando chocan |
| Cámara, luz y espacio | `references/cinelabs.md`, `references/camera-movement.md` | Handheld físico, zoom, geometría (dentro del ADN de cámara) |
| Actuación y conjunto | `references/actinglabs.md` | Conducta visible, secundarios, reacciones en onda |
| Capturas de móvil | `references/ugc.md` | Dueño de la cámara, dispositivos, partitura inline si hay diálogo |
| Estilo | Los prompts de referencia y la definición del estilo | Los diez rasgos |

### Si las fuentes chocan

Gana la **guía de Seedance 2.5 en estructura y sintaxis**. Del Guía de cámara y POV y de referencia se conserva el contenido y se descarta su forma.

| Choque | Decisión |
|---|---|
| Guía de cámara y POV: `@image_1`, plantilla `FORMAT/SUBJECT/SHOT N`, segundos sin rejilla, diálogo entre comillas | Se usa la plantilla de Seedance 2.5: `@Image1`, `[Stage N]`, rejilla `.00/.50`, diálogo entre `{ }` |
| Guía de cámara y POV: guiones largos en el diálogo ("em-dashes") | No se usan (regla de estilo). Se sustituyen por puntos suspensivos o comas |
| Guía de cámara y POV: "anuncia el mapeo antes del prompt" | El mapa va dentro del prompt, en `[Characters]`, `[Props]` y `[Scene]` |
| Prompts de referencia: bloques `====`, mayúsculas, listas largas de negativas, escenas contadas varias veces | La señal se dice una vez. Las restricciones van dentro del stage donde surge el riesgo, y las reglas duras una sola vez en `[Maintain Consistency]` |
| Prompts de referencia: "CUT" o "CUT ABRUPTLY" al final de una toma continua | El final se escribe como "el metraje acaba de golpe, sin resolución". La palabra "cut" contradice "no cuts" y el modelo puede leerla como un corte |
| Prompts de referencia: duración y ratio dentro del prompt | Se dan fuera del bloque. Dentro solo queda el ratio si es parte del aspecto del aparato (4:3 si es un camcorder) |
| Prompts de referencia: camcorder de 2000 como aparato. Aparato por defecto del ADN: móvil | Aparato por defecto, móvil. El camcorder solo si la entrada lo pide expresamente (D1); entonces valen su aspecto, su zoom óptico y su autofocus que busca |
| Guía de cámara y POV (camcorder de found footage): fecha y REC en una esquina. Prompts de referencia: "camera interface" excluido | Por defecto no hay overlay. Solo se pregunta (D7) si el aparato es un camcorder |
| Guía de cámara y POV (iPhone): el autofocus no busca. Prompts de referencia (camcorder): el autofocus busca | Depende del aparato: con móvil, no busca (Guía de cámara y POV); con el camcorder que traiga la entrada, busca (referencia) |
| CineLabs y `refinar-prompt`: whip pan y seguimiento como movimientos de riesgo. Guía de cámara y POV: whip pan y tracking son movimientos válidos | Mandan la guía de cámara y POV y el estilo: se usan, con un solo movimiento principal por stage y con las mitigaciones (duración, dirección, aterrizaje y la frase `Same continuous take.`, sin la palabra "cut") |
| Guía de cámara y POV: segundos por plano según número de planos. Guía 2.5: segundos enteros entre 4 y 30 y stages | Manda la ocupación por stage (tabla de refinar-prompt). La guía de cámara y POV sirve de comprobación de cordura |

## ADN de cámara

Fuente: la guía de cámara y POV de esta maestra (secciones "Camera Language" y "POV Scenes"), por indicación de el usuario (2026-10-26). Sustituye al bloque de móvil en mano que se había añadido antes.

### Principio: el dispositivo manda

1. **La cámara ES el dispositivo** (móvil, gafas, camcorder, cámara de acción) y **nunca se ve en plano**: ni el aparato, ni el operador, ni su sombra.
2. **El aspecto es el real de ese aparato.** No se "Hollywood-ifica" (ver tabla de dispositivos).
3. **El audio suena captado por el micro del aparato.**
4. **Cada plano se dirige con encuadre, lente y movimiento** (el lenguaje de cámara de la guía de cámara y POV, más abajo). En Seedance 2.5 cada stage lleva su encuadre, su sensación de lente y su movimiento.
5. **Siempre es un testigo, a distancia y en tercera persona**. La cámara es de alguien que está lejos y ve cómo ocurre, con una única perspectiva, nunca de quien lo monta o lo dirige. Todo es muy realista y físicamente exacto. Lo raro se trata como normal por quien está en escena (ver Reglas de reacción).

### Reglas duras de POV (se escriben tal cual en el prompt cuando aplican)

| Cuándo | Regla que se escribe |
|---|---|
| Siempre | `POV: the camera IS the [device]. The device is never visible in frame.` |
| Siempre (testigo) | `Spontaneous footage by a bystander who is there and watches it happen[, from where they stand / from far away]. Physically exact, serious in tone, fully believable.` El tramo entre corchetes solo si la entrada dice dónde está el testigo |
| Móvil (también el que graba a otros) | `Full depth of field: the background is sharp, not blurred. NO autofocus hunting. Focus stays locked on the main subject.` |
| Selfie a brazo extendido | Lo anterior, con `Focus stays locked on his/her face.` |
| Gafas inteligentes | `Clean natural first-person view. No fisheye, no lens distortion.` |
| Alguien camina mientras se graba o lo graban | `[Subject] walks forward continuously for the full duration, never stops, never slows to a standstill.` (si no se dice, se detiene a mitad de la toma) |
| Audio | `All audio sounds like it was captured by the device's microphone: natural, slightly muffled, no studio polish.` |
| Oscuridad | "Dim but visible", nunca "pitch black" ni "black void" |
| Un objeto debe entrar por un sitio concreto | Dirigir la cámara y la entrada: `The camera tilts DOWN and focuses on [place]. The object enters from the side at floor level.` |

El autofocus que busca **solo** se escribe con un camcorder que traiga la entrada (como en los prompts de referencia). Con móvil no se pide nunca.

### Lenguaje de cámara (Guía de cámara y POV)

**Encuadre**

| Término | Significado | Mejor para |
|---|---|---|
| ECU | Primerísimo plano | Detalle de un ojo, textura de un objeto |
| CU | Primer plano | Cara y cuello |
| MCU | Plano medio corto | Cabeza y hombros: el plano de diálogo |
| MS | Plano medio | De cintura para arriba: el plano de acción |
| WS | Plano general | Cuerpo entero en el entorno |
| OTS | Por encima del hombro | Conversaciones, revelaciones |
| POV | Punto de vista | Subjetivo inmersivo: la cámara son los ojos |

**Lente (sensación)**

| Lente | Sensación | Mejor para |
|---|---|---|
| 24 a 28 mm | Ancha, inmersiva | Acción, plano de situación, espacios dinámicos |
| 35 mm | Documental, natural | Realismo de cámara en mano, escenas de calle |
| 50 mm | Neutra | La más versátil |
| 85 mm | Íntima, poca profundidad de campo | Caras, emoción, retratos |
| 100 mm macro | Detalle extremo | Objetos, texturas |

**Movimiento**

| Término | Significado | Uso en espontáneo-viral |
|---|---|---|
| Locked | Trípode fijo | **No se usa** (definición del estilo: grabado a mano) |
| Slow push-in | Escalada emocional | Sí, con balanceo de mano |
| Slow pull-back | Revelar o soltar | Sí, con balanceo de mano |
| Tracking | Sigue al sujeto | Sí: el operador camina tras él |
| Arc / orbit | Rodea al sujeto | **No por defecto** (riesgo de deformar la identidad; ver Límites) |
| Whip pan | Giro seco, para la acción | Sí, con las mitigaciones de abajo |
| Handheld | Urgencia, realismo | **Base de todo plano** |
| Rack focus | Cambia el foco entre planos | Sí, como refoco humano (no como búsqueda de autofocus) |

Cómo se aplican al estilo:

- **Móvil:** 35 mm como sensación por defecto (documental, cámara en mano) y 24 a 28 mm para situar el lugar o la acción dinámica. 85 mm y 100 mm macro dan poca profundidad de campo y chocan con el aspecto de móvil: solo si el concepto lo pide.
- **Encuadre final de cada stage** con un término de la guía de cámara y POV (WS, MS, MCU...), no con "medium-wide" ni "small".
- **Whip pan:** puede salir como un corte encubierto. Siempre con duración, dirección, aterrizaje y la frase `Same continuous take.` (sin la palabra "cut": el modelo la lee como un corte, incluso dentro de "no cut").
- **Handheld** es la base: el temblor viene de la mano, los pasos y la respiración, nunca de un "random shake".

## Dispositivo y aspecto

El ADN de cámara es "el dispositivo manda". **El aparato por defecto es el smartphone en mano** (vertical 9:16 salvo que se pida otro). Los demás solo si la entrada los pide expresamente (D1). Cada clip declara un dispositivo y no mezcla looks.

| Dispositivo | Cuándo | Aspecto | Origen |
|---|---|---|---|
| **Smartphone en mano (por defecto)** | Escena grabada por alguien que está allí, o selfie | Todo enfocado de delante atrás, **sin profundidad de campo corta**, color natural de móvil, sin flare, sin grano cinematográfico, el autofocus no busca, vertical 9:16 salvo que se pida otro, bordes algo blandos, compresión contenida, sin grading cinematográfico, obstáculos en primer plano | Guía de cámara y POV (iPhone), references/ugc.md ("audience-filmed") |
| Camcorder de consumo | Solo si la entrada lo pide (p. ej. los prompts de referencia) | 4:3 apaisado, sensor CCD pequeño, rango dinámico limitado, desaturación moderada, balance de blancos cálido, altas luces que se queman, aberración cromática leve, compresión digital temprana, **zoom óptico**, el autofocus busca y la exposición bombea (referencia). Del Guía de cámara y POV (found footage): luz LED de cámara dura, ruido digital fuerte en las sombras, distorsión de lente leve; fecha y REC en una esquina solo si se pide (D7) | prompts de referencia, Guía de cámara y POV |
| Selfie o vlog a brazo extendido | Alguien se graba a sí mismo | Como el smartphone, con el brazo extendido hacia el objetivo, el móvil nunca en plano, foco bloqueado en la cara y, si camina, sin parar toda la toma | Guía de cámara y POV, references/ugc.md |
| Gafas inteligentes (POV) | Primera persona natural | Línea de visión humana natural, **sin ojo de pez**, sin viñeta, ligero balanceo de cabeza, manos visibles al gesticular | Guía de cámara y POV |
| Cámara de acción | Deporte o movimiento en primera persona | Gran angular con distorsión, contraste alto, colores sobresaturados | Guía de cámara y POV |

Reglas comunes:

- El dispositivo es la cámara y **no se ve nunca en plano** (ni el aparato, ni el operador, ni su sombra, salvo que el concepto lo pida).
- El ratio por defecto acompaña al aparato (móvil 9:16, camcorder 4:3). Si el usuario pide otro y el aparato lo permite (un móvil grabando en horizontal, 16:9), se respeta sin avisar. Solo se avisa si choca con un primer fotograma o con un camcorder pedido en 9:16.
- Estética contradictoria ("cinematográfico" con "amateur", limpio 4K con móvil) se marca como hallazgo (E2).
- Nunca "negro total": si hace falta oscuridad, "oscuro pero visible" (Guía de cámara y POV).

## Estilo visual y luz (referencia)

- Aspecto de cámara amateur, no cinematográfico: detalle ligeramente blando, grano leve en las sombras, compresión digital suave, colores naturales y poco saturados.
- Altas luces que se queman y sombras sin detalle. Sin HDR, sin 4K limpio, sin nitidez digital moderna.
- Piel sin suavizar: poros y textura visibles. Sin filtro de belleza ni grading.
- Sin LUT de cine, sin teal-orange, sin luz de contra artificial, sin luz volumétrica.
- Luz: la de la fuente real del lugar y de la hora, sin relleno. La luz no cambia; solo cambia la exposición de la cámara.
- Con camcorder, LED de cámara solo si la escena lo justifica (D13). Oscuro pero visible.

## Reglas de cámara espontánea

### Dueño de la cámara

Todo prompt contesta, antes de escribir, estas cuatro preguntas (references/ugc.md):

1. ¿Quién sostiene el aparato?
2. ¿Dónde está respecto al cuerpo y a la escena (distancia, altura, lado)?
3. ¿Qué evento físico lo mueve?
4. ¿Qué intenta mantener en cuadro el operador, y qué sabe (no sabe nada de lo que va a pasar)?

### Cómo se escribe un movimiento (seis piezas)

Disparador, inicio, trayecto (tipo, dirección, amplitud, velocidad), aterrizaje (el encuadre en que acaba), foco (qué queda nítido) y lo que no es. Ejemplo de redacción (ilustrativo, sin cifras del input):

```text
Camera: WS, 35mm feel, handheld. The rider enters the frame small and the operator notices late: a whip pan of about a second to frame-right lands off-centre on him, then settles into an MS as the operator steps forward behind him. Same continuous take.
In-lens: focus stays locked on the rider throughout; the background stays sharp.
```

### Comportamientos reactivos opcionales (listado de comportamientos de referencia)

No son el ADN: son un repertorio **opcional**, para cuando la entrada o el usuario pidan una cámara más reactiva (por ejemplo, los prompts de referencia). Encajan dentro del lenguaje de cámara de la guía de cámara y POV (handheld, tracking, whip pan, push-in) y del dispositivo elegido: el zoom digital solo existe en un móvil, el óptico solo en un camcorder, y el autofocus que busca no se usa con móvil. Los grupos corresponden a las etiquetas del listado base: "ambos" es la capa de mano, "Shoot 1" es el seguimiento físico y "Shoot 3" es la atención y el zoom.

**A. Capa de mano (opcional; el handheld ya es la base de todo plano)**

| # | Comportamiento | Qué es |
|---|---|---|
| 1 | Handheld sway | Oscilación irregular en varios ejes |
| 2 | Horizon roll | Rotación del horizonte de 1 a 5 grados |
| 3 | Micro-jitter | Vibración de alta frecuencia por la mano y los pasos |
| 16 | Vertical handheld bob | Vaivén vertical sutil por la respiración o la postura |

**B. Seguimiento físico** (el operador se mueve con el sujeto)

| # | Comportamiento | Qué es | Cuándo |
|---|---|---|---|
| 4 | Tilt up | Rotación vertical hacia arriba para mantener al sujeto en cuadro | El sujeto sube o se levanta |
| 5 | Rising reframe | Elevación física de la cámara mientras el personaje se levanta | El sujeto se levanta y se acerca a la cámara |
| 6 | Follow tracking shot | Desplazamiento físico acompañando al personaje | El sujeto camina y el operador camina tras él |
| 7 | Lateral tracking | Seguimiento lateral con reajuste de orientación | El sujeto cruza el encuadre |
| 8 | Physical push-in | Aproximación real del operador hacia el sujeto (no es un zoom) | El operador se acerca andando |
| 9 | Reactive recoil | Retroceso repentino de la cámara ante una acción | Un golpe, un susto, algo que se acerca |

**C. Atención y zoom** (el operador reacciona sin moverse del sitio)

| # | Comportamiento | Qué es | Cuándo |
|---|---|---|---|
| 10 | Snap digital zoom | Ampliación digital rápida y agresiva | Algo llama la atención |
| 11 | Zoom overshoot and correction | El zoom sobrepasa el objetivo y corrige con brusquedad | Siempre que haya snap zoom |
| 12 | Reactive whip reframe | Giro rápido para llevar la atención a otra acción | Pasa algo en otro punto |
| 13 | Reactive pan | Paneo horizontal motivado por un personaje, con retraso | El sujeto se desplaza o mira a otro lado |
| 14 | Slow digital zoom creep | Acercamiento digital lento e inestable, para énfasis dramático | Una escena que va a más |
| 15 | Foreground parallax occlusion | Objetos cercanos que pasan por delante y tapan parcialmente al sujeto | Hay obstáculos físicos entre cámara y sujeto |

**D. Derivados de los prompts de referencia** (no están en el listado base, encajan con el ADN)

| # | Comportamiento | Qué es |
|---|---|---|
| 17 | Descubrimiento tardío | El operador ve el evento un instante después de que empiece; el sujeto entra pequeño o descentrado |
| 18 | Pérdida y reencuentro | Un obstáculo físico tapa al sujeto por oclusión real, no por teletransporte; el operador busca en la zona equivocada, corrige y lo recupera |

Reglas del catálogo:

- **Un movimiento principal por stage.** Mezclar grupos entre stages es lo normal; dentro de un stage, uno dominante. Las correcciones humanas (sobrepaso, refoco, reencuadre) forman parte de ese movimiento y se cuentan en la ocupación.
- **No confundir push-in físico y zoom:** se declara cuál es. El push-in físico cambia el paralaje; el zoom no.
- **Riesgos conocidos** (de `refinar-prompt`): el whip reframe y el snap zoom pueden salir como un corte encubierto o un cambio de escena; el seguimiento a través de puertas o umbrales puede atravesar paredes; un zoom lento de más de 8 a 10 s sin hitos deriva. Mitigación: duración, dirección y aterrizaje explícitos, ruta y punto de parada, y la frase `Same continuous take.` (sin la palabra "cut").
- Cada comportamiento se escribe con las **seis piezas** (ver más arriba). Sin dirección ni causa, el modelo lo resuelve al azar (hallazgo V4).

### Límites

- **Un movimiento principal por stage** (CineLabs), siempre sobre el handheld de base.
- La posición de la cámara al acabar un stage es la de arranque del siguiente.
- El obstáculo que tapa al sujeto se define: dónde está respecto a la cámara y al sujeto, qué se mueve (el obstáculo, la cámara o el sujeto) y por qué lado desaparece y reaparece.
- Se declara qué **no se usa nunca**, en una sola línea dentro de `[Camera]`: trípode o plano bloqueado, gimbal robótico, carril o dolly sobre vehículo, grúa, dron, órbita alrededor del sujeto, cámara lenta. El seguimiento a pie **no** está prohibido. Un arco corto del operador (hasta unos 90 grados) solo si la entrada lo pide.
- El shake del aparato no degrada la identidad: si hay una referencia de personaje, el desenfoque de movimiento fuerte y los giros rápidos de cabeza se limitan a donde estén motivados (ejemplo de referencia, regla de identidad).

- **Posición fija del operador, cámara siempre en mano.** El operador puede quedarse en un sitio, pero la cámara nunca va en trípode ni bloqueada: llega tarde a los enfoques, reacciona a lo que pasa, no encuadra perfecto y tiene una vibración leve, como la de alguien no experto grabando en la calle, sin estabilizar.
- **Presupuesto de eventos de lente.** En `[Camera]` se declara el número exacto de autoenfoques, ajustes de exposición y destellos de todo el clip. Se cuenta en la auditoría, y ninguna frase del prompt puede contradecirlo (Q8).
- **Cámara dentro de un vehículo en marcha** (un móvil en las manos de un pasajero, no montado): es válida y no es un dolly sobre vehículo. Se declara quién lo sostiene y que no va fijado al salpicadero ni al cristal, y se comprueba la cobertura (Q9): ángulo que el parabrisas deja ver, pilares y marcos, velocidad relativa por segundos y lo que entra por delante (un puente o un túnel cambia la luz y rompe el presupuesto de exposición).

## Reglas de mundo, actuación y elemento inesperado

### Mundo

- El lugar se describe como **funcional y vivo**, con el detalle físico que importa (materiales, polvo, objetos que se usan), no como decorado ni ruinas.
- Fondo con vida: cada grupo del fondo hace una tarea concreta y nada se congela. Solo reacciona quien está afectado directamente, de forma práctica. El resto sigue trabajando como si lo raro fuera normal.
- Recuento cerrado de las personas que importan ("exactly N visible people: ...") y, para el fondo, una cifra o un grupo definido, no "a few" ni "several".

### Elemento inesperado

- El perímetro de lo inesperado se declara: **qué objetos o personas son lo único que rompe el mundo**. Todo lo demás pertenece al mundo (ejemplo de referencia, drive-thru: la ventanilla, la bolsa y el vaso son lo único moderno).
- Si el quiebre es un objeto anacrónico, un personaje fuera de sitio o una acción que sorprende, nadie reacciona a la contradicción: quien lo usa o lo protagoniza lo trata como normal, sin fascinarse. Solo reacciona quien está afectado directamente, de forma práctica, y el resto sigue a lo suyo.
- La escalada se escribe como estados, no como adjetivos: de A a B a C, con lo que cambia entre cada uno (cinta de correr: paso lento, paso rápido, trote, carrera).

### Actuación

- Conducta práctica: el personaje hace lo suyo. Emociones como conducta visible (2 a 4 señales), nunca como etiqueta ("serio", "irritado" sin decir cómo se ve).
- Política de mirada: nadie mira a la lente ni al testigo en ningún stage, salvo selfie pedido explícitamente. Se dice a qué mira cada personaje en cada stage.
- Manos y props: qué mano hace qué, qué hace la libre, dónde queda cada objeto al final.
- Quien no actúa tiene papel: oyente activo, reacción en escalera, el que ya está ahí, extra de fondo.
- Si hay diálogo: ver reglas de diálogo.

### Concepto y final

- **Legible en segundos**: un mundo claro, un elemento inesperado, una acción sencilla que escala. Si hay más de un quiebre de la rutina o no hay escalada física, es el hallazgo V12.
- **Final abierto**: el estado final es exacto y observable, y el metraje acaba mientras la situación continúa (o justo antes de la expectativa, como en el cazador cavernícola). Sin resolución, sin push-in dramático, sin corte a negro.

## Reglas de sonido

- Todo el sonido viene del micro del aparato y **respeta la distancia**: lo lejano suena lejano y amortiguado (un aterrizaje a lo lejos es un golpe sordo). Con camcorder, carácter de micro de camcorder; con móvil, voz y ambiente de micro de móvil, ligeramente comprimidos (Guía de cámara y POV: "natural, slightly muffled, no studio polish").
- Ambiente más efectos puntuales **inline y junto a su causa visible**: `<Tires rattling over wooden planks>`. Nunca agrupados al final (Guía de Seedance 2.5).
- Sin música, narración, golpe de humor ni risas grabadas salvo petición. Si no hay música: `No music.` Subtítulos solo si se piden, con `【 】`.
- Sin diálogo guionizado: `No scripted dialogue. Mouths do not articulate.` Si una persona emite una reacción involuntaria, se decide entre un sonido sin palabras o nada (nunca un modal tipo "possible").
- Con diálogo: idioma, variedad, forma de decirlo y hablante antes de cada línea, y la línea entre `{ }`. Español sin variedad: castellano de España.

## Reglas de revisión del estilo (Guía de cámara y POV, adaptadas)

Estas reglas se aplican tanto al estudiar una entrada como al escribir el prompt.

### Respetar el reloj

- Cuenta las acciones y las sílabas. Un clip corto es pequeño. Si un stage tiene demasiadas acciones, se acelera o se omiten.
- Referencia de cordura de la guía de cámara y POV: 5 s, un gesto sencillo; 10 s, dos o tres momentos; 15 s, tres o cuatro como máximo.
- El árbitro es la **ocupación por stage** de `refinar-prompt` (tabla de tiempos). Los comportamientos de cámara reactiva (zoom con sobrepaso, búsqueda tras una oclusión, refoco) se **estiman y se declaran como estimación**, porque no están en la tabla.
- Cuando "Too much" o "chill": se recorta la parte hinchada, no se reescribe todo.
- Cortar antes de añadir: un stage simple con atmósfera rica supera a uno cargado.

### Diálogo

- Corto, entrecortado y real: una o dos frases por personaje y stage como máximo, con contracciones y dudas. Dicho, no escrito. Sin discursos, sin información volcada, sin marcas.
- Una frase hablada ocupa unos 2 a 3 segundos: se hace la cuenta (tabla de refinar-prompt: palabras por segundo).
- En duda, se quita. Un rostro en silencio dice más que un monólogo.
- La partitura de actuación (references/ugc.md): preparación, línea, gestos anclados justo después de las palabras que los motivan, recuperación. Los gestos nunca van lejos del guion.

### Reglas anti-fallo

| Fallo | Regla que se escribe |
|---|---|
| Personajes duplicados | `Exactly one X throughout. Only one X visible at any time.` |
| Personajes que se mezclan | `X is visually distinct from Y: different hair, build, face. No duplicates.` |
| Cambia la ropa | `Same wardrobe across the whole clip.` |
| Aparece el aparato o el operador | `The camera is the [device]. The device is never visible in frame.` |
| Props que aparecen de la nada | `The [prop] is produced at Stage N with a visible motion.` |
| Objeto con identidad (carta, libro, logo) | `Exactly one, always the same. No other, ever.` |
| El sujeto deja de caminar | `Walks forward continuously for the full duration.` |
| Autofocus que busca (selfie de móvil) | `NO autofocus shifting. Focus stays locked on the face.` |

Las reglas se escriben dentro del stage donde surge el riesgo. Las que valen para todo el clip, una sola vez en `[Maintain Consistency]`.

### Fallos habituales y arreglos

| Síntoma | Arreglo |
|---|---|
| Escena acelerada o con tirones | Quitar acciones, o dividir el stage |
| Escena demasiado cinematográfica | Quitar movimientos perfectos, grading y luz imposible; fijar el look del aparato |
| El móvil sale demasiado cinematográfico | `Everything in focus front to back. NO shallow DOF.` |
| Se ve el aparato en plano | Regla de dispositivo invisible |
| Gafas con ojo de pez | `No fisheye, no lens distortion, clean natural human POV.` |
| Audio demasiado producido | `Audio captured by the device mic, natural and slightly muffled.` |
| Escena emocional plana | Detalle físico: pecho que sube, manos, mirada, respiración |
| El objeto equivocado sigue saliendo | Repetir la restricción en el stage del objeto |
| Un objeto entra por un lado equivocado | Dirigir la entrada: de dónde viene y a qué altura |
| Entorno demasiado oscuro | "Dim but visible", nunca "black void" |
| Final forzado | Final abierto, sin cierre dramático |

### Iteración (cuando el usuario devuelve un vídeo generado)

1. Leer lo que el usuario **ha dicho**, no lo que se supone.
2. Hacer el cambio mínimo, en el punto exacto que falla. No reescribir lo que no se ha tocado.
3. Traducir la intención: "too dramatic" = bajar la intensidad, sin push-ins ni corte a negro; "more emotion" = más detalle físico; "chill" = menos acciones por stage; "less dialogue" = quitar la mitad; "be realistic" = respetar el reloj; "why is X happening" = ese es el único sitio que se toca; "I already fixed X" = no se toca X.
4. Igualar la energía del usuario: informal con informal, quirúrgico con técnico.
5. Nunca reestructurar por cuenta propia. Si es de verdad ambiguo, una pregunta corta.
6. Primero se identifica el síntoma, luego la causa más pequeña, se cambia una variable y se conserva lo que funcionaba (ejemplo de referencia, iteración mínima; guía de Seedance 2.5, matriz de diagnóstico).

## Disciplina de referencias (aplicada a Seedance 2.5)

Reglas, todas obligatorias cuando hay adjuntos.

1. **Una referencia, una responsabilidad.** Cada material dice qué aporta. Nada de "combina estas imágenes".
2. **Jerarquía de referencias.** Primarias (identidad del personaje, producto protagonista, vehículo distintivo): deben mantenerse muy coherentes. Secundarias (vestuario, arquitectura, interior): apoyo importante. De estilo (luz, color, textura, atmósfera): solo eso. Si chocan, se declara cuál gana.
3. **Decir qué se ignora.** Toda referencia lleva su `Do not use ...`: la cara de una imagen de ropa, el fondo de una hoja de personaje, las personas de una imagen de localización, el peinado, la pose, la iluminación y los textos.
4. **Mapa de referencias.** Una línea por material, antes de la escena, con su handle: `[Alias] corresponds to @ImageN. Use only ... Do not use ...`. Se cierra con `Do not blend identity, clothing, environment or object information between references unless explicitly instructed.` El alias sin handle no vincula nada.
5. **El texto dirige, la referencia define cómo se ve.** Una referencia de personaje quieta no obliga a reproducir la pose. La acción va en el texto.
6. **Contaminación entre referencias** (*reference bleeding*): la ropa cambia la cara, la localización cambia la ropa, el vehículo crea un coche extra. Se arregla reforzando el límite de esa referencia, no alargando todo el prompt.
7. **Identidad primero.** La referencia de identidad es la de máxima prioridad. Con identidad crítica se evitan los movimientos extremos.
8. **Objetos con identidad.** Se declaran forma, color y proporciones, y la cantidad exacta: `Exactly one vehicle matching @ImageN. No alternative version.`
9. **Bloqueos de continuidad.** Un solo personaje, una sola ropa, un solo vehículo, entorno coherente, sin duplicados ni fundidos de identidad.
10. **Selección por escena.** Se usan solo las referencias necesarias en cada stage; no hace falta que aparezcan todas a la vez. Con 5 o más sujetos con varias vistas, una vista por imagen.
11. **Varias vistas, una instancia.** Las vistas del mismo sujeto u objeto declaran explícitamente una única instancia.
12. **Hoja de personaje reutilizable.** Si hay un personaje recurrente, su hoja es el activo de identidad (todas las vistas son una persona; se ignoran paneles, bordes y fondo neutro).
13. **Vídeo de movimiento.** `@VideoN` aporta solo lo que se declara (cámara, ritmo, secuencia). No hereda identidad, ropa ni escena, y no se repite su coreografía en texto.
14. **Audio.** Se declara si es pista exacta o guía libre, nunca las dos a la vez.
15. **Handles compactos**, numerados por tipo y por orden de subida, sin espacios ni guiones bajos (`@Image1`, nunca `@image_1`). Nunca nombres de archivo ni "the provided image".

Con una imagen que es el primer fotograma: `@ImageN is the exact first frame. Begin directly from this exact visual state.` Si solo es localización: `Do not use @ImageN as a first frame.`

Tabla de comprobación al abrir cada imagen (cotejo de referencias, como en `refinar-prompt`):

| Handle | Qué muestra de verdad | Rol que le da el prompt | Qué dice el prompt de ella | Choques o restos que pueden colarse |
|---|---|---|---|---|

## Contrato de formato Seedance 2.5

La guía manda. Aquí está lo que se comprueba y cómo se escribe la salida (detalle completo en `references/auditoria-refinar-prompt.md`, sección "Contrato de formato Seedance 2.5").

- **Familias.** Se elige exactamente una de las ocho. Lo habitual aquí: simple (una acción y pocas referencias), multi-referencia (varios personajes, props, escenas o medios) o vídeo largo por etapas (dos o más cambios de estado). Con primer fotograma, se añade el rol de `@ImageN` como primer frame.
- **Stages.** Con dos o más cambios de estado, `[Stage N]` con un único evento principal: `Initial state:` (o `Continue from the previous stage:`), `Primary event:`, `End state:`. El estado final de un stage es el inicial del siguiente.
- **Tiempo.** Duración entera de 4 a 30 s. Si no la da el usuario: acción única, de 6 a 8 s; secuencia de 2 o 3 eventos, de 10 a 14 s; narrativa completa, de 16 a 25 s. Los límites de tiempo caen en `.00` o `.50`, cada tramo dura 1,00 s o más, son consecutivos y el último cierra en la duración total. Nunca se copian centésimas.
- **Delimitadores.** Diálogo `{ }`, efectos `< >` inline junto a su causa, música `( )`, subtítulos `【 】`. Nunca diálogo entre comillas normales. Los nombres de personajes y props van en texto plano.
- **Parámetros** fuera del bloque: `📐 Aspect ratio: ... | ⏱ Duration: Ns`. Sin resolución ni fps dentro del prompt.
- **Idioma.** El prompt va en inglés; el diálogo, en el idioma pedido.
- **Restricciones críticas inline** en el stage donde surge el riesgo; las generales, una vez. Sin bloques masivos de negativas.
- Sin razonamiento interno ni QA visibles en el bloque.

## Catálogo de auditoría

Se usan los **nueve ejes de `refinar-prompt`** tal cual (cámara, enfoque, estética y luz, actuación, acción y física, contexto y geometría, ritmo y tiempo, sincronía con el audio, referencias y formato), con su detector de lenguaje ambiguo, la pasada de continuidad, la ocupación por stage y la tabla de tiempos. Se leen en `references/auditoria-refinar-prompt.md`, no se copian aquí.

Cuando la entrada es un prompt en prosa o en un formato que no es el de Seedance 2.5, el eje de formato (R7) se reduce a **un único hallazgo global**: "no sigue la arquitectura de Seedance 2.5, se reconstruye en la Fase 3". No se enumera línea a línea.

### Eje 10. Estilo espontáneo-viral (V)

Se pasa siempre, además de los nueve. Es la formalización de los diez rasgos a partir de los prompts de referencia y de la guía de cámara y POV; si se aportan más ejemplos, se revisa (ver Mantenimiento).

| ID | Qué se busca | Por qué falla |
|---|---|---|
| V1 B | Movimiento mecánico o profesional, pedido o implícito (carril o dolly sobre vehículo, gimbal robótico, grúa, dron, órbita alrededor del sujeto, trípode o plano bloqueado, push-in cinematográfico suave, cámara lenta o speed ramp). El seguimiento a pie, el whip pan y el push-in o pull-back con balanceo de mano **no** son V1: son lenguaje de cámara de la guía de cámara y POV | Seedance lo ejecuta pulido y desaparece lo orgánico |
| V2 B | Cámara sin dueño: no dice quién graba, dónde, a qué distancia, con qué aparato ni qué sabe | El modelo elige un punto de vista omnisciente |
| V3 B | Cámara que anticipa: encuadra el momento clave antes de que ocurra, sigue perfecta o deja al sujeto centrado | Se pierde la reactividad |
| V4 I | Imperfecciones sin causa física, dirección o amplitud ("shake", "imperfect", "handheld") | El modelo inventa un temblor al azar |
| V5 I | Lenguaje cinematográfico o comercial ("cinematic", "epic", "stunning", "dramatic lighting") | Empuja a un acabado de anuncio |
| V6 I | Personas que actúan para la cámara (sonríen, saludan, posan, miran a la lente o al testigo) sin petición explícita | Rompe el "nadie actúa para la cámara" |
| V7 I | Lo raro se trata como evento: gente que reacciona al hecho absurdo, se reúne, graba o aplaude, o reacciona sin estar afectada; o el perímetro de lo inesperado no está acotado | Se pierde el humor serio, o se cuela más modernidad |
| V8 I | Fondo congelado, o multitud que reacciona como un solo cuerpo, o extras sin tarea | Escena sin vida |
| V9 I | Sonido no diegético (música, narración, golpe cómico) o sonido sin carácter de micro ni distancia | Suena a producción |
| V10 I | Aspecto incompatible con el aparato (profundidad de campo corta en móvil, grading, HDR, luz de contra, 4K limpio) o aspecto sin dispositivo | Look incoherente |
| V11 I | Final cinematográfico (resolución, push-in, corte a negro) o final sin definir; o "cut" como cierre en una toma continua | El modelo inventa un cierre, o lee "cut" como un corte |
| V12 I | Concepto no legible en segundos: más de un quiebre de la rutina (objeto anacrónico, personaje fuera de sitio o acción que sorprende), o sin escalada física clara. No se marca la ausencia de un elemento surreal | Se diluye el chiste |
| V13 B | Reglas de POV del ADN rotas: el dispositivo se ve en plano, el aparato no está declarado, cámara bloqueada o con trípode ("locked-off", "tripod", "gimbal-like"), fisheye en gafas, profundidad de campo corta o autofocus que busca en móvil, o el sujeto que camina y se detiene | El modelo deja de parecer una cámara real en la mano de alguien |

Etiqueta propia de este eje: **ESTILO**, con la frase "Esto no es espontáneo-viral:" y el mecanismo de fallo. Si el mecanismo es una petición explícita del usuario, se marca como AVISO y no como ERROR. Se combina con el resto de etiquetas de `refinar-prompt` (ERROR, PROBABLE, CONTRADICCIÓN, FALTA, DETALLE, RÁPIDO, LENTO, SOBRA) y la misma gravedad (B, I, M).

### Eje 11. Calidad del prompt (Q)

Se pasa siempre, además de los nueve ejes y del eje 10. No mira el estilo (eso es el eje 10): mira que el prompt diga lo mismo que las referencias, que la física y que el reloj, y que no contradiga sus propias reglas. Recoge los errores de prompting que más se repitieron en las cuatro escenas de prueba de los caballeros (mitin, calle, acampada y Vespa, 2026-10-27 y 28), tanto en los borradores del Video Prompter como en los prompts propios. Se marca con las etiquetas de `refinar-prompt` (ERROR, CONTRADICCIÓN, FALTA, DETALLE, RÁPIDO, SOBRA) y la misma gravedad (B, I, M).

**Referencias y modo del modelo**

| ID | Qué se busca | Por qué falla y cómo se arregla |
|---|---|---|
| Q1 B | Referencia cuyo **estado** contradice el arco del texto: atril vacío con un orador que habla, público ya aplaudiendo cuando debe escuchar, mesa con folletos cuando se juega a cartas, calle sin el escaparate que se rompe | El modelo copia el estado de la imagen o mezcla las dos versiones. Se escribe `@ImageN defines only [lo que sirve]. Do not use [pose, estado, personas]`; lo que falta se declara como `the only addition` en `[Scene]`; si el elemento que falta es protagonista, se avisa y se recomienda editar la referencia antes de generar |
| Q2 B | Modo del modelo incompatible con el conjunto de materiales. Caso visto: primer fotograma más hoja de personaje en Seedance 2.5 Lite, donde `i2v` y `ref` no se combinan | Se comprueba con `ailab info <modelo>` (solo lectura, sin gasto) cuando hay primer fotograma más otras referencias. Si no combinan, se entrega la versión principal (`ref`, con el primer fotograma declarado en texto, que puede no coincidir al píxel) y una variante `i2v` con el vestuario descrito en texto, y se dice en una línea. Un modelo que la skill no pueda consultar se declara "no consta" |
| Q3 I | `Exactly as @ImageN` o `identical framing` mientras se excluye parte de la imagen (la pose del público, las personas) | Contradicción: no se puede copiar todo y excluir algo. Se limita a `same position, height and angle` |
| Q4 I | Negativa que choca con lo que la referencia contiene: `no banners` con banderas y pancartas en la imagen, `no other text` con carteles legibles | El modelo duda entre la imagen y la regla. Se escribe `no other text or logo than in @ImageN` y se nombra el texto que se conserva |
| Q5 I | Hoja de personaje con paneles sin cabeza, cuello difuminado o rostros borrosos | Se usa el cuerpo de unos paneles con la cabeza o el yelmo de otros, y se excluye la zona difuminada (`Do not use the blurred areas`). Se declara que todos los paneles son un único diseño |
| Q6 I | Primer fotograma y hoja de personaje que difieren en un detalle visible (cruz visible en la espalda frente a capa lisa en la vista trasera) | El modelo copia la hoja y pierde el detalle del primer fotograma. Se declara la jerarquía: el primer fotograma manda en el estado inicial y la hoja en todo detalle que el primero no muestra |
| Q7 I | Cambio de ratio respecto a la referencia o al prompt original (16:9 a 9:16) resuelto cambiando una palabra (`landscape` por `portrait`) | La ventana vertical recorta los lados. Se reescribe qué queda a la izquierda y a la derecha, la orientación del aparato y el encuadre de partida, y se avisa en una línea |

**Cámara, geometría y mirada**

| ID | Qué se busca | Por qué falla y cómo se arregla |
|---|---|---|
| Q8 B | Texto que contradice el presupuesto de lente o el aparato: `autofocus hunts`, `brief focus hunt`, `exposure responds`, `auto-exposure`, `flare`, `soft blurred sliver`, `bokeh`, `shallow depth` en un móvil | Quedan 0 eventos de lente declarados y el texto pide uno. Se sustituye por `focus stays locked`, `exposure stays constant` y un descriptor sin desenfoque (`a sliver of orange tent fabric`) |
| Q9 B | Cámara que va dentro de un vehículo o que se desplaza con el sujeto sin comprobar la **cobertura**: ángulo máximo que deja ver el parabrisas, pilares y marcos que tapan, velocidad relativa por segundos, qué entra por delante (puente, túnel, sombra) | Prometer `lo adelanta y siempre en cuadro` con un pilar a la izquierda es imposible. Se calcula con números: distancia inicial y final, separación lateral, velocidad relativa por segundos. Si adelantar saca al sujeto del encuadre, se cierra el clip antes de ese punto y se ofrece un segundo clip con cámara lateral. Un puente o un túnel que se alcance cambia la luz: o no se alcanza (se escribe), o se declara |
| Q10 I | Distancias o escalas que no cuadran con las acciones: `4 m` frente a `dos zancadas`; lanzar desde 1,5 m a un blanco a 3 m | El modelo cumple una cifra y rompe la otra. Una cifra por distancia, escrita una vez, comprobada con zancadas de 1,3 a 1,5 m y con la tabla de tiempos |
| Q11 I | Lados sin sistema: `left` y `right` sin decir de quién; `his left` con dos personajes iguales; `the Vespa's left side` | Escena invertida. Se escribe `frame-left` y `frame-right` (desde la cámara), y el lado de un personaje con su rol (`Front Knight's left hand`) |
| Q12 B | `Faces the camera`, `toward the camera` o `looks at` sin destino para personas de la escena | Equivale a mirar a la lente. Se escribe a qué mira cada uno (la mesa, las cartas, el camino) y que el rostro o el yelmo apunta ahí |

**Ritmo, personajes y contenido**

| ID | Qué se busca | Por qué falla y cómo se arregla |
|---|---|---|
| Q13 I | Acciones en serie que pueden ser simultáneas; pausa de silencio o beat vacío dentro de un stage; tres señalamientos o gestos iguales en menos de 3 s | Ocupación por encima de 1,0 (RÁPIDO). Se funden las acciones simultáneas, se quitan los beats vacíos y se deja un gesto por beat |
| Q14 M | Tiempos internos (`at about 7.50`) fuera del rango del stage, o que no caben en su ocupación | Se comprueban contra el rango y contra la tabla de tiempos. Se corrigen sin preguntar |
| Q15 I | Personajes con el mismo vestuario (dos caballeros, gemelos, uniformes) | Se funden, se intercambian o aparece un tercero. Posiciones o asientos fijos, rol por nombre en cada frase (sin pronombres sueltos), nunca contiguos si el concepto lo permite, contacto limitado a lo pedido (`only the hands touch`), `never fused, never swap`, recuento exacto |
| Q16 I | Elementos, sonidos o reacciones que la entrada no trae (policía, sirena, celebración previa, ovación), o sonidos imposibles por la distancia o por lo que hay en medio (un tintineo a 10 m a través de un parabrisas) | Se filtra cada elemento contra la entrada y se quita lo inventado. El sonido a 20 m es sordo y tenue; a través de un cristal, amortiguado o fuera |
| Q17 I | Objetos pequeños con texto o símbolos (cartas, folletos, pantallas, matrículas, carteles) sin regla de legibilidad, sitio ni cantidad | Se vuelven legibles al azar o se multiplican. Se declara `tiny, unreadable` o `text stays as in @ImageN`, con su sitio y su cantidad |

**Formato y deslices típicos del agente**

| ID | Qué se busca | Por qué falla y cómo se arregla |
|---|---|---|
| Q18 M | Mapa de referencias o primer fotograma escritos antes del primer encabezado; stages sin `\| 0.00-X.X0s`; sin `Initial state`, `Primary event` o `End state`; efectos fuera de `< >` o agrupados; nombres de personaje dentro de `< >`; sin presupuesto de lente | Formato no válido. Se reconstruye en la plantilla sin preguntar. Todo va dentro de los encabezados; solo la frase de cierre queda fuera |
| Q19 I | La palabra `cut` en cualquier sentido: `no cut`, `no cuts`, `cuts in`, `cut to` | El modelo la lee como un corte. Se sustituye (`moves into the gap`, `Same continuous take.`) |

Los deslices Q8, Q12, Q16, Q18 y Q19 son los que más trae un borrador del Video Prompter: se buscan primero cuando la entrada es un borrador de agente.

## Decisiones de dirección

Además de los hallazgos, la skill propone estas decisiones (se numeran en la misma serie que los hallazgos, con etiqueta `DIRECCIÓN`). Cada una lleva una propuesta recomendada y una alternativa. **No se pregunta lo que la entrada ya responde.**

| ID | Decisión | Cuándo aplica | Propuesta por defecto |
|---|---|---|---|
| D1 B | Dispositivo, look y ratio | Solo si la entrada no declara aparato. Si lo declara (camcorder, móvil, selfie), se conserva sin preguntar y solo se avisa en una línea de que existe la alternativa móvil | Sin aparato declarado: **smartphone en mano** (ADN de cámara). Ratio: el que pida el usuario; si no hay dato, 9:16. Cada aparato lleva sus reglas de POV |
| D2 B | Duración y reparto | Siempre | La que salga de la ocupación. Si el usuario ha dado una duración y no cabe: opción A, alargar (cambia el coste en AILAB) y opción B, recortar acciones sin alargar |
| D3 I | Alcance del cambio | Cuando la entrada es un prompt | **Fiel**: conserva contenido, cámara y movimiento, y solo añade arquitectura, detalle y apuntes técnicos. Alternativa: **Ajustado**, que además corrige los hallazgos (contradicciones, ritmo) |
| D4 I | Cierre del clip | Siempre | Final abierto en medio de la situación, sin la palabra "cut" en ningún sitio: ni como salida de la toma, ni en negativas (`no cut`, `no cuts`), ni en verbos (`cuts in`, `cut to`). La mitigación del zoom o del whip pan es `Same continuous take.` |
| D5 I | Sonido | Siempre | Solo diegético del aparato, sin música ni narración |
| D6 I | Diálogo | Si lo hay o lo pide | Español de España declarado, corto y real; si no hay: sin diálogo y bocas sin articular |
| D7 M | Fecha y REC en una esquina | Solo con camcorder | No hay overlay |
| D10 I | Encuadre, lente y movimiento por stage | Siempre | Elegidos del lenguaje de cámara de la guía de cámara y POV según el contenido: encuadre final con WS, MS o MCU, sensación de lente (35 mm por defecto en móvil) y un movimiento principal por stage (handheld, tracking, whip pan, push-in, pull-back, rack focus) |
| D8 I | Referencias: roles y jerarquía | Si hay adjuntos | Mapa propuesto por la skill, tras leer cada imagen |
| D9 M | Fallos conocidos a reforzar | Si el usuario cuenta fallos de otras generaciones | Reforzar hasta 3 menciones solo esos fallos |
| D12 I | Posición del testigo | Siempre | Lejos, a nivel del suelo o a distancia media, con zoom óptico (camcorder) o digital lento (móvil). El operador no se desplaza hacia la escena. Si la entrada pide cerca al inicio: se avisa una vez y se hace |
| D13 I | Luz | Siempre | Natural de la fuente real del lugar y de la hora, sin relleno. La luz no cambia; solo la exposición. Con camcorder, LED de cámara solo si la escena lo justifica |

## Procedimiento

Tres fases. La conversación manda: la skill reconoce en qué fase está por lo que dice el usuario.

| Fase | Se activa cuando el usuario... | Qué hace la skill |
|---|---|---|
| 1. Análisis | Pasa una idea, un prompt, un vídeo o referencias ("hazme un espontáneo-viral de esto", "valóralo", "cómo lo ves") | Estudia, audita y entrega el informe con una propuesta por punto |
| 2. Valoración | Responde ("1 vale", "el 3 con la alternativa", "decide tú", texto libre) | Anota cada decisión, re-audita y enseña qué queda pendiente |
| 3. Generación | Acepta ("vale a todo", "adelante", "genera", "lánzalo", "dame el prompt") | Escribe el prompt con todas las referencias, lo re-audita en silencio y lo entrega |

Reglas del flujo:

- **No se escribe el prompt antes de que el usuario acepte y responda.** Excepción: si la señal llega en la misma frase que la entrada ("hazlo y dámelo", "decide tú y lánzalo"), se entrega informe y prompt en el mismo mensaje con todas las propuestas aplicadas y listadas en `Supuestos`.
- **Sin problemas que valorar:** si no hay bloqueantes ni importantes y las decisiones de dirección se deducen, se dice en una línea y se entrega el prompt con los menores aplicados.
- **"Decide tú"** sobre un punto: aplica la propuesta de ese punto. Sobre todo: aplica todas las pendientes.
- **Aceptar con puntos abiertos:** se aplica la propuesta recomendada de cada uno y se listan en `Supuestos`. Si queda un bloqueante abierto, se avisa en la primera línea.
- **Fallo tras generar:** si el usuario vuelve con un vídeo que ha fallado, se vuelve a la Fase 1 centrada en el síntoma (ver Iteración).

### Paso 0. Triaje (antes de leer ninguna guía)

Se hace antes de abrir ningún archivo y no necesita contexto externo. El mismo texto está en el `SKILL.md`; si se cambia uno, se cambia el otro.

1. **Entrada vacía** (solo el nombre de la skill o un saludo): no se lee nada más. Se responde y se espera:
   `Dame una de estas cosas: una idea escrita, un prompt que quieras refinar, un vídeo o enlace de referencia, o imágenes y audio. Ejemplo: "un gladiador pide un café en una cafetería de barrio, 6 s". Si quieres el prompt directo, añade "dámelo".`
2. **Fuera de alcance:** una sola línea que nombre la skill que encaja, y se para sin leer nada más.

   | Si piden | Skill |
   |---|---|
   | Auditar un prompt de Seedance 2.5 ya estructurado, sin pedir este estilo | `refinar-prompt` |
   | Estética CCD de compacta | `estilo-amateur-ccd` |
   | UGC de móvil | `estilo-ugc` |
   | Edición, extensión, storyboard, montaje o transiciones | `seedance-25-ailendra-labs` |
   | Campaña, moda o lujo cinematográfico | una skill de dirección cinematográfica de campañas |
   | Otro modelo de vídeo | el Video Prompter de AILAB |
   | Guion hablado | una skill de guion |
   | Hooks o ángulos de contenido | una skill de ideación de contenido |
   | Enviar a AILAB | `ailab` |
   | Texto que no es un encargo de vídeo (captions, estrategia) | Se dice en una línea que no es de esta skill |

   Un encargo de Seedance 2.5 espontáneo que pida dron, música o cámara lenta no es esto: se resuelve con el caso edge "El encargo choca con el estilo".
3. **Idea corta** (entrada A: una o dos frases, sin referencias ni diálogo): lectura reducida (esta maestra y la Guía de Seedance 2.5) e informe corto con este formato, sin las tablas de rasgos y de ritmo (salvo que el reloj no cuadre):

   ```text
   Análisis espontáneo-viral (corto)
   Entrada: idea · Dispositivo: <propuesto> · Duración: <N> s · Ratio: <ratio>
   Encaje con el estilo: <una línea>.
   Lo que falla (hasta 3): [ETIQUETA · ID · gravedad] "<cita>". Esto no es espontáneo-viral: <mecanismo>. Propuesta: <...>.
   Decisiones: <D1 y D2 solo si la idea no las responde>.
   Dime qué hacemos con cada punto o "decide tú". Cuando lo aceptes, te doy el prompt.
   ```
4. **Todo lo demás:** flujo completo (Fase 1 a 3).

### Fase 1. Análisis

**Paso 1. Intake.** Clasificar la entrada (A, B, C, D o mezcla) y preparar, en silencio, lo que cada tipo necesita antes de auditar:

| Entrada | Qué se prepara |
|---|---|
| A. Idea | **Ficha del encargo**: quién graba, dónde está, a qué distancia y altura, con qué aparato y qué sabe; ratio y duración; mundo, quiebre de la rutina, escalada en estados y final; qué aporta cada referencia y qué se ignora. **Prueba de física**: distancias con zancadas de 1,3 a 1,5 m y la tabla de tiempos; cobertura de la cámara (ángulo visible, obstáculos, si se mueve con un vehículo, Q9); lados desde la cámara (Q11); recuento de personas; qué sonidos llegan de verdad al micro a esa distancia (Q16). Si la prueba no cuadra, se dice en el informe antes de escribir nada. No se añade ningún elemento que la idea no traiga |
| B. Prompt | Leer entero y medir `wc -c`. Si es el borrador del Video Prompter o de otro agente (lo habitual), pasar primero **los deslices del agente**: Q8 (foco, exposición, desenfoque), Q12 (mirada a cámara), Q16 (elementos y sonidos inventados), Q18 (formato) y Q19 ("cut"). Comparar el borrador con la idea original del usuario: lo que el borrador añadió y la idea no pidió se marca |
| C. Vídeo | **Ficha del vídeo**: beats con tiempos, tamaño de plano y distancia al sujeto, comportamiento del aparato (balanceo, zoom, correcciones, pérdidas del sujeto), aspecto, sonido con su distancia, texto en pantalla. Lo que no se vea o no se mida es "no consta". Se decide con el usuario qué hereda (ver "Análisis de un vídeo de referencia") |
| D. Referencias | `Read` de cada imagen; medir audio y vídeo si los hay. Anotar el orden y el tipo de cada adjunto para los handles. Por cada imagen, comprobar si su **estado** (pose, vacío, texto, lo que falta) encaja con el arco del texto (Q1) y si el **modo del modelo** admite el conjunto (Q2) |

Se anotan también los fallos de generaciones anteriores que cuente el usuario.

**Paso 2. Estudio del estilo.** Contrastar la entrada con los diez rasgos. Es un cuadro interno que alimenta el informe:

| # | Rasgo | Qué hay en la entrada | Veredicto (cumple, falta, choca) |
|---|---|---|---|

Para una idea (A) la columna central es "qué pide el encargo".

**Paso 3. Inventario y auditoría.**

1. Inventario: duración, ratio, dispositivo, quién graba y dónde; personas (principales, secundarias, fondo) con su recuento; props; mapa espacial desde la cámara (qué hay a cada lado y a qué distancia); acciones por stage; cámara (tipo, posición, comportamientos, foco); estética declarada; audio.
2. Cotejo de referencias (tabla de la disciplina de referencias).
3. Detector de lenguaje ambiguo, con todos los absolutos ("only", "never", "always", "exactly").
4. Nueve ejes de `refinar-prompt`, eje 10 (V) y eje 11 (Q), sin saltarse ninguno.
5. Pasada de continuidad y ocupación por stage, con total (heurística de la tabla de tiempos; la cámara reactiva se estima y se declara).
6. Segunda pasada de sospecha en los ejes que salgan limpios.
7. Con una **idea** (A) no hay hallazgos de prompt: se hace una pre-auditoría del encargo (rasgos que faltan, cabe o no cabe en el reloj, posibles choques con el estilo) y salen decisiones de dirección.
8. Antes de anotar una pregunta, se comprueba si las referencias, el audio o el vídeo ya la responden.

**Paso 4. Informe.** Formato fijo:

```text
Análisis espontáneo-viral
Entrada: <idea | prompt | vídeo | referencias | mixto> · Dispositivo: <propuesto o declarado> · Duración: <N> s · Ratio: <ratio> · Longitud: <N> caracteres (si hay prompt)
Encaje con el estilo: <una línea: cuántos de los 10 rasgos cumple y cuáles faltan>.

Rasgos del estilo
| # | Rasgo | Qué hay en la entrada | Veredicto |

Bloqueantes
1. [ESTILO · V1 · B] "<cita corta>". Esto no es espontáneo-viral: <mecanismo>.
   Propuesta: <solución recomendada>. Alternativa: <otra, si la hay>.
2. [CONTRADICCIÓN · C8 · I] "<cita A>" frente a "<cita B>". Esto es una contradicción: <por qué no pueden ser las dos>.
   Propuesta: ...

Importantes
3. [RÁPIDO · T1 · B] Stage 3 (0,9 s). Esto lo comprimes en muy poco tiempo: <acciones> necesitan unos <N> s (estimación). Te va a salir demasiado rápido o se saltará <acción>.
   Propuesta: ...

Decisiones de dirección
7. [DIRECCIÓN · D1 · B] Dispositivo y look: Propuesta (Recommended): <...>. Alternativa: <...>.

Ritmo por stage
| Stage | Acciones | Necesita | Tiene | Ocupación | Veredicto |
| Total | | <N> s | <N> s | | |

Sobra: <lista corta>.
Menores que resuelvo yo: <lista en una línea>.
Sin hallazgos en: <ejes>.
Lo que funciona y se conserva: <una línea>.

Dime qué hacemos con cada punto (por número) o "decide tú". Cuando lo aceptes, te doy el prompt.
```

Reglas del informe:

- Numeración continua, la misma durante toda la conversación.
- Primero lo que falla, sin halagos al empezar. Lo que funciona va al final, en una línea.
- Cada hallazgo con etiqueta, ID, gravedad, cita (o "no aparece"), mecanismo de fallo y propuesta. Sin mecanismo no hay hallazgo. Las citas llevan menos de 15 palabras.
- Se distingue ERROR (seguro) de PROBABLE. No se inventan problemas: un eje limpio se declara en `Sin hallazgos en`.
- Orden: errores seguros y contradicciones, luego faltas y ritmo, luego detalles. Más de 12 hallazgos: se agrupan por eje (cámara, actuación y geometría primero).
- Un prompt muy bueno recibe un informe corto.
- Las propuestas respetan la historia, el contenido, la cámara y el movimiento de la entrada. Si la mejor solución cambia la duración, se ofrece también una que no la cambie.
- Castellano de España, tuteo y directo, sin em dashes.

### Fase 2. Valoración

1. **Bloqueantes con `AskUserQuestion`** (hasta 4 por llamada) justo después del informe. Cada pregunta cita el fragmento, explica el fallo en una frase y ofrece la propuesta primero con "(Recommended)" y las alternativas. En cámara se ofrecen movimientos con velocidad y aterrizaje; en actuación, conductas, no etiquetas; en ritmo, segundos concretos.
2. **Importantes y detalles por número**, en texto libre ("2 vale", "el 5 con la alternativa", "el 7 déjalo").
3. **Registro de decisiones** tras cada respuesta: `Decidido: 1 (propuesta), 2 (alternativa) · Pendiente: 3, 5`.
4. **Re-auditoría tras cada respuesta.** Si una decisión abre un problema nuevo (por ejemplo, pasar a 9:16 con un camcorder 4:3), se añade como hallazgo con el siguiente número.
5. **El usuario manda.** Si descarta un hallazgo, se respeta. Si es un fallo conocido, se dice una vez y se refuerza el bloqueo en el prompt.
6. No se reescribe el prompt en esta fase. Como mucho se enseña la frase concreta de una decisión.

### Fase 3. Generación

Con la señal de aceptar:

1. **Elegir la familia** de la guía (simple, multi-referencia o vídeo largo por etapas; con primer fotograma si lo hay) y la plantilla.
2. **Aplicar solo lo decidido**: las decisiones del usuario, las propuestas de los puntos pendientes (a `Supuestos`), los menores y las correcciones de formato. Lo que no ha salido como hallazgo no se toca.
3. **Reglas de escritura:**
   - **Contenido de la entrada**: se conserva el contenido, la cámara y el movimiento. Se reescribe la forma, no la historia. Un prompt de referencia se convierte en la arquitectura de Seedance 2.5 sin los bloques `====`, sin las escenas repetidas, sin "CUT" y sin listas de negativas.
   - **Referencias**: mapa de una línea por material, jerarquía, exclusiones, instancia única, selección por stage.
   - **Cámara**: las reglas de POV del dispositivo en `[Camera]` (la cámara ES el aparato y nunca se ve, aspecto real, audio de micro), la línea de testigo, dueño, posición, y por stage encuadre más sensación de lente más un movimiento principal con sus seis piezas; encuadre final con WS, MS o MCU; posición final de un stage = inicial del siguiente; línea de lo que no se usa nunca.
   - **Enfoque**: qué está nítido por stage y cómo se mueve el foco, con causa.
   - **Personas**: estado inicial, política de mirada, manos, conducta práctica en 2 a 4 señales, secundarios con papel y recuento exacto.
   - **Mundo**: espacio descrito una vez, desde la cámara, con distancias y obstáculos; vida de fondo con tareas.
   - **Elemento inesperado**: perímetro declarado y tratado como normal.
   - **Props**: dueño, mano, cantidad, ciclo de vida con flechas, reparto final.
   - **Sonido**: efectos inline junto a su causa, ambiente, carácter del micro y distancia; sin música ni narración salvo petición.
   - **Final y bloqueos**: estado final exacto; el estado deseado primero y el "no X" después, en el stage donde surge el riesgo; las reglas duras una sola vez en `[Maintain Consistency]`; repetición reforzada (hasta 3 menciones) solo para fallos conocidos; como mucho dos marcas `★ ... ★`.
   - **Economía**: lo marcado como SOBRA, fuera. Cada regla, una vez y en su sitio.
   - **Redacción** (sale de los errores Q):
     - Cada frase nombra al sujeto por su rol (`Front Knight`, `Rear Knight`). Sin pronombres sueltos cuando hay personajes con el mismo vestuario.
     - Lo deseado primero y el "no X" después, solo donde surge el riesgo.
     - Una cifra por magnitud (distancia, velocidad, tiempo), escrita una vez y comprobada con zancadas y con la tabla de tiempos.
     - Los lados, desde la cámara (`frame-left`, `frame-right`); la mano o el lado de un personaje, con su rol.
     - Todo dentro de los encabezados: el primer fotograma y el mapa de referencias van en `[Reference Mapping]`. Solo la frase de cierre queda fuera.
     - Los tiempos internos (`at about 7.50`) caen dentro del rango de su stage.
     - Cada sonido es plausible a su distancia y a través de lo que haya entre la fuente y el micro (cristal, pared).
     - Ninguna palabra `cut` en ningún sentido. La mitigación es `Same continuous take.`
     - Con referencias en conflicto, la jerarquía se dice una vez: quién manda en qué.
     - Un cambio de ratio respecto a la referencia se reescribe entero (Q7), no se cambia una palabra.
4. **Re-auditoría silenciosa** del prompt nuevo (nueve ejes, ejes 10 y 11, continuidad, ocupación entre 0,5 y 1,0 o justificada) y comparación con la entrada (historia, orden, contenido, cámara, movimiento, diálogo literal e identidades intactos salvo lo decidido). Si algo falla, se corrige antes de entregar.
5. **Lectura adversaria final.** Se lee el prompt frase a frase como si el modelo solo tuviera esa frase, y se pregunta qué haría con ella. Tres pasadas: estilo y lente (eje 10, Q8, Q19); geometría y reloj (Q9 a Q14); referencias y personajes (Q1 a Q7, Q12, Q15, Q17). Un fallo en cualquiera se corrige antes de entregar.
6. **Entrega** (ver "Output esperado").

### Análisis de un vídeo de referencia (entrada C)

1. `ffprobe` para duración, ratio y fps. Escena: número de cortes (`select='gt(scene,0.1)'`) y mosaico de fotogramas con `Read`.
2. Análisis narrativo con `vervideo` (modo completo, foco en cámara, estética y sonido) o `watch:watch`.
3. Extraer, con tiempos aproximados: qué ocurre y en qué orden (beats), tamaños de plano, comportamiento de la cámara (balanceo, zoom, paneos, correcciones, pérdidas del sujeto), aspecto del aparato (ratio, grano, color, compresión), sonido (qué se oye y a qué distancia), y cualquier texto o interfaz en pantalla.
4. Valorar el encaje con los diez rasgos. Si la cámara es profesional (dolly, grúa, estabilizada), se dice y se pregunta si solo se quiere tomar el contenido.
5. Decidir con el usuario el **rol** del vídeo en Seedance 2.5: referencia de movimiento (`@VideoN` aporta solo cámara, ritmo y secuencia, y no hereda identidad, ropa ni escena) o inspiración para recrear en texto. No se repite en texto la coreografía que el vídeo ya define. Límites de la guía: hasta 10 vídeos con 30 s en total, 5 a 10 s por vídeo de sujeto.
6. Lo que no se pueda ver o medir se declara como "no consta".

## Plantilla de salida

Se omiten los bloques que no aplican. Los textos entre corchetes son los datos de la entrada o de las decisiones.

```text
[Generation Goal]
Create a [N]-second [type of scene] captured as [device] footage by [who holds it], in ONE continuous take. [One-sentence story.] [@ImageN is the exact first frame.] Every visible action, camera reaction and focus change happens in real time.

[Reference Mapping]
One line per reference: @ImageN defines only [...]. Do not use [...]. Ignore [backgrounds, grids, panels]. @VideoN defines only [...].

[Characters]
[Name] corresponds to @ImageN. Use only [...]. Do not use [...]. [Active hand; free hand.] Looks at [target], never at the lens.
Do not interchange their appearances, clothing, actions, positions or dialogue. Exactly [N] visible people in the main action: [...]. Background: [group, task].

[Props]
[Prop] corresponds to @ImageN and belongs only to [Name]. Exactly one. [Mechanics if relevant.]

[Scene]
[Location] references @ImageN. Layout from the camera's point of view: [left, right, near, far; route distances; obstacles]. The only unexpected element is [perimeter]; everything else belongs to the world. Nobody reacts to it. [Begin directly from this exact visual state. / Do not use @ImageN as a first frame.]

[Lighting]
[Natural light from the real source, fixed direction and time of day. The light never changes; only the exposure does.]

[Audio Reference]
[Only with exact audio or a sound reference.]

[Visual Style]
[Device look as described. Nothing added.]

[Camera]
POV: the camera IS the [device]. The device is never visible in frame. Spontaneous footage by a bystander who is there and watches it happen[, from where they stand / from far away]. Physically exact, serious in tone, fully believable. [Device look rules from the ADN: depth of field, flare, grain, autofocus.] [Walking subject: continuous.] All audio sounds like it was captured by the device's microphone: natural, slightly muffled, no studio polish.
Owner and device: [who, where, how far, height]. The operator does not know what will happen. Focus baseline: [...]. Not used anywhere: tripod or locked framing, robotic gimbal, rail or vehicle dolly, crane, drone, orbit around the subject, slow motion.

Lens budget for the whole clip, exactly: [N] autofocus, [N] exposure adaptation(s), [N] flare(s). Nothing else.

[Stage 1 | 0.00-X.X0s]
Initial state: [everyone and everything at 0.00, including the camera's framing.]
Primary event: [one main event.]
Performance: [2 to 4 cues; gaze; hands.]
Background: [each group and task.]
Camera: [FRAMING], [lens feel], handheld; [one main movement with its six pieces]; lands on [FRAMING].
In-lens: [what is sharp; focus behaviour of the device.]
Sound: [<effect> next to its visible cause; ambience at the device mic's distance.]
End state: [observable state, including camera framing.]

[Stage 2 | X.X0-Y.Y0s]
Continue from the previous stage: [...]
...

[Maintain Consistency]
[Rules once: counts, identities, props, device never visible, no music or narration, the footage ends abruptly with no resolution.]

[Audio]
[Only if no @Audio is attached.]

[Closing intent sentence: what the clip must feel like, in plain terms.]
```

Fuera del bloque: `📐 Aspect ratio: [ratio] | ⏱ Duration: [N]s`.

## Output esperado

**Fase 1:** el informe del Paso 4 y, a continuación, las preguntas de los bloqueantes y de D1 y D2.

**Fase 2:** respuesta corta a lo que diga el usuario, hallazgos nuevos si los hay y la línea `Decidido · Pendiente`. Sin prompt.

**Fase 3:**

1. Si quedan bloqueantes sin decidir, una línea antes del prompt: cuáles y qué se ha aplicado.
2. Un único bloque de código con el prompt.
3. Fuera del bloque: `📐 Aspect ratio: ... | ⏱ Duration: ...s`.
4. `Cambios:` como mucho 8 viñetas cortas en castellano, cada una con el número del punto que resuelve.
5. `Supuestos:` solo si hay puntos que el usuario no decidió, con la propuesta aplicada.

Sin traducción del prompt, sin QA visible y sin em dashes. La skill no envía nada a AILAB.

## Casos edge

- **Idea muy escueta:** se aplica "traducir, no reescribir". No se inventa la historia: se propone la estructura mínima (mundo, quiebre de la rutina si la idea no lo trae, escalada) y el usuario decide. Nunca se añade un elemento surreal que la idea no traiga.
- **El encargo choca con el estilo** (cámara lenta épica, dron, plano cinematográfico, música): se dice en una línea y se ofrecen dos salidas: versión espontánea (se retira lo profesional) o usar el Video Prompter con la guía de Seedance 2.5 fuera de esta skill.
- **Prompt de referencia (prosa, mayúsculas, `====`, negativas largas):** D3 por defecto "Fiel". Se conserva todo lo que se ve; se quita la repetición y se reconstruye en la arquitectura. Las negativas pasan a ser restricciones dentro del stage donde surge el riesgo.
- **Prompt ya estructurado de Seedance 2.5:** se audita con los nueve ejes más el eje 10, se respeta su estructura y no se le añade nada que no sea un hallazgo.
- **Vídeo de referencia con cámara profesional:** se pregunta si solo se aprovecha el contenido.
- **Entrada con camcorder (prompts de referencia):** se conservan el contenido, el movimiento y el aparato. D1 solo avisa en una línea de la alternativa móvil; con el camcorder valen su aspecto, su zoom óptico y su autofocus que busca, y las reglas de POV (nunca visible, audio de micro) se aplican igualmente.
- **Entrada con cámara fija, trípode o "locked-off":** choca con el rasgo 3 y con el ADN (V13). Se propone cámara en mano con posición fija del operador; si el concepto exige un trípode o un plano bloqueado, se avisa de que deja de ser espontáneo-viral.
- **Vídeo de referencia más texto:** el texto no repite lo que el vídeo ya define (guía de Seedance 2.5).
- **Imagen con texto, etiquetas o cuadrículas:** hallazgo R5 y exclusión explícita.
- **Audio exacto sin archivo ni transcripción:** se pide antes de auditar el eje 8.
- **Diálogo en la entrada:** reglas de diálogo, partitura inline y `{ }`. Con audio exacto, las llaves asignan hablante y tiempo, no crean una interpretación nueva.
- **Ratio que choca con el aparato o con el primer fotograma:** manda el primer fotograma; se avisa de la incoherencia con el aparato.
- **Duración que no cabe:** alargar (cambia el coste en AILAB) o recortar acciones sin alargar. Se ofrecen las dos.
- **Cámara lenta pedida expresamente:** no es LENTO y no es V1, pero se avisa de que choca con el rasgo 3 y se pregunta.
- **Un solo personaje o sin personas:** se sustituye la dirección de secundarios por la de fondo y objetos en movimiento.
- **Fallo reportado tras generar:** Fase 1 centrada en el síntoma, matriz de diagnóstico de la guía, cambio mínimo.
- **Lanzar significa enviarlo a AILAB:** esta skill solo entrega el texto. El envío va por `ailab`.
- **Pedido fuera del estilo** (cámara cercana al inicio, cámara lenta, reacción colectiva): se avisa en una línea, una sola vez, y se hace si el usuario lo pide explícitamente. Las reglas de estilo generan aviso, no error; las de formato de Seedance 2.5 siguen siendo error.
- **Referencia cuyo estado contradice el arco** (atril vacío, público ya animado, mesa distinta, falta el elemento que se rompe): Q1. Se usa solo lo que sirve, se excluye el estado, lo que falta se declara como único añadido y se recomienda editar la referencia antes si es protagonista.
- **Hoja de personaje con cuello difuminado o rostros borrosos:** Q5. Cuerpo de unos paneles más cabeza o yelmo de otros, y la zona borrosa excluida.
- **Primer fotograma más otras referencias:** se comprueba el modo del modelo (Q2) con `ailab info <modelo>`. Si `i2v` y `ref` no se combinan, se entregan la versión principal y la variante, y se dice.
- **Cámara dentro de un vehículo:** Q9. Se calcula la cobertura con números. Lo que no se puede filmar con ese aparato (adelantar a un vehículo sin sacarlo del parabrisas, por ejemplo) se dice en una línea, se entrega lo que sí cabe y se nombra la alternativa. No se promete lo imposible.
- **Personajes con el mismo vestuario:** Q15. Posiciones fijas, rol por nombre en cada frase y contacto limitado a lo pedido.
- **Cambio de ratio respecto a la referencia o al original:** Q7. Se reescribe el layout y se avisa.
- **Borrador de un agente que añadió cosas que la idea no pidió:** se comparan con la idea original (Q16) y se quitan o se preguntan, según lo que cambien.
- **Caso no contemplado:** se dice en una línea y se propone cómo resolverlo. No se improvisan reglas nuevas.

## Verificación

**Antes del informe**
- ¿Se han leído enteras las guías aplicables y abierto cada referencia?
- ¿Cotejo de referencias (con el estado de cada imagen frente al arco, Q1), detector de ambigüedad, nueve ejes, ejes 10 y 11 y segunda pasada en los ejes limpios?
- ¿Modo del modelo comprobado si hay primer fotograma más otras referencias (Q2)?
- Con un borrador de agente: ¿pasados primero Q8, Q12, Q16, Q18 y Q19, y comparado con la idea original?
- ¿Pasada de continuidad y ocupación por stage con total, con la cámara reactiva declarada como estimación?
- ¿Cada punto con número, etiqueta, ID, cita, mecanismo y propuesta, y ninguno inventado?
- ¿Decisiones de dirección solo para lo que la entrada no responde?

**Antes de entregar el prompt**
- ¿Solo se ha cambiado lo decidido, lo pendiente con su propuesta, lo menor y el formato?
- ¿Formato Seedance 2.5 válido: familia única, stages con estado inicial y final, rejilla `.00/.50`, delimitadores, handles compactos, parámetros fuera del bloque?
- ¿Contenido, cámara y movimiento de la entrada conservados?
- ¿Reglas de POV del dispositivo en `[Camera]` (la cámara ES el aparato, nunca visible, aspecto real, audio de micro), la línea de testigo y las reglas del aparato elegido (profundidad de campo y autofocus en móvil, sin ojo de pez en gafas)?
- ¿Cada stage con encuadre, sensación de lente y un movimiento principal con sus seis piezas, y un encuadre final con WS, MS o MCU?
- ¿Dueño de la cámara y dispositivo declarados, sin trípode ni movimientos mecánicos o profesionales?
- ¿Cámara siempre en mano, con movimiento orgánico (llega tarde, no encuadra perfecto, vibración leve), y el presupuesto de eventos de lente declarado?
- ¿Perímetro del elemento inesperado declarado y sin reacciones a él?
- ¿Cada referencia con rol, exclusión, jerarquía e instancia única, y seleccionadas por stage?
- ¿Cada persona con mirada, manos y conducta, y los secundarios con papel y recuento?
- ¿Ocupación entre 0,5 y 1,0 en todos los stages, o justificada?
- ¿Final abierto y ninguna palabra "cut" en ningún sentido (`no cut`, `cuts in`, `cut to`)?
- ¿Presupuesto de lente sin contradicciones en el texto (ni foco que busca, ni exposición que responde, ni desenfoque, ni destello)?
- ¿Cifras de distancia y tiempo coherentes con las acciones y con la tabla de tiempos, y lados escritos desde la cámara?
- ¿Cobertura de cámara comprobada (ángulo, obstáculos, velocidad relativa, luz que cambia por delante)?
- ¿Referencias sin contradicciones con el texto (estado, negativas, ratio, jerarquía entre primer fotograma y hoja)?
- ¿Personajes iguales distinguidos por posición y rol, sin pronombres sueltos, y nada en el prompt que la entrada no trajera (elementos y sonidos)?
- ¿Tiempos internos dentro de su stage y todo dentro de los encabezados?
- ¿Sonido diegético, efectos inline, sin música ni narración salvo petición?
- ¿Cada regla una vez, sin restos de iteraciones, sin em dashes y con cifras solo de la entrada, de la medición o de las decisiones?
- ¿`Cambios` con el número del punto que resuelve cada uno?

## Anexo A. Banco de pruebas

Prompts de regresión. Están en `pruebas/` (dos borradores reales del Video Prompter). Si se cambia el catálogo, la skill debe seguir detectando al menos esto y no marcar lo que no es un fallo.

| # | Prompt | Tipo | Debe detectar | No debe marcar |
|---|---|---|---|---|
| 1 | `caballeros-01-mitin-video-prompter.txt` (caballero en un mitin, 6 s, 16:9, con @Image1 del recinto y @Image2 hoja del caballero) | Borrador del Video Prompter, estructurado, con referencias | V13/V1 "locked-off" frente a la vibración final (hallazgo de cámara fija); Q1 atril vacío y público ya en pie frente a un orador que habla y un público que escucha; Q3 "exact camera composition" frente a la exclusión de la pose del público; Q4 "no other banners" frente a las banderas de la imagen; Q8 y presupuesto de lente ausente; T1 stage 2 en serie (inclinarse, barridos y silencio, ocupación hacia 1,4); Q13 el silencio de relleno; el público "on its feet" que exige pasar de sentados a de pie; frase legible en `{ }` cuando el usuario pidió ilegible; Q18 `Initial:` y `End:` en vez de `Initial state:` y `End state:`, sin `Performance` ni `Sound` por stage; Q19 "no cuts" | La exclusión del cuello difuminado de la hoja, el recuento de un solo caballero y el final abierto |
| 2 | `caballeros-04-vespa-video-prompter.txt` (dos caballeros en una Vespa por la M-30, 8 s, 9:16, con primer fotograma y hoja) | Borrador del Video Prompter, vídeo desde dentro de un coche | Q8 "Autofocus hunts briefly" y "Phone auto-exposure" frente a un presupuesto de lente de 0; Q19 "no cuts" y "no vehicle cuts"; Q18 mapa de referencias antes de `[Generation Goal]` y stages sin timestamps ni `Primary event`; Q9 "pasarla ligeramente" con un pilar A a la izquierda y la Vespa a la izquierda (no se puede filmar por el parabrisas), y el paso elevado que se alcanzaría en 8 s; Q2 primer fotograma más hoja en Lite (`i2v` y `ref` no se combinan); Q6 cruz en la espalda frente a la capa de la hoja; Q16 tintineo de la cota de malla a 10 m a través del cristal; Q10 velocidad relativa y distancias (unos 15 m en 8 s) sin justificar; Q11 "the Vespa's left side" ambiguo; "the car eases toward its left lane line" que nadie pidió; Q15 dos caballeros iguales sin roles fijos en cada frase | El cierre abierto, la regla de que el pilar no tape a los caballeros, el uso de roles `Front Knight` y `Rear Knight` |
| 3 | Calle de Barcelona de noche, 8 s, 9:16 (borrador no conservado) | Borrador del Video Prompter con una referencia de escena sin el escaparate | Q1 la imagen no trae el escaparate que se rompe; Q10 4 m frente a "dos zancadas"; Q16 policía y sirena, y una celebración previa que la idea no traía; Q8 destello de la lámpara; Q19 "no cuts"; nombres dentro de `< >` | La escalada física con causa y efecto |
| 4 | Acampada de Sol, 10 s, 9:16 (borrador no conservado) | Borrador del Video Prompter con una referencia de entorno | Q8 "brief focus hunt" y "soft blurred sliver"; Q12 caballero B y civil 4 "facing the camera" sin destino de mirada; Q13 tres señalamientos más un barrido en 2,5 s; Q16 risas que "boom" a 20 m; Q1 mesa con folletos frente a cartas; Q18 stages sin `.00`; Q15 dos caballeros iguales sentados | El zoom inicial con sobrepaso y el final abierto con la caída |

## Mantenimiento

- **Decisiones que el usuario puede cambiar** (valores por defecto actuales): restricciones dentro del stage y un bloque corto de consistencia (no listas largas de negativas); sin overlay de fecha y REC; diálogo en español de España declarado; duración por ocupación y no por la del input; aparato por defecto: móvil en mano 9:16; camcorder solo si la entrada lo pide; sin autofocus que busque con móvil (Guía de cámara y POV); trípode y órbita fuera del estilo aunque la guía de cámara y POV los tenga (rasgo 3).
- **El eje 10 y los diez rasgos son una formalización** de prompts de referencia y de la guía de cámara y POV. Cada vez que el usuario aporte un ejemplo nuevo de espontáneo-viral o confirme que un prompt generado con esta skill ha funcionado, proponer (con aprobación) añadirlo al banco de pruebas y revisar los rasgos.
- La tabla de comportamientos reactivos y las estimaciones de tiempo de la cámara reactiva son heurísticas. Si un vídeo real demuestra que un stage "correcto" sale lento o rápido, ajustar con el caso concreto.
- Un fallo visto en generación que aparezca en 2 o más prompts pasa a las reglas anti-fallo o a la repetición reforzada.
- Revisar esta skill si cambian la guía de Seedance 2.5, `refinar-prompt` (catálogo, tablas, contrato de formato), `references/ugc.md`, `references/cinelabs.md` o `references/actinglabs.md`.
- Los errores del eje 11 (Q) salen de las cuatro escenas de los caballeros (2026-10-27 y 28). Un error nuevo que aparezca en 2 o más prompts distintos se añade al eje 11 con su arreglo; uno que deje de aparecer en varias generaciones se revisa.
- Historial de cambios:
  - 1.0.0: primera versión pública para la comunidad de Ailendra Labs.
