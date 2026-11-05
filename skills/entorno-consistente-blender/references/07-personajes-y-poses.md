# 07 · Personajes en una posición exacta

La regla es la misma que con los muebles: **la posición la decide Blender, no la IA.** Un maniquí por personaje marca dónde está, su altura y su pose. La hoja de personaje decide quién es.

```
Imagen 1 = render con maniquíes  → dónde está cada persona y cómo está colocada
Resto    = sala + hojas de personaje + objetos → cómo es cada persona y qué lleva
```

## Qué pedirle al usuario

1. **Hojas de cada personaje:** cara (varias expresiones/ángulos) y cuerpo entero con el outfit (frente, perfil, espalda). Si no las tiene, se hacen antes (skill `personaje-consistente` o AILAB).
2. **Objetos que lleva o usa** (cascos, móvil, periódico, bolsa) en una hoja de producto con vistas.
3. **Pose:** descrita ("sentado con la pierna derecha cruzada, leyendo") o con una foto de referencia (se usa solo la pose).
4. **Dónde está cada uno** y qué plano quiere. Si no lo sabe, propón la posición más natural y enséñala.

## Maniquíes (`scripts/blender/maniquies.py`)

```python
exec(open("<skill>/scripts/blender/maniquies.py").read())
maniqui("Joven", "de_pie_mandos", pos=(6.78, 4.13), mira_a=(7.05, 4.40), altura=1.80)
maniqui("Mayor", "sentado_leyendo", pos=(1.98, 5.02), angulo=180, asiento=0.45, cruzar="derecha", objeto="periodico")
maniqui("Joven", "sentado_rodillas_abiertas", pos=(3.05, 5.0), angulo=180, asiento=0.45)
```

| Pose | Para |
|---|---|
| `de_pie` | personaje quieto |
| `de_pie_mandos` | jugando en una máquina, en un mostrador, cocinando, en un teclado |
| `andando` | paso a medio camino |
| `sentado` | sentado erguido, manos en los muslos |
| `sentado_rodillas_abiertas` | sentado en el borde, rodillas separadas, manos en los muslos, mirada abajo |
| `sentado_piernas_cruzadas` | pierna `cruzar` ("derecha" o "izquierda") sobre la otra rodilla |
| `sentado_leyendo` | piernas cruzadas y `objeto` entre las manos ("periodico", "libro", "movil") |
| `sentado_suelo` | sentado en el suelo con las rodillas arriba |
| `apoyado_pared` | de pie, espalda contra la pared, una rodilla doblada |

- Ejes del maniquí: mira hacia +Y local; `angulo` en grados (0 = mirando a +Y del mundo, 180 = a −Y) o `mira_a=(x, y)`.
- `asiento` = altura real del asiento (sofá 0,45; taburete 0,75). `altura` = estatura de pie.
- Cada maniquí cuelga de un Empty `<Nombre>_maniqui`: muévelo o gíralo y se mueve entero. Para retocar una articulación concreta, edita el diccionario de la pose o mueve el hueso (`<Nombre>_<hueso>`).
- Colores distintos por personaje: el prompt los nombra ("the white mannequin", "the grey-green mannequin").
- **Copiar una pose de una imagen ya generada:** mírala con detalle (recorta y amplía), anota qué pierna está encima, dónde están las manos, hacia dónde mira y en qué parte del mueble se sienta; ajusta el maniquí y compruébalo con `mcp__blender__look` desde la cámara de esa imagen. En el caso real así se consiguió que una vista nueva (contrapicado) respetara exactamente la pose de la anterior.

## Conflictos con el espacio

Lo que choca con un personaje se resuelve en Blender, no en el prompt. Si un mueble ocupa el sitio del personaje (en el caso real, dos pufs justo donde se ponía el jugador), se mueve **solo en esa vista** con un estado:

```python
exec(open("<skill>/scripts/blender/estado_vista.py").read())
definir_estado("G", mover={"Puf_azul": (6.07, 3.89, 0.22), "Puf_crema": (6.54, 3.42, 0.22)}, mostrar=["Personajes_guia"])
definir_estado("H", mostrar=["Personajes_guia"])
```

`render_pases.py` aplica el estado solo al renderizar esa vista. Varias vistas del mismo momento comparten estado (mismos maniquíes, mismos objetos movidos).

## Generar

Plantilla 3 de `assets/plantillas/prompts-de-reserva.md` o brief a Image Prompter (`08-generacion-ailab.md`). Orden recomendado:

1. Render con maniquíes.
2. Una o dos vistas aprobadas del espacio (la más parecida en ángulo primero). Si ya existe una imagen aprobada del mismo momento con esos personajes, va la primera de las de aspecto.
3. Por cada personaje: cara y cuerpo entero.
4. Objetos (cascos, periódico...).

Hasta 14 imágenes en total. En el caso real se usaron entre 5 y 9 sin problema en Higgsfield; en AILAB, ese día, todas las peticiones dieron "generate task timeout" (con 4, 6 y 9 referencias), así que el número de referencias no era la causa.

En el prompt: cada maniquí asignado a su personaje, la pose con lado izquierdo/derecho, la mirada, cómo lleva cada objeto ("the cable runs down his side to the MP3 player in his trouser pocket").

## Añadir un personaje a una imagen ya aprobada

Si la imagen ya está bien y solo falta alguien: edición directa (plantilla 4) con la imagen aprobada como Image 1 y, si la pose importa, una foto de referencia como Image 2 ("take only the pose"). Más rápido, pero el modelo puede reencuadrar un poco o tocar algún detalle: revisa y corrige con parche (`09-correccion-y-control-absoluto.md`). Si la posición tiene que ser exacta, pon el maniquí en Blender y genera desde el render.

## Lo que se aprendió

- Con personas, el modelo se toma algo más de libertad con el encuadre que en vistas vacías. Compruébalo con los contornos y decide si vale.
- El modelo tiende a hacer al personaje un poco más pequeño y hundido de lo que marca el maniquí. Si importa, exagera un poco la altura del maniquí o corrige después.
- Escribe los objetos que lleva el personaje y por dónde van (cables, bolsillos). Si no, los inventa: en el caso real el cable de los cascos acabó en la mano y hubo que corregirlo.
- Las piezas opcionales de los muebles (tapas, puertas) que existan en Blender pueden aparecer o desaparecer al editar. Revísalas en cada imagen.
