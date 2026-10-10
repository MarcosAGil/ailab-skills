# Luz y exposición en vídeo de móvil

Cómo se comporta la luz y cómo la registra un móvil, para escribirlo con causa y ritmo. Los niveles de confianza son los de siempre: **[D]** regla dura, **[H]** heurística, **[?]** hipótesis a validar. Los tiempos son órdenes de magnitud.

## Reglas

1. **Toda fuente de luz está nombrada** (ventana, lámpara, techo, sol, farolas, pantalla) con su lado y su dureza [D].
2. **Todo cambio de luz tiene causa y ritmo**: qué lo provoca y cuánto tarda. Si la luz no debe cambiar, se escribe "la luz no cambia" [D].
3. **La exposición automática del móvil reacciona**, no salta: sube o baja en torno a medio segundo o un segundo cuando cambia el brillo, y puede pasarse un poco antes de asentarse [H]. Es un comportamiento de la cámara, no un cambio de la luz de la escena: se escribe así ("the camera's auto exposure catches up") [D].
4. **El balance de blancos también tarda**: al pasar de luz cálida a fría, la imagen se desplaza de color antes de asentarse [H].
5. **Nada de "cinematic lighting", "studio lighting", "HDR" ni "color grading"** [D]. Se describe lo observable: de dónde viene la luz, cómo cae en la cara, qué zona queda quemada o en sombra.
6. **El aro de luz solo si el usuario lo pide** [D]. Si lo pide, se describe con su consecuencia (reflejo circular en los ojos, luz frontal plana).

## Situaciones

| Situación | Causa física | Cómo se comporta la luz | Respuesta de la cámara |
|---|---|---|---|
| **Ventana de día, lateral** | Luz difusa que cae por un lado | Un lado de la cara más claro, el otro suave; caída hacia el fondo de la sala | Exposición estable. Si ella se mueve hacia la ventana, la cara se aclara |
| **Contraluz de ventana** | Ventana detrás de ella | Cara en sombra, ventana muy brillante o quemada | La cámara decide entre cara y ventana; la cara se aclara con retraso [H] |
| **Pasar de una estancia luminosa a una oscura** | Dos niveles de luz distintos | Cambio gradual de la luz que cae sobre ella | La imagen se oscurece, sube el ruido y se recupera en torno a un segundo [H] |
| **Encender una luz** (interruptor, lámpara) | Pulsación | La estancia gana luz cálida o fría de golpe | Breve sobreexposición o cambio de color, y se asienta; si la bombilla sale en cuadro, destello pequeño [H]. Los fluorescentes de cocina o garaje pueden parpadear una o dos veces al encender [?] |
| **Luz mixta** (ventana fría y lámpara cálida) | Dos temperaturas | Un lado de la cara frío y otro cálido; paredes con matices distintos | El balance de blancos elige una; el resto se tiñe [H] |
| **Noche con una lámpara o solo la pantalla** | Poca luz | Alto contraste, sombras profundas, tonos cálidos o azulados | Ruido de imagen, detalle blando, menos nitidez [H] |
| **Sol entre hojas** (parque, calle con árboles) | Hojas que filtran el sol | Manchas de luz y sombra que cruzan la cara, la ropa y el suelo al ritmo del paso | Exposición que oscila; la cara parpadea entre claro y sombra [H] |
| **Sol de frente** | Sol bajo delante | Cara muy iluminada, ojos entrecerrados, brillo en la piel | Destello pequeño en la lente (veiling glare); la imagen se vela [H] |
| **Hora dorada** | Sol bajo lateral | Luz cálida lateral, sombras largas, borde luminoso en el pelo | Estable y cálida |
| **Sombra de edificio al caminar** | Cambio de sol a sombra | Caída brusca y luego estable | La exposición sube con retraso [H] |
| **Coche** | Parabrisas y ventanillas | Luz cenital y lateral; sombras que pasan (árboles, puentes, túneles); reflejos del salpicadero en el cristal | Cambios rápidos de brillo; la cara se oscurece y se aclara al pasar la sombra [H] |
| **Baño** | Luz sobre el espejo y de techo | Luz fría y pareja, brillos en azulejos y grifería | Reflejos en superficies pulidas (riesgo de ver el móvil: ver `SKILL.md`) |
| **Cocina** | Led de techo o fluorescente más ventana | Luz fría y plana más un lado cálido de ventana | Reflejos en acero y vitrocerámica |
| **Linterna del móvil** (de noche, en oscuro) | Luz del propio móvil | Luz frontal dura y plana, caída fuerte, sombras detrás de la persona | Alto contraste; el móvil no se ve [D] |
| **Escenario de ponencia o evento** | Foco frontal sobre quien habla, panel retroiluminado detrás, luces de contorno | Cara y ropa bien iluminadas, hombros y pelo con borde de luz, fondo muy luminoso; el público, en penumbra y casi en silueta [H] | Exposición medida para la cara, el fondo sale claro; la ropa clara no se quema [H]. Las siluetas del público tienen un tinte cálido en la piel y el pelo |
| **Plató de podcast** | Luz suave de frente a unos 45 grados, luces prácticas detrás (aplique, tira de led, lámpara) y un borde de luz de separación | Cara bien modelada con brillo suave en la piel, fondo cálido con puntos de luz suaves, contraste moderado [H] | Estable, sin parpadeos. Exposición fija, imagen limpia, color cálido trabajado (no es una imagen de móvil) [H] |
| **Calle de entrevista** | Sol o sombra del sitio, rebotes de fachadas | Sombras más duras al mediodía, luz suave en sombra; cambios si se mueven al sol o a la sombra | Exposición con retraso al pasar de sol a sombra [H] |
| **Pared lisa detrás (Q&A)** | Luz de ventana o de lámpara sobre una pared sin objetos | Luz pareja en la zona de arriba, sin manchas ni degradados duros, para que un texto superpuesto se lea [H] | Estable |
| **Nubes que pasan** | Variación lenta del sol | Fluctuación suave de brillo y contraste | Exposición que acompaña con retraso |

## Efectos de lente

- **Veiling glare** (velo): cuando una fuente brillante está fuera de cuadro o delante, el contraste baja y aparece un velo [H].
- **Destello pequeño**: una mancha de luz con un par de reflejos tenues al apuntar a una bombilla o al sol. Nada de destellos de cine [D].
- **Huella en la lente**: velo blando y pérdida de contraste, solo en el dial **crudo** [?].
- **Ruido** en sombras con poca luz, y suavizado de detalle [H].

## Cómo escribirlo

- Un bloque de luz en `[Scene]` o `[Visual Style]` con: fuentes y lado, hora y estación, qué parte de la cara queda más clara.
- En cada tramo con cambio de luz: causa, ritmo y respuesta de la cámara. Ejemplo: *"As she steps from the bright living room into the hallway, the light falling on her face drops; the camera's auto exposure takes about a second to catch up, her face dims slightly and then recovers, and the white balance cools a little before settling. It reads as the camera metering, never as a lamp changing."*
- Al final de `[Maintain Consistency]`, si la luz de la escena no debe cambiar: *"No light source brightens, dims, flickers, switches on or off at any point, except the changes described."*
