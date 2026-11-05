# 10 · Qué se puede generar (catálogo)

Una vez construido el espacio en Blender, cada imagen nueva es solo una cámara más. Todo comparte las mismas medidas, los mismos objetos y la misma luz por construcción.

## Del espacio vacío

| Tipo | Cómo | Notas |
|---|---|---|
| Hoja de entorno | Todas las vistas aprobadas en una hoja (`control_contornos.py`) | Referencia para imagen y vídeo; con logo de Ailendra Labs |
| Frontal de una pared | `camara()` de frente, 35 mm | Pared entera: `distancia_para_ancho(ancho, lente)` |
| Frontales cada vez más lejanas | Misma X, más distancia; quitar la pared de detrás si hace falta | En el caso real: 6, 7,5, 9,5, 12 y 15,5 m |
| Tres cuartos / esquina | `plano(..., "tres_cuartos")` | Suele ser la maestra |
| Lateral / contraplano | Cámara en el lado opuesto | El contraplano necesita la pared que se quitó: recupérala de `Pared_X_oculta` |
| Hacia el elemento protagonista | Cámara desde el paso o la puerta | Máquina, mostrador, cama, escenario... |
| Cenital | Ortográfica alta, techo oculto | Planta del espacio |
| Maqueta / casa de muñecas | Cámara alta en diagonal, techo y pared delantera ocultos | Buen plano de presentación; también un GIF girando (render por fotogramas) |
| Detalle | `plano(..., "detalle")`, 60 a 70 mm | Objetos, texturas, cuadros |

## Con personajes

| Tipo | Receta | Ejemplo del caso real |
|---|---|---|
| Plano general con varias personas | Maniquíes + vista amplia | Jugador en la arcade y mayor leyendo al fondo |
| Perfil paralelo a un objeto | `paralela_a_frontal()` | Máquina de perfil a la derecha, jugador a la izquierda |
| Contrapicado desde el suelo | `plano(..., "contrapicado")` (0,16 m) | Periódico a la izquierda, cara arriba a la derecha |
| A la altura de la rodilla | `plano(..., "rodilla")` (0,5 m) | Sin techo ni pared lateral, cuadros rectos |
| Plano medio / primer plano | `plano(..., "plano_medio" / "primer_plano")` | Conversaciones, reacciones |
| Picado | `plano(..., "picado")` | Vista de alguien sentado desde arriba |
| Mismo momento desde otro ángulo | Mismo estado de vista, otra cámara | G y H comparten maniquíes y pufs movidos |
| Añadir a alguien con una pose de foto | Edición directa con foto de pose | El joven sentado en el otro sofá |

Recetas de `scripts/blender/camaras.py` (distancia m, altura cámara m, objetivo mm, giro por defecto):

| Receta | Distancia | Altura | Objetivo | Giro |
|---|---|---|---|---|
| `frontal` | 3,0 | 1,35 | 35 | 0° |
| `tres_cuartos` | 3,0 | 1,35 | 28 | 40° |
| `perfil` | 2,5 | 1,30 | 35 | 90° |
| `plano_medio` | 1,6 | 1,40 | 40 | 15° |
| `primer_plano` | 0,9 | ojos | 60 | 10° |
| `detalle` | 0,6 | sujeto | 70 | 0° |
| `contrapicado` | 1,8 | 0,16 | 30 | 35° |
| `rodilla` | 2,4 | 0,50 | 30 | 10° |
| `picado` | 2,6 | 2,30 | 30 | 25° |
| `gran_angular` | 4,5 | 1,35 | 20 | 30° |

`lado` positivo = la cámara se va hacia la izquierda del sujeto (le ves su lado izquierdo). `desplazar` positivo = el sujeto queda a la izquierda del encuadre.

## Corrección y extras

- Cambiar lo que sale en una pantalla, un cartel, un cuadro: edición con la imagen como referencia.
- Corregir un detalle (cable, objeto de más, tapa): edición + parche.
- Cambiar outfit de un personaje en una imagen aprobada: edición con la hoja del outfit nuevo.
- Variantes de luz (día/noche) de una vista: edición describiendo la luz y conservando todo lo demás (o luz nueva en Blender y nueva maestra).
- Primer y último fotograma para vídeo: dos vistas del mismo momento (misma escena, cámaras distintas) sirven como inicio y final de un plano en modelos de vídeo.
- GIFs para clases o entregas: `gif_comparativa.py` (render → IA, antes/después, secuencias de vistas).

## Límites honestos

- La IA no es determinista: puede mover un poco el encuadre, el tamaño de una persona o un detalle. Se ve en el control y se corrige.
- Texto pequeño (letreros, pantallas lejanas) puede salir ilegible.
- Manos y cables son lo que más falla en personajes.
- Un espacio nuevo pide de 2 a 6 vueltas de blockout. Las imágenes vienen después y son rápidas.
