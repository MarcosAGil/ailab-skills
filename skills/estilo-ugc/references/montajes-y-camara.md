# Montajes de cámara, vibración y enfoque (el móvil como cámara)

Cómo se graba un vídeo UGC con un móvil, descrito para poder escribirlo en un prompt. Nada de esto es una verdad absoluta: son criterios para decidir y para preguntar.

**Niveles de confianza:** **[D]** regla dura de la skill; **[H]** heurística razonada (se usa por defecto, se corrige con la experiencia); **[?]** hipótesis a validar generando. Los números son órdenes de magnitud para orientar, no datos medidos.

## 1. Los montajes

Cada prompt elige **uno** (por plano). El montaje decide quién sostiene, qué se ve, cómo vibra la imagen y cómo se encuadra.

| Montaje | Qué se ve | Vibración | Encuadre y enfoque típicos |
|---|---|---|---|
| **A. Selfie con brazo extendido** (cámara frontal) | La persona de frente. La mano que sujeta, fuera de cuadro. El antebrazo, solo si se pide [D] | Temblor fino de mano, balanceo lento por la respiración, deriva que la persona corrige tarde, retraso cuando mueve la cabeza [H] | Del pecho hacia arriba, a la distancia del brazo [H]. Ligero gran angular de la cámara frontal, nariz y centro algo ampliados, detalle algo más blando que la trasera [H]. Enfoque en la cara |
| **B. Selfie sentado o con el codo apoyado** | Igual que A, con menos movimiento corporal | Más estable: respiración y pulso, correcciones raras [H] | Pecho arriba, cabeza algo por encima del centro [H] |
| **C. Móvil apoyado** (lavabo, estante, mesa, cama, repisa) | El entorno y la persona en él. Ni móvil ni soporte | **Casi ninguna**: cámara quieta con microvida del entorno (pasos cercanos, aparatos). Nada de balanceo de mano [D]. Se repite que la cámara es estática [H] | Encuadre fijo y algo imperfecto: ligeramente descentrado, con una pequeña inclinación y algún objeto que tapa un borde [H]. La persona entra y sale del cuadro. El enfoque y la exposición reaccionan a su movimiento |
| **D. Móvil en el coche** (soporte o apoyado) | El interior y el paisaje por la ventanilla. Ni móvil ni soporte | Vibración del coche: temblor fino y constante más baches ocasionales; en parado, casi fija [H]. El fondo se mueve, la cabina no [D] | Plano fijo respecto al coche, desde el salpicadero o el parabrisas. Reflejos del salpicadero en el cristal [H]. Luz que cambia con sombras que pasan |
| **E. Alguien graba** (cámara trasera, otra persona) | La persona en su entorno, sin que se vea quien graba | Movimiento natural de una persona detrás, que reacciona tarde y reencuadra [H] | Encuadre algo descentrado, medio, con aire. Ella apenas mira a la lente. El enfoque pasa de fondo a ella cuando se mueve |
| **F. Primera persona (POV)** (cámara trasera) | Las manos de quien graba entran por abajo. No se ve la cara de quien graba | Balanceo de cabeza y cuerpo, pasos si camina, giros que siguen la mirada [H] | A la altura de los ojos. Las manos hacen las acciones. El enfoque se desplaza entre manos y objeto |
| **G. Caminando** (selfie con brazo extendido o trasera) | La persona al caminar y el fondo en movimiento | Rebote al paso, balanceo lateral, deriva y correcciones. La estabilización digital da un aspecto algo flotante [H] | Cara casi siempre nítida y centrada con tirones; el fondo cambia con paralaje. El enfoque se reajusta al girar |
| **H. Trípode** (móvil fijo en un trípode que no se ve) | La persona y el entorno. Ni móvil ni trípode | **Ninguna**: sin deriva, sin respiración, sin temblor, sin reencuadre [D] | Encuadre deliberado y centrado, a la altura de los ojos, horizonte recto, desde uno o dos metros [H]. Enfoque y exposición reaccionan si ella se mueve |
| **I. Desde el público** (ponencia o evento, trasera con zoom) | El escenario y quien habla; siluetas de cabezas y hombros desenfocadas delante | Pulso ligero y constante, ampliado por el zoom; pequeñas variaciones de encuadre; sin zoom en movimiento [H] | Plano medio con ligero contrapicado. Profundidad de campo corta por el zoom: la ponente nítida, el primer plano muy desenfocado [H] |
| **J. Cámara dedicada fija** (podcast, plató; **no es un móvil**) | Las personas sentadas en un plató. Sin móvil | **Ninguna** [D] | Plano medio con profundidad de campo corta, imagen limpia y cálida, óptica media o larga; una cámara fija por ángulo (frontal, tres cuartos, lateral) [H] |

**Una sola toma, un solo movimiento principal** [D]. En una toma continua, la cámara hace un único movimiento principal. Lo demás se resuelve con el movimiento del sujeto, no encadenando reencuadres.

**Trípode frente a apoyado.** Con trípode no hay ningún movimiento de cámara. Con el móvil apoyado en un sitio, hay microvida del entorno (pasos cercanos, un aparato que vibra). Se pregunta cuál de los dos es [D].

**Fijo y vivo.** Con el móvil apoyado, la imagen no está inmóvil de forma sobrenatural: tiene microvida (una ventana que cambia, un pequeño ajuste del enfoque o de la exposición cuando ella se acerca). Pero nunca el temblor de una mano [D].

**Dos looks de captura.** Por defecto, el vídeo se ve **grabado con un móvil**. La excepción es el formato **podcast** (montaje J): se graba con una cámara dedicada fija, con una imagen más limpia y una profundidad de campo corta. Se declara el look en `[Visual Style]` y no se mezclan [D].

## 2. Frontal frente a trasera

| | Frontal (selfie) | Trasera |
|---|---|---|
| Perspectiva | Ligero gran angular, algo de distorsión de cara cerca [H] | Más natural, mejor compresión [H] |
| Detalle | Algo más blanda, algo más de suavizado de piel por el procesado del móvil [?] | Más nítida y limpia [H] |
| Mirada | La persona mira a la lente (cara a la pantalla) y a veces justo debajo | Quien graba no sale; la persona mira poco a la lente |
| Uso típico | Hablar a cámara, probar cosas, andar y hablar | "Alguien me graba", producto en manos, POV |

Nombrar un modelo de móvil (por ejemplo "iPhone-style") puede ayudar a que el modelo asocie un aspecto, pero es **[?]**. Por defecto se describe como *smartphone front camera* o *smartphone rear camera*, sin marcas.

## 3. Cómo se describe la vibración

Se compone de efectos independientes. Para cada montaje se eligen los que corresponden y se escribe la causa.

| Efecto | Qué es | Cuándo |
|---|---|---|
| Balanceo de respiración | Oscilación lenta de baja amplitud | Cualquier mano |
| Temblor fino | Vibración rápida de baja amplitud | Brazo extendido, mano, coche |
| Deriva | El encuadre se desplaza poco a poco y se corrige tarde | Brazo extendido, caminando |
| Corrección tardía | Un pequeño reencuadre cuando se pierde el centro | Selfie, alguien graba |
| Rebote de paso | Subida y bajada rítmica con cada pisada | Caminando |
| Balanceo lateral | Vaivén con el paso | Caminando |
| Judder del coche | Vibración fina continua más baches | Coche |
| Estabilización digital | Aspecto "flotante", recorte ligero del borde, algún pequeño tirón al corregir | Caminando y movimiento fuerte [?] |
| Rolling shutter | Inclinación elástica solo en barridos rápidos | Giros bruscos (no se pide salvo que haya giro) [?] |

**Descripciones por nivel (dial)** [H]. El dial **natural** es el valor por defecto.

| Dial | Vibración | Eventos de enfoque o exposición | Piel y textura | Entorno |
|---|---|---|---|---|
| **Limpio** | Muy ligera y estable | 0 a 1 | Natural, algo suavizada | Pocos detalles, ordenado |
| **Natural** (por defecto) | Perceptible, creíble | 1 a 3 | Poros visibles, brillo donde da la luz | 2 a 4 detalles usados |
| **Crudo** | Marcada, con correcciones | 3 a 5 | Textura evidente, ruido en sombras | 5 a 7 detalles, algo desordenado |

**Presupuesto de eventos de lente.** Se escribe en `[Camera]` cuántos eventos de enfoque o exposición hay en total y cuáles (`In-lens budget`), para que no se multipliquen.

## 4. Enfoque

- **Cara nítida** como plano principal en selfie y caminando [H]. Se escribe qué está nítido al empezar, durante y al acabar [D].
- **Profundidad amplia de móvil por defecto** [H]: el fondo no se difumina de forma cremosa. El desenfoque llega por **cercanía** (un objeto muy cerca de la lente) o por **modo retrato** si el usuario lo pide.
- **Excepción: zoom o teleobjetivo** (montaje I, ponencia) [H]. Con una vista muy ampliada, la profundidad de campo se acorta y lo que está delante del sujeto (cabezas del público) se desenfoca mucho. Se declara el zoom, que no se mueve durante el plano.
- **Producto cerca de la lente:** se acerca y queda blando un instante antes de enfocar al apartarlo un poco [H].
- **Cambios de enfoque con causa:** el sujeto se acerca o se aleja, un objeto entra, la persona se gira. Duración aproximada de medio segundo [H].
- **Caminando:** la cara se mantiene nítida, el fondo cambia con paralaje y puede haber un pequeño reajuste del enfoque al girar una esquina [H].
- **Poca luz:** más ruido y detalle más blando, no bokeh [H].

## 5. Perfiles por defecto

Los formatos de contenido completos (selfie en casa, caminando, producto, móvil apoyado, coche, alguien graba, ponencia, trípode, entrevista y Q&A) están en `formatos-ugc.md`, con su montaje, cámara, vibración, mirada, luz y sonido por defecto.

## 6. Cómo escribirlo en el prompt

- En `[Camera]`: montaje, cámara frontal o trasera, quién (nadie visible), qué contiene el encuadre, perfil de vibración con sus causas, enfoque inicial y final, presupuesto de eventos de lente, y lo que no se usa.
- En `[Visual Style]`: cómo se ve la imagen de un móvil (nitidez, ruido, contraste, procesado), sin "cinematic" ni "HDR".
- Una frase por efecto, con causa. Ejemplo: *"A light fine hand tremor and a slow breathing sway; every few seconds a small late correction brings her face back to the centre of the frame."*
- Del aparato se habla lo mínimo: una mención como look de captura y una frase de prohibición en `[Maintain Consistency]`. En `[Camera]` se habla de **la cámara** y **el encuadre**, y nunca se narran acciones del aparato [D].

## 7. Movimientos de cámara de alto riesgo

Movimientos que suelen salir mal. No se proponen por defecto; si el usuario los pide, se avisa del riesgo y se ofrece la alternativa.

| Movimiento | Riesgo | Alternativa |
|---|---|---|
| Subir la cámara a una pantalla o al techo (levantar el aparato) | Aparece un móvil o unas manos delante, o el zoom salta [?] (fallo real) | Un encuadre que ya incluya lo que se quiere ver, o un corte duro declarado |
| Abrir o cerrar zoom durante el plano | Salto de calidad, corte o interfaz [?] | Zoom fijo; si hay que acercar, se acerca andando (físico) |
| Reencuadre grande (tilt o pan) mientras el sujeto hace una acción grande (levantarse) | Corte involuntario [?] | Un encuadre que contenga la acción, o un único movimiento lento y con retraso |
| Dos o más movimientos de cámara en una toma | Deriva flotante, o se ignoran | Uno solo; el resto lo hace el sujeto |
| Caminar y reencuadrar a la vez | Imagen que flota o corta | Un solo movimiento principal |
