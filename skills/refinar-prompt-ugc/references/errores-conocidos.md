# Errores conocidos: causa raíz y defensa

La autopsia de cada fallo real que ha salido de esta skill. Para cada uno: **cómo se coló**, **qué regla lo impide** y **qué comprobación lo atrapa**. Cuando aparezca un fallo nuevo, se añade aquí con el mismo formato antes de dar el trabajo por cerrado.

Convención: **L** = lo atrapa `scripts/lint_prompt.py`; **M** = hay que comprobarlo a mano (la skill lo hace en el paso de verificación).

## Errores del prompt de ponencia con mando (audio de 17 s)

| ID | Error | Cómo se coló (causa raíz) | Defensa añadida | Comprobación |
|---|---|---|---|---|
| E01 | La mano que sostiene un objeto (mando) hacía gestos de mano abierta (palma arriba, palma abajo, abrir hacia el público) | El lexicón de gestos daba "mano abierta" como forma por defecto y no se cruzaba con lo que la mano ya sostenía. Había una regla de manos y otra de gestos, pero ninguna las comparaba | **Matriz de manos** obligatoria antes de escribir: por tramo, qué lleva cada mano. Una mano con objeto gesticula con antebrazo y muñeca, mano cerrada. Catálogo P14 | L (aviso) y M |
| E02 | El límite del tramo 1 (5.00 s) caía dentro de una palabra del audio (la frase acaba a 5,74 s) | Se escribieron los tiempos de los tramos a partir de una idea aproximada y no de las pausas medidas. La regla existía, pero nada obligaba a consultarla | **Tabla de tiempos del audio** (`medir_audio.py`) antes de escribir; los límites se eligen solo dentro de silencios medidos. Catálogo S3 reforzado | L (error) |
| E03 | Quedó un hueco de plantilla sin rellenar: `[Location] references @Image3` | El contrato de formato incluía ese texto con un corchete como ejemplo y la skill lo copió literalmente | Los ejemplos ya no llevan corchetes de plantilla. Regla: en el prompt final no queda ningún corchete salvo los encabezados. Catálogo R9 | L (error) |
| E04 | Un micrófono de mano y otro de diadema a la vez | No se comparó la lista de objetos del primer frame con su coherencia. Dos objetos con la misma función no se detectaban | Paso de intake: se listan los objetos visibles de las imágenes y se preguntan los que duplican función. Catálogo K9 | L (aviso) y M |
| E05 | El final pedía que "se quede quieto" y que "el eco se desvanezca", pero el audio termina pegado al final del clip | La regla de "un solo cierre" permitía una pose sostenida sin comprobar si el audio dejaba tiempo, y el eco se supuso, no se midió | Regla de **final con audio exacto**: si la cola de silencio es menor que 0,5 s, el clip acaba en la última palabra, sin pose ni eco. Catálogo S14 | L (error) |
| E06 | "Un silencio de aproximadamente un segundo" cuando el audio medido tiene unos 0,8 s | Se copió la duración del guion con el que se generó el audio y no la medición | Las duraciones de pausa salen de la medición, redondeadas a cuartos de segundo. Catálogo S13 | M |
| E07 | "nobody holds anything up" | Se arrastró una frase de una versión anterior que menciona lo que no debe aparecer | Lista de frases de priming prohibidas. Catálogo R8 ampliado | L (aviso) |
| E08 | "shifts a few millimetres only once" | Se escribió un detalle con una escala imposible de ver y con un evento sin causa | Regla: nada de cantidades sin escala visible ni eventos sin causa. Catálogo R10 | M |
| E09 | "no bokeh" junto a una silueta muy desenfocada de primer plano | La plantilla de estilo trae "no bokeh" y no se adaptó al formato de ponencia | Regla: con un primer plano desenfocado, el desenfoque se atribuye "solo a la cercanía" y no se niega el bokeh. Catálogo F9 | L (aviso) |
| E10 | "quieter and firmer" para la última frase con audio exacto | Se dio una indicación de volumen que el audio ya fija | Con audio exacto, el prompt no prescribe volumen ni tempo; describe el cuerpo. Catálogo S15 | L (aviso) |

## Errores del prompt de ponencia con subida al logo

| ID | Error | Cómo se coló | Defensa añadida | Comprobación |
|---|---|---|---|---|
| E11 | Apareció un móvil con manos delante al subir la cámara | Se narró la acción del aparato ("lifts the phone and opens the zoom") y se nombró varias veces | El aparato se nombra lo mínimo y nunca se narran sus acciones. Catálogo D1 y V10 | L (error) |
| E12 | Un corte donde no se pedía (al levantarse) | Una acción corporal grande junto a un reencuadre, y muchos tramos con límites marcados | Una acción grande por tramo, un único movimiento de cámara y menos tramos. `gestos-y-guion.md` | M (hipótesis) |
| E13 | Gestos estándar que no acompañan a las palabras | Un gesto genérico por frase | Plan de movimiento con gestos por función y anclados a la palabra de énfasis. Catálogo P13 | M |
| E14 | Zoom que no gusta | Zoom en movimiento | Sin zoom en movimiento por defecto. Catálogo V5 | L (error) |

## Cómo se usa este documento

1. Antes de entregar un prompt, la skill recorre esta tabla y se pregunta, fila a fila, si su salida repite alguna causa raíz.
2. Cuando el usuario cuente un fallo nuevo, la skill hace la misma autopsia (cómo se coló, qué regla falta, qué comprobación lo atraparía), lo añade aquí y, si es mecánico, lo añade a `scripts/lint_prompt.py` y a `evals/casos.md`.
3. Una regla nueva no se da por buena hasta que el caso de prueba correspondiente de `evals/` pasa.
