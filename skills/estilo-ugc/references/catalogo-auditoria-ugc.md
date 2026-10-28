# Catálogo de auditoría UGC

La lista de comprobaciones que se pasa, eje por eje, contra el prompt (o el brief) y sus referencias. Cada hallazgo lleva un ID, una gravedad y se escribe en el informe así: **Dónde** (cita corta del prompt, o "no aparece"), **Problema** (una frase), **Pregunta** (con opciones).

Gravedad:
- **B, bloqueante:** si no se resuelve, el vídeo sale mal o falso casi seguro. Siempre se pregunta (salvo modo rápido).
- **I, importante:** probable fallo o deriva. Se pregunta si cambia el resultado visible; si no, se decide.
- **M, menor:** se decide con criterio y se lista en `Supuestos`.

Antes de preguntar, mira si las referencias, el audio o el vídeo guía ya contestan: lo deducible no se pregunta.

## Eje 1. Coherencia de escena (primer filtro)

| ID | Qué se busca | Por qué falla | Qué se pregunta |
|---|---|---|---|
| K1 B | No hay motivo creíble para grabar ahora (prueba de una frase) | El vídeo se lee como anuncio o como escena de estudio | ¿Por qué está grabando ahora? Se ofrecen motivos corrientes (acaba de llegar, está recogiendo, lo usa a diario) |
| K2 B | El producto está en un sitio donde no vive (un sérum en la cocina, una botella en el dormitorio sin motivo) | La incoherencia rompe el realismo más que cualquier ajuste de cámara | ¿Dónde está el producto en su vida real? |
| K3 I | Lugar aspiracional o "de catálogo" sin que el usuario lo pida | Se lee como publicidad | ¿Lo graba en su propio espacio (recomendado) o quieres un sitio concreto? |
| K4 I | El registro no coincide: tono, decorado y nivel del producto en registros distintos | Parece montaje | ¿Qué registro quieres: casa corriente, intimidad, exterior? |
| K5 I | Rig imposible: una persona con un móvil encuadra a la vez un fondo amplio y un macro del producto, o hace un movimiento que pide equipo | El modelo improvisa y deforma | ¿Qué manda: el fondo o el producto? |
| K6 I | Tiempo, hora, estación y ropa no coinciden (sol bajo con luz de mediodía, abrigo en verano) | Detalle que delata | ¿Qué hora y qué estación es? |
| K7 M | Persona, ropa y casa no encajan en edad, nivel y estilo | Poca credibilidad | Se decide a partir de las referencias |
| K8 I | Formato de contenido sin decidir (selfie, ponencia, trípode, entrevista, Q&A...) | El modelo mezcla rasgos de varios formatos | ¿Qué formato es? Se ofrece el más cercano con su perfil (ver `formatos-ugc.md`) |
| K9 I | Dos objetos con la misma función (micrófono de mano y de diadema, dos mandos) o un objeto incoherente con la escena | Parece un montaje y el modelo duplica o funde objetos | ¿Cuál queda? Se decide con la imagen del primer frame |

## Eje 2. Dispositivo y montaje de cámara

| ID | Qué se busca | Por qué falla | Qué se pregunta |
|---|---|---|---|
| D1 B | **El móvil aparece o está implícito**: "sostiene el móvil", "se graba", "mira la pantalla", mano con un objeto rectangular, cámara que se ve en un reflejo; **verbos del aparato** (lo levanta, lo baja, lo sostiene, abre el zoom, apunta); o menciones repetidas o negaciones insistentes del móvil | Rompe la regla central: la cámara es el móvil, y nombrarlo o narrarlo hace que el modelo lo dibuje [?] | Se reescribe con "la cámara" y una sola prohibición. Se pregunta solo si el usuario quiere un segundo móvil como utilería |
| D2 B | Montaje no definido (selfie, apoyado, coche, alguien graba, primera persona, caminando) | El modelo elige y cambia entre planos | ¿Cómo se graba? Se ofrecen los montajes con su perfil |
| D3 B | Cámara frontal o trasera sin definir | Cambian la distorsión, la nitidez y el encuadre | ¿Frontal (selfie) o trasera? |
| D4 B | Selfie de espejo, o superficie reflectante en cuadro (espejo, ventana de noche, gafas de sol, TV apagada, horno, microondas, acero) | El modelo dibuja el móvil en el reflejo | ¿Quito la superficie o la tapo con otra cosa? |
| D5 I | Brazo y mano sin definir: si el antebrazo se ve y qué hace la otra mano | Aparece un brazo flotante o un móvil en la mano | ¿Se ve el antebrazo o la mano que sujeta queda fuera de cuadro? |
| D6 I | Soporte, trípode o palo de selfie visible, o sombra del brazo o del móvil | Delata el aparato | Se bloquea; se pregunta si debe verse |
| D7 I | Interfaz de grabación, marcas de agua, punto rojo, temporizador | Parece capturado de la pantalla | Se bloquea salvo petición |
| D8 M | Móvil apoyado con una mano que entra a pararlo al final | Muestra el aparato implícitamente | Se pregunta si el usuario quiere ese gesto |
| D9 M | Si va en el coche: ¿parado o en marcha? | Cambia la vibración, la luz y la mirada | ¿Parado o conduciendo? |
| D10 B | Trípode o "cámara fija" pedido junto a vibración, respiración o seguimiento (o "fijo" sin decir si es trípode o apoyado) | Mezcla física imposible | ¿Trípode (ninguna vibración) o móvil apoyado (microvida del entorno)? |
| D11 I | Montaje desde el público sin distancia, altura, zoom o cabezas en primer plano | Pierde el aspecto de ponencia | ¿Cuántas cabezas, dónde y con qué zoom? |
| D12 I | Entrevista sin definir el micrófono (visible, de dónde entra), la voz del entrevistador o la mirada del entrevistado | El micrófono se confunde con el móvil, o mira a la lente todo el rato | ¿Hay micrófono de mano, se oye al entrevistador y a dónde mira? |
| D13 B | Podcast o plató sin declarar el look de captura (cámara dedicada, no móvil) o con vibración de mano | Sale una imagen de móvil o con temblor | ¿Cámara dedicada fija, sin vibración y con profundidad de campo corta? |

## Eje 3. Vibración y movimiento de cámara

| ID | Qué se busca | Por qué falla | Qué se pregunta |
|---|---|---|---|
| V1 B | Sin perfil de vibración, o solo "handheld" | El modelo sale estable y limpio, o con temblor exagerado | ¿Qué tipo y cuánta (ligera, natural, marcada) con qué causa? |
| V2 B | Vibración incoherente con el montaje (temblor de mano con el móvil apoyado, cámara fija con una persona que camina) | Mezcla física imposible | ¿Cuál manda? Se propone la que corresponde al montaje |
| V3 B | Más de un movimiento principal de cámara en una toma continua (seguir, girar, acercar y reencuadrar) | El resultado es una deriva flotante o se ignora | ¿Cuál es el principal? El resto se resuelve con el movimiento del sujeto |
| V4 I | Movimientos de cámara que un móvil no hace de forma natural (órbita, grúa, dolly, plano cenital a 3 m, rack focus) | Se lee como cine, no como móvil | Se sustituye por un equivalente de mano |
| V5 B | Zoom en movimiento ("quick zoom", "push-in", "opens the zoom"), o zoom no declarado | Es el movimiento que más falla: salta, corta o dibuja interfaz | Por defecto, **sin zoom en movimiento**: ¿se acerca andando (físico) o se incluye lo que se quiere ver en el encuadre? |
| V6 I | Palabras de velocidad o ambiente sobre el sujeto o la cámara ("fast", "dynamic", "energetic camera") | Degradan la calidad y producen movimientos bruscos | Se describe el ritmo con causa y duración |
| V7 I | Estabilización contradictoria ("smooth" y "shaky" a la vez) | Mezcla incompatible | ¿Estabilización digital normal (flotante) o sin estabilizar? |
| V8 I | Cambio de ritmo de la vibración sin causa (pasos, parada, llegada) | Parece un efecto | Se liga a una causa |
| V9 M | Cierre de la toma: movimiento, reencuadre final | Un cierre perfecto parece anuncio | ¿Corta en movimiento o se queda en pose? (uno solo) |
| V10 B | Gesto de cámara que levanta, baja o apunta el aparato (subir a una pantalla o al techo, "lift and open") | Aparece un móvil o unas manos delante, o el zoom salta (fallo real) | ¿Se incluye lo que se quiere ver en el encuadre, o prefieres un corte duro? |

## Eje 4. Enfoque y óptica

| ID | Qué se busca | Por qué falla | Qué se pregunta |
|---|---|---|---|
| F1 B | No se dice qué está nítido al empezar, durante y al acabar | El modelo enfoca el fondo o el primer plano al azar | ¿Qué debe estar nítido en cada momento? |
| F2 I | Cambio de enfoque sin causa, duración o dirección (el enfoque "respira") | Rack focus no pedido, o ninguno | ¿Cuándo y por qué cambia (producto entra, ella se mueve)? |
| F3 I | Profundidad de campo cinematográfica (bokeh cremoso, fondo difuminado), **salvo en podcast, que usa cámara dedicada con profundidad corta** | En un móvil normal el fondo se ve casi todo nítido | ¿Profundidad amplia de móvil (recomendado) o modo retrato? |
| F4 I | Producto muy cerca de la lente sin decir qué pasa con el enfoque | Se queda blando o hay desenfoque raro | ¿Se acerca y queda blando un instante, o se mantiene a distancia? |
| F5 I | Perspectiva de la cámara frontal (ligero gran angular, cara algo deformada) sin declarar, o contradictoria entre planos | Cambia el aspecto de la cara | Se decide según frontal o trasera |
| F6 I | Caminando: desenfoque del fondo y estabilidad del enfoque en la cara | El fondo se vuelve borroso o la cara se pierde | ¿La cara siempre nítida y el fondo con movimiento natural? |
| F7 M | Ruido y suavizado en poca luz | Imagen demasiado limpia en baja luz | Se decide con el dial |
| F8 I | Zoom o teleobjetivo no declarado en un vídeo desde lejos (ponencia): fondo y primer plano con profundidad cinematográfica sin explicación | Incoherente con un móvil normal | ¿Es una vista ampliada? Se declara el zoom y que no se mueve |
| F9 M | "No bokeh" junto a un primer plano desenfocado | Contradicción interna | Se atribuye el desenfoque a la cercanía y se quita la negación |

## Eje 5. Luz y exposición

| ID | Qué se busca | Por qué falla | Qué se pregunta |
|---|---|---|---|
| L1 B | Fuentes de luz sin definir | El modelo ilumina como un estudio | ¿Qué luz hay (ventana, lámpara, techo, sol, farolas) y desde dónde? |
| L2 B | Cambio de luz sin causa ni ritmo (parpadeos, habitación que se ilumina sola) | Parece un fallo del modelo | ¿Qué provoca el cambio y cuánto tarda? |
| L3 I | Paso de una estancia a otra sin comportamiento de exposición | Luz constante, irreal | ¿Cómo reacciona la cámara (tarda, se pasa, se asienta)? |
| L4 I | Luz que se enciende o se apaga sin causa visible, momento ni respuesta de la lente | No se ve el "clic" físico | ¿Quién pulsa el interruptor y en qué momento? |
| L5 I | Sol entre hojas, sombras de árboles o edificios que no se mueven con el paso | Luz moteada estática | ¿A qué ritmo cruza la luz la cara según el paso? |
| L6 I | Contraluz o ventana sin decidir si se quema o se recupera | Resultado impredecible | ¿Cara oscura o ventana quemada? |
| L7 I | Mezcla de temperaturas de color no definida (lámpara cálida y ventana fría) | Color uniforme, irreal | ¿Qué se mezcla y en qué lado de la cara? |
| L8 I | Aro de luz, flash o "cinematic lighting" no pedidos | Delatan el montaje | Se quitan salvo petición |
| L9 I | Hora del día y dirección de las sombras que no coinciden | Detalle que delata | ¿Qué hora y orientación tiene la ventana? |
| L10 M | Destellos de lente (luz directa, huella en la lente) | Efectos de cine si se piden mal | Se decide con el dial |

## Eje 6. Entorno y atrezo

| ID | Qué se busca | Por qué falla | Qué se pregunta |
|---|---|---|---|
| E1 B | Sin inventario de lo visible (solo "salón", "casa", "calle") | El modelo pone un fondo de catálogo o vacío | ¿Qué hay en la pared, en las superficies y al fondo? Se ofrece un inventario por capas |
| E2 I | Decorado incoherente con quién vive ahí (edad, nivel, estilo, región) | Parece un decorado | ¿Quién vive aquí y en qué ciudad? |
| E3 I | Demasiado ordenado o simétrico, "de catálogo" | Se lee como estudio | Se añaden 2 o 3 detalles usados en el borde |
| E4 I | Desorden que compite con el producto, o desorden desagradable | Distrae o degrada el producto | Se baja el desorden al nivel del dial |
| E5 I | Cuadros, carteles y pósters sin decidir: tipo, tema, legibilidad | Texto inventado o imagen genérica | ¿Qué tipo de cuadros (láminas, fotos, póster) y se leen? |
| E6 I | Texto y logos visibles sin decidir (marcas en objetos, etiquetas, carteles) | El modelo los deforma o los inventa | ¿Sin texto legible, o con una referencia exacta? |
| E7 I | Falta de profundidad por capas (primer plano, medio, fondo) | Escena plana | Se escribe por capas |
| E8 I | Fondo estático sin vida (ventana, sombras, cortinas, tráfico lejano) | Fondo congelado | ¿Qué se mueve ligeramente al fondo? |
| E9 I | Detalles regionales incoherentes con España (enchufes, interruptores, persianas, radiadores, matrículas, mobiliario urbano) | Rompe la credibilidad local | ¿País y región? |
| E10 M | Lista fija de objetos repetida entre prompts de una serie | Se convierte en un tic | Se varía |
| E11 M | Personas de fondo, mascotas o niños no definidos | Aparecen o no, al azar | ¿Hay alguien más, o nadie? |
| E12 I | Público, siluetas o personas de fondo sin definir (cuántas, dónde, nitidez, y sin móviles levantados) | Aparecen caras nítidas, móviles en el público o ninguna silueta | ¿Cuántas siluetas, dónde y con qué desenfoque? |
| E13 B | Q&A o texto posterior sin zona libre declarada, u objetos en la parte alta del encuadre | El texto superpuesto no se podrá leer, o el modelo usa todo el cuadro | ¿Qué zona queda libre (arriba, un cuarto) y qué debe estar vacío? |
| E14 B | Podcast sin mapa de plató: quién se sienta dónde, dónde está el interlocutor fuera de cuadro y por qué lado entra el brazo del micrófono | Mira a cámara, el interlocutor aparece o cambia de sitio entre ángulos | ¿Dónde se sienta cada uno y qué ángulo es este? |
| E15 I | Micrófono de estudio sin definir: tamaño, lado, altura, que no tape los labios, sin logo ni texto | Logo inventado, boca tapada o brazo que atraviesa el cuerpo | ¿Micrófono visible de qué lado y altura, sin marca? |
| E16 I | Varios ángulos del mismo plató con inventario, ropa o luz distintos | Deriva de identidad y de decorado entre ángulos | Se repite el mismo bloque de plató en cada ángulo |

## Eje 7. Persona y actuación

| ID | Qué se busca | Por qué falla | Qué se pregunta |
|---|---|---|---|
| P1 B | Emoción como etiqueta ("emocionada", "feliz", "natural") | Sonrisa fija y energía de anuncio | ¿Cómo se ve? Se ofrecen conductas (ojos, boca, ritmo) |
| P2 B | Mirada sin política: lente, pantalla (justo bajo la lente), producto, entorno | Mira a la lente todo el rato, o a ninguna parte | ¿A dónde mira en cada momento? |
| P3 B | Manos y objetos sin definir: qué mano, qué sostiene, qué hace | Cambian de mano, aparecen o desaparecen objetos | ¿Con qué mano sostiene el producto? |
| P4 I | Energía constante (entusiasmo en todas las frases) | Se lee como anuncio | ¿Energía base plana con un solo pico genuino? |
| P5 I | Habla sin ritmo ni detalles de delivery (respiración, pausas, muletillas ya presentes en el texto) | Habla de locutora | Se describe a partir del texto del usuario, sin reescribirlo |
| P6 I | Piel, pelo y ropa sin detalle real (poros, brillos, pelos sueltos, arrugas) | Piel lisa y plástica | Se decide con el dial |
| P7 I | Vestuario incoherente con el contexto (en casa, de estar; en la calle, de salir) | Parece un vestuario de anuncio | Se decide con las referencias |
| P8 I | Cuerpo: postura, peso, orientación respecto a la cámara, movimiento al hablar andando | Movimientos genéricos | ¿Cómo se mueve y hacia dónde? |
| P9 I | Fricción humana: ninguna (todo perfecto) o demasiadas | Falso, o acumulación de tropiezos | ¿Un gesto pequeño? (peinarse, apartar la mirada, una risa corta) |
| P10 M | Microvida (parpadeo, respiración, tragar, cambio de peso) | Pose rígida | Se decide |
| P11 M | Reacción al entorno (un ruido, un cambio de luz) | Actuación aislada del lugar | Se decide |
| P12 B | Mirada hacia un interlocutor fuera de cuadro sin lado ni coherencia entre ángulos (podcast, entrevista) | Mira a la lente o cambia de dirección entre cortes | ¿A qué lado del plató mira en cada ángulo? |
| P13 B | Gestos genéricos: el mismo gesto en cada frase, o gestos no ligados a la función de la frase ni a su palabra de énfasis | Actuación estándar que no acompaña al guion | Se resuelve con el plan de movimiento (`gestos-y-guion.md`); solo se pregunta la intención ambigua |
| P14 B | Una mano que sostiene un objeto (mando, bolígrafo, micrófono) con gestos de mano abierta, palma o dedos | El modelo suelta o duplica el objeto o ignora el gesto | Se adaptan los gestos a antebrazo y muñeca con la mano cerrada, o se cambia el objeto de mano |

## Eje 8. Acción y producto

| ID | Qué se busca | Por qué falla | Qué se pregunta |
|---|---|---|---|
| A1 B | Más de una acción principal por tramo | El modelo mezcla y deforma | ¿Cuál es la acción principal de cada tramo? |
| A2 B | Estado inicial y final no observables (dónde está el producto, cómo está ella) | El tramo queda ambiguo | ¿Cómo empieza y cómo acaba cada tramo? |
| A3 B | **Acción de riesgo**: comer, beber, aplicar maquillaje, peinarse con las manos, manipular objetos pequeños, verter líquidos | Manos y objetos se deforman | ¿La acotamos (sostener y enseñar, acabar antes de consumir, mostrar el resultado)? |
| A4 I | Producto pequeño o lejano con etiqueta que debe leerse | El texto se deforma | ¿Más grande en cuadro (30 a 40 %) o sin texto legible? |
| A5 I | Logo o caja nueva centrados, o producto girado como en una peana | Señal de anuncio | Se enseña ya usado, con un gesto de agarre y peso |
| A6 I | Física y causa de cada acción (puerta, líquido, objeto que cae) sin definir | El modelo hace lo plausible, no lo pedido | ¿Qué provoca cada cosa? |
| A7 I | Duración que no cabe en la acción pedida | El modelo comprime o salta | ¿Alargo el tiempo o simplifico? |
| A8 I | Cierre sin definir, o dos cierres a la vez ("corta en movimiento" y "pose final") | Resuelve hacia un final de anuncio | ¿Corta en movimiento (recomendado) o pose? Uno solo |
| A9 M | Afirmaciones o cifras sobre el producto dichas o escritas sin que las dé el usuario | Contenido inventado | No se escriben; si aparecen, se marcan |
| A10 B | Acción corporal grande (levantarse, sentarse, cambiar de sitio) junto a un reencuadre, o más de una acción grande por tramo | Puede provocar un corte involuntario [?] | ¿La acción cabe en el encuadre inicial, o un único movimiento lento de cámara? |
| A11 I | Demasiados tramos: uno por frase en vez de uno por cambio de estado | Los límites marcados pueden empujar cortes y el texto largo diluye [?] | Se agrupan por estado real |

## Eje 9. Sonido y sincronía

| ID | Qué se busca | Por qué falla | Qué se pregunta |
|---|---|---|---|
| S1 I | Diálogo sin audio de referencia | La sincronía labial y la voz sale peor | Recomienda generar la voz con Seed Audio y pasarla. Si el usuario sigue sin audio, se avisa y se continúa |
| S2 B | Audio exacto sin transcripción, archivo medible o quién habla | No se puede sincronizar | ¿Me pasas el archivo o la transcripción? |
| S3 B | **Límite de tramo o de corte que no cae dentro de un silencio medido**, frase que queda partida entre dos tramos, o duración que trunca una palabra (se comprueba contra la tabla de tiempos del audio) | Corte sobre palabras | ¿Muevo los cortes a las pausas o alargo la duración? |
| S4 I | Ritmo de habla supuesto, no medido | El texto no cabe o sobra tiempo | Con audio se mide; sin audio se estima con prudencia y se avisa |
| S5 I | Sonido ambiente de micrófono de móvil sin definir (eco de sala, viento, motor, ruido de manejo) | Sonido de estudio | ¿Dónde está y cómo suena el lugar? |
| S6 I | Voz que no encaja con la distancia o el movimiento (andando, en el coche, de espaldas) | Voz de estudio constante | Se decide con el montaje |
| S7 I | Música no pedida, o efectos sin causa visible | Parece anuncio | Se bloquea salvo petición |
| S8 I | Idioma y variedad no declarados (castellano de España) | Acento latino o neutro | Se declara por hablante |
| S9 M | Gestos o miradas sin anclaje a una frase | Caen donde quieren | Se anclan a fragmentos |
| S10 I | Voz fuera de cuadro (entrevistador, público) o megafonía de sala sin definir | Una voz inventada o ausente | ¿Quién habla fuera de cuadro y cómo suena? |
| S13 I | Duración de una pausa tomada del guion con el que se generó el audio ("pausa de 1 s") en vez de la medida | El gesto o el tramo no coinciden con el audio | Se usa la duración medida, en cuartos de segundo |
| S14 B | El audio termina pegado al final del clip (cola de silencio menor que 0,5 s) y el prompt pide una pose final, "se queda quieto" o una cola de eco | No hay tiempo para ello y el eco sería sonido inventado | El clip acaba en la última palabra, sin pose ni eco |
| S15 M | Con audio exacto, el prompt prescribe volumen o tempo ("quieter", "faster", "more quietly") | Choca con el audio, que ya lo fija | Se describe el cuerpo, no la voz |

## Eje 10. Señales de IA, referencias y formato

| ID | Qué se busca | Por qué falla | Qué se pregunta |
|---|---|---|---|
| I1 I | Piel lisa y simétrica, pelo perfecto, dientes demasiado blancos | Rostro de render | Se escribe el detalle real, sin "beauty" |
| I2 I | Fondo congelado o textura repetida | Se nota al segundo | Se escribe vida de fondo y detalles variados |
| I3 I | Palabras vacías ("ultra realistic", "8K", "cinematic", "masterpiece") o de belleza | No aportan y empujan a lo pulido | Se sustituyen por detalle observable |
| I4 I | "HDR", "color grading", "bokeh" como estilo (**salvo en podcast**, donde el look de cámara dedicada es el correcto) | Se desvían del móvil | Se describe el resultado observable |
| I5 I | Texto en pantallas o carteles inventado | Garabatos | Referencia exacta o sin texto legible |
| I6 I | Manos a la cara, dedos cruzados o muy cerca de la lente | Dedos de más | Se simplifica el gesto |
| R1 B | Handles que no corresponden al orden y tipo reales de los adjuntos | Identidades cruzadas | Se confirma el orden |
| R2 B | Asset sin rol claro (primer frame, localización, solo estética) | El modelo usa la imagen donde no debe | ¿Qué aporta cada referencia y qué no? |
| R3 I | Primer frame congelado como pose (retrato) en vez de un instante de acción | Anima rígido | Se escribe como instante en movimiento |
| R4 I | Conflicto entre referencia y texto (la imagen tiene un look que el texto contradice) | Mezcla | ¿Manda la imagen o el texto? |
| R5 I | Ratio o duración que chocan con el primer frame o el audio | Recorte o estiramiento | Se decide y se avisa |
| R6 I | Errores de formato Seedance 2.5 (diálogo entre comillas, idioma sin declarar, alias sin `@`) | El modelo los ignora | Se corrige sin preguntar |
| R7 M | Contaminación: restos de iteraciones, nombres de archivo, @tags inexistentes | Instrucciones fantasma | Se limpia sin preguntar |
| R8 I | El prompt nombra el móvil más de dos veces, repite la prohibición en varios sitios, describe acciones del aparato o usa frases de priming ("nobody holds anything up", "no one raises a phone") | Puede hacer que el modelo lo dibuje [?] (fallo real) | Se reescribe con "la cámara" y una sola prohibición; no se pregunta |
| R9 I | Hueco de plantilla sin rellenar (corchetes como [Location], [Name], [N]) en el prompt final | El modelo lee el corchete como texto o lo ignora | Se rellena; no se pregunta |
| R10 M | Cantidades sin escala visible ("unos milímetros") o eventos sin causa ("se mueve una sola vez") | Detalles que el modelo no puede ejecutar | Se sustituyen por algo observable con causa |

## Matriz de contradicciones de captura

Cada coincidencia es un hallazgo V2 o V7 (según el caso):

| Pedido A | Pedido B | Qué se pregunta |
|---|---|---|
| Móvil apoyado o "cámara fija" | Temblor de mano, "sigue a la persona" | ¿Fija de verdad, o en mano? |
| Selfie con brazo extendido | La persona se mueve por la casa sin variar el temblor | ¿Cómo cambia la vibración al andar? |
| Caminando | "Smooth", "stabilised", "cinematic" | ¿Estabilización digital normal (flotante) o sin estabilizar? |
| Plano cerrado de la cara | Producto grande y fondo amplio a la vez | ¿Qué manda? |
| "Rack focus" o desenfoque cremoso | Cámara de móvil normal | ¿Profundidad amplia, o modo retrato? |
| Ring light | "Luz natural de ventana" | ¿Cuál manda? |
| Selfie frontal con brazo extendido visible | Brazo "fuera de cuadro" | ¿Se ve o no? |
| Cámara en el coche | "Plano estable de estudio" | ¿Vibración del coche (recomendado) o fija? |
| Un solo plano continuo | Cortes o transiciones | ¿Una toma o cortes duros? |
| Trípode o "cámara estática" | "Handheld", "breathing sway", "sigue a la persona" | ¿Trípode (nada se mueve) o en mano? |
| Q&A con "fondo decorado" | Espacio libre arriba | ¿Qué manda: decorado o zona libre? (recomendado: zona libre) |
| Ponencia | Zoom que se mueve o la ponente mira a la lente | ¿Zoom fijo y mirada al público? |
| Podcast (cámara fija) | "Handheld", vibración o aspecto de móvil | ¿Cámara dedicada fija o móvil? |
| Podcast (hablando con otra persona) | Mirada a la lente | ¿Mira al interlocutor fuera de cuadro? |
| Varios ángulos en un clip | "Una sola toma" | ¿Un ángulo por clip o cortes duros entre ángulos? |
| Levantarse o una acción corporal grande | Reencuadre o zoom en la misma toma | ¿Encuadre que contenga la acción, o un único movimiento lento? |
| Mostrar algo fuera de cuadro (pantalla, techo, logo) | "Sin corte y sin zoom" | ¿Encuadre más abierto, o corte duro declarado? |
| Luz "constante" | Cambio de habitación o encender una luz | ¿Qué cambia y por qué? |
