# Formatos de contenido UGC

Cada formato fija por defecto el montaje, la cámara, el encuadre, la mirada, la luz, el sonido y los riesgos. La skill propone el formato más cercano a lo que pide el usuario y este cambia lo que no encaje. Un prompt pertenece a **un** formato (aunque se pueden combinar rasgos si el usuario lo pide).

Niveles de confianza: **[D]** regla dura, **[H]** heurística razonada, **[?]** hipótesis a validar. Lo que viene de la observación de un vídeo concreto se indica como "observado".

## Tabla resumen

| Formato | Montaje | Cámara | Vibración | Mirada | Zona libre para texto |
|---|---|---|---|---|---|
| 1. Selfie hablando en casa | A o B | Frontal | Natural ligera | A la lente con destellos | No |
| 2. Caminando y hablando | G | Frontal | Rebote de paso | A la lente y adelante | No |
| 3. Producto en manos | E o F | Trasera | Suave | Al producto y a la lente | No |
| 4. Móvil apoyado haciendo algo | C | Frontal o trasera | Casi nula | A lo que hace y a la lente | No |
| 5. En el coche | D | Frontal | Del coche | A la lente y a la carretera | No |
| 6. Alguien me graba | E | Trasera | Natural | Poco a la lente | No |
| 7. **Ponencia (desde el público)** | I | Trasera con zoom | Ligera | Al público | No |
| 8. **Trípode** | H | Frontal o trasera | **Ninguna** | A la lente | Opcional |
| 9. **Entrevista en la calle** | E con micrófono | Trasera | Natural | Al entrevistador | No |
| 10. Q&A | A, B o H | Frontal | Ligera o ninguna | **A la lente** | **Sí, arriba** |
| 11. **Podcast** | **J (cámara dedicada fija)** | **Cámara de estudio, no móvil** | **Ninguna** | **Al interlocutor, fuera de cuadro** | No |

---

## Formatos 1 a 6 (resumen)

**1. Selfie hablando en casa.** Montaje A o B, cámara frontal, vibración natural ligera, cara nítida, ventana lateral suave, voz cercana con algo de eco de sala, encuadre de pecho arriba.

**2. Caminando y hablando.** Montaje G, cámara frontal, rebote de paso y deriva, cara nítida con paralaje de fondo, luz exterior con sombras que pasan, viento sobre el micrófono.

**3. Producto en manos (unboxing o demostración).** Montaje E o F, cámara trasera, vibración suave, producto grande en cuadro, enfoque que reajusta al acercar, luz de ventana, sonidos de manipulación.

**4. Móvil apoyado haciendo algo** (maquillarse, cocinar, preparar). Montaje C, encuadre fijo imperfecto, ella entra y sale, enfoque y exposición que reaccionan, sonido del lugar. Si necesita espejo, ver `SKILL.md`.

**5. En el coche.** Montaje D, vibración del coche, sombras que pasan, voz con motor y carretera de fondo. Se pregunta si está parado o en marcha.

**6. Alguien me graba.** Montaje E, cámara trasera, ella apenas mira a la lente y la cámara reacciona tarde.

---

## 7. Ponencia (desde el público)

*Qué es:* un asistente graba con el móvil a quien habla en un escenario. Observado en un vídeo de referencia de 11 s en 9:16: plano medio de una ponente sentada en un sillón del escenario, con el micrófono de mano a la barbilla, filmada desde el patio de butacas, con **dos cabezas muy desenfocadas y oscuras en las esquinas inferiores**, un fondo azul claro muy luminoso y una ligera vibración sin zoom.

- **Montaje I (desde el público):** quien graba está sentado varias filas por detrás, con el móvil en las dos manos a la altura del pecho o de los ojos. La vista sube un poco hacia el escenario (contrapicado suave) [H].
- **Óptica:** se graba con zoom o teleobjetivo del móvil. Por eso el espacio queda comprimido, la ponente es el único plano nítido y las cabezas de delante se desenfocan **mucho más que en un selfie**. Es una excepción a la regla de profundidad amplia [H].
- **Cabezas y hombros delante:** dos o tres siluetas en las esquinas y el borde inferior, grandes, oscuras, sin rasgos y fuera de foco, con un tinte cálido en la piel y el borde del pelo. Se declara cuántas, dónde y que **no tienen móviles levantados** (podrían confundirse con la cámara) [D]. Ningún rostro nítido entre el público.
- **Vibración:** ligera y constante, de pulso, ampliada por el zoom, con pequeñas variaciones de encuadre. **Sin zoom en movimiento, sin reencuadres** [H]. No se sube la cámara a una pantalla ni al techo: lo que se quiere ver debe entrar en el encuadre o resolverse con un corte duro declarado [D]. Si la ponente hace un cambio grande de postura (levantarse), ver `gestos-y-guion.md`.
- **Enfoque:** fijo sobre la cara de la ponente. No respira, salvo que una cabeza se mueva delante [H].
- **Exposición:** medida para la cara y el traje, así que el fondo luminoso sale muy claro. La ropa clara no se quema [H].
- **Luz de escenario:** foco frontal sobre la cara y la ropa, panel retroiluminado detrás y luz de contorno en hombros y pelo; el público, en penumbra (ver `luz.md`).
- **Sonido:** la voz sale por la megafonía de la sala: limpia y cercana, con algo de reverberación de auditorio; sala en silencio atento, sin aplausos ni murmullos si no se piden; ruido de sala muy bajo [H].
- **Actuación de la ponente:** presencia de escenario. Se dirige al público, no a la lente. Gestos abiertos con una mano, mientras la otra sujeta el micrófono. Pausas con respiración y una sonrisa cuando toca [H].
- **Zona libre:** no.
- **Orador de pie con mando o micrófono en las manos:** la mano con el mando gesticula con antebrazo y muñeca, no con palma abierta, y se confirma con la imagen del primer frame que no hay dos micrófonos [D]. Con un primer plano desenfocado, no se escribe "no bokeh": el desenfoque viene solo de la cercanía.
- **Riesgos:** móviles en el público, caras nítidas de público, texto en pantallas o carteles del escenario, micrófono que se confunde con otro objeto, ponente que mira a la lente.

*Fragmento de `[Camera]` (inglés):*

```text
Recorded from the audience by an attendee seated several rows back, at chest height, looking up slightly at the stage. Vertical 9:16, a long zoomed-in view that stays at the same magnification for the whole clip. A light constant hand tremor and small slow drifts of the framing, with no zoom movement and no reframing. The speaker is the only sharp plane. The heads and shoulders of two people sitting in front of the camera fill the lower left and lower right corners, large, dark and strongly out of focus, with a warm tint on their skin and hair edges; no face in the audience is sharp and nothing is held up in front of the lens. The autofocus stays locked on her face. The exposure is set for her face, so the backdrop behind her is bright and pale.
```

---

## 8. Trípode

*Qué es:* el móvil está sobre un trípode, que **no se ve**. **No hay movimiento de cámara ni vibración de ningún tipo.**

- **Cámara totalmente fija** [D]: sin deriva, sin balanceo de respiración, sin temblor, sin reencuadres y sin zoom durante todo el clip, a cualquier nivel del dial. La imperfección viene de la luz, el decorado y la actuación, no de la cámara.
- **Encuadre deliberado:** la persona suele estar centrada, con la altura de los ojos cuidada, el horizonte recto y el aire en la cabeza que le corresponde. Quien graba lo ha preparado [H].
- **Distancia:** la persona habla desde uno o dos metros, con más habitación visible que en un selfie [H].
- **El móvil sigue procesando:** el enfoque y la exposición reaccionan cuando ella se mueve, entra o sale, o enseña algo; la compresión y el ruido existen [H].
- **Sonido:** voz algo más lejana que en un selfie, con más sala [H].
- **Se repite que la cámara es estática**, hasta tres veces, y que no se ve el trípode [H].
- **Riesgos:** pedir "handheld" o "breathing sway" a la vez, trípode o patas visibles, reencuadre al final.

*Fragmento de `[Camera]`:*

```text
The camera is locked off on a tripod that is never seen. It is completely static for the entire clip: no drift, no breathing sway, no tremor, no reframing, no zoom. The frame is deliberate: she is centred at eye level with the horizon level. The camera's autofocus and exposure still react when she moves, and the image carries the soft processing of phone footage. Static camera, static frame.
```

---

## 9. Entrevista en la calle (street interview)

*Qué es:* alguien graba con el móvil a una persona en la calle mientras le hace preguntas con un micrófono.

- **Montaje E con micrófono:** el entrevistador sujeta el móvil con una mano y un **micrófono de mano pequeño** con la otra. El micrófono es un objeto de utilería, no la cámara, y puede entrar en cuadro desde un lado hacia la barbilla de la persona. El entrevistador no se ve [D].
- **Mirada:** la persona mira al entrevistador, justo al lado de la lente, y de vez en cuando a la lente. No habla a cámara durante toda la entrevista [H].
- **Voz del entrevistador:** se decide si se oye (fuera de cuadro) o no. Si el usuario da su texto, se respeta literal y se declara como un hablante más [D].
- **Vibración:** natural de alguien de pie, con correcciones tardías, y un pequeño reencuadre cuando pasa alguien [H].
- **Enfoque:** en la cara de la persona. El fondo de la calle se ve casi nítido en un móvil normal, y las personas lejanas, blandas por movimiento y distancia [H].
- **Fondo:** viandantes que cruzan sin mirar a la lente y sin caras nítidas, coches, fachadas, un bar con terraza (ver `entornos.md`). Sin otras cámaras ni móviles visibles [D].
- **Luz:** la del sol o la sombra del sitio, con cambios si se mueven; ropa y piel con sombras duras al mediodía [H].
- **Sonido:** viento sobre el micrófono, tráfico, pasos, voces lejanas, y la voz de la persona más cercana al micrófono de mano [H].
- **Riesgos:** que el micrófono se confunda con un móvil, caras nítidas de viandantes, texto en carteles, cámara que se pasea.

*Fragmento de `[Camera]`:*

```text
Recorded by the interviewer with the rear camera, held in one hand at chest height; the interviewer is never seen. Their other hand holds a small black handheld microphone that enters the frame from the lower left toward the interviewee's chin; the microphone is a prop and never the camera. Natural handheld tremor of someone standing still, with a small late correction when someone walks past behind. The interviewee looks at the interviewer's position just beside the lens and glances at the lens now and then. Passers-by in the background are soft, walk without looking at the lens, and show no sharp faces.
```

---

## 10. Q&A

*Qué es:* una persona responde a una pregunta mirando a cámara, en casa y con un aire relajado. Después, el usuario superpone la pregunta como texto.

- **Habla directamente a la lente** durante casi todo el clip, con breves apartes de mirada [H].
- **Zona libre arriba:** el **cuarto superior** del encuadre (aproximadamente) es espacio negativo limpio, para colocar la pregunta después. En esa zona no hay cuadros, plantas, lámparas, ventanas brillantes, sombras duras ni movimiento: una pared lisa y con luz pareja, para que el texto sea legible [H]. La cabeza y los hombros ocupan los dos tercios inferiores.
- **El prompt no genera la pregunta, ni texto ni subtítulos** [D]: solo deja el espacio y lo declara. Cualquier texto lo pone el usuario después.
- **"Andar por casa":** ropa cómoda y casera, un rincón corriente (sofá, cama, escritorio), luz de ventana o de lámpara, sin producción [H].
- **Montaje:** selfie con brazo extendido o sentado (A o B), o trípode (H) si se quiere el plano limpio. La zona libre se mantiene con cualquiera [H].
- **Encuadre:** pecho arriba con la cara algo por debajo del centro. El borde superior no corta la cabeza [H].
- **Sonido:** voz cercana, con el eco de la habitación.
- **Riesgos:** objetos detrás de la cabeza que invaden la zona libre, luz que deja manchas arriba, texto generado por el modelo, que el modelo centre la cara y use todo el cuadro.

*Fragmento de `[Camera]` y `[Scene]`:*

```text
Composition: the upper quarter of the frame is calm negative space, a plain, evenly lit wall with nothing hanging on it, no bright window, no plant tops, no lamps and no moving elements; her head and shoulders sit in the lower two thirds of the frame, with her face a little below the centre. No text, no question and no captions appear in the frame: the space stays empty. She looks straight into the lens and answers directly to camera.
```

---

## 11. Podcast (multicámara estática)

*Qué es:* dos o más personas conversan sentadas en un plató pequeño y se graba con **cámaras fijas**, de las que se sacan clips verticales. La persona **nunca mira a la lente: habla siempre con la otra persona**, que queda fuera de cuadro. Observado en dos fotos de referencia (9:16): una mujer sentada en un sofá de bouclé crema y un hombre en un sillón de terciopelo verde oscuro, cada uno con un **micrófono de estudio grande en un brazo articulado** que entra desde un lado a la altura de la barbilla, plano medio, con la cabeza girada o ladeada hacia quien tienen enfrente y un fondo cálido con luces prácticas.

- **Look de captura: cámara dedicada, no móvil** [D]. Es la excepción a la regla del "aspecto de móvil". Aquí la imagen es limpia, con mucho detalle, poco ruido, color cálido y trabajado, profundidad de campo **corta** (el fondo y las plantas, blandos) y óptica de focal media o larga. Se declara con claridad que **no es un móvil** y que no hay temblor de mano [H]. El móvil sigue sin aparecer en cuadro.
- **Cámara totalmente estática** [D]: sin deriva, sin respiración, sin reencuadre, sin zoom, sin temblor, en todo el clip y a cualquier nivel del dial. Se repite hasta tres veces.
- **Mapa de plató.** Antes de escribir hay que decidir y fijar: dónde se sienta la persona, dónde el interlocutor (fuera de cuadro), hacia qué lado entra el brazo del micrófono, y dónde está cada cámara. Todo prompt del mismo plató repite el mismo mapa [D].
- **Ángulos** (cada ángulo es una cámara fija):
  1. **Frontal a los hombros:** la cámara de frente a los hombros; la cabeza gira o se ladea hacia el interlocutor, así que la mirada cae a un lado del eje y nunca en la lente.
  2. **Tres cuartos (diagonal):** la cámara a unos 30 o 45 grados; se ve más volumen de la cara y el cuerpo.
  3. **Lateral (perfil):** a unos 90 grados; la persona mira a través del encuadre hacia el interlocutor.
  4. **Plano de los dos** o **sobre el hombro**: solo si el usuario lo pide.
  El plano es medio (de las rodillas o la cintura hacia arriba), a la altura de los ojos o algo por debajo [H].
- **Mirada** [D]: siempre al interlocutor, fuera de cuadro, **con la dirección de mirada coherente entre ángulos** (si en el frontal mira hacia la izquierda del encuadre, en el tres cuartos sigue mirando hacia el mismo lado del plató). Nunca a la lente.
- **Postura y gestos:** sentados, con el cuerpo algo girado, a veces las piernas cruzadas; gestos a la altura del pecho con una mano, la otra descansa; la cabeza se ladea al hablar; asentimientos ligeros al escuchar y pausas con respiración [H]. Las manos **no tocan el micrófono ni lo atraviesan** [D].
- **Micrófono (prop visible)** [D]: micrófono de estudio grande en un brazo articulado, que entra en cuadro desde un lado y queda por debajo de la boca, **sin tapar los labios** y sin atravesar el cuerpo. **Sin logo ni texto legible** (se describe como "large black broadcast microphone", sin marca) [D]. El cable cae con holgura natural.
- **Enfoque:** fijo en la cara. El micrófono, que está más cerca de la lente, puede quedar algo blando o nítido según el plano: se decide [H].
- **Luz:** luz suave de frente a unos 45 grados, luces prácticas cálidas detrás (aplique circular, tira de led, lámpara), separación de fondo con un borde de luz, piel con algo de brillo, contraste moderado [H]. Ver `luz.md`.
- **Entorno:** plató con paneles de madera, ladrillo o tela acústica, plantas, estantería o cuadros, sofá o sillón con textura, una mesa baja con vasos. Sin marcas ni texto legible [D]. Ver `entornos.md`.
- **Cortes entre ángulos** (solo si se piden; por defecto, **un ángulo por clip**): cortes duros que caen en una pausa del audio, de al menos un segundo cada tramo. **La acción continúa en tiempo real a través del corte**: el gesto que subía sigue subiendo, la pose y la mano coinciden, la luz y la ropa no cambian [D].
- **Sonido:** voz de micrófono de estudio: cercana, cálida, con efecto de proximidad, sin reverberación de sala, respiración audible, sin ruido de fondo. El interlocutor, si se oye, está fuera de cuadro [H].
- **Riesgos:** que el modelo mire a la lente, que aparezca el interlocutor, un micrófono con logo, que tape la boca o se deforme, que el brazo atraviese el cuerpo, la identidad que cambia entre ángulos, y que aparezca una estética de móvil.

*Fragmento de `[Camera]` (un ángulo, frontal a los hombros):*

```text
Recorded by a locked-off professional camera on a tripod, never a smartphone. The frame is completely static for the entire clip: no drift, no tremor, no breathing sway, no reframing and no zoom. Static camera, static frame. Angle: square to her shoulders, a medium shot from the hips up, at eye level, lens of medium focal length with a shallow depth of field. She sits turned slightly toward her interlocutor, who sits off frame to the left; her head tilts and her eyes are directed at them and never at the lens. A large black broadcast microphone on a boom arm enters from the right of the frame at chin height, angled toward her mouth, never covering her lips, with no logo or readable text on it, its cable hanging with natural slack. She is the only sharp plane; the wall light and the plants behind her are soft. The image is clean and detailed, with warm colour.
```

*Fragmento de un segundo ángulo en el mismo clip (corte duro):*

```text
Hard cut at 4.50s to the camera at 45 degrees to her left, a second locked-off angle, same moment of her speech: the gesture her hand was making continues across the cut, her clothes, the microphone and the light are unchanged. Her eyes keep looking at her interlocutor off frame to her left, never at the lens. No transition, no fade.
```
