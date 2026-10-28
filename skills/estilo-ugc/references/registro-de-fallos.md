# Registro de fallos y correcciones

La autopsia detallada de cada fallo (causa raíz y defensa) está en `errores-conocidos.md`. Este registro recoge lo que el usuario cuenta al generar.

Un registro vivo. Cada vez que el usuario cuenta un fallo visto al generar y confirma la causa y el cambio, se añade una fila. Una regla solo se endurece cuando el mismo fallo aparece en **dos prompts distintos**.

Protocolo ante un fallo: **síntoma, causa mínima, cambiar una sola variable, reforzar con repetición (hasta 3 menciones) y conservar lo que funcionaba.**

## Registro del usuario

| Fecha | Escena | Síntoma | Causa probable | Cambio | Resultado |
|---|---|---|---|---|---|
| oct 2026 | Ponencia desde el público, el ponente se levanta y la cámara sube a una pantalla con zoom | Aparece un móvil con manos delante al subir la cámara | Se narró la acción del aparato ("lifts the phone and opens the zoom") y se nombró varias veces | Describir el encuadre que sube, sin nombrar el aparato; una sola prohibición; sin zoom en movimiento | Por validar |
| oct 2026 | La misma escena | Se produce un corte cuando el ponente se levanta | Acción corporal grande más reencuadre de cámara, y tramos con límites muy marcados | Encuadre que contenga la acción o un único movimiento lento; menos tramos | Por validar |
| oct 2026 | La misma escena | Los movimientos del ponente son estándar y no acompañan a las palabras | Un gesto genérico por frase, sin ligarlo a la función ni a la palabra de énfasis | Plan de movimiento con gestos por función, anclados a fragmentos partidos en la palabra de énfasis | Por validar |
| oct 2026 | La misma escena | El zoom no gusta | Zoom en movimiento | Sin zoom en movimiento; lo que se quiere ver entra en el encuadre | Por validar |

## Hipótesis heredadas, aún por validar

Estas afirmaciones aparecen en otras guías públicas de prompting UGC, pero **no están comprobadas** para tu modelo ni tu caso. Se usan como hipótesis y se confirman o descartan con tus generaciones.

| ID | Hipótesis | Estado |
|---|---|---|
| H1 | La palabra "fast" sobre el sujeto degrada la calidad en Seedance | Sin validar |
| H2 | No dar instrucciones de parpadeo en clips de 4 a 8 s evita ojos nerviosos | Sin validar |
| H3 | Nombrar un modelo de móvil ("iPhone-style") aumenta el realismo | Sin validar |
| H4 | Decir "static camera" dos veces fija mejor el plano que decirlo una vez | Sin validar |
| H5 | "No ring light" elimina el aspecto de influencer sobreiluminado | Sin validar |
| H6 | Prompts de 60 a 100 palabras funcionan mejor que los largos | Contradicho por nuestras generaciones largas; validar por tipo de clip |
| H7 | Marcas de tiempo dentro del prompt empeoran el resultado | Contradicho: se usan solo con audio exacto; validar |
| H8 | "Hora dorada" es la luz que mejor funciona en Seedance | Sin validar |
| H9 | Frases de sincronía labial ("lip synchronization natural and precise") mejoran la boca | Sin validar |
| H10 | Un ritmo de 3 palabras por segundo es el correcto (otras guías dicen casi 6) | Contradicho: con audio de referencia se mide |
| H11 | Nombrar o negar el móvil varias veces, o narrar sus acciones, hace que aparezca | Nacida de un fallo real; por validar |
| H12 | Una acción corporal grande junto a un reencuadre provoca un corte involuntario | Nacida de un fallo real; por validar |
| H13 | Los tramos con límites muy marcados pueden empujar cortes | Sin validar |
