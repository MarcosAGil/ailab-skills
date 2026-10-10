# Actuación UGC, producto y acciones de riesgo

Cómo se dirige a la persona y al producto para que parezca una persona real grabándose. La skill **no escribe ni cambia el texto hablado**: dirige cómo se dice y qué hace el cuerpo mientras tanto. Niveles de confianza: **[D]** regla dura, **[H]** heurística, **[?]** hipótesis.

## Mirada

La mirada se decide por montaje y por momento. Se escribe a dónde mira en cada tramo y que nunca queda sin definir [D].

| Montaje | Política por defecto |
|---|---|
| Selfie (A, B, G) | Mira a la lente la mayor parte del tiempo, con **breves destellos** a la pantalla (justo debajo de la lente), al producto o fuera de cuadro cuando piensa. Nunca una mirada fija y una sonrisa clavadas todo el vídeo [H] |
| Móvil apoyado (C) | Habla a la lente cuando habla a cámara y mira a lo que hace cuando actúa (al lavabo, a la mesa). Se mueve dentro del encuadre [H] |
| Alguien graba (E) | Apenas mira a la lente. Mira a lo que hace o a quien graba, fuera de cuadro, con algún destello a la lente [H] |
| Primera persona (F) | Sin cara de quien graba; la mirada se refleja en el movimiento de la cámara y en las manos [H] |
| Trípode (H) | Habla a la lente, se mueve dentro del encuadre y puede alejarse o acercarse; mira a lo que hace cuando actúa [H] |
| Podcast (J) | Siempre al interlocutor, fuera de cuadro, con dirección coherente entre ángulos; **nunca a la lente** [D]. La cabeza se ladea, hay asentimientos ligeros y pausas con respiración [H] |
| Desde el público (I) | La ponente mira al público, no a la lente; gestos abiertos con una mano mientras la otra sujeta el micrófono; pausas con respiración [H] |
| Entrevista (E con micrófono) | Mira al entrevistador, justo al lado de la lente, con destellos a la lente [H] |
| Q&A | A la lente casi todo el tiempo, con breves apartes de mirada [H] |
| Coche (D) | Mira a la lente entre destellos a la carretera o al retrovisor si va en marcha [H] |

## Energía y fricción

- **Energía base plana, conversacional**, como hablando con una amiga. **Un solo momento** con reacción genuina (una risa corta, un gesto de sorpresa suave). El entusiasmo constante en todas las frases se lee como anuncio [H].
- **Dial natural:** 0 o 1 **gesto de fricción humana**, físico y pequeño: apartarse un mechón, una mirada fuera de cuadro un instante, un respiro antes de seguir, una risa corta. No se escribe texto nuevo para ello [H].
- Sin tropiezos, sin soltar el producto y sin reencuadrar a mano mientras habla (sería un segundo movimiento de cámara) [H].
- Si el usuario no quiere fricción, ninguna.

## Habla

- El texto es del usuario y es literal [D]. La skill describe el **delivery**: ritmo (conversacional), respiración audible, pequeñas pausas entre ideas, cómo se aprieta la voz al enfatizar y cómo se relaja al acabar.
- Las muletillas, rectificaciones y frases entrecortadas ya presentes en el texto se respetan y se anclan a un gesto (mirada, respiración).
- **Castellano de España** declarado por hablante (`Dialogue language: Spanish (Spain)`), registro coloquial si el texto lo es [D].
- Si hay audio de referencia, el audio manda sobre cualquier descripción: la boca sigue el audio (ver `sonido-y-audio.md`).

## Cuerpo y manos

Los gestos que acompañan a un texto se diseñan con el **plan de movimiento** de `gestos-y-guion.md`: cada gesto sale del significado de la frase, se ancla a su palabra de énfasis y no se repiten gestos estándar.

- **Postura y peso:** cómo se sienta o se apoya, cómo cambia de postura. Nadie queda congelado [H].
- **Manos:** qué mano sostiene el producto, qué hace la otra, y que no se cruzan ni tapan la cara (los dedos se deforman) [D].
- **Gestos cerca de la lente:** una mano que entra cerca de la cámara desenfoca un instante y arrastra el enfoque. Se escribe como evento con causa [H].
- **Caminando y hablando:** respira entre frases, el paso condiciona el ritmo, mira adelante de vez en cuando [H].
- **Microvida:** parpadeo natural, respiración, tragar, pequeños cambios de peso, ropa y pelo que responden al movimiento [H].

## Piel, pelo y ropa

El realismo es imperfección, no belleza [H]. Se escribe como **detalle observado**, no como petición:

- *Piel:* poros visibles, tono algo desigual (rubor en la nariz o las mejillas), un brillo ligero donde le da la luz, ojeras suaves.
- *Pelo:* pelos sueltos y mechones fuera de sitio.
- *Ropa:* arrugas y pliegues, textura visible; de estar por casa en casa, de calle en la calle (ver `entornos.md`).
- *Maquillaje:* el que marquen las referencias, o ninguno o muy natural.
- Sin adjetivos de belleza ("beautiful", "gorgeous", "stunning"), sin "perfect skin", sin "airbrushed" [D].
- Joyas, uñas y accesorios solo si se ven y vienen en las referencias; si no, no se piden [H].

## Producto

- **Tamaño en cuadro:** si la etiqueta debe verse, el producto ocupa de un 30 a un 40 % del encuadre y el fondo es sencillo detrás [H].
- **Cómo se enseña:** lo trae hacia la lente **desde abajo o desde el lado**, ligeramente descentrado, con el entorno todavía visible detrás; **no centrado y cuadrado a la lente** como en un anuncio [H].
- **Un solo gesto de agarre y peso:** lo gira un poco en la mano, para un instante cuando la luz le da, cambia el agarre. Nada de girarlo despacio y centrado como en una peana [H].
- **Ya usado, no recién salido de la caja.** Una caja nueva o un logo grande centrados delatan un anuncio [H]. Si el unboxing es el contenido, la caja aparece como parte de la acción, no como objeto protagonista.
- **Texto, marca y números** (ver más abajo).
- **Cantidad exacta** y mano, en `[Props]`, con ciclo de vida si cambia de estado (cerrado, abierto, usado) [D].

## Texto, marcas y pantallas

- **No se pide al modelo que renderice texto de marca o de pantallas**: sale deformado [H]. Si el texto debe leerse: o es una **referencia exacta** ("exact printed text from @ImageN, no added text") o va por **overlay en postproducción** (se avisa al usuario).
- Si una pantalla es referencia, **se referencia y no se describe su interfaz en prosa**: describirla invita a inventar paneles [H].
- **Afirmaciones y cifras sobre el producto** solo las pone el usuario. La skill nunca inventa datos [D].

## Acciones de riesgo

Estas acciones deforman manos, objetos o líquidos. Se detectan (hallazgo A3) y se ofrece la versión acotada [H]:

| Acción | Riesgo | Alternativa |
|---|---|---|
| Comer o beber | La comida desaparece, aparece color donde no toca | Sostiene y enseña, sin consumir; acaba antes del primer bocado |
| Aplicar maquillaje o cosmética | El color se traslada, aparecen marcas previas | Sostiene y enseña el producto; se muestra el resultado, no la aplicación |
| Manipular objetos pequeños | Dedos de más, objeto que cambia de forma | Una acción simple: coger, sostener, girar, dejar |
| Verter líquidos | Sin física creíble | Cantidad pequeña, plano corto, resultado visible |
| Manos en el pelo o la cara | Dedos que se funden | Un solo gesto, lento y pequeño |
| Escribir o tocar una pantalla | Interfaz y dedos inventados | Se evita; si hace falta, segundo móvil como utilería con referencia |
| Dos acciones seguidas en un mismo plano | El modelo las mezcla | Una acción principal por tramo [D] |

## Cómo escribirlo

- En `[Characters]`: referencia, qué rasgos usa, política de mirada, mano de cada cosa, "no habla" o idioma y variedad.
- En cada tramo: mirada, manos, cuerpo y respiración, con un único gesto principal y su anclaje a una frase.
- **Con audio exacto, si la voz llega pegada al final del clip, no hay cierre propio:** el clip acaba en la última palabra (ver `gestos-y-guion.md`).
- Un solo cierre: o corte en movimiento (recomendado: la cámara sigue algo descentrada y el producto aún en cuadro) o pose sostenida. Nunca los dos [H].
